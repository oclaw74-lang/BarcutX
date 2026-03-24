from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient
from app.core.queue_manager import add_to_queue, get_next_waiting, get_queue, remove_from_queue, update_entry_status
from app.modules.queue.repository import QueueRepository
from app.modules.queue.schemas import JoinQueueRequest

log = structlog.get_logger()

class QueueService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = QueueRepository(client)

    async def get_queue_state(self, shop_id: str) -> list[dict[str, Any]]:
        queue = await get_queue(shop_id)
        if queue:
            return queue
        return await self._repo.list_by_shop(shop_id)

    async def join(self, shop_id: str, body: JoinQueueRequest, client_id: str | None = None) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        entry_id = str(uuid4())
        db_payload: dict[str, Any] = {
            "id": entry_id, "shop_id": shop_id, "client_name": body.client_name,
            "status": "waiting", "position": 0, "joined_at": now,
        }
        if client_id:
            db_payload["client_id"] = client_id
        if body.service_id:
            db_payload["service_id"] = str(body.service_id)
        if body.barber_id:
            db_payload["barber_id"] = str(body.barber_id)
        try:
            await self._repo.insert(db_payload)
        except Exception as exc:
            log.error("queue_join_db_error", shop_id=shop_id, error=str(exc))
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not persist queue entry") from exc
        redis_entry: dict[str, Any] = {
            "id": entry_id, "shop_id": shop_id, "client_name": body.client_name,
            "status": "waiting", "position": 0, "joined_at": now,
            "barber_id": str(body.barber_id) if body.barber_id else None,
            "service_id": str(body.service_id) if body.service_id else None,
        }
        queue = await add_to_queue(shop_id, redis_entry)
        for e in queue:
            if e["id"] == entry_id:
                return e
        return redis_entry

    async def call_next(self, shop_id: str) -> dict[str, Any]:
        entry = await get_next_waiting(shop_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No waiting clients in queue")
        now = datetime.now(timezone.utc).isoformat()
        try:
            await self._repo.update_status(entry["id"], "called", {"called_at": now})
        except Exception as exc:
            log.error("queue_call_next_db_error", entry_id=entry["id"], error=str(exc))
        queue = await update_entry_status(shop_id, entry["id"], "called")
        for e in queue:
            if e["id"] == entry["id"]:
                return e
        return {**entry, "status": "called"}

    async def mark_done(self, shop_id: str, entry_id: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        try:
            await self._repo.update_status(entry_id, "done", {"done_at": now})
        except Exception as exc:
            log.error("queue_mark_done_db_error", entry_id=entry_id, error=str(exc))
        queue = await remove_from_queue(shop_id, entry_id)
        return {"id": entry_id, "status": "done", "queue": queue}

    async def leave(self, shop_id: str, entry_id: str) -> dict[str, Any]:
        try:
            await self._repo.update_status(entry_id, "left")
        except Exception as exc:
            log.error("queue_leave_db_error", entry_id=entry_id, error=str(exc))
        queue = await remove_from_queue(shop_id, entry_id)
        return {"id": entry_id, "status": "left", "queue": queue}
