from typing import Any

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.database import get_supabase
from app.core.websocket_manager import ws_manager
from app.modules.queue.anonymous_service import AnonymousQueueService
from app.modules.queue.schemas import (
    AnonymousQueueEntry,
    AnonymousQueueJoin,
    PublicQueueStatus,
)

log = structlog.get_logger()

router = APIRouter(prefix="/queue-public", tags=["queue-public"])


@router.get(
    "/{barber_code}",
    response_model=PublicQueueStatus,
    status_code=status.HTTP_200_OK,
)
async def get_public_queue_status(barber_code: str) -> PublicQueueStatus:
    """Return the public queue status for a barber. No authentication required."""
    supabase = await get_supabase()
    service = AnonymousQueueService(supabase)
    return await service.get_public_status(barber_code)


@router.post(
    "/{barber_code}/join",
    response_model=AnonymousQueueEntry,
    status_code=status.HTTP_200_OK,
)
async def join_anonymous_queue(
    barber_code: str, body: AnonymousQueueJoin
) -> AnonymousQueueEntry:
    """Join a barber's queue anonymously via QR scan. No authentication required."""
    supabase = await get_supabase()
    service = AnonymousQueueService(supabase)
    entry = await service.join_anonymous(barber_code, body)
    log.info("qr_anonymous_joined", barber_code=barber_code, entry_id=str(entry.entry_id))
    await ws_manager.broadcast_to_shop(
        barber_code,
        {"event": "queue_updated", "barber_code": barber_code},
    )
    return entry


@router.get(
    "/{barber_code}/{entry_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_entry_position(
    barber_code: str,
    entry_id: str,
    token: str = Query(..., description="session_token returned at join time"),
) -> dict[str, Any]:
    """
    Check the current position and ETA for an anonymous queue entry.
    Requires the session_token issued at join time. No authentication required.
    Returns a completion message when status is 'done' or 'left'.
    """
    supabase = await get_supabase()
    service = AnonymousQueueService(supabase)
    return await service.get_entry_status(barber_code, entry_id, token)


@router.websocket("/{barber_code}/ws")
async def anonymous_queue_websocket(
    websocket: WebSocket,
    barber_code: str,
    token: str | None = Query(default=None, description="session_token for personalized updates"),
) -> None:
    """
    WebSocket endpoint for real-time queue updates.
    No authentication required.
    Broadcasts queue_length, estimated_wait, and the client's position when token is provided.
    """
    await ws_manager.connect(websocket, barber_code)
    log.info("qr_ws_connected", barber_code=barber_code, has_token=token is not None)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, barber_code)
        log.info("qr_ws_disconnected", barber_code=barber_code)
