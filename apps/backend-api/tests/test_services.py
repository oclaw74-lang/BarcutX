"""Unit tests for the services endpoints (issue #10)."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

SHOP_ID = str(uuid.uuid4())
SERVICE_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())

VALID_PAYLOAD = {
    "name": "Corte clasico",
    "description": "Corte de cabello con tijera",
    "price": "15.00",
    "duration_minutes": 30,
}


def _make_service_response():
    from app.modules.services.schemas import ServiceResponse

    return ServiceResponse(
        id=uuid.UUID(SERVICE_ID),
        shop_id=uuid.UUID(SHOP_ID),
        name="Corte clasico",
        description="Corte de cabello con tijera",
        price=Decimal("15.00"),
        duration_minutes=30,
        is_active=True,
        created_at=datetime(2026, 3, 24, 10, 0, 0, tzinfo=timezone.utc),
    )


def _override_db():
    from app.core.database import get_db
    from app.main import app

    async def _fake_db():  # type: ignore[return]
        yield AsyncMock()

    app.dependency_overrides[get_db] = _fake_db
    return get_db


def _override_auth(user_id: str = OWNER_ID):
    from app.core.security import UserPayload, get_current_user
    from app.main import app

    async def _fake_auth() -> UserPayload:
        return UserPayload(id=uuid.UUID(user_id), email="owner@test.com", role="owner")

    app.dependency_overrides[get_current_user] = _fake_auth
    return get_current_user


def _clear_overrides():
    from app.main import app

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /api/v1/barber-shops/{shop_id}/services  (public)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_services_public(client: AsyncClient) -> None:
    """Public endpoint returns 200 and a list of services without authentication."""
    from app.modules.services.service import ServiceService

    _override_db()

    with patch.object(ServiceService, "list_services", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [_make_service_response()]
        response = await client.get(f"/api/v1/barber-shops/{SHOP_ID}/services")

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Corte clasico"
    assert data[0]["shop_id"] == SHOP_ID


# ---------------------------------------------------------------------------
# POST /api/v1/barber-shops/{shop_id}/services
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_service_without_auth_returns_401(client: AsyncClient) -> None:
    """POST without Authorization header must return 401."""
    _override_db()

    response = await client.post(
        f"/api/v1/barber-shops/{SHOP_ID}/services",
        json=VALID_PAYLOAD,
    )

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_service_with_auth(client: AsyncClient) -> None:
    """POST with valid mock auth creates a service and returns 201."""
    from app.modules.services.service import ServiceService

    _override_db()
    _override_auth()

    with patch.object(ServiceService, "create_service", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = _make_service_response()

        response = await client.post(
            f"/api/v1/barber-shops/{SHOP_ID}/services",
            json=VALID_PAYLOAD,
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Corte clasico"
    assert data["shop_id"] == SHOP_ID
    assert data["price"] == "15.00"


@pytest.mark.asyncio
async def test_create_service_invalid_payload_returns_422(client: AsyncClient) -> None:
    """POST with negative price must return 422 validation error."""
    _override_db()
    _override_auth()

    response = await client.post(
        f"/api/v1/barber-shops/{SHOP_ID}/services",
        json={"name": "X", "price": "-5.00", "duration_minutes": 30},
        headers={"Authorization": "Bearer fake.jwt.token"},
    )

    _clear_overrides()

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PATCH /api/v1/barber-shops/{shop_id}/services/{service_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_service(client: AsyncClient) -> None:
    """PATCH with valid mock auth updates a service and returns 200."""
    from app.modules.services.schemas import ServiceResponse
    from app.modules.services.service import ServiceService

    updated = ServiceResponse(
        id=uuid.UUID(SERVICE_ID),
        shop_id=uuid.UUID(SHOP_ID),
        name="Corte premium",
        description="Corte con navaja",
        price=Decimal("20.00"),
        duration_minutes=45,
        is_active=True,
        created_at=datetime(2026, 3, 24, 10, 0, 0, tzinfo=timezone.utc),
    )

    _override_db()
    _override_auth()

    with patch.object(ServiceService, "update_service", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = updated

        response = await client.patch(
            f"/api/v1/barber-shops/{SHOP_ID}/services/{SERVICE_ID}",
            json={"name": "Corte premium", "price": "20.00", "duration_minutes": 45},
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Corte premium"
    assert data["price"] == "20.00"
    assert data["duration_minutes"] == 45


# ---------------------------------------------------------------------------
# DELETE /api/v1/barber-shops/{shop_id}/services/{service_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_service_without_auth_returns_401(client: AsyncClient) -> None:
    """DELETE without auth must return 401."""
    _override_db()

    response = await client.delete(
        f"/api/v1/barber-shops/{SHOP_ID}/services/{SERVICE_ID}",
    )

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_service_with_auth(client: AsyncClient) -> None:
    """DELETE with valid mock auth deactivates a service and returns 204."""
    from app.modules.services.service import ServiceService

    _override_db()
    _override_auth()

    with patch.object(ServiceService, "delete_service", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = None

        response = await client.delete(
            f"/api/v1/barber-shops/{SHOP_ID}/services/{SERVICE_ID}",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 204


# ---------------------------------------------------------------------------
# GET /api/v1/barber-shops/{shop_id}/services/{service_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_service_not_found(client: AsyncClient) -> None:
    """GET single service that does not exist returns 404."""
    from fastapi import HTTPException
    from app.modules.services.service import ServiceService

    _override_db()

    with patch.object(ServiceService, "get_service", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = HTTPException(status_code=404, detail="Service not found")

        response = await client.get(
            f"/api/v1/barber-shops/{SHOP_ID}/services/{SERVICE_ID}",
        )

    _clear_overrides()

    assert response.status_code == 404
    assert response.json()["detail"] == "Service not found"
