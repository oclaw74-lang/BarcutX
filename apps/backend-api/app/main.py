from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.core.logging import configure_logging

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    log.info("barcutx_api_starting", environment=settings.environment)
    yield
    await engine.dispose()
    log.info("barcutx_api_stopped")


app = FastAPI(
    title="BarcutX API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


# Routers (registered in Fase 1)
# from app.api.v1 import router as api_v1_router
# app.include_router(api_v1_router, prefix="/api/v1")
