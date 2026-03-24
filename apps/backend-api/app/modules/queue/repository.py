from typing import Any
import structlog
from supabase import AsyncClient

log = structlog.get_logger()
TABLE = "queue_entries"

class QueueRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def insert(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(TABLE).insert(data).execute()
        return (result.data or [])[0]

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        result = (
            await self._client.table(TABLE)
            .select("*")
            .eq("shop_id", shop_id)
            .neq("status", "done")
            .neq("status", "left")
            .order("position")
            .execute()
        )
        return result.data or []

    async def get_by_id(self, entry_id: str) -> dict[str, Any] | None:
        result = await self._client.table(TABLE).select("*").eq("id", entry_id).execute()
        rows = result.data or []
        return rows[0] if rows else None

    async def update_status(self, entry_id: str, status: str, extra: dict[str, Any] | None = None) -> dict[str, Any] | None:
        payload: dict[str, Any] = {"status": status}
        if extra:
            payload.update(extra)
        result = await self._client.table(TABLE).update(payload).eq("id", entry_id).execute()
        rows = result.data or []
        return rows[0] if rows else None
