-- Migration 011: Add barber_id to services to support barber-owned services
-- Run manually in Supabase SQL editor

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

COMMENT ON COLUMN services.barber_id IS 'NULL = servicio del shop, NOT NULL = servicio propio del barbero';

CREATE INDEX IF NOT EXISTS idx_services_barber_id ON services(barber_id);

-- Update RLS to allow barbers to manage their own services
DROP POLICY IF EXISTS "services_insert" ON services;
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS "services_update" ON services;
CREATE POLICY "services_update" ON services FOR UPDATE USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
