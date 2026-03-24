import json
from collections import defaultdict

import structlog
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

from app.core.redis import get_redis

log = structlog.get_logger()


class WebSocketManager:
    """
    Manages WebSocket connections grouped by barber_shop_id.
    Uses Redis Pub/Sub to broadcast across multiple FastAPI instances.
    """

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, shop_id: str) -> None:
        await websocket.accept()
        self._connections[shop_id].add(websocket)
        log.info("ws_client_connected", shop_id=shop_id, total=len(self._connections[shop_id]))

    def disconnect(self, websocket: WebSocket, shop_id: str) -> None:
        self._connections[shop_id].discard(websocket)
        log.info("ws_client_disconnected", shop_id=shop_id, total=len(self._connections[shop_id]))

    async def broadcast_to_shop(self, shop_id: str, event: dict) -> None:
        """Publish event to Redis — reaches all FastAPI instances."""
        redis = get_redis()
        channel = f"queue:{shop_id}"
        await redis.publish(channel, json.dumps(event))

    async def _deliver_to_local_connections(self, shop_id: str, message: dict) -> None:
        """Send message to all local WebSocket connections for a shop."""
        dead: list[WebSocket] = []
        for ws in list(self._connections[shop_id]):
            try:
                await ws.send_json(message)
            except (WebSocketDisconnect, RuntimeError):
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, shop_id)

    async def listen_redis(self) -> None:
        """Subscribe to Redis Pub/Sub and relay to local connections."""
        redis = get_redis()
        pubsub = redis.pubsub()
        await pubsub.psubscribe("queue:*")

        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue
            channel: str = message["channel"]
            shop_id = channel.removeprefix("queue:")
            try:
                data = json.loads(message["data"])
                await self._deliver_to_local_connections(shop_id, data)
            except (json.JSONDecodeError, Exception) as e:
                log.error("ws_relay_error", shop_id=shop_id, error=str(e))


ws_manager = WebSocketManager()
