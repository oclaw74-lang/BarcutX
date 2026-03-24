from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient

SHOP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
ENTRY_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
SAMPLE_ENTRY = {
    "id": ENTRY_ID, "shop_id": SHOP_ID, "client_name": "Test Client",
    "status": "waiting", "position": 1, "joined_at": "2026-03-24T10:00:00+00:00",
    "barber_id": None, "service_id": None,
}
VALID_JOIN_PAYLOAD = {"client_name": "Test Client"}


def _make_supabase_mock() -> MagicMock:
    mock = MagicMock()
    table_mock = MagicMock()
    execute_result = MagicMock(data=[SAMPLE_ENTRY])
    table_mock.insert.return_value.execute = AsyncMock(return_value=execute_result)
    table_mock.select.return_value.eq.return_value.neq.return_value.neq.return_value.order.return_value.execute = AsyncMock(return_value=MagicMock(data=[SAMPLE_ENTRY]))
    table_mock.select.return_value.eq.return_value.execute = AsyncMock(return_value=execute_result)
    table_mock.update.return_value.eq.return_value.execute = AsyncMock(return_value=execute_result)
    mock.table.return_value = table_mock
    return mock


def _make_redis_mock(queue_data=None) -> AsyncMock:
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=queue_data)
    mock.set = AsyncMock()
    mock.publish = AsyncMock()
    mock.ping = AsyncMock()
    return mock


@pytest.mark.asyncio
async def test_get_empty_queue(client: AsyncClient) -> None:
    supabase = _make_supabase_mock()
    supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.neq.return_value.order.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    async def _fake_supabase():
        return supabase

    with (
        patch("app.api.v1.queue.get_supabase", new=_fake_supabase),
        patch("app.core.queue_manager.get_redis") as mock_redis,
    ):
        mock_redis.return_value = _make_redis_mock(queue_data=None)
        response = await client.get(f"/api/v1/queue/{SHOP_ID}")

    assert response.status_code == 200
    data = response.json()
    assert data["shop_id"] == SHOP_ID
    assert data["entries"] == []
    assert data["total_waiting"] == 0


@pytest.mark.asyncio
async def test_join_queue_returns_entry(client: AsyncClient) -> None:
    supabase = _make_supabase_mock()

    async def _fake_supabase():
        return supabase

    with (
        patch("app.api.v1.queue.get_supabase", new=_fake_supabase),
        patch("app.core.queue_manager.get_redis") as mock_redis,
        patch("app.api.v1.queue.ws_manager") as mock_ws,
    ):
        mock_redis.return_value = _make_redis_mock(queue_data=None)
        mock_ws.broadcast_to_shop = AsyncMock()
        response = await client.post(f"/api/v1/queue/{SHOP_ID}/join", json=VALID_JOIN_PAYLOAD)

    assert response.status_code == 200
    data = response.json()
    assert data["client_name"] == "Test Client"
    assert data["status"] == "waiting"
    assert "id" in data
    assert data["shop_id"] == SHOP_ID


@pytest.mark.asyncio
async def test_join_queue_invalid_body_returns_422(client: AsyncClient) -> None:
    response = await client.post(f"/api/v1/queue/{SHOP_ID}/join", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_join_queue_empty_name_returns_422(client: AsyncClient) -> None:
    response = await client.post(f"/api/v1/queue/{SHOP_ID}/join", json={"client_name": ""})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_call_next_without_auth_returns_401(client: AsyncClient) -> None:
    response = await client.post(f"/api/v1/queue/{SHOP_ID}/call-next")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_call_next_with_invalid_token_returns_401(client: AsyncClient) -> None:
    response = await client.post(
        f"/api/v1/queue/{SHOP_ID}/call-next",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mark_done_without_auth_returns_401(client: AsyncClient) -> None:
    response = await client.post(f"/api/v1/queue/{SHOP_ID}/entries/{ENTRY_ID}/done")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_leave_queue(client: AsyncClient) -> None:
    supabase = _make_supabase_mock()

    async def _fake_supabase():
        return supabase

    with (
        patch("app.api.v1.queue.get_supabase", new=_fake_supabase),
        patch("app.core.queue_manager.get_redis") as mock_redis,
        patch("app.api.v1.queue.ws_manager") as mock_ws,
    ):
        mock_redis.return_value = _make_redis_mock(queue_data=None)
        mock_ws.broadcast_to_shop = AsyncMock()
        response = await client.post(f"/api/v1/queue/{SHOP_ID}/entries/{ENTRY_ID}/leave")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == ENTRY_ID
    assert data["status"] == "left"
