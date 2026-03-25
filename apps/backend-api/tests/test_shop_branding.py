"""
Unit tests for Shop Branding, Hours and Gallery endpoints.
Supabase client is fully mocked — no real DB connection required.
Auth dependencies are overridden via app.dependency_overrides.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.core.security import get_auth_user_id
from app.main import app

# ---------------------------------------------------------------------------
# Fixtures / constants
# ---------------------------------------------------------------------------

SHOP_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())
NOW_ISO = datetime.now(timezone.utc).isoformat()

BASE_SHOP_ROW: dict = {
    "id": SHOP_ID,
    "owner_id": OWNER_ID,
    "name": "Barber Kings",
    "description": "Premium cuts",
    "address": "Calle Mayor 1",
    "city": "Madrid",
    "phone": "+34 600 000 000",
    "email": "info@barberkings.com",
    "slug": None,
    "accent_color": None,
    "tagline": None,
    "instagram_url": None,
    "whatsapp": None,
    "logo_url": None,
    "cover_url": None,
    "gallery_urls": [],
    "is_active": True,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}


def _result(data: list) -> MagicMock:
    r = MagicMock()
    r.data = data
    return r


def _make_builder(return_data: list) -> MagicMock:
    """Build a chainable supabase query builder mock."""
    result = _result(return_data)
    b = MagicMock()
    b.select = MagicMock(return_value=b)
    b.insert = MagicMock(return_value=b)
    b.update = MagicMock(return_value=b)
    b.delete = MagicMock(return_value=b)
    b.eq = MagicMock(return_value=b)
    b.execute = AsyncMock(return_value=result)
    return b


def _make_supabase(return_data: list) -> AsyncMock:
    builder = _make_builder(return_data)
    client = AsyncMock()
    client.table = MagicMock(return_value=builder)
    return client


# ---------------------------------------------------------------------------
# Helper: sequential execute responses on the same builder
# ---------------------------------------------------------------------------


def _make_supabase_multi(responses: list[list]) -> AsyncMock:
    """
    Build a supabase mock where successive execute() calls return
    different data lists, in order.
    """
    results = [_result(d) for d in responses]
    execute_mock = AsyncMock(side_effect=results)

    builder = MagicMock()
    builder.select = MagicMock(return_value=builder)
    builder.insert = MagicMock(return_value=builder)
    builder.update = MagicMock(return_value=builder)
    builder.delete = MagicMock(return_value=builder)
    builder.eq = MagicMock(return_value=builder)
    builder.execute = execute_mock

    client = AsyncMock()
    client.table = MagicMock(return_value=builder)
    return client


# ---------------------------------------------------------------------------
# test_update_branding_slug — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_branding_slug(client: AsyncClient) -> None:
    """PATCH /branding with a valid new slug must return 200 and the updated row."""
    updated_row = {**BASE_SHOP_ROW, "slug": "barber-kings"}

    # Calls in order:
    # 1. get_by_id (get_or_404)
    # 2. get_by_slug (unique check — returns empty = slug is free)
    # 3. update_branding (returns updated row)
    supabase_mock = _make_supabase_multi([[BASE_SHOP_ROW], [], [updated_row]])

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}/branding",
                json={"slug": "barber-kings"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "barber-kings"


# ---------------------------------------------------------------------------
# test_update_branding_duplicate_slug — 409
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_branding_duplicate_slug(client: AsyncClient) -> None:
    """PATCH /branding with a slug already used by another shop must return 409."""
    other_shop_id = str(uuid.uuid4())
    existing_slug_row = {"id": other_shop_id}

    # Calls:
    # 1. get_by_id (get_or_404) → returns our shop
    # 2. get_by_slug → returns a different shop (conflict)
    supabase_mock = _make_supabase_multi([[BASE_SHOP_ROW], [existing_slug_row]])

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}/branding",
                json={"slug": "taken-slug"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 409
    assert "slug" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# test_update_branding_invalid_color — 422
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_branding_invalid_color(client: AsyncClient) -> None:
    """PATCH /branding with an invalid hex color must return 422."""
    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        response = await client.patch(
            f"/api/v1/barber-shops/{SHOP_ID}/branding",
            json={"accent_color": "not-a-color"},
            headers={"Authorization": "Bearer fake-token"},
        )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# test_update_hours — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_hours(client: AsyncClient) -> None:
    """PATCH /hours with valid day data must return 200 and updated hours."""
    hours_row = {
        "id": str(uuid.uuid4()),
        "barbershop_id": SHOP_ID,
        "day_of_week": 0,
        "open_time": "09:00",
        "close_time": "18:00",
        "is_closed": False,
    }

    # Calls:
    # 1. get_by_id (get_or_404)
    # 2. get existing hours row for monday (eq barbershop_id + day_of_week) → empty → insert
    # 3. insert new hours row
    # 4. get_hours_by_shop (final select)
    supabase_mock = _make_supabase_multi(
        [[BASE_SHOP_ROW], [], [hours_row], [hours_row]]
    )

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}/hours",
                json={"monday": {"open": "09:00", "close": "18:00", "is_open": True}},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["shop_id"] == SHOP_ID
    assert "hours" in data
    assert data["hours"]["monday"]["open"] == "09:00"


# ---------------------------------------------------------------------------
# test_add_gallery_photo — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_gallery_photo(client: AsyncClient) -> None:
    """POST /gallery with a URL adds it when gallery has fewer than 10 photos."""
    photo_url = "https://cdn.example.com/photo1.jpg"
    gallery_row = {"gallery_urls": [photo_url]}

    # Calls:
    # 1. get_by_id (get_or_404)
    # 2. get_gallery_urls (select gallery_urls)
    # 3. update_gallery_urls
    supabase_mock = _make_supabase_multi([[BASE_SHOP_ROW], [{"gallery_urls": []}], [gallery_row]])

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/barber-shops/{SHOP_ID}/gallery",
                json={"url": photo_url},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert photo_url in data["gallery_urls"]


# ---------------------------------------------------------------------------
# test_gallery_max_10_photos — 400
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_gallery_max_10_photos(client: AsyncClient) -> None:
    """POST /gallery returns 400 when the gallery already has 10 photos."""
    full_gallery = [f"https://cdn.example.com/photo{i}.jpg" for i in range(10)]

    # Calls:
    # 1. get_by_id (get_or_404)
    # 2. get_gallery_urls → returns 10 photos
    supabase_mock = _make_supabase_multi(
        [[BASE_SHOP_ROW], [{"gallery_urls": full_gallery}]]
    )

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/barber-shops/{SHOP_ID}/gallery",
                json={"url": "https://cdn.example.com/extra.jpg"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 400
    assert "full" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# test_unauthorized_branding_update — 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_unauthorized_branding_update(client: AsyncClient) -> None:
    """PATCH /branding by a non-owner user must return 403."""
    # Calls:
    # 1. get_by_id (get_or_404) → returns shop owned by OWNER_ID
    supabase_mock = _make_supabase_multi([[BASE_SHOP_ROW]])

    app.dependency_overrides[get_auth_user_id] = lambda: OTHER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
        ):
            response = await client.patch(
                f"/api/v1/barber-shops/{SHOP_ID}/branding",
                json={"tagline": "Hack attempt"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Additional coverage: GET /public
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_shop_public(client: AsyncClient) -> None:
    """GET /public returns full shop profile including branding and gallery."""
    shop_with_branding = {
        **BASE_SHOP_ROW,
        "slug": "barber-kings",
        "accent_color": "#FF5733",
        "tagline": "Premium cuts since 2020",
    }
    gallery_row = {"gallery_urls": ["https://cdn.example.com/photo1.jpg"]}

    # Calls:
    # 1. get_by_id (get_or_404)
    # 2. get_gallery_urls
    supabase_mock = _make_supabase_multi([[shop_with_branding], [gallery_row]])

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.barber_shops.get_supabase", return_value=supabase_mock
    ):
        response = await client.get(f"/api/v1/barber-shops/{SHOP_ID}/public")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "barber-kings"
    assert data["accent_color"] == "#FF5733"
    assert isinstance(data["gallery_urls"], list)


# ---------------------------------------------------------------------------
# Branding without auth — 401
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_branding_without_auth_returns_401(client: AsyncClient) -> None:
    """PATCH /branding without Bearer token must return 401."""
    response = await client.patch(
        f"/api/v1/barber-shops/{SHOP_ID}/branding",
        json={"tagline": "Test"},
    )
    assert response.status_code == 401
