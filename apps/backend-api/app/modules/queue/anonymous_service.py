import secrets
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.core.queue_manager import add_to_queue, get_queue
from app.modules.queue.schemas import AnonymousQueueJoin, AnonymousQueueEntry, PublicQueueStatus

log = structlog.get_logger()

# Minutes estimated per client served
_ETA_PER_CLIENT_MINUTES = 15


class AnonymousQueueService:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_barber_by_code(self, barber_code: str) -> dict[str, Any]:
        """Fetch the barber row by its public barber_code. Raises 404 if not found."""
        result = (
            await self._client.table("barbers")
            .select("*")
            .eq("barber_code", barber_code)
            .execute()
        )
        rows = result.data or []
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )
        return rows[0]

    async def _get_shop(self, shop_id: str) -> dict[str, Any]:
        """Fetch the barber shop row. Returns empty dict if not found."""
        result = (
            await self._client.table("barber_shops")
            .select("id, name")
            .eq("id", shop_id)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else {}

    async def _get_barber_services(self, barber_id: str) -> list[dict[str, Any]]:
        """Fetch the active services offered by the barber."""
        result = (
            await self._client.table("services")
            .select("id, name, price, duration_minutes")
            .eq("barber_id", barber_id)
            .eq("is_active", True)
            .execute()
        )
        return result.data or []

    def _compute_eta(self, waiting_count: int) -> int:
        """Return estimated wait time in minutes."""
        return waiting_count * _ETA_PER_CLIENT_MINUTES

    def _current_client_name(self, entries: list[dict[str, Any]]) -> str | None:
        """Return first name of the currently called/serving client, if any."""
        for e in entries:
            if e.get("status") == "called":
                full_name: str = e.get("client_name", "")
                return full_name.split()[0] if full_name else None
        return None

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    async def get_public_status(self, barber_code: str) -> PublicQueueStatus:
        """Return the public queue status for a barber identified by barber_code."""
        barber = await self._get_barber_by_code(barber_code)
        barber_id = barber["id"]
        shop_id = barber.get("shop_id")

        shop_name = ""
        if shop_id:
            shop = await self._get_shop(shop_id)
            shop_name = shop.get("name", "")

        services = await self._get_barber_services(barber_id)
        entries = await get_queue(barber_id)
        if not entries:
            result = (
                await self._client.table("queue_entries")
                .select("*")
                .eq("barber_id", barber_id)
                .not_.in_("status", ["done", "left"])
                .order("position")
                .execute()
            )
            entries = result.data or []

        waiting = [e for e in entries if e.get("status") == "waiting"]
        current = self._current_client_name(entries)

        barber_name = barber.get("display_name") or barber.get("profile_id", "")
        is_available = barber.get("is_open", True)

        return PublicQueueStatus(
            barber_code=barber_code,
            barber_name=barber_name,
            shop_name=shop_name,
            is_available=is_available,
            queue_length=len(waiting),
            estimated_wait_minutes=self._compute_eta(len(waiting)),
            current_client=current,
            services=services,
        )

    async def join_anonymous(
        self, barber_code: str, body: AnonymousQueueJoin
    ) -> AnonymousQueueEntry:
        """Create an anonymous queue entry for the given barber."""
        barber = await self._get_barber_by_code(barber_code)
        barber_id = barber["id"]
        shop_id = barber.get("shop_id")

        shop_name = ""
        if shop_id:
            shop = await self._get_shop(shop_id)
            shop_name = shop.get("name", "")

        now = datetime.now(timezone.utc).isoformat()
        entry_id = str(uuid4())
        session_token = secrets.token_urlsafe(16)

        db_payload: dict[str, Any] = {
            "id": entry_id,
            "shop_id": shop_id or barber_id,  # fallback to barber_id when freelance
            "barber_id": barber_id,
            "client_name": body.client_name,
            "status": "waiting",
            "position": 0,
            "joined_at": now,
            "is_anonymous": True,
            "session_token": session_token,
            "source": "qr_scan",
        }
        if body.client_phone:
            db_payload["client_phone"] = body.client_phone
        if body.service_id:
            db_payload["service_id"] = str(body.service_id)
        if body.service_name:
            db_payload["service_name"] = body.service_name

        try:
            await self._client.table("queue_entries").insert(db_payload).execute()
        except Exception as exc:
            log.error("anonymous_queue_join_db_error", barber_code=barber_code, error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not persist queue entry",
            ) from exc

        redis_entry: dict[str, Any] = {**db_payload}
        queue = await add_to_queue(barber_id, redis_entry)

        position = 1
        for e in queue:
            if e["id"] == entry_id:
                position = e.get("position", 1)
                break

        waiting_before = max(0, position - 1)
        eta = self._compute_eta(waiting_before)
        barber_name = barber.get("display_name") or barber.get("profile_id", "")
        view_url = f"https://barcutx.com/q/{barber_code}/{entry_id}"

        log.info(
            "anonymous_queue_joined",
            barber_code=barber_code,
            entry_id=entry_id,
            position=position,
        )

        return AnonymousQueueEntry(
            entry_id=entry_id,  # type: ignore[arg-type]
            position=position,
            estimated_wait_minutes=eta,
            barber_name=barber_name,
            shop_name=shop_name,
            session_token=session_token,
            view_url=view_url,
        )

    async def get_entry_status(
        self, barber_code: str, entry_id: str, token: str
    ) -> dict[str, Any]:
        """Return current position and ETA for an anonymous entry, validating the session token."""
        barber = await self._get_barber_by_code(barber_code)
        barber_id = barber["id"]

        result = (
            await self._client.table("queue_entries")
            .select("*")
            .eq("id", entry_id)
            .execute()
        )
        rows = result.data or []
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Queue entry not found",
            )

        entry = rows[0]
        if entry.get("session_token") != token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Queue entry not found",
            )

        entry_status: str = entry.get("status", "waiting")
        if entry_status in ("done", "left"):
            return {
                "entry_id": entry_id,
                "status": entry_status,
                "message": "Your appointment is complete. Thank you!",
            }

        # Compute live position from Redis or DB
        entries = await get_queue(barber_id)
        if not entries:
            db_result = (
                await self._client.table("queue_entries")
                .select("*")
                .eq("barber_id", barber_id)
                .not_.in_("status", ["done", "left"])
                .order("position")
                .execute()
            )
            entries = db_result.data or []

        position = 1
        waiting_before = 0
        for e in entries:
            if e.get("status") == "waiting":
                if e["id"] == entry_id:
                    position = e.get("position", position)
                    break
                waiting_before += 1

        eta = self._compute_eta(waiting_before)

        return {
            "entry_id": entry_id,
            "status": entry_status,
            "position": position,
            "estimated_wait_minutes": eta,
        }
