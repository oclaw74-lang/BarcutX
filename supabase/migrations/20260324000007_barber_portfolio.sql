-- Migration 007: Create barber_portfolio table for work showcase photos
-- Run manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS barber_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_portfolio_barber_id ON barber_portfolio(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_portfolio_order ON barber_portfolio(barber_id, display_order);

ALTER TABLE barber_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_select" ON barber_portfolio FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "portfolio_insert" ON barber_portfolio FOR INSERT WITH CHECK (
  barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
CREATE POLICY "portfolio_update" ON barber_portfolio FOR UPDATE USING (
  barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
CREATE POLICY "portfolio_delete" ON barber_portfolio FOR DELETE USING (
  barber_id IN (SELECT id FROM barbers WHERE profile_id = auth.uid())
);
