"""Unit tests for the appointments endpoints (issue #11)."""

from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from jose import jwt

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

JWT_SECRET = "test-jwt-secret"
ALGORITHM = "HS256"

CLIENT_ID = str(uuid4())
SHOP_ID = str(uuid4())
SERVICE_ID = str(uuid4())
BARBER_ID = str(uuid4())
APPT_ID = str(uuid4())

SCHEDULED_AT = datetime(2026, 4, 1, 10, 0, 0, tzinfo=timezone.utc)


def _make_token(user_id: str) -> str:
    """Generate a Supabase-style JWT for tests."""
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": 9999999999,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def _appt_row(
    *,
    appt_id: str = APPT_ID,
    client_id: str = CLIENT_ID,
    shop_id: str = SHOP_ID,
    status: str = "pending",
) -> dict[str, Any]:
    return {
        "id": appt_id,
        "shop_id": shop_id,
        "barber_id": None,
        "client_id": client_id,
        "service_id": SERVICE_ID,
        "scheduled_at": SCHEDULED_AT.isoformat(),
        "duration_minutes": 30,
        "status": status,
        "notes": None,
        "created_at": "2026-03-23T00:00:00+00:00",
    }


def _mock_supabase_result(data: list[dict[str, Any]]) -> MagicMock:
    result = MagicMock()
    result.data = data
    return result


def _build_supabase_chain(return_data: list[dict[str, Any]]) -> AsyncMock:
    """Return an AsyncMock that mimics the supabase table chaining API."""
    execute_mock = AsyncMock(return_value=_mock_supabase_result(return_data))
    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.update.return_value = chain
    chain.delete.return_value = chain
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.execute = execute_mock
    return chain


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_appointment_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /api/v1/appointments without a Bearer token must return 401."""
    response = await client.post(
        "/api/v1/appointments",
        json={
            "shop_id": SHOP_ID,
            "service_id": SERVICE_ID,
            "scheduled_at": SCHEDULED_AT.isoformat(),
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_appointment_with_auth(client: AsyncClient) -> None:
    """POST /api/v1/appointments with valid auth must return 201 and the new appointment."""
    token = _make_token(CLIENT_ID)

    # Two sequential supabase calls: get_service_duration → create
    service_result = _mock_supabase_result([{"duration_minutes": 30}])
    create_result = _mock_supabase_result([_appt_row()])

    execute_mock = AsyncMock(side_effect=[service_result, create_result])

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.eq.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.post(
            "/api/v1/appointments",
            json={
                "shop_id": SHOP_ID,
                "service_id": SERVICE_ID,
                "scheduled_at": SCHEDULED_AT.isoformat(),
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == APPT_ID
    assert data["status"] == "pending"
    assert data["client_id"] == CLIENT_ID


@pytest.mark.asyncio
async def test_create_appointment_service_not_found_returns_404(client: AsyncClient) -> None:
    """POST /api/v1/appointments with an unknown service_id must return 404."""
    token = _make_token(CLIENT_ID)

    # Service lookup returns empty list
    service_result = _mock_supabase_result([])
    execute_mock = AsyncMock(return_value=service_result)

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.post(
            "/api/v1/appointments",
            json={
                "shop_id": SHOP_ID,
                "service_id": str(uuid4()),
                "scheduled_at": SCHEDULED_AT.isoformat(),
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_my_appointments(client: AsyncClient) -> None:
    """GET /api/v1/appointments must return 200 and the client's appointments."""
    token = _make_token(CLIENT_ID)
    rows = [_appt_row()]

    list_result = _mock_supabase_result(rows)
    execute_mock = AsyncMock(return_value=list_result)

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.get(
            "/api/v1/appointments",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == APPT_ID


@pytest.mark.asyncio
async def test_list_my_appointments_without_auth_returns_401(client: AsyncClient) -> None:
    """GET /api/v1/appointments without auth must return 401."""
    response = await client.get("/api/v1/appointments")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cancel_appointment(client: AsyncClient) -> None:
    """POST /api/v1/appointments/{id}/cancel must return 200 with cancelled status."""
    token = _make_token(CLIENT_ID)

    pending_row = _appt_row(status="pending")
    cancelled_row = _appt_row(status="cancelled")

    # Calls: get_by_id → update_status
    get_result = _mock_supabase_result([pending_row])
    update_result = _mock_supabase_result([cancelled_row])
    execute_mock = AsyncMock(side_effect=[get_result, update_result])

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.update.return_value = chain
    chain.eq.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.post(
            f"/api/v1/appointments/{APPT_ID}/cancel",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"


@pytest.mark.asyncio
async def test_cancel_appointment_not_owner_returns_403(client: AsyncClient) -> None:
    """Attempting to cancel another client's appointment must return 403."""
    other_client_id = str(uuid4())
    token = _make_token(other_client_id)

    # The appointment belongs to CLIENT_ID, not other_client_id
    pending_row = _appt_row(status="pending", client_id=CLIENT_ID)
    get_result = _mock_supabase_result([pending_row])
    execute_mock = AsyncMock(return_value=get_result)

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.post(
            f"/api/v1/appointments/{APPT_ID}/cancel",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_cancel_already_confirmed_appointment_returns_409(client: AsyncClient) -> None:
    """Cancelling a confirmed appointment must return 409."""
    token = _make_token(CLIENT_ID)

    confirmed_row = _appt_row(status="confirmed", client_id=CLIENT_ID)
    get_result = _mock_supabase_result([confirmed_row])
    execute_mock = AsyncMock(return_value=get_result)

    chain = MagicMock()
    chain.table.return_value = chain
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.execute = execute_mock

    with patch("app.api.v1.appointments.get_supabase", AsyncMock(return_value=chain)):
        response = await client.post(
            f"/api/v1/appointments/{APPT_ID}/cancel",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
