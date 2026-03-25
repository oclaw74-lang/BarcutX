"""
Unit tests for barber extended profile endpoints (issue #37).
Supabase client is mocked — no real DB connection required.
Auth dependencies are overridden via app.dependency_overrides.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.core.security import get_auth_user_id
from app.main import app

BARBER_ID = str(uuid.uuid4())
PROFILE_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())
SHOP_ID = str(uuid.uuid4())

NOW_ISO = datetime.now(timezone.utc).isoformat()

SHOP_ROW = {
    "id": SHOP_ID,
    "owner_id": str(uuid.uuid4()),
    "name": "Elite Cuts",
    "description": "Best cuts in town",
    "address": "Gran Via 10",
    "city": "Madrid",
    "phone": None,
    "email": None,
    "is_active": True,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}

BARBER_ROW = {
    "id": BARBER_ID,
    "shop_id": SHOP_ID,
    "profile_id": PROFILE_ID,
    "bio": "Specialist in fades",
    "specialty": "fades",
    "avatar_url": None,
    "rating": 4.8,
    "total_reviews": 120,
    "is_available_for_hire": False,
    "hire_type": None,
    "target_city": None,
    "qr_code": None,
    "is_active": True,
    "created_at": NOW_ISO,
}

AVAILABLE_BARBER_ROW = {
    **BARBER_ROW,
    "is_available_for_hire": True,
    "hire_type": "freelance",
    "target_city": "Barcelona",
}


def _make_result(data: list) -> MagicMock:
    result = MagicMock()
    result.data = data
    return result


def _make_builder(return_data: list) -> MagicMock:
    result = _make_result(return_data)
    builder = MagicMock()
    builder.select = MagicMock(return_value=builder)
    builder.insert = MagicMock(return_value=builder)
    builder.update = MagicMock(return_value=builder)
    builder.delete = MagicMock(return_value=builder)
    builder.eq = MagicMock(return_value=builder)
    builder.execute = AsyncMock(return_value=result)
    return builder


def _make_supabase_for_tables(table_data: dict[str, list]) -> AsyncMock:
    builders = {name: _make_builder(data) for name, data in table_data.items()}
    default_builder = _make_builder([])
    supabase_mock = AsyncMock()
    supabase_mock.table = MagicMock(
        side_effect=lambda name: builders.get(name, default_builder)
    )
    return supabase_mock


# ---------------------------------------------------------------------------
# GET /barbers/{barber_id}/public
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_public_profile(client: AsyncClient) -> None:
    """GET /barbers/{id}/public returns barber public profile without auth."""
    supabase_mock = _make_supabase_for_tables(
        {
            "barbers": [BARBER_ROW],
            "barber_shops": [SHOP_ROW],
        }
    )

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get(f"/api/v1/barbers/{BARBER_ID}/public")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == BARBER_ID
    assert data["specialty"] == "fades"
    assert data["bio"] == "Specialist in fades"
    assert data["rating"] == 4.8


@pytest.mark.asyncio
async def test_get_public_profile_includes_shop_info(client: AsyncClient) -> None:
    """Public profile includes shop info when barber is linked to a shop."""
    supabase_mock = _make_supabase_for_tables(
        {
            "barbers": [BARBER_ROW],
            "barber_shops": [SHOP_ROW],
        }
    )

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get(f"/api/v1/barbers/{BARBER_ID}/public")

    assert response.status_code == 200
    data = response.json()
    assert data["shop"] is not None
    assert data["shop"]["name"] == "Elite Cuts"
    assert data["shop"]["city"] == "Madrid"


@pytest.mark.asyncio
async def test_get_public_profile_not_found_returns_404(client: AsyncClient) -> None:
    """GET /barbers/{id}/public for non-existent barber returns 404."""
    supabase_mock = _make_supabase_for_tables({"barbers": []})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get(f"/api/v1/barbers/{uuid.uuid4()}/public")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /barbers/{barber_id}/profile
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_own_profile(client: AsyncClient) -> None:
    """Barber can update their own profile."""
    updated_row = {**BARBER_ROW, "bio": "Expert in classic cuts", "specialty": "classic"}

    barbers_builder = _make_builder([BARBER_ROW])
    # Make update return the updated row
    update_builder = _make_builder([updated_row])
    update_builder.eq = MagicMock(return_value=update_builder)
    update_builder.execute = AsyncMock(return_value=_make_result([updated_row]))
    barbers_builder.update = MagicMock(return_value=update_builder)

    shop_builder = _make_builder([SHOP_ROW])
    supabase_mock = AsyncMock()
    table_map = {"barbers": barbers_builder, "barber_shops": shop_builder}
    supabase_mock.table = MagicMock(side_effect=lambda name: table_map.get(name, _make_builder([])))

    app.dependency_overrides[get_auth_user_id] = lambda: PROFILE_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barbers.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barbers/{BARBER_ID}/profile",
                json={"bio": "Expert in classic cuts", "specialty": "classic"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == "Expert in classic cuts"
    assert data["specialty"] == "classic"


@pytest.mark.asyncio
async def test_update_profile_without_auth_returns_401(client: AsyncClient) -> None:
    """PATCH /barbers/{id}/profile without token must return 401."""
    response = await client.patch(
        f"/api/v1/barbers/{BARBER_ID}/profile",
        json={"bio": "Test"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_profile_of_another_barber_returns_403(client: AsyncClient) -> None:
    """Barber cannot update another barber's profile."""
    supabase_mock = _make_supabase_for_tables({"barbers": [BARBER_ROW]})

    app.dependency_overrides[get_auth_user_id] = lambda: OTHER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barbers.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barbers/{BARBER_ID}/profile",
                json={"bio": "Hack"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /barbers/{barber_id}/availability
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_toggle_availability_to_true(client: AsyncClient) -> None:
    """Barber can toggle is_available_for_hire to true."""
    toggled_row = {**BARBER_ROW, "is_available_for_hire": True}

    barbers_builder = _make_builder([BARBER_ROW])
    update_builder = _make_builder([toggled_row])
    update_builder.eq = MagicMock(return_value=update_builder)
    update_builder.execute = AsyncMock(return_value=_make_result([toggled_row]))
    barbers_builder.update = MagicMock(return_value=update_builder)

    shop_builder = _make_builder([SHOP_ROW])
    supabase_mock = AsyncMock()
    table_map = {"barbers": barbers_builder, "barber_shops": shop_builder}
    supabase_mock.table = MagicMock(side_effect=lambda name: table_map.get(name, _make_builder([])))

    app.dependency_overrides[get_auth_user_id] = lambda: PROFILE_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barbers.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barbers/{BARBER_ID}/availability",
                json={"is_available_for_hire": True},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["is_available_for_hire"] is True


@pytest.mark.asyncio
async def test_toggle_availability_without_auth_returns_401(client: AsyncClient) -> None:
    """PATCH /barbers/{id}/availability without token must return 401."""
    response = await client.patch(
        f"/api/v1/barbers/{BARBER_ID}/availability",
        json={"is_available_for_hire": True},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_toggle_availability_wrong_barber_returns_403(client: AsyncClient) -> None:
    """Non-owner barber cannot toggle another's availability."""
    supabase_mock = _make_supabase_for_tables({"barbers": [BARBER_ROW]})

    app.dependency_overrides[get_auth_user_id] = lambda: OTHER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barbers.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barbers/{BARBER_ID}/availability",
                json={"is_available_for_hire": True},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /barbers/available
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_available_barbers(client: AsyncClient) -> None:
    """GET /barbers/available returns barbers with is_available_for_hire=true."""
    supabase_mock = _make_supabase_for_tables({"barbers": [AVAILABLE_BARBER_ROW]})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get("/api/v1/barbers/available")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["is_available_for_hire"] is True


@pytest.mark.asyncio
async def test_list_available_barbers_returns_empty_when_none(client: AsyncClient) -> None:
    """GET /barbers/available returns empty list when no available barbers."""
    supabase_mock = _make_supabase_for_tables({"barbers": []})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get("/api/v1/barbers/available")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_available_barbers_filtered_by_city(client: AsyncClient) -> None:
    """GET /barbers/available?city=Barcelona filters correctly."""
    supabase_mock = _make_supabase_for_tables({"barbers": [AVAILABLE_BARBER_ROW]})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barbers.get_supabase", return_value=supabase_mock
    ):
        response = await client.get("/api/v1/barbers/available?city=Barcelona")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
