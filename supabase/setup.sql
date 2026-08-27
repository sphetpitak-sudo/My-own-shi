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

DO $$ BEGIN
  CREATE POLICY "Profiles select" ON profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Profiles insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Profiles update" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

DO $$ BEGIN
  CREATE POLICY "Readings select" ON readings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Readings insert" ON readings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created ON readings(created_at DESC);

-- ============================================
-- 3. POINT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin_grant', 'reading_purchase', 'daily_bonus', 'referral')),
  description TEXT NOT NULL DEFAULT '',
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "PointTransactions select" ON point_transactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "PointTransactions insert" ON point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR admin_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
  CREATE POLICY "Admin settings select" ON admin_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin settings update" ON admin_settings
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin settings insert" ON admin_settings
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin));
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 6. RPC: safe points increment (with balance floor)
-- ============================================
CREATE OR REPLACE FUNCTION increment_points(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET points = points + p_amount
  WHERE id = p_user_id AND (points + p_amount) >= 0;

  -- If the update affected no rows, the balance would have gone negative
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points or user not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RPC: spend points atomically (check + deduct)
-- ============================================
CREATE OR REPLACE FUNCTION spend_points(p_user_id UUID, p_amount INTEGER)
RETURNS boolean AS $$
DECLARE
  current_points INTEGER;
BEGIN
  SELECT points INTO current_points FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_points < p_amount THEN
    RETURN false;
  END IF;

  UPDATE profiles SET points = points - p_amount WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. RPC: claim daily bonus atomically
-- ============================================
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID, p_amount INTEGER)
RETURNS boolean AS $$
DECLARE
  today_start TIMESTAMPTZ;
  existing_tx RECORD;
BEGIN
  today_start := date_trunc('day', now());

  -- Check if already claimed today
  SELECT id INTO existing_tx
  FROM point_transactions
  WHERE user_id = p_user_id
    AND type = 'daily_bonus'
    AND created_at >= today_start
  LIMIT 1;

  IF FOUND THEN
    RETURN false;
  END IF;

  -- Award points
  UPDATE profiles SET points = points + p_amount WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'daily_bonus', 'Daily bonus');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. MAKE YOURSELF ADMIN + FIX EXISTING USERS
-- ============================================

-- Create profiles for users who signed up before the trigger existed
INSERT INTO profiles (id, display_name, avatar_url, points, is_admin)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  0,
  (u.email = 'sphetpitak@gmail.com')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  is_admin = EXCLUDED.is_admin,
  display_name = EXCLUDED.display_name;

-- ============================================
-- DONE
-- ============================================
