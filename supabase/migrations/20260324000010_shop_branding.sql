-- Migration 010: Add branding fields to barber_shops table
-- Run manually in Supabase SQL editor

ALTER TABLE barber_shops
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#D97706',
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Generate initial slug for existing shops
UPDATE barber_shops
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 6)
WHERE slug IS NULL;

ALTER TABLE barber_shops ALTER COLUMN slug SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_barber_shops_slug ON barber_shops(slug);
