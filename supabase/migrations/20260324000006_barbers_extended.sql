-- Migration 006: Extend barbers profile with additional fields
-- Run manually in Supabase SQL editor

ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_service_minutes INT,
  ADD COLUMN IF NOT EXISTS is_available_for_hire BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hire_type TEXT CHECK (hire_type IN ('full_time','part_time','freelance')),
  ADD COLUMN IF NOT EXISTS target_city TEXT,
  ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Generate unique QR code for existing barbers
UPDATE barbers SET qr_code = gen_random_uuid()::text WHERE qr_code IS NULL;
