-- Migration 008: Create products table for shop and barber products
-- Run manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES barber_shops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INT DEFAULT 0,
  photo_url TEXT,
  category TEXT DEFAULT 'other',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN products.barber_id IS 'NULL = producto del shop, NOT NULL = producto propio del barbero';

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_barber_id ON products(barber_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_insert_owner" ON products FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
CREATE POLICY "products_update_owner" ON products FOR UPDATE USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
CREATE POLICY "products_delete_owner" ON products FOR DELETE USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
