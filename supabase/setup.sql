-- ============================================
-- Sealo — Complete Database Setup
-- Safe to re-run (IF NOT EXISTS + EXCEPTION)
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1a. Admin helper (SECURITY DEFINER so it bypasses RLS — avoids
--     "infinite recursion" when policies reference profiles)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

-- Drop old policies so they can be recreated with admin access
DROP POLICY IF EXISTS "Profiles select" ON profiles;
DROP POLICY IF EXISTS "Profiles insert" ON profiles;
DROP POLICY IF EXISTS "Profiles update" ON profiles;

-- Users can read their own row; admins can read everyone
CREATE POLICY "Profiles select" ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own row; column-level grants below
-- restrict which columns are actually writable (points/is_admin are locked).
CREATE POLICY "Profiles update" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 1b. LOCK DOWN profiles columns
--     Clients must NEVER be able to write points or is_admin directly.
--     Only display_name / avatar_url are client-writable.
-- ============================================
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;

-- ============================================
-- 2. READINGS
-- ============================================
CREATE TABLE IF NOT EXISTS readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spread_type TEXT NOT NULL CHECK (spread_type IN ('single', 'three_card', 'celtic', 'oracle')),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  question TEXT NOT NULL DEFAULT '',
  interpretation TEXT NOT NULL DEFAULT '',
  points_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure the spread_type constraint accepts 'oracle' (idempotent migration)
