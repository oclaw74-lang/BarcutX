from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

TABLE = "barber_shops"


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
