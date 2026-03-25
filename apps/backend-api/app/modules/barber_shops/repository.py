from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

TABLE = "barber_shops"
HOURS_TABLE = "business_hours"


class BarberShopRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def list_active(self) -> list[dict[str, Any]]:
        result = await self._client.table(TABLE).select("*").eq("is_active", True).execute()
        return result.data or []

    async def get_by_id(self, shop_id: str) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).select("*").eq("id", shop_id).execute()
        rows = result.data or []
        return rows[0] if rows else None

    async def get_by_slug(self, slug: str) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).select("id").eq("slug", slug).execute()
        rows = result.data or []
        return rows[0] if rows else None

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(TABLE).insert(data).execute()
        rows = result.data or []
        return rows[0]

    async def update(self, shop_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE).update(data).eq("id", shop_id).execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def deactivate(self, shop_id: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .update({"is_active": False})
            .eq("id", shop_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    # -------------------------------------------------------------------------
    # Branding
    # -------------------------------------------------------------------------

    async def update_branding(
        self, shop_id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).update(data).eq("id", shop_id).execute()
        rows = result.data or []
        return rows[0] if rows else None

    # -------------------------------------------------------------------------
    # Gallery
    # -------------------------------------------------------------------------

    async def get_gallery_urls(self, shop_id: str) -> list[str]:
        result = (
            await self._client.table(TABLE)
            .select("gallery_urls")
            .eq("id", shop_id)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return []
        return rows[0].get("gallery_urls") or []

    async def update_gallery_urls(
        self, shop_id: str, urls: list[str]
    ) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .update({"gallery_urls": urls})
            .eq("id", shop_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    # -------------------------------------------------------------------------
    # Business hours
    # -------------------------------------------------------------------------

    async def get_hours_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        result = (
            await self._client.table(HOURS_TABLE)
            .select("*")
            .eq("barbershop_id", shop_id)
            .execute()
        )
        return result.data or []

    async def upsert_day_hours(
        self, shop_id: str, day_index: int, open_time: str, close_time: str, is_closed: bool
    ) -> dict[str, Any]:
        existing = (
            await self._client.table(HOURS_TABLE)
            .select("id")
            .eq("barbershop_id", shop_id)
            .eq("day_of_week", day_index)
            .execute()
        )
        rows = existing.data or []

        payload: dict[str, Any] = {
            "barbershop_id": shop_id,
            "day_of_week": day_index,
            "open_time": open_time,
            "close_time": close_time,
            "is_closed": is_closed,
        }

        if rows:
            result = (
                await self._client.table(HOURS_TABLE)
                .update(payload)
                .eq("id", rows[0]["id"])
                .execute()
            )
        else:
            result = await self._client.table(HOURS_TABLE).insert(payload).execute()

        result_rows = result.data or []
        return result_rows[0] if result_rows else payload
