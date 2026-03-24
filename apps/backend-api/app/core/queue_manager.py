import json
import structlog
from app.core.redis import get_redis

log = structlog.get_logger()
QUEUE_KEY = "barcutx:queue:{shop_id}"
QUEUE_TTL = 86400

async def get_queue(shop_id: str) -> list[dict]:
    redis = get_redis()
    data = await redis.get(QUEUE_KEY.format(shop_id=shop_id))
    if not data:
        return []
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        log.error("queue_corrupt_data", shop_id=shop_id)
        return []

async def add_to_queue(shop_id: str, entry: dict) -> list[dict]:
    queue = await get_queue(shop_id)
    waiting = sum(1 for e in queue if e.get("status") == "waiting")
    entry["position"] = waiting + 1
    queue.append(entry)
    redis = get_redis()
    await redis.set(QUEUE_KEY.format(shop_id=shop_id), json.dumps(queue), ex=QUEUE_TTL)
    return queue

async def update_entry_status(shop_id: str, entry_id: str, status: str) -> list[dict]:
    queue = await get_queue(shop_id)
    for entry in queue:
        if entry["id"] == entry_id:
            entry["status"] = status
            break
    redis = get_redis()
    await redis.set(QUEUE_KEY.format(shop_id=shop_id), json.dumps(queue), ex=QUEUE_TTL)
    return queue

async def remove_from_queue(shop_id: str, entry_id: str) -> list[dict]:
    queue = await get_queue(shop_id)
    queue = [e for e in queue if e["id"] != entry_id]
    pos = 1
    for entry in queue:
        if entry.get("status") == "waiting":
            entry["position"] = pos
            pos += 1
    redis = get_redis()
    await redis.set(QUEUE_KEY.format(shop_id=shop_id), json.dumps(queue), ex=QUEUE_TTL)
    return queue

async def get_next_waiting(shop_id: str) -> dict | None:
    queue = await get_queue(shop_id)
    for entry in queue:
        if entry.get("status") == "waiting":
            return entry
    return None
