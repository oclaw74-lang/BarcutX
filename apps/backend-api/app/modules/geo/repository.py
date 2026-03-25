from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

TABLE = "barber_shops"
BARBERS_TABLE = "barbers"


class GeoRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get_nearby_shops(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        limit: int,
    ) -> list[dict[str, Any]]:
        """Call the Haversine SQL RPC function and return rows."""
        result = await self._client.rpc(
            "get_nearby_shops",
            {"user_lat": lat, "user_lng": lng, "radius_km": radius_km},
        ).execute()
        rows: list[dict[str, Any]] = result.data or []
        return rows[:limit]

    async def search_shops(
        self,
        q: str | None,
        city: str | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        """Full-text name search and/or city filter on active shops."""
        query = (
            self._client.table(TABLE)
            .select("*")
            .eq("is_active", True)
        )
        if city:
            query = query.ilike("city", f"%{city}%")
        if q:
            query = query.ilike("name", f"%{q}%")
        result = await query.limit(limit).execute()
        return result.data or []

    async def get_by_id(self, shop_id: str) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).select("*").eq("id", shop_id).execute()
        rows = result.data or []
        return rows[0] if rows else None

    async def update_location(
        self,
        shop_id: str,
        latitude: float,
        longitude: float,
        address: str | None,
    ) -> dict[str, Any] | None:
        payload: dict[str, Any] = {"latitude": latitude, "longitude": longitude}
        if address is not None:
            payload["address"] = address
        result = (
            await self._client.table(TABLE)
            .update(payload)
            .eq("id", shop_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def count_barbers(self, shop_id: str) -> int:
        """Return the number of active barbers in a shop."""
        result = (
            await self._client.table(BARBERS_TABLE)
            .select("id", count="exact")
            .eq("shop_id", shop_id)
            .eq("is_active", True)
            .execute()
        )
        return result.count or 0
