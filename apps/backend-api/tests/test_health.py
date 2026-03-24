from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient) -> None:
    with (
        patch("app.core.database.AsyncSessionLocal") as mock_session_factory,
        patch("app.core.redis.get_redis") as mock_get_redis,
    ):
        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session.execute = AsyncMock()
        mock_session_factory.return_value = mock_session

        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock()
        mock_get_redis.return_value = mock_redis

        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "db" in data
    assert "redis" in data


@pytest.mark.asyncio
async def test_health_db_disconnected_still_returns_ok(client: AsyncClient) -> None:
    with (
        patch("app.core.database.AsyncSessionLocal") as mock_session_factory,
        patch("app.core.redis.get_redis") as mock_get_redis,
    ):
        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(side_effect=Exception("DB unreachable"))
        mock_session_factory.return_value = mock_session

        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock()
        mock_get_redis.return_value = mock_redis

        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "disconnected"
