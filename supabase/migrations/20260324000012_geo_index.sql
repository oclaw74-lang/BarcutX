-- Migration: geolocation columns, index and Haversine RPC function
-- Issue #16 — Geo search and nearby shops

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add lat/lng columns to barber_shops if they don't exist
ALTER TABLE barber_shops
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Partial index for proximity queries (only rows with coordinates)
CREATE INDEX IF NOT EXISTS idx_barber_shops_location
    ON barber_shops (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Haversine function: returns active shops within radius_km sorted by distance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_nearby_shops(
    user_lat    DOUBLE PRECISION,
    user_lng    DOUBLE PRECISION,
    radius_km   DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
    id           UUID,
    name         TEXT,
    slug         TEXT,
    address      TEXT,
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    distance_km  DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.id,
        bs.name,
        bs.slug,
        bs.address,
        bs.latitude,
        bs.longitude,
        (6371.0 * acos(
            LEAST(1.0,
                cos(radians(user_lat)) * cos(radians(bs.latitude)) *
                cos(radians(bs.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(bs.latitude))
            )
        )) AS distance_km
    FROM barber_shops bs
    WHERE bs.is_active = TRUE
      AND bs.latitude  IS NOT NULL
      AND bs.longitude IS NOT NULL
      AND (6371.0 * acos(
            LEAST(1.0,
                cos(radians(user_lat)) * cos(radians(bs.latitude)) *
                cos(radians(bs.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(bs.latitude))
            )
          )) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
