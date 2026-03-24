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
    "id": SHOP_ID, "owner_id": OWNER_ID, "name": "Barber Kings",
    "description": "Premium cuts", "address": "Calle Mayor 1", "city": "Madrid",
    "phone": "+34 600 000 000", "email": "info@barberkings.com",
    "avatar_url": None, "is_active": True,
    "created_at": NOW_ISO, "updated_at": NOW_ISO,
}
BARBER_ROW = {
    "id": BARBER_ID, "shop_id": SHOP_ID, "profile_id": PROFILE_ID,
    "bio": "Specialist in fades", "is_active": True,
    "created_at": NOW_ISO, "updated_at": NOW_ISO,
}


def _make_result(data):
    r = MagicMock()
    r.data = data
    return r


def _make_mock(data):
    result = _make_result(data)
    builder = MagicMock()
    builder.select = MagicMock(return_value=builder)
    builder.insert = MagicMock(return_value=builder)
    builder.update = MagicMock(return_value=builder)
    builder.delete = MagicMock(return_value=builder)
    builder.eq = MagicMock(return_value=builder)
    builder.execute = AsyncMock(return_value=result)
    mock = AsyncMock()
    mock.table = MagicMock(return_value=builder)
    return mock


@pytest.mark.asyncio
async def test_list_shops_public(client: AsyncClient) -> None:
    mock = _make_mock([SHOP_ROW])
    with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
        r = await client.get("/api/v1/barber-shops")
    assert r.status_code == 200
    assert r.json()[0]["name"] == "Barber Kings"


@pytest.mark.asyncio
async def test_list_shops_empty(client: AsyncClient) -> None:
    mock = _make_mock([])
    with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
        r = await client.get("/api/v1/barber-shops")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_shop_without_auth_returns_401(client: AsyncClient) -> None:
    r = await client.post("/api/v1/barber-shops", json={"name": "X", "address": "Y", "city": "Z"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_create_shop_with_auth(client: AsyncClient) -> None:
    mock = _make_mock([SHOP_ROW])
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
            r = await client.post(
                "/api/v1/barber-shops",
                json={"name": "Barber Kings", "address": "Calle Mayor 1", "city": "Madrid"},
                headers={"Authorization": "Bearer fake"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)
    assert r.status_code == 201
    assert r.json()["owner_id"] == OWNER_ID


@pytest.mark.asyncio
async def test_get_shop_detail(client: AsyncClient) -> None:
    mock = _make_mock([SHOP_ROW])
    with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
        r = await client.get(f"/api/v1/barber-shops/{SHOP_ID}")
    assert r.status_code == 200
    assert r.json()["id"] == SHOP_ID


@pytest.mark.asyncio
async def test_get_shop_detail_not_found(client: AsyncClient) -> None:
    mock = _make_mock([])
    with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
        r = await client.get(f"/api/v1/barber-shops/{uuid.uuid4()}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_shop_without_auth_returns_401(client: AsyncClient) -> None:
    r = await client.patch(f"/api/v1/barber-shops/{SHOP_ID}", json={"name": "X"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_update_shop_forbidden_for_non_owner(client: AsyncClient) -> None:
    other = str(uuid.uuid4())
    mock = _make_mock([SHOP_ROW])
    app.dependency_overrides[get_auth_user_id] = lambda: other
    try:
        with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
            r = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}",
                json={"name": "Hack"},
                headers={"Authorization": "Bearer fake"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_list_barbers_public(client: AsyncClient) -> None:
    res_shop = _make_result([SHOP_ROW])
    res_barbers = _make_result([BARBER_ROW])
    b_shop = MagicMock()
    b_shop.select = MagicMock(return_value=b_shop)
    b_shop.eq = MagicMock(return_value=b_shop)
    b_shop.execute = AsyncMock(return_value=res_shop)
    b_barbers = MagicMock()
    b_barbers.select = MagicMock(return_value=b_barbers)
    b_barbers.eq = MagicMock(return_value=b_barbers)
    b_barbers.execute = AsyncMock(return_value=res_barbers)
    mock = AsyncMock()
    mock.table = MagicMock(side_effect=lambda n: b_shop if n == "barber_shops" else b_barbers)
    with patch("app.api.v1.barber_shops.get_supabase", return_value=mock):
        r = await client.get(f"/api/v1/barber-shops/{SHOP_ID}/barbers")
    assert r.status_code == 200
    assert r.json()[0]["shop_id"] == SHOP_ID


@pytest.mark.asyncio
async def test_add_barber_without_auth_returns_401(client: AsyncClient) -> None:
    r = await client.post(
        f"/api/v1/barber-shops/{SHOP_ID}/barbers",
        json={"profile_id": str(PROFILE_ID)},
    )
    assert r.status_code == 401
