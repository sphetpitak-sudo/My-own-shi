-- Migration: Add skip_weekends column to recurring_transactions
-- Run this in Supabase SQL Editor

ALTER TABLE recurring_transactions
  ADD COLUMN skip_weekends boolean not null default false;
