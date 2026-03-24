import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.core.logging import configure_logging
from app.core.websocket_manager import ws_manager

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    log.info("barcutx_api_starting", environment=settings.environment)
    redis_task = asyncio.create_task(ws_manager.listen_redis())
    yield
    redis_task.cancel()
    try:
        await redis_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()
    log.info("barcutx_api_stopped")


app = FastAPI(
    title="BarcutX API", version="0.1.0", lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None, redoc_url=None,
)

app.add_middleware(
    CORSMiddleware, allow_origins=settings.allowed_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    from sqlalchemy import text
    from app.core.database import AsyncSessionLocal
    from app.core.redis import get_redis
    db_status = "disconnected"
    redis_status = "disconnected"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        log.warning("health_check_db_failed", error=str(e))
    try:
        redis = get_redis()
        await redis.ping()
        redis_status = "connected"
    except Exception as e:
        log.warning("health_check_redis_failed", error=str(e))
    return {"status": "ok", "db": db_status, "redis": redis_status, "version": "0.1.0"}


from app.api.v1.queue import router as queue_router  # noqa: E402
app.include_router(queue_router, prefix="/api/v1")
