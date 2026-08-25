-- Migration: Add 'daily' frequency to recurring_transactions
-- Run this in Supabase SQL Editor if you already have the recurring_transactions table

ALTER TABLE recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_frequency_check;

ALTER TABLE recurring_transactions
  ADD CONSTRAINT recurring_transactions_frequency_check
  CHECK (frequency in ('daily', 'weekly', 'monthly', 'yearly'));
