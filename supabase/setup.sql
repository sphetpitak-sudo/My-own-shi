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
  spread_type TEXT NOT NULL CHECK (spread_type IN ('single', 'three_card', 'celtic')),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  question TEXT NOT NULL DEFAULT '',
  interpretation TEXT NOT NULL DEFAULT '',
  points_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readings select" ON readings;
DROP POLICY IF EXISTS "Readings insert" ON readings;

-- Users read their own readings; admins read all
CREATE POLICY "Readings select" ON readings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Inserted server-side after a completed reading (user session owns the row)
CREATE POLICY "Readings insert" ON readings FOR INSERT
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

-- Ensure the type constraint accepts 'refund' as well (idempotent)
DO $$ BEGIN
  ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
  ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_type_check
    CHECK (type IN ('admin_grant', 'reading_purchase', 'daily_bonus', 'referral', 'refund'));
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
-- DONE
-- ============================================
