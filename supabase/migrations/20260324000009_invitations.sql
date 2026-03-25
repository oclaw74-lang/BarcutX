-- Migration 009: Create shop_invitations and barber_join_requests tables
-- Run manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS shop_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES barber_shops(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invited_email TEXT NOT NULL,
  invited_barber_id UUID REFERENCES barbers(id),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES barber_shops(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_shop_id ON shop_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON shop_invitations(token);
CREATE INDEX IF NOT EXISTS idx_join_requests_shop_id ON barber_join_requests(shop_id);

ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_owner_all" ON shop_invitations FOR ALL USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
);
CREATE POLICY "invitations_invitee_select" ON shop_invitations FOR SELECT USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "join_requests_insert" ON barber_join_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);
CREATE POLICY "join_requests_owner" ON barber_join_requests FOR SELECT USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
  OR requester_id = auth.uid()
);
CREATE POLICY "join_requests_owner_update" ON barber_join_requests FOR UPDATE USING (
  shop_id IN (SELECT id FROM barber_shops WHERE owner_id = auth.uid())
);
