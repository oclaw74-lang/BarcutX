-- Migration: Virtual queue table
-- Apply manually via Supabase SQL editor or CLI: supabase db push

CREATE TYPE queue_status AS ENUM ('waiting', 'called', 'serving', 'done', 'left');

CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    status queue_status NOT NULL DEFAULT 'waiting',
    position INTEGER NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    done_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_queue_shop_status ON public.queue_entries(shop_id, status);

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view queue"
    ON public.queue_entries FOR SELECT
    USING (TRUE);

CREATE POLICY "Clients can join queue"
    ON public.queue_entries FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Shop staff can update queue"
    ON public.queue_entries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.barber_shops
            WHERE id = shop_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.barbers
            WHERE shop_id = queue_entries.shop_id AND profile_id = auth.uid()
        )
    );
