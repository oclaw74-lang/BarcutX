-- Migration: services table
-- Created: 2026-03-24
-- Issue: #10 - Sistema de servicios y precios

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Shop owners can manage services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barber_shops
            WHERE id = shop_id AND owner_id = auth.uid()
        )
    );
