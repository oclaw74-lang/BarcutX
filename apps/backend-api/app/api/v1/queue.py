from typing import Annotated
import structlog
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.core.websocket_manager import ws_manager
from app.modules.queue.schemas import JoinQueueRequest, QueueEntryResponse, QueueResponse
from app.modules.queue.service import QueueService

log = structlog.get_logger()
router = APIRouter(prefix="/queue", tags=["queue"])


def _entry_response(e: dict) -> QueueEntryResponse:
    return QueueEntryResponse(
        id=e["id"], shop_id=e["shop_id"], client_name=e["client_name"],
        status=e["status"], position=e.get("position", 0), joined_at=e.get("joined_at", ""),
        barber_id=e.get("barber_id"), service_id=e.get("service_id"),
    )


@router.get("/{shop_id}", response_model=QueueResponse, status_code=status.HTTP_200_OK)
async def get_queue(shop_id: str) -> QueueResponse:
    supabase = await get_supabase()
    entries = await QueueService(supabase).get_queue_state(shop_id)
    models = [_entry_response(e) for e in entries]
    return QueueResponse(shop_id=shop_id, entries=models, total_waiting=sum(1 for e in entries if e.get("status") == "waiting"))


@router.post("/{shop_id}/join", response_model=QueueEntryResponse, status_code=status.HTTP_200_OK)
async def join_queue(shop_id: str, body: JoinQueueRequest) -> QueueEntryResponse:
    supabase = await get_supabase()
    svc = QueueService(supabase)
    entry = await svc.join(shop_id, body)
    log.info("queue_client_joined", shop_id=shop_id, entry_id=entry["id"])
    queue_state = await svc.get_queue_state(shop_id)
    await ws_manager.broadcast_to_shop(shop_id, {"event": "queue_updated", "shop_id": shop_id, "entries": queue_state})
    return _entry_response(entry)


@router.post("/{shop_id}/call-next", response_model=QueueEntryResponse, status_code=status.HTTP_200_OK)
async def call_next(shop_id: str, user_id: Annotated[str, Depends(get_auth_user_id)]) -> QueueEntryResponse:
    supabase = await get_supabase()
    svc = QueueService(supabase)
    entry = await svc.call_next(shop_id)
    log.info("queue_call_next", shop_id=shop_id, entry_id=entry["id"], caller=user_id)
    queue_state = await svc.get_queue_state(shop_id)
    await ws_manager.broadcast_to_shop(shop_id, {"event": "client_called", "shop_id": shop_id, "called_entry_id": entry["id"], "entries": queue_state})
    return _entry_response(entry)


@router.post("/{shop_id}/entries/{entry_id}/done", status_code=status.HTTP_200_OK)
async def mark_done(shop_id: str, entry_id: str, user_id: Annotated[str, Depends(get_auth_user_id)]) -> dict:
    supabase = await get_supabase()
    result = await QueueService(supabase).mark_done(shop_id, entry_id)
    log.info("queue_entry_done", shop_id=shop_id, entry_id=entry_id, actor=user_id)
    await ws_manager.broadcast_to_shop(shop_id, {"event": "entry_done", "shop_id": shop_id, "entry_id": entry_id, "entries": result["queue"]})
    return {"id": entry_id, "status": "done"}


@router.post("/{shop_id}/entries/{entry_id}/leave", status_code=status.HTTP_200_OK)
async def leave_queue(shop_id: str, entry_id: str) -> dict:
    supabase = await get_supabase()
    result = await QueueService(supabase).leave(shop_id, entry_id)
    log.info("queue_client_left", shop_id=shop_id, entry_id=entry_id)
    await ws_manager.broadcast_to_shop(shop_id, {"event": "client_left", "shop_id": shop_id, "entry_id": entry_id, "entries": result["queue"]})
    return {"id": entry_id, "status": "left"}


@router.websocket("/{shop_id}/ws")
async def queue_websocket(websocket: WebSocket, shop_id: str) -> None:
    await ws_manager.connect(websocket, shop_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, shop_id)