DO $$ BEGIN
  ALTER TABLE readings DROP CONSTRAINT IF EXISTS readings_spread_type_check;
  ALTER TABLE readings ADD CONSTRAINT readings_spread_type_check
    CHECK (spread_type IN ('single', 'three_card', 'celtic', 'oracle'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readings select" ON readings;
DROP POLICY IF EXISTS "Readings insert" ON readings;
DROP POLICY IF EXISTS "Readings update" ON readings;

-- Users read their own readings; admins read all
CREATE POLICY "Readings select" ON readings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Inserted server-side after a completed reading (user session owns the row)
CREATE POLICY "Readings insert" ON readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own readings (e.g. streaming interpretation completion)
CREATE POLICY "Readings update" ON readings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created ON readings(created_at DESC);

-- ============================================
-- 3. POINT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure the type constraint accepts 'refund' and 'redeem' (idempotent)
DO $$ BEGIN
  ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
  ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_type_check
    CHECK (type IN ('admin_grant', 'reading_purchase', 'daily_bonus', 'referral', 'refund', 'redeem'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PointTransactions select" ON point_transactions;
DROP POLICY IF EXISTS "PointTransactions insert" ON point_transactions;

-- Users read their own ledger; admins read all
CREATE POLICY "PointTransactions select" ON point_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- NOTE: No INSERT policy. The ledger is written exclusively by the
-- SECURITY DEFINER RPCs below (spend_points, refund_points,
-- claim_daily_bonus, admin_adjust_points) so users cannot fabricate
-- transactions or mint points.

CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_type_date ON point_transactions(user_id, type, created_at);

-- ============================================
-- 4. ADMIN SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO admin_settings (key, value) VALUES
  ('reading_costs', '{"single": 5, "three_card": 15, "celtic": 50}'::jsonb),
  ('daily_bonus', '{"amount": 10}'::jsonb),
  ('referral_bonus', '{"amount": 20}'::jsonb),
  ('maintenance_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin settings select" ON admin_settings;
  CREATE POLICY "Admin settings select" ON admin_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin settings update" ON admin_settings;
  CREATE POLICY "Admin settings update" ON admin_settings
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin settings insert" ON admin_settings;
  CREATE POLICY "Admin settings insert" ON admin_settings
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 5. TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 6. RPC: spend points atomically (self-only, deducts + writes ledger)
-- ============================================
CREATE OR REPLACE FUNCTION spend_points(p_user_id UUID, p_amount INTEGER, p_description TEXT DEFAULT 'Reading')
RETURNS boolean AS $$
DECLARE
  current_points INTEGER;
BEGIN
  -- Only the calling user may spend their own points
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT points INTO current_points FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_points < p_amount THEN
    RETURN false;
  END IF;

  UPDATE profiles SET points = points - p_amount WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'reading_purchase', p_description);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 7. RPC: refund points atomically (self-only, credits + writes ledger)
-- ============================================
CREATE OR REPLACE FUNCTION refund_points(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  UPDATE profiles SET points = points + p_amount WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', 'Refund: reading failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 8. RPC: admin adjust points (grant or deduct any user)
-- ============================================
CREATE OR REPLACE FUNCTION admin_adjust_points(p_user_id UUID, p_amount INTEGER, p_reason TEXT DEFAULT '')
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET points = points + p_amount
  WHERE id = p_user_id AND (points + p_amount) >= 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points or user not found';
  END IF;

  INSERT INTO point_transactions (user_id, amount, type, description, admin_id)
  VALUES (p_user_id, p_amount, 'admin_grant', COALESCE(NULLIF(p_reason, ''), 'Admin adjustment'), auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 9. RPC: claim daily bonus atomically (self-only, race-safe)
-- ============================================
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID, p_amount INTEGER)
RETURNS boolean AS $$
DECLARE
  today_start TIMESTAMPTZ;
  existing_tx RECORD;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Serialize concurrent claims for this user (prevents double-claim race)
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- "Today" boundary in Bangkok (UTC+7) so the daily bonus resets at local midnight
  today_start := date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok';

  SELECT id INTO existing_tx
  FROM point_transactions
  WHERE user_id = p_user_id
    AND type = 'daily_bonus'
    AND created_at >= today_start
  LIMIT 1;

  IF FOUND THEN
    RETURN false;
  END IF;

  UPDATE profiles SET points = points + p_amount WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'daily_bonus', 'Daily bonus');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 10. MAKE YOURSELF ADMIN + FIX EXISTING USERS
-- ============================================

-- Create profiles for users who signed up before the trigger existed
INSERT INTO profiles (id, display_name, avatar_url, points, is_admin)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  0,
  (LOWER(u.email) = 'sphetpitak@gmail.com')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  is_admin = EXCLUDED.is_admin,
  display_name = EXCLUDED.display_name;

-- ============================================
-- 11. REALTIME (points live update)
-- ============================================
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE point_transactions REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE point_transactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 12. REDEEM CODES
-- ============================================
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0 AND points <= 1000),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redeem_claims (
  code_id UUID NOT NULL REFERENCES redeem_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (code_id, user_id)
);

ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redeem codes select" ON redeem_codes;
CREATE POLICY "Redeem codes select" ON redeem_codes FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Redeem codes admin all" ON redeem_codes;
CREATE POLICY "Redeem codes admin all" ON redeem_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Redeem claims select" ON redeem_claims;
CREATE POLICY "Redeem claims select" ON redeem_claims FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Redeem claims insert" ON redeem_claims;
-- NOTE: No client INSERT policy on redeem_claims. Claims are written exclusively by the
-- SECURITY DEFINER RPC claim_code.

CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeem_claims_user ON redeem_claims(user_id);

-- RPC: create code (admin only)
CREATE OR REPLACE FUNCTION create_redeem_code(p_code TEXT, p_points INTEGER, p_max_uses INTEGER DEFAULT NULL, p_expires_at TIMESTAMPTZ DEFAULT NULL)
RETURNS UUID AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_code IS NULL OR LENGTH(TRIM(p_code)) < 3 OR LENGTH(TRIM(p_code)) > 20 THEN RAISE EXCEPTION 'Invalid code length'; END IF;
  IF UPPER(TRIM(p_code)) !~ '^[A-Z0-9_-]+$' THEN RAISE EXCEPTION 'Invalid code format'; END IF;
  IF p_points < 1 OR p_points > 1000 THEN RAISE EXCEPTION 'Invalid points'; END IF;
  IF p_max_uses IS NOT NULL AND p_max_uses < 1 THEN RAISE EXCEPTION 'Invalid max_uses'; END IF;
  INSERT INTO redeem_codes (code, points, max_uses, expires_at, created_by)
  VALUES (UPPER(TRIM(p_code)), p_points, p_max_uses, p_expires_at, auth.uid())
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: delete code (admin only)
CREATE OR REPLACE FUNCTION delete_redeem_code(p_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM redeem_codes WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Code not found'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: claim code (1 person / 1 code, checks expiry & max_uses atomically)
CREATE OR REPLACE FUNCTION claim_code(p_code TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_code redeem_codes%ROWTYPE;
  v_points INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_code IS NULL OR TRIM(p_code) = '' THEN RAISE EXCEPTION 'Invalid code'; END IF;

  SELECT * INTO v_code FROM redeem_codes WHERE code = UPPER(TRIM(p_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid code'; END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RAISE EXCEPTION 'Code expired';
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.uses_count >= v_code.max_uses THEN
    RAISE EXCEPTION 'Code fully redeemed';
  END IF;

  IF EXISTS (SELECT 1 FROM redeem_claims WHERE code_id = v_code.id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  -- grant points
  UPDATE profiles SET points = points + v_code.points WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  v_points := v_code.points;

  UPDATE redeem_codes SET uses_count = uses_count + 1 WHERE id = v_code.id;

  INSERT INTO redeem_claims (code_id, user_id) VALUES (v_code.id, auth.uid());

  INSERT INTO point_transactions (user_id, amount, type, description, admin_id)
  VALUES (auth.uid(), v_points, 'redeem', 'Redeem: ' || v_code.code, v_code.created_by);

  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 13. PURCHASES (PromptPay/Stripe)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_thb INTEGER NOT NULL CHECK (amount_thb > 0),
  points INTEGER NOT NULL CHECK (points > 0),
  provider TEXT NOT NULL CHECK (provider IN ('promptpay','stripe','mock')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  provider_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Purchases select" ON purchases;
CREATE POLICY "Purchases select" ON purchases FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Purchases insert" ON purchases;
CREATE POLICY "Purchases insert" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

-- ============================================
-- 14. PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Push select" ON push_subscriptions;
CREATE POLICY "Push select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Push insert" ON push_subscriptions;
CREATE POLICY "Push insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Push delete" ON push_subscriptions;
CREATE POLICY "Push delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ============================================
-- 15. API RATE LIMITS (DB-backed)
-- ============================================
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RateLimits select" ON api_rate_limits;
CREATE POLICY "RateLimits select" ON api_rate_limits FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "RateLimits insert" ON api_rate_limits;
CREATE POLICY "RateLimits insert" ON api_rate_limits FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint, created_at);

-- ============================================
-- 16. SECURITY HARDENING: Readings UPDATE lockdown
-- ============================================
-- Revoke broad update and allow only interpretation/followups
DO $$ BEGIN
  REVOKE UPDATE ON public.readings FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
-- Grant only safe columns if columns exist (interpretation)
DO $$ BEGIN
  GRANT UPDATE (interpretation) ON public.readings TO authenticated;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ============================================
-- 17. POINTS UPPER BOUND
-- ============================================
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_points_upper;
  ALTER TABLE profiles ADD CONSTRAINT profiles_points_upper CHECK (points >= 0 AND points <= 1000000);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
-- Cap admin_adjust_points: add check inside function (recreate)
CREATE OR REPLACE FUNCTION admin_adjust_points(p_user_id UUID, p_amount INTEGER, p_reason TEXT DEFAULT '')
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF ABS(p_amount) > 10000 THEN RAISE EXCEPTION 'Amount too large (max 10000)'; END IF;
  UPDATE profiles
  SET points = LEAST(1000000, GREATEST(0, points + p_amount))
  WHERE id = p_user_id AND (points + p_amount) >= 0 AND (points + p_amount) <= 1000000;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points or user not found';
  END IF;
  INSERT INTO point_transactions (user_id, amount, type, description, admin_id)
  VALUES (p_user_id, p_amount, 'admin_grant', COALESCE(NULLIF(p_reason, ''), 'Admin adjustment'), auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Extend point_transactions type to include purchase/streak_bonus
DO $$ BEGIN
  ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
  ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_type_check
    CHECK (type IN ('admin_grant','reading_purchase','daily_bonus','referral','refund','redeem','purchase','streak_bonus'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================
-- 18. MOCK PURCHASE RPC (self-service for demo bundles)
-- ============================================
CREATE OR REPLACE FUNCTION create_mock_purchase(p_amount_thb INTEGER, p_points INTEGER)
RETURNS UUID AS $$
DECLARE new_id UUID;
DECLARE allowed BOOLEAN := false;
DECLARE mock_enabled BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_amount_thb IS NULL OR p_points IS NULL THEN RAISE EXCEPTION 'Invalid bundle'; END IF;
  -- Check if mock is enabled (admin setting) or caller is admin — otherwise block in production
  SELECT COALESCE((value->>'enabled')::boolean, false) INTO mock_enabled FROM admin_settings WHERE key = 'enable_mock_purchase';
  IF NOT mock_enabled AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Mock purchase disabled';
  END IF;
  -- Whitelist bundles: 99->120, 199->280, 399->650, 19->25,49->70
  IF (p_amount_thb=99 AND p_points=120) OR (p_amount_thb=199 AND p_points=280) OR (p_amount_thb=399 AND p_points=650) OR (p_amount_thb=19 AND p_points=25) OR (p_amount_thb=49 AND p_points=70) OR (p_amount_thb=9 AND p_points=10) THEN
    allowed := true;
  END IF;
  IF NOT allowed THEN RAISE EXCEPTION 'Invalid bundle'; END IF;
  -- Insert purchase
  INSERT INTO purchases (user_id, amount_thb, points, provider, status, provider_ref)
  VALUES (auth.uid(), p_amount_thb, p_points, 'mock', 'completed', 'mock-'||gen_random_uuid()::text)
  RETURNING id INTO new_id;
  -- Grant points (capped)
  UPDATE profiles SET points = LEAST(1000000, points + p_points) WHERE id = auth.uid();
  INSERT INTO point_transactions (user_id, amount, type, description) VALUES (auth.uid(), p_points, 'purchase', 'Purchase: '||p_amount_thb||'฿ → '||p_points||'pts');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Seed mock toggle (default disabled for production safety)
INSERT INTO admin_settings (key, value) VALUES ('enable_mock_purchase', '{"enabled": false}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 19. READING FOLLOWUPS (2 per reading max)
-- ============================================
CREATE TABLE IF NOT EXISTS reading_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) > 0 AND char_length(question) <= 200),
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE reading_followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Followups select" ON reading_followups;
CREATE POLICY "Followups select" ON reading_followups FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Followups insert" ON reading_followups;
CREATE POLICY "Followups insert" ON reading_followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Followups delete" ON reading_followups FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
CREATE INDEX IF NOT EXISTS idx_followups_reading ON reading_followups(reading_id);
CREATE INDEX IF NOT EXISTS idx_followups_user ON reading_followups(user_id);
-- Enforce max 2 per reading via trigger
CREATE OR REPLACE FUNCTION check_followup_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify reading ownership
  IF NOT EXISTS (SELECT 1 FROM readings WHERE id = NEW.reading_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'Reading not found or not owned';
  END IF;
  -- Enforce max 2 with row-level lock on reading
  PERFORM 1 FROM readings WHERE id = NEW.reading_id FOR UPDATE;
  IF (SELECT COUNT(*) FROM reading_followups WHERE reading_id = NEW.reading_id) >= 2 THEN
    RAISE EXCEPTION 'Followup limit reached (max 2)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_followup_limit ON reading_followups;
CREATE TRIGGER trg_followup_limit BEFORE INSERT ON reading_followups FOR EACH ROW EXECUTE FUNCTION check_followup_limit();

-- ============================================
-- 20. STREAK BONUS HELPER (optional)
-- ============================================
-- No extra RPC needed — handled in app/api/daily-bonus

-- ============================================
-- DONE
-- ============================================
