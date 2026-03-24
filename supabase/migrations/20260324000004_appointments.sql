-- Migration: appointments table
-- Run manually: apply via Supabase dashboard or CLI

CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_shop_id ON public.appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clients see their own appointments
CREATE POLICY "Clients can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = client_id);

-- Shop owners and assigned barbers see all appointments in their shop
CREATE POLICY "Shop staff can view shop appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.barber_shops WHERE id = shop_id AND owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.barbers WHERE shop_id = appointments.shop_id AND profile_id = auth.uid())
    );

-- Clients can create appointments for themselves
CREATE POLICY "Clients can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can cancel only their own pending appointments
CREATE POLICY "Clients can cancel own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = client_id AND status = 'pending');

-- Shop owners and barbers can update any appointment in their shop
CREATE POLICY "Shop staff can update appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.barber_shops WHERE id = shop_id AND owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.barbers WHERE shop_id = appointments.shop_id AND profile_id = auth.uid())
    );
