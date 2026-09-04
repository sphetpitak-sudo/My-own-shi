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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spread_type TEXT NOT NULL CHECK (spread_type IN ('single', 'three_card', 'celtic', 'oracle')),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_array_length(cards) BETWEEN 0 AND 10),
  question TEXT NOT NULL DEFAULT '' CHECK (char_length(question) <= 500),
  interpretation TEXT NOT NULL DEFAULT '' CHECK (char_length(interpretation) <= 10000),
  points_spent INTEGER NOT NULL DEFAULT 0 CHECK (points_spent >= 0 AND points_spent <= 1000),
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
DROP POLICY IF EXISTS "Readings delete" ON readings;
CREATE POLICY "Readings delete" ON readings FOR DELETE USING (auth.uid() = user_id);

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

-- Ensure the type constraint accepts all current types (idempotent)
DO $$ BEGIN
  ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
  ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_type_check
    CHECK (type IN ('admin_grant', 'reading_purchase', 'daily_bonus', 'referral', 'refund', 'redeem', 'purchase', 'streak_bonus'));
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
  ('reading_costs', '{"single": 5, "three_card": 15, "celtic": 50, "birthchart": 25, "daily": 5, "zodiac": 5, "oracle_single": 5, "oracle_three": 15, "lucky_number": 5, "moon_phase": 5}'::jsonb),
  ('daily_bonus', '{"amount": 10}'::jsonb),
  ('referral_bonus', '{"amount": 20}'::jsonb),
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('announcement_mode', '{"enabled": false}'::jsonb),
  ('db_migration_lock', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- Phase 4: maintenance_mode is RETIRED (kept dormant for history).
-- Use announcement_mode (graceful page block, API keeps running) and
-- db_migration_lock (hard block on all spends/writes during migrations).
-- Ensure existing row gets new keys (idempotent update)
UPDATE admin_settings SET value = value || '{"birthchart": 25, "daily": 5, "zodiac": 5, "oracle_single": 5, "oracle_three": 15, "lucky_number": 5, "moon_phase": 5}'::jsonb WHERE key='reading_costs' AND NOT (value ? 'birthchart');

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
  v_costs JSONB;
  v_allowed BOOLEAN := false;
BEGIN
  -- Only the calling user may spend their own points
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Phase 4: hard block on all spends during DB migration.
  -- Missing key = OFF (safe for old DBs before this seed runs).
  IF COALESCE((SELECT (value->>'enabled')::boolean FROM admin_settings WHERE key = 'db_migration_lock'), false) THEN
    RAISE EXCEPTION 'Service temporarily unavailable (migration)';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  -- Dynamic whitelist from admin_settings (prevents arbitrary 1-point spends but allows admin-configured costs)
  SELECT value INTO v_costs FROM admin_settings WHERE key='reading_costs';
  IF v_costs IS NOT NULL THEN
    IF p_amount = COALESCE((v_costs->>'single')::int, 5) OR p_amount = COALESCE((v_costs->>'three_card')::int, 15) OR p_amount = COALESCE((v_costs->>'celtic')::int, 50) THEN
      v_allowed := true;
    END IF;
  ELSE
    IF p_amount IN (5,15,50) THEN v_allowed := true; END IF;
  END IF;
  IF NOT v_allowed THEN
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

-- Trusted spend for spread (authoritative cost from admin_settings)
CREATE OR REPLACE FUNCTION spend_for_spread(p_spread TEXT, p_description TEXT DEFAULT 'Reading')
RETURNS INTEGER AS $$
DECLARE
  v_cost INTEGER;
  v_user_id UUID;
  current_points INTEGER;
  costs JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  -- Phase 4: hard block on all spends during DB migration (see spend_points).
  IF COALESCE((SELECT (value->>'enabled')::boolean FROM admin_settings WHERE key = 'db_migration_lock'), false) THEN
    RAISE EXCEPTION 'Service temporarily unavailable (migration)';
  END IF;
  IF p_spread NOT IN ('single','three_card','celtic','single_yesno','oracle_single','oracle_three','daily','zodiac','birthchart','lucky_number','moon_phase') THEN
    RAISE EXCEPTION 'Invalid spread';
  END IF;
  SELECT value INTO costs FROM admin_settings WHERE key='reading_costs';
  IF p_spread = 'single' OR p_spread = 'single_yesno' OR p_spread = 'oracle_single' THEN
    v_cost := COALESCE((costs->>'single')::int, 5);
  ELSIF p_spread = 'three_card' OR p_spread = 'oracle_three' THEN
    v_cost := COALESCE((costs->>'three_card')::int, 15);
  ELSIF p_spread = 'celtic' THEN
    v_cost := COALESCE((costs->>'celtic')::int, 50);
  ELSIF p_spread = 'birthchart' THEN
    v_cost := COALESCE((costs->>'birthchart')::int, 25);
  ELSIF p_spread IN ('daily','zodiac','lucky_number','moon_phase') THEN
    v_cost := COALESCE((costs->>p_spread)::int, 5);
  END IF;
  IF v_cost <=0 THEN RAISE EXCEPTION 'Invalid cost'; END IF;
  SELECT points INTO current_points FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  IF current_points < v_cost THEN RETURN 0; END IF;
  UPDATE profiles SET points = points - v_cost WHERE id = v_user_id;
  INSERT INTO point_transactions (user_id, amount, type, description) VALUES (v_user_id, -v_cost, 'reading_purchase', COALESCE(p_description, p_spread||' reading'));
  RETURN v_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 7. RPC: refund points atomically (self-only, tied to recent purchase, single-use)
-- ============================================
CREATE OR REPLACE FUNCTION refund_points(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
DECLARE
  v_recent RECORD;
  v_refund_count INTEGER;
  v_costs JSONB;
  v_allowed BOOLEAN := false;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  SELECT value INTO v_costs FROM admin_settings WHERE key='reading_costs';
  IF v_costs IS NOT NULL THEN
    IF p_amount = COALESCE((v_costs->>'single')::int, 5)
    OR p_amount = COALESCE((v_costs->>'three_card')::int, 15)
    OR p_amount = COALESCE((v_costs->>'celtic')::int, 50)
    OR p_amount = COALESCE((v_costs->>'birthchart')::int, 25)
    OR p_amount = COALESCE((v_costs->>'daily')::int, 5)
    OR p_amount = COALESCE((v_costs->>'zodiac')::int, 5)
    THEN
      v_allowed := true;
    END IF;
  ELSE
    IF p_amount IN (5,15,25,50) THEN v_allowed := true; END IF;
  END IF;
  IF NOT v_allowed THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  -- Must have a recent reading_purchase with exact amount in last 10 minutes
  SELECT * INTO v_recent FROM point_transactions
   WHERE user_id = p_user_id AND type='reading_purchase' AND amount = -p_amount
     AND created_at >= now() - interval '10 minutes'
   ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No recent purchase to refund';
  END IF;
  -- Prevent double refund of same purchase (one refund per purchase window)
  SELECT COUNT(*) INTO v_refund_count FROM point_transactions
   WHERE user_id = p_user_id AND type='refund' AND created_at > v_recent.created_at
     AND created_at < v_recent.created_at + interval '1 minute' AND amount = p_amount;
  IF v_refund_count > 0 THEN
    RAISE EXCEPTION 'Already refunded';
  END IF;
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;
  UPDATE profiles SET points = LEAST(1000000, points + p_amount) WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', 'Refund: reading failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Secure refund by reading_id (preferred, idempotent)
CREATE OR REPLACE FUNCTION refund_by_reading(p_reading_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_reading RECORD;
  v_refund_count INTEGER;
BEGIN
  SELECT * INTO v_reading FROM readings WHERE id = p_reading_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Reading not found'; END IF;
  IF v_reading.points_spent <=0 THEN RAISE EXCEPTION 'Invalid reading cost'; END IF;
  SELECT COUNT(*) INTO v_refund_count FROM point_transactions
    WHERE user_id = auth.uid() AND type='refund' AND description = 'Refund: reading '||p_reading_id::text;
  IF v_refund_count >0 THEN RAISE EXCEPTION 'Already refunded'; END IF;
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  UPDATE profiles SET points = LEAST(1000000, points + v_reading.points_spent) WHERE id = auth.uid();
  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (auth.uid(), v_reading.points_spent, 'refund', 'Refund: reading '||p_reading_id::text);
  RETURN v_reading.points_spent;
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
-- 9. RPC: claim daily bonus atomically (self-only, race-safe, server-authoritative amount)
-- ============================================
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID, p_amount INTEGER)
RETURNS boolean AS $$
DECLARE
  today_start TIMESTAMPTZ;
  existing_tx RECORD;
  v_base INTEGER;
  v_streak INTEGER;
  v_amount INTEGER;
  v_settings JSONB;
  v_days TEXT[];
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- p_amount is ignored for security; computed server-side
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;
  today_start := date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok';
  SELECT id INTO existing_tx FROM point_transactions WHERE user_id = p_user_id AND type='daily_bonus' AND created_at >= today_start LIMIT 1;
  IF FOUND THEN RETURN false; END IF;
  SELECT value INTO v_settings FROM admin_settings WHERE key='daily_bonus';
  v_base := COALESCE((v_settings->>'amount')::int, 10);
  -- Compute streak: consecutive daily_bonus days before today
  SELECT array_agg(to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') ORDER BY created_at DESC) INTO v_days
    FROM point_transactions WHERE user_id=p_user_id AND type='daily_bonus' AND created_at >= today_start - interval '35 days';
  v_streak := 0;
  FOR i IN 1..35 LOOP
    IF v_days IS NOT NULL AND (today_start - (i * interval '1 day'))::date::text = ANY(v_days) THEN
      -- This checks previous days; we need to count consecutive from yesterday
      NULL;
    END IF;
  END LOOP;
  -- Simpler streak calc: count consecutive days ending yesterday
  WITH consecutive AS (
    SELECT to_char(d::date,'YYYY-MM-DD') as dstr FROM generate_series(today_start - interval '34 days', today_start - interval '1 day', interval '1 day') d
  ), claimed AS (
    SELECT to_char(created_at AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') as dstr FROM point_transactions WHERE user_id=p_user_id AND type='daily_bonus' AND created_at >= today_start - interval '35 days'
  )
  SELECT COUNT(*) INTO v_streak FROM consecutive c
   WHERE c.dstr IN (SELECT dstr FROM claimed)
   AND NOT EXISTS (
     SELECT 1 FROM consecutive c2 WHERE c2.dstr > c.dstr AND c2.dstr < to_char(today_start,'YYYY-MM-DD') AND c2.dstr NOT IN (SELECT dstr FROM claimed)
   );
  -- Actually compute properly: streak is consecutive days ending yesterday
  v_streak := 0;
  FOR i IN 1..35 LOOP
    IF EXISTS (SELECT 1 FROM point_transactions WHERE user_id=p_user_id AND type='daily_bonus' AND to_char(created_at AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') = to_char(today_start - (i * interval '1 day'),'YYYY-MM-DD')) THEN
      v_streak := v_streak + 1;
    ELSE EXIT;
    END IF;
  END LOOP;
  v_amount := v_base;
  IF v_streak + 1 >= 30 THEN v_amount := v_base + 30;
  ELSIF v_streak + 1 >= 14 THEN v_amount := v_base + 20;
  ELSIF v_streak + 1 >= 7 THEN v_amount := v_base + 15;
  ELSIF v_streak + 1 >= 3 THEN v_amount := v_base + 5;
  END IF;
  IF p_amount IS NOT NULL AND p_amount != v_amount AND p_amount != v_base THEN
    -- If caller supplied different amount, ignore and use authoritative
    NULL;
  END IF;
  UPDATE profiles SET points = LEAST(1000000, points + v_amount) WHERE id = p_user_id;
  INSERT INTO point_transactions (user_id, amount, type, description) VALUES (p_user_id, v_amount, 'daily_bonus', 'Daily bonus');
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Zero-arg wrapper (preferred, no amount control)
CREATE OR REPLACE FUNCTION claim_daily_bonus()
RETURNS boolean AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT claim_daily_bonus(auth.uid(), 10) INTO v_ok;
  RETURN v_ok;
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
-- 17. POINTS — NO LIMIT FOR ADMIN (per user request: unlimited grant/deduct)
-- ============================================
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_points_upper;
  -- Keep lower bound 0 only; no upper bound for admin flexibility
  ALTER TABLE profiles ADD CONSTRAINT profiles_points_upper CHECK (points >= 0);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
-- Admin can grant/deduct ANY amount, no per-call cap, no 1M ceiling
CREATE OR REPLACE FUNCTION admin_adjust_points(p_user_id UUID, p_amount INTEGER, p_reason TEXT DEFAULT '')
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Amount must not be 0'; END IF;
  -- No ABS limit; allow any positive/negative; clamp to 0 floor, no ceiling
  UPDATE profiles
  SET points = GREATEST(0, points + p_amount)
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
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
  -- Mock purchase disabled for everyone (including admin) — closed in production
  SELECT COALESCE((value->>'enabled')::boolean, false) INTO mock_enabled FROM admin_settings WHERE key = 'enable_mock_purchase';
  IF NOT mock_enabled THEN
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
DROP POLICY IF EXISTS "Followups update" ON reading_followups;
CREATE POLICY "Followups update" ON reading_followups FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Followups delete" ON reading_followups;
CREATE POLICY "Followups delete" ON reading_followups FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
DO $$ BEGIN
  GRANT UPDATE (answer, question) ON public.reading_followups TO authenticated;
EXCEPTION WHEN undefined_column THEN NULL; END $$;
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
-- 21. ATOMIC RATE LIMIT (serverless-safe)
-- ============================================
CREATE OR REPLACE FUNCTION check_rate_limit(p_endpoint TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    -- For anon, use 0 limit (block) — API should have already checked auth
    RETURN false;
  END IF;
  -- Serialize per user+endpoint with advisory lock (prevents TOCTOU across concurrent Lambdas)
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_endpoint));
  SELECT COUNT(*) INTO v_count FROM api_rate_limits
   WHERE user_id = v_user_id AND endpoint = p_endpoint
     AND created_at >= now() - (p_window_seconds || ' seconds')::interval;
  IF v_count >= p_limit THEN
    RETURN false;
  END IF;
  INSERT INTO api_rate_limits (user_id, endpoint) VALUES (v_user_id, p_endpoint);
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicit EXECUTE privileges (defense in depth)
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION spend_points(UUID,INTEGER,TEXT) FROM public, anon;
  GRANT EXECUTE ON FUNCTION spend_points(UUID,INTEGER,TEXT) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION spend_for_spread(TEXT,TEXT) FROM public, anon;
  GRANT EXECUTE ON FUNCTION spend_for_spread(TEXT,TEXT) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION refund_points(UUID,INTEGER) FROM public, anon;
  GRANT EXECUTE ON FUNCTION refund_points(UUID,INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION refund_by_reading(UUID) FROM public, anon;
  GRANT EXECUTE ON FUNCTION refund_by_reading(UUID) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION claim_daily_bonus(UUID,INTEGER) FROM public, anon;
  GRANT EXECUTE ON FUNCTION claim_daily_bonus(UUID,INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION claim_daily_bonus() FROM public, anon;
  GRANT EXECUTE ON FUNCTION claim_daily_bonus() TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT,INTEGER,INTEGER) FROM public, anon;
  GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT,INTEGER,INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================
-- 22. BIRTH CHARTS (real calculation + AI interpretation)
-- ============================================
CREATE TABLE IF NOT EXISTS birth_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL CHECK (char_length(birth_date) <= 20),
  birth_time TEXT NOT NULL CHECK (char_length(birth_time) <= 20),
  birth_place TEXT NOT NULL CHECK (char_length(birth_place) <= 80),
  chart JSONB NOT NULL DEFAULT '{}'::jsonb,
  interpretation TEXT NOT NULL DEFAULT '' CHECK (char_length(interpretation) <= 5000),
  source TEXT NOT NULL DEFAULT 'fallback' CHECK (source IN ('ai','fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BirthCharts select" ON birth_charts;
CREATE POLICY "BirthCharts select" ON birth_charts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "BirthCharts insert" ON birth_charts;
CREATE POLICY "BirthCharts insert" ON birth_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "BirthCharts update" ON birth_charts;
CREATE POLICY "BirthCharts update" ON birth_charts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "BirthCharts delete" ON birth_charts;
CREATE POLICY "BirthCharts delete" ON birth_charts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_birth_charts_user ON birth_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_charts_created ON birth_charts(created_at DESC);
-- Textbook-accurate extension: real chart needs lat/lon/tz + house/angles (idempotent)
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS tz TEXT;
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS tz_offset INTEGER;
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS house_system TEXT DEFAULT 'whole_sign';
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS zodiac_system TEXT DEFAULT 'tropical';
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS asc_lon DOUBLE PRECISION;
ALTER TABLE birth_charts ADD COLUMN IF NOT EXISTS mc_lon DOUBLE PRECISION;

-- ============================================
-- 22b. SAJU CHARTS — Five Elements (오행 ไม้ไฟดินทองน้ำ) for Atlas remedy
-- ============================================
CREATE TABLE IF NOT EXISTS saju_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL CHECK (char_length(birth_date) <= 20),
  birth_time TEXT NOT NULL CHECK (char_length(birth_time) <= 20),
  birth_place TEXT NOT NULL CHECK (char_length(birth_place) <= 80),
  pillars JSONB NOT NULL DEFAULT '{}'::jsonb, -- {year:{stem,branch}, month, day, hour}
  element_counts JSONB NOT NULL DEFAULT '{}'::jsonb, -- {wood,fire,earth,metal,water: number 0-8}
  weakest TEXT CHECK (weakest IN ('wood','fire','earth','metal','water')),
  day_master TEXT,
  interpretation TEXT NOT NULL DEFAULT '' CHECK (char_length(interpretation) <= 5000),
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE saju_charts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SajuCharts select" ON saju_charts;
CREATE POLICY "SajuCharts select" ON saju_charts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "SajuCharts insert" ON saju_charts;
CREATE POLICY "SajuCharts insert" ON saju_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "SajuCharts update" ON saju_charts;
CREATE POLICY "SajuCharts update" ON saju_charts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "SajuCharts delete" ON saju_charts;
CREATE POLICY "SajuCharts delete" ON saju_charts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_saju_charts_user ON saju_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_saju_charts_created ON saju_charts(created_at DESC);

-- ============================================
-- 23. CHAT — Sealo Chat (separate from reading follow-ups)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'สนทนาใหม่' CHECK (char_length(title) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL CHECK (char_length(content) <= 6000),
  tool_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ChatConversations select" ON chat_conversations;
CREATE POLICY "ChatConversations select" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatConversations insert" ON chat_conversations;
CREATE POLICY "ChatConversations insert" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatConversations update" ON chat_conversations;
CREATE POLICY "ChatConversations update" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatConversations delete" ON chat_conversations;
CREATE POLICY "ChatConversations delete" ON chat_conversations FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatMessages select" ON chat_messages;
CREATE POLICY "ChatMessages select" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatMessages insert" ON chat_messages;
CREATE POLICY "ChatMessages insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ChatMessages delete" ON chat_messages;
CREATE POLICY "ChatMessages delete" ON chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_chat_message_timestamp ON chat_messages;
CREATE TRIGGER trg_chat_message_timestamp AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_chat_conversation_timestamp();

-- ============================================
-- 24. AI CIRCUIT BREAKER (Phase 1.3) — shared store, NOT in-memory
-- In-memory counters reset on cold start / split across serverless
-- instances, so breaker state lives here. Same advisory-lock pattern
-- as check_rate_limit. T thresholds default 10 fails/60s, cooldown 30s
-- (tune from Phase 0 dashboard: refund rate / p95 / error-rate).
-- ============================================
CREATE TABLE IF NOT EXISTS ai_circuit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ai_circuit_events ENABLE ROW LEVEL SECURITY;
-- No client policies: written/read only via SECURITY DEFINER RPCs below.
CREATE INDEX IF NOT EXISTS idx_ai_circuit_endpoint_created ON ai_circuit_events(endpoint, created_at DESC);

CREATE OR REPLACE FUNCTION record_ai_failure(p_endpoint TEXT)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO ai_circuit_events (endpoint) VALUES (p_endpoint);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_ai_breaker(
  p_endpoint TEXT,
  p_fail_threshold INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60,
  p_cooldown_seconds INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_last TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false; -- fail-open for anon
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('ai_breaker:' || p_endpoint));
  SELECT COUNT(*), MAX(created_at) INTO v_count, v_last
  FROM ai_circuit_events
  WHERE endpoint = p_endpoint
    AND created_at >= now() - (p_window_seconds || ' seconds')::interval;
  IF v_count IS NULL OR v_count < p_fail_threshold THEN
    RETURN false;
  END IF;
  -- Trip only if failures are recent (within cooldown of now).
  IF v_last IS NOT NULL AND v_last >= now() - (p_cooldown_seconds || ' seconds')::interval THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION record_ai_failure(TEXT) FROM public, anon;
  GRANT EXECUTE ON FUNCTION record_ai_failure(TEXT) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION check_ai_breaker(TEXT,INTEGER,INTEGER,INTEGER) FROM public, anon;
  GRANT EXECUTE ON FUNCTION check_ai_breaker(TEXT,INTEGER,INTEGER,INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================
-- 25. PHASE 2 SWEEPER (orphan __generating__ rows) + LEDGER RECONCILE
-- The sweeper refunds+deletes rows whose invocation provably died
-- (older than route maxDuration + buffer; same TTLs as
-- v_orphan_expired in observability_metrics.sql).
-- Safety properties:
--   * service_role ONLY (GRANTs below + in-function role check).
--   * FOR UPDATE SKIP LOCKED: never fights the Phase 1.1 CAS guard —
--     rows locked by a live retry worker are skipped, not refunded.
--   * Same ledger description as refund_by_reading ('Refund: reading <id>')
--     + NOT EXISTS guard: a row refunded by EITHER path is never
--     refunded twice, in either order.
--   * Report-only reconcile: lists profile-vs-ledger drift, never auto-fixes.
-- ============================================
CREATE OR REPLACE FUNCTION sweep_expired_generating(p_limit INTEGER DEFAULT 50)
RETURNS JSONB AS $$
DECLARE
  v_row RECORD;
  v_desc TEXT;
  v_n_readings INTEGER := 0;
  v_n_followups INTEGER := 0;
  v_points INTEGER := 0;
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_row IN
    SELECT id, user_id, points_spent FROM readings
    WHERE interpretation = '__generating__'
      AND created_at < now() - interval '180 seconds'
    ORDER BY created_at ASC
    LIMIT GREATEST(1, LEAST(p_limit, 500))
    FOR UPDATE SKIP LOCKED
  LOOP
    v_desc := 'Refund: reading ' || v_row.id::text;
    IF v_row.points_spent > 0 THEN
      PERFORM 1 FROM point_transactions
      WHERE user_id = v_row.user_id AND type = 'refund' AND description = v_desc;
      IF NOT FOUND THEN
        UPDATE profiles
        SET points = LEAST(1000000, points + v_row.points_spent)
        WHERE id = v_row.user_id;
        INSERT INTO point_transactions (user_id, amount, type, description)
        VALUES (v_row.user_id, v_row.points_spent, 'refund', v_desc);
        v_points := v_points + v_row.points_spent;
      END IF;
    END IF;
    DELETE FROM readings WHERE id = v_row.id;
    v_n_readings := v_n_readings + 1;
  END LOOP;

  FOR v_row IN
    SELECT id FROM reading_followups
    WHERE answer = '__generating__'
      AND created_at < now() - interval '120 seconds'
    ORDER BY created_at ASC
    LIMIT GREATEST(1, LEAST(p_limit, 500))
    FOR UPDATE SKIP LOCKED
  LOOP
    DELETE FROM reading_followups WHERE id = v_row.id;
    v_n_followups := v_n_followups + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'readings_swept', v_n_readings,
    'followups_swept', v_n_followups,
    'points_refunded', v_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION reconcile_ledger_mismatches(p_limit INTEGER DEFAULT 20)
RETURNS JSONB AS $$
DECLARE
  v_checked INTEGER;
  v_sample JSONB;
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT COUNT(*) INTO v_checked FROM profiles;
  SELECT COALESCE(jsonb_agg(s ORDER BY s.user_id), '[]'::jsonb) INTO v_sample
  FROM (
    SELECT p.id AS user_id, p.points AS profile_points,
      COALESCE(SUM(t.amount), 0)::INTEGER AS ledger_total
    FROM profiles p
    LEFT JOIN point_transactions t ON t.user_id = p.id
    GROUP BY p.id
    HAVING p.points <> COALESCE(SUM(t.amount), 0)
    ORDER BY p.id
    LIMIT GREATEST(1, LEAST(p_limit, 100))
  ) s;
  RETURN jsonb_build_object(
    'checked_users', v_checked,
    'mismatch_count', jsonb_array_length(v_sample),
    'sample', v_sample
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION sweep_expired_generating(INTEGER) FROM public, anon, authenticated;
  GRANT EXECUTE ON FUNCTION sweep_expired_generating(INTEGER) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION reconcile_ledger_mismatches(INTEGER) FROM public, anon, authenticated;
  GRANT EXECUTE ON FUNCTION reconcile_ledger_mismatches(INTEGER) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================
-- DONE
-- ============================================
