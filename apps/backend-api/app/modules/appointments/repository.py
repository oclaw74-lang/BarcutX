from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

TABLE = "appointments"
SERVICES_TABLE = "services"


class AppointmentRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def get_service_duration(self, service_id: str) -> int | None:
        """Return duration_minutes for the given service, or None if not found."""
        result = (
            await self._client.table(SERVICES_TABLE)
            .select("duration_minutes")
            .eq("id", service_id)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return None
        return int(rows[0]["duration_minutes"])

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(TABLE).insert(data).execute()
        rows = result.data or []
        return rows[0]

    async def list_by_client(self, client_id: str) -> list[dict[str, Any]]:
        result = (
            await self._client.table(TABLE)
            .select("*")
            .eq("client_id", client_id)
            .order("scheduled_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_by_id(self, appointment_id: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .select("*")
            .eq("id", appointment_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def update_status(
        self, appointment_id: str, status: str
    ) -> dict[str, Any] | None:
        result = (
            await self._client.table(TABLE)
            .update({"status": status})
            .eq("id", appointment_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None
