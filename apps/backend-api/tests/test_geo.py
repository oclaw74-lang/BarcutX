"""
Unit tests for geo search endpoints.
GeoService is mocked — no real DB or Supabase connection required.

Auth dependencies are overridden via app.dependency_overrides.
get_supabase is patched at the router module level following project conventions.
"""

import os
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException, status
from httpx import ASGITransport, AsyncClient

# Set required env vars before importing the app
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_dummy")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("ENVIRONMENT", "test")

from app.core.security import get_auth_user_id  # noqa: E402
from app.main import app  # noqa: E402

SHOP_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())

NEARBY_ROW = {
    "id": SHOP_ID,
    "name": "Barber Kings",
    "slug": "barber-kings",
    "address": "Calle Mayor 1",
    "latitude": 40.4168,
    "longitude": -3.7038,
    "distance_km": 1.2,
    "rating": None,
    "is_open": True,
    "accent_color": "#1a1a1a",
    "logo_url": None,
    "barber_count": 3,
}

SEARCH_ROW = {
    "id": SHOP_ID,
    "name": "Barber Kings",
    "city": "Madrid",
    "address": "Calle Mayor 1",
}

LOCATION_UPDATE_ROW = {
    "id": SHOP_ID,
    "latitude": 40.5000,
    "longitude": -3.6000,
    "address": "Gran Via 10",
}


def _make_supabase_mock() -> AsyncMock:
    """Build a minimal supabase async client mock."""
    supabase_mock = AsyncMock()
    supabase_mock.table = MagicMock(return_value=MagicMock())
    return supabase_mock


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# GET /api/v1/geo/nearby
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_nearby_returns_list(client: AsyncClient) -> None:
    """Happy path: returns a list of nearby shops."""
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.get_nearby = AsyncMock(return_value=[NEARBY_ROW])

    with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
        "app.api.v1.geo.GeoService", return_value=service_mock
    ):
        response = await client.get(
            "/api/v1/geo/nearby",
            params={"lat": 40.4168, "lng": -3.7038, "radius_km": 5.0, "limit": 20},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Barber Kings"
    assert data[0]["distance_km"] == 1.2


@pytest.mark.asyncio
async def test_nearby_missing_lat_returns_422(client: AsyncClient) -> None:
    """Missing required lat/lng parameters should return 422."""
    response = await client.get(
        "/api/v1/geo/nearby",
        params={"lng": -3.7038},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_nearby_invalid_radius_returns_422(client: AsyncClient) -> None:
    """radius_km exceeding max (50) should return 422 from FastAPI query validation."""
    response = await client.get(
        "/api/v1/geo/nearby",
        params={"lat": 40.4168, "lng": -3.7038, "radius_km": 999.0},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_nearby_returns_empty_list_when_no_shops(client: AsyncClient) -> None:
    """Service returning empty list should produce 200 with []."""
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.get_nearby = AsyncMock(return_value=[])

    with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
        "app.api.v1.geo.GeoService", return_value=service_mock
    ):
        response = await client.get(
            "/api/v1/geo/nearby",
            params={"lat": 0.0, "lng": 0.0},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


# ---------------------------------------------------------------------------
# GET /api/v1/geo/search
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_search_by_city(client: AsyncClient) -> None:
    """Happy path: search by city returns matching shops."""
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.search = AsyncMock(return_value=[SEARCH_ROW])

    with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
        "app.api.v1.geo.GeoService", return_value=service_mock
    ):
        response = await client.get(
            "/api/v1/geo/search",
            params={"city": "Madrid"},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["city"] == "Madrid"


@pytest.mark.asyncio
async def test_search_by_name(client: AsyncClient) -> None:
    """Happy path: search by q param returns matching shops."""
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.search = AsyncMock(return_value=[SEARCH_ROW])

    with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
        "app.api.v1.geo.GeoService", return_value=service_mock
    ):
        response = await client.get(
            "/api/v1/geo/search",
            params={"q": "Barber"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_search_requires_q_or_city(client: AsyncClient) -> None:
    """Calling search without q or city should propagate the service's 422."""
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.search = AsyncMock(
        side_effect=HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one of 'q' or 'city' is required",
        )
    )

    with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
        "app.api.v1.geo.GeoService", return_value=service_mock
    ):
        response = await client.get("/api/v1/geo/search")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "q" in response.json()["detail"] or "city" in response.json()["detail"]


# ---------------------------------------------------------------------------
# PATCH /api/v1/geo/shops/{shop_id}/location
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_location_success(client: AsyncClient) -> None:
    """Owner can update shop location — returns updated record."""
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.update_location = AsyncMock(return_value=LOCATION_UPDATE_ROW)

    try:
        with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
            "app.api.v1.geo.GeoService", return_value=service_mock
        ):
            response = await client.patch(
                f"/api/v1/geo/shops/{SHOP_ID}/location",
                json={"latitude": 40.5000, "longitude": -3.6000, "address": "Gran Via 10"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["latitude"] == 40.5000
        assert data["address"] == "Gran Via 10"
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)


@pytest.mark.asyncio
async def test_update_location_unauthorized_returns_401(client: AsyncClient) -> None:
    """Request without auth token should return 401."""
    response = await client.patch(
        f"/api/v1/geo/shops/{SHOP_ID}/location",
        json={"latitude": 40.5000, "longitude": -3.6000},
    )
    assert response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )


@pytest.mark.asyncio
async def test_update_location_unauthorized_returns_403(client: AsyncClient) -> None:
    """Non-owner authenticated user should receive 403 from the service."""
    other_user_id = str(uuid.uuid4())
    app.dependency_overrides[get_auth_user_id] = lambda: other_user_id
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.update_location = AsyncMock(
        side_effect=HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this shop",
        )
    )

    try:
        with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
            "app.api.v1.geo.GeoService", return_value=service_mock
        ):
            response = await client.patch(
                f"/api/v1/geo/shops/{SHOP_ID}/location",
                json={"latitude": 40.5000, "longitude": -3.6000},
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)


@pytest.mark.asyncio
async def test_update_location_shop_not_found_returns_404(client: AsyncClient) -> None:
    """When shop does not exist service raises 404."""
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    supabase_mock = _make_supabase_mock()
    service_mock = AsyncMock()
    service_mock.update_location = AsyncMock(
        side_effect=HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barber shop not found",
        )
    )

    try:
        with patch("app.api.v1.geo.get_supabase", return_value=supabase_mock), patch(
            "app.api.v1.geo.GeoService", return_value=service_mock
        ):
            response = await client.patch(
                f"/api/v1/geo/shops/{uuid.uuid4()}/location",
                json={"latitude": 40.5000, "longitude": -3.6000},
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)


@pytest.mark.asyncio
async def test_update_location_invalid_body_returns_422(client: AsyncClient) -> None:
    """Latitude out of valid range should be rejected at schema level."""
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        response = await client.patch(
            f"/api/v1/geo/shops/{SHOP_ID}/location",
            json={"latitude": 999.0, "longitude": -3.6000},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)
