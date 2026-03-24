"""
Unit tests for barber shops and barbers CRUD endpoints.
Supabase client is mocked — no real DB connection required.

Auth dependencies that use Bearer JWT are overridden via app.dependency_overrides
so tests do not require a real Supabase JWT secret.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.core.security import get_auth_user_id
from app.main import app

SHOP_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())
BARBER_ID = str(uuid.uuid4())
PROFILE_ID = str(uuid.uuid4())

NOW_ISO = datetime.now(timezone.utc).isoformat()

SHOP_ROW = {
    "id": SHOP_ID,
    "owner_id": OWNER_ID,
    "name": "Barber Kings",
    "description": "Premium cuts",
    "address": "Calle Mayor 1",
    "city": "Madrid",
    "phone": "+34 600 000 000",
    "email": "info@barberkings.com",
    "avatar_url": None,
    "is_active": True,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}

BARBER_ROW = {
    "id": BARBER_ID,
    "shop_id": SHOP_ID,
    "profile_id": PROFILE_ID,
    "bio": "Specialist in fades",
    "is_active": True,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}


def _make_supabase_result(data: list) -> MagicMock:
    """Build a mock that mimics supabase-py APIResponse with .data attribute."""
    result = MagicMock()
    result.data = data
    return result


def _make_supabase_mock(return_data: list) -> AsyncMock:
    """
    Build a full supabase async client mock supporting method chaining:
    client.table(...).select(...).eq(...).execute()
    All chain methods return the same builder mock; execute() returns the result.
    """
    result = _make_supabase_result(return_data)

    builder = MagicMock()
    builder.select = MagicMock(return_value=builder)
    builder.insert = MagicMock(return_value=builder)
    builder.update = MagicMock(return_value=builder)
    builder.delete = MagicMock(return_value=builder)
    builder.eq = MagicMock(return_value=builder)
    builder.execute = AsyncMock(return_value=result)

    supabase_mock = AsyncMock()
    supabase_mock.table = MagicMock(return_value=builder)
    return supabase_mock


# ---------------------------------------------------------------------------
# Barber Shops — list
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_shops_public(client: AsyncClient) -> None:
    """GET /api/v1/barber-shops without auth must return 200 with shop list."""
    supabase_mock = _make_supabase_mock([SHOP_ROW])

    with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
        response = await client.get("/api/v1/barber-shops")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Barber Kings"


@pytest.mark.asyncio
async def test_list_shops_returns_empty_when_none(client: AsyncClient) -> None:
    """GET /api/v1/barber-shops returns empty list when no active shops exist."""
    supabase_mock = _make_supabase_mock([])

    with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
        response = await client.get("/api/v1/barber-shops")

    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# Barber Shops — create
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_shop_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /api/v1/barber-shops without Bearer token must return 401."""
    payload = {
        "name": "Test Shop",
        "address": "Calle Test 1",
        "city": "Barcelona",
    }
    response = await client.post("/api/v1/barber-shops", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_shop_with_auth(client: AsyncClient) -> None:
    """POST /api/v1/barber-shops with valid auth and body must return 201."""
    supabase_mock = _make_supabase_mock([SHOP_ROW])

    payload = {
        "name": "Barber Kings",
        "address": "Calle Mayor 1",
        "city": "Madrid",
        "description": "Premium cuts",
        "phone": "+34 600 000 000",
        "email": "info@barberkings.com",
    }

    # Override the auth dependency so no real JWT is needed
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
            response = await client.post(
                "/api/v1/barber-shops",
                json=payload,
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Barber Kings"
    assert data["owner_id"] == OWNER_ID


# ---------------------------------------------------------------------------
# Barber Shops — detail
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_shop_detail(client: AsyncClient) -> None:
    """GET /api/v1/barber-shops/{id} without auth must return 200 with shop data."""
    supabase_mock = _make_supabase_mock([SHOP_ROW])

    with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
        response = await client.get(f"/api/v1/barber-shops/{SHOP_ID}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == SHOP_ID
    assert data["city"] == "Madrid"


@pytest.mark.asyncio
async def test_get_shop_detail_not_found(client: AsyncClient) -> None:
    """GET /api/v1/barber-shops/{id} for non-existent shop must return 404."""
    supabase_mock = _make_supabase_mock([])

    with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
        response = await client.get(f"/api/v1/barber-shops/{uuid.uuid4()}")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Barber Shops — update
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_shop_without_auth_returns_401(client: AsyncClient) -> None:
    """PATCH /api/v1/barber-shops/{id} without token must return 401."""
    response = await client.patch(
        f"/api/v1/barber-shops/{SHOP_ID}", json={"name": "New Name"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_shop_forbidden_for_non_owner(client: AsyncClient) -> None:
    """PATCH /api/v1/barber-shops/{id} by non-owner must return 403."""
    other_user_id = str(uuid.uuid4())
    # Shop row has owner_id = OWNER_ID, requester will be other_user_id → 403
    supabase_mock = _make_supabase_mock([SHOP_ROW])

    app.dependency_overrides[get_auth_user_id] = lambda: other_user_id
    try:
        with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
            response = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}",
                json={"name": "Hack"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Barbers — list
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_barbers_public(client: AsyncClient) -> None:
    """GET /api/v1/barber-shops/{id}/barbers without auth must return 200."""
    result_shop = _make_supabase_result([SHOP_ROW])
    result_barbers = _make_supabase_result([BARBER_ROW])

    builder_shop = MagicMock()
    builder_shop.select = MagicMock(return_value=builder_shop)
    builder_shop.eq = MagicMock(return_value=builder_shop)
    builder_shop.execute = AsyncMock(return_value=result_shop)

    builder_barbers = MagicMock()
    builder_barbers.select = MagicMock(return_value=builder_barbers)
    builder_barbers.eq = MagicMock(return_value=builder_barbers)
    builder_barbers.execute = AsyncMock(return_value=result_barbers)

    def table_side_effect(name: str) -> MagicMock:
        if name == "barber_shops":
            return builder_shop
        return builder_barbers

    supabase_mock = AsyncMock()
    supabase_mock.table = MagicMock(side_effect=table_side_effect)

    with patch("app.api.v1.barber_shops.get_supabase", return_value=supabase_mock):
        response = await client.get(f"/api/v1/barber-shops/{SHOP_ID}/barbers")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["shop_id"] == SHOP_ID


# ---------------------------------------------------------------------------
# Barbers — add (auth required)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_barber_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /api/v1/barber-shops/{id}/barbers without token must return 401."""
    response = await client.post(
        f"/api/v1/barber-shops/{SHOP_ID}/barbers",
        json={"profile_id": str(PROFILE_ID)},
    )
    assert response.status_code == 401
