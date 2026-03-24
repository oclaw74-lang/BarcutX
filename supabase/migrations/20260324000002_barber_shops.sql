-- Migration: barber_shops and barbers tables
-- Run manually via Supabase dashboard or CLI

CREATE TABLE IF NOT EXISTS public.barber_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.barber_shops(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shop_id, profile_id)
);

ALTER TABLE public.barber_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- barber_shops: public read, owner write
CREATE POLICY "Anyone can view active shops" ON public.barber_shops
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Owners can manage their shops" ON public.barber_shops
    FOR ALL USING (auth.uid() = owner_id);

-- barbers: public read, shop owner manages
CREATE POLICY "Anyone can view barbers" ON public.barbers
    FOR SELECT USING (TRUE);

CREATE POLICY "Shop owners can manage barbers" ON public.barbers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barber_shops
            WHERE id = shop_id AND owner_id = auth.uid()
        )
    );
