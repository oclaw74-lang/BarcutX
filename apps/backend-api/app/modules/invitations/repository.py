from typing import Any

import structlog
from supabase import AsyncClient

log = structlog.get_logger()

INVITATIONS_TABLE = "invitations"
JOIN_REQUESTS_TABLE = "join_requests"


class InvitationRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(INVITATIONS_TABLE).insert(data).execute()
        rows = result.data or []
        return rows[0]

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        result = (
            await self._client.table(INVITATIONS_TABLE)
            .select("*")
            .eq("shop_id", shop_id)
            .execute()
        )
        return result.data or []

    async def get_by_id(self, invitation_id: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(INVITATIONS_TABLE)
            .select("*")
            .eq("id", invitation_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def get_by_token(self, token: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(INVITATIONS_TABLE)
            .select("*")
            .eq("token", token)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def update_status(
        self, invitation_id: str, status: str
    ) -> dict[str, Any] | None:
        result = (
            await self._client.table(INVITATIONS_TABLE)
            .update({"status": status})
            .eq("id", invitation_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def delete(self, invitation_id: str) -> bool:
        result = (
            await self._client.table(INVITATIONS_TABLE)
            .delete()
            .eq("id", invitation_id)
            .execute()
        )
        rows = result.data or []
        return len(rows) > 0


class JoinRequestRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        result = await self._client.table(JOIN_REQUESTS_TABLE).insert(data).execute()
        rows = result.data or []
        return rows[0]

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        result = (
            await self._client.table(JOIN_REQUESTS_TABLE)
            .select("*")
            .eq("shop_id", shop_id)
            .execute()
        )
        return result.data or []

    async def get_by_id(self, request_id: str) -> dict[str, Any] | None:
        result = (
            await self._client.table(JOIN_REQUESTS_TABLE)
            .select("*")
            .eq("id", request_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    async def update_status(
        self, request_id: str, status: str
    ) -> dict[str, Any] | None:
        result = (
            await self._client.table(JOIN_REQUESTS_TABLE)
            .update({"status": status})
            .eq("id", request_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None
