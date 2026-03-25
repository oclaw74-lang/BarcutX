from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

TABLE = "barbers"


class BarberRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        result = await self._client.table(TABLE).select("*").eq("shop_id", shop_id).execute()
        return result.data or []

    async def get_by_id(self, barber_id: str) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).select("*").eq("id", barber_id).execute()
        rows = result.data or []
        return rows[0] if rows else None

    async def get_by_profile_id(self, profile_id: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .select("*")
            .eq("profile_id", profile_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def list_available(
        self,
        city: str | None = None,
        specialty: str | None = None,
    ) -> list[dict[str, Any]]:
        builder = self._client.table(TABLE).select("*").eq("is_available_for_hire", True)
        if city:
            builder = builder.eq("target_city", city)
        if specialty:
            builder = builder.eq("specialty", specialty)
        result = await builder.execute()
        return result.data or []

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(TABLE).insert(data).execute()
        rows = result.data or []
        return rows[0]

    async def update(self, barber_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .update(data)
            .eq("id", barber_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def delete(self, barber_id: str) -> bool:
        result = await self._client.table(TABLE).delete().eq("id", barber_id).execute()
        rows = result.data or []
        return len(rows) > 0
