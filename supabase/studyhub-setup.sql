-- ============================================
-- StudyHub — Student Planner Database Setup
-- Safe to re-run (IF NOT EXISTS + EXCEPTION)
-- ============================================

-- 1. SUBJECTS (customizable per user)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#4F7CFF',
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    is_default BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Subjects select" ON subjects FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Subjects insert" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Subjects update" ON subjects FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Subjects delete" ON subjects FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);

-- 2. ASSIGNMENTS (replaces todos + transactions)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
    estimated_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Assignments select" ON assignments FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Assignments insert" ON assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Assignments update" ON assignments FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Assignments delete" ON assignments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- Additional columns for features #66–70
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS recurring TEXT DEFAULT 'none';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS actual_minutes INTEGER;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Additional constraints (wrapped in DO blocks for safe re-run)
DO $$ BEGIN
  ALTER TABLE assignments ADD CONSTRAINT check_recurring CHECK (recurring IN ('none', 'daily', 'weekly', 'monthly'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE assignments ADD CONSTRAINT check_estimated_minutes CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE assignments ADD CONSTRAINT check_actual_minutes CHECK (actual_minutes IS NULL OR actual_minutes >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE assignments ADD CONSTRAINT check_title_length CHECK (char_length(title) > 0 AND char_length(title) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignments_user_due ON assignments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_user_status ON assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subjects_user_name ON subjects(user_id, name);
