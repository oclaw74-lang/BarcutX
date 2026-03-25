"""
Unit tests for invitations and join requests endpoints.
Supabase client is mocked — no real DB connection required.
Auth dependencies are overridden via app.dependency_overrides.
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.core.security import get_auth_user_id
from app.main import app

SHOP_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())
BARBER_USER_ID = str(uuid.uuid4())
INVITATION_ID = str(uuid.uuid4())
JOIN_REQUEST_ID = str(uuid.uuid4())
BARBER_ROW_ID = str(uuid.uuid4())
TOKEN = "secure_test_token_abc123"

NOW_ISO = datetime.now(timezone.utc).isoformat()
FUTURE_ISO = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
PAST_ISO = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()

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

INVITATION_ROW = {
    "id": INVITATION_ID,
    "shop_id": SHOP_ID,
    "invited_email": "barber@example.com",
    "message": "Join our team",
    "token": TOKEN,
    "status": "pending",
    "expires_at": FUTURE_ISO,
    "created_at": NOW_ISO,
}

JOIN_REQUEST_ROW = {
    "id": JOIN_REQUEST_ID,
    "shop_id": SHOP_ID,
    "requester_id": BARBER_USER_ID,
    "status": "pending",
    "message": "I want to join",
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}

APPROVED_JOIN_REQUEST_ROW = {**JOIN_REQUEST_ROW, "status": "approved"}
ACCEPTED_INVITATION_ROW = {**INVITATION_ROW, "status": "accepted"}
REJECTED_INVITATION_ROW = {**INVITATION_ROW, "status": "rejected"}

LINKED_BARBER_ROW = {
    "id": BARBER_ROW_ID,
    "shop_id": SHOP_ID,
    "profile_id": BARBER_USER_ID,
    "bio": None,
    "is_active": True,
    "created_at": NOW_ISO,
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
    """Build a supabase mock with per-table data routing."""
    builders: dict[str, MagicMock] = {
        name: _make_builder(data) for name, data in table_data.items()
    }
    default_builder = _make_builder([])
    supabase_mock = AsyncMock()

    def table_side_effect(name: str) -> MagicMock:
        return builders.get(name, default_builder)

    supabase_mock.table = MagicMock(side_effect=table_side_effect)
    return supabase_mock


# ---------------------------------------------------------------------------
# POST /shops/{shop_id}/invitations
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_owner_invites_barber(client: AsyncClient) -> None:
    """Owner can create an invitation for a barber."""
    supabase_mock = _make_supabase_for_tables(
        {
            "barber_shops": [SHOP_ROW],
            "invitations": [INVITATION_ROW],
        }
    )

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/shops/{SHOP_ID}/invitations",
                json={"invited_email": "barber@example.com", "message": "Join our team"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 201
    data = response.json()
    assert data["invited_email"] == "barber@example.com"
    assert data["status"] == "pending"
    assert data["shop_id"] == SHOP_ID


@pytest.mark.asyncio
async def test_invite_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /shops/{id}/invitations without token must return 401."""
    response = await client.post(
        f"/api/v1/shops/{SHOP_ID}/invitations",
        json={"invited_email": "barber@example.com"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invite_by_non_owner_returns_403(client: AsyncClient) -> None:
    """Non-owner cannot create invitations."""
    supabase_mock = _make_supabase_for_tables({"barber_shops": [SHOP_ROW]})

    app.dependency_overrides[get_auth_user_id] = lambda: OTHER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/shops/{SHOP_ID}/invitations",
                json={"invited_email": "barber@example.com"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /invitations/{token}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_invitation_by_token(client: AsyncClient) -> None:
    """GET /invitations/{token} returns invitation for valid token."""
    supabase_mock = _make_supabase_for_tables({"invitations": [INVITATION_ROW]})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.invitations.get_supabase", return_value=supabase_mock
    ):
        response = await client.get(f"/api/v1/invitations/{TOKEN}")

    assert response.status_code == 200
    data = response.json()
    assert data["token"] == TOKEN
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_invalid_token_invitation_returns_404(client: AsyncClient) -> None:
    """GET /invitations/{token} with invalid token must return 404."""
    supabase_mock = _make_supabase_for_tables({"invitations": []})

    with __import__("unittest.mock", fromlist=["patch"]).patch(
        "app.api.v1.invitations.get_supabase", return_value=supabase_mock
    ):
        response = await client.get("/api/v1/invitations/invalid-token-xyz")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /invitations/{token}/accept
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_barber_accepts_invitation_links_to_shop(client: AsyncClient) -> None:
    """Accepting a valid invitation links the barber to the shop."""
    inv_builder = _make_builder([INVITATION_ROW])
    # update returns accepted row
    inv_update_builder = _make_builder([ACCEPTED_INVITATION_ROW])
    barbers_builder = _make_builder([LINKED_BARBER_ROW])

    # We need the invitations table to respond differently for select vs update
    inv_calls = [0]

    def inv_select(*_args, **_kwargs):
        return inv_builder

    supabase_mock = AsyncMock()

    table_map = {
        "invitations": inv_builder,
        "barbers": barbers_builder,
    }
    # Make update on invitations return accepted row
    inv_builder.update = MagicMock(return_value=inv_update_builder)
    inv_update_builder.eq = MagicMock(return_value=inv_update_builder)
    inv_update_builder.execute = AsyncMock(return_value=_make_result([ACCEPTED_INVITATION_ROW]))

    supabase_mock.table = MagicMock(side_effect=lambda name: table_map.get(name, _make_builder([])))

    app.dependency_overrides[get_auth_user_id] = lambda: BARBER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/invitations/{TOKEN}/accept",
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"


@pytest.mark.asyncio
async def test_accept_invitation_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /invitations/{token}/accept without token must return 401."""
    response = await client.post(f"/api/v1/invitations/{TOKEN}/accept")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# JOIN REQUESTS — POST /shops/{shop_id}/join-requests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_barber_creates_join_request(client: AsyncClient) -> None:
    """A barber can submit a join request to a shop."""
    supabase_mock = _make_supabase_for_tables(
        {
            "barber_shops": [SHOP_ROW],
            "join_requests": [JOIN_REQUEST_ROW],
        }
    )

    app.dependency_overrides[get_auth_user_id] = lambda: BARBER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/shops/{SHOP_ID}/join-requests",
                json={"message": "I want to join"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 201
    data = response.json()
    assert data["shop_id"] == SHOP_ID
    assert data["requester_id"] == BARBER_USER_ID
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_join_request_shop_not_found_returns_404(client: AsyncClient) -> None:
    """Creating a join request for non-existent shop returns 404."""
    supabase_mock = _make_supabase_for_tables({"barber_shops": []})

    app.dependency_overrides[get_auth_user_id] = lambda: BARBER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/shops/{uuid.uuid4()}/join-requests",
                json={"message": "I want to join"},
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# JOIN REQUESTS — approve flow
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_owner_approves_join_request_links_barber(client: AsyncClient) -> None:
    """Owner approves join request → requester is linked as barber."""
    jr_builder = _make_builder([JOIN_REQUEST_ROW])
    jr_update_builder = _make_builder([APPROVED_JOIN_REQUEST_ROW])
    jr_update_builder.eq = MagicMock(return_value=jr_update_builder)
    jr_update_builder.execute = AsyncMock(
        return_value=_make_result([APPROVED_JOIN_REQUEST_ROW])
    )
    jr_builder.update = MagicMock(return_value=jr_update_builder)

    shop_builder = _make_builder([SHOP_ROW])
    barbers_builder = _make_builder([LINKED_BARBER_ROW])

    supabase_mock = AsyncMock()
    table_map = {
        "join_requests": jr_builder,
        "barber_shops": shop_builder,
        "barbers": barbers_builder,
    }
    supabase_mock.table = MagicMock(side_effect=lambda name: table_map.get(name, _make_builder([])))

    app.dependency_overrides[get_auth_user_id] = lambda: OWNER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/join-requests/{JOIN_REQUEST_ID}/approve",
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"


@pytest.mark.asyncio
async def test_approve_join_request_without_auth_returns_401(client: AsyncClient) -> None:
    """POST /join-requests/{id}/approve without token must return 401."""
    response = await client.post(f"/api/v1/join-requests/{JOIN_REQUEST_ID}/approve")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_approve_join_request_non_owner_returns_403(client: AsyncClient) -> None:
    """Non-owner cannot approve join requests."""
    jr_builder = _make_builder([JOIN_REQUEST_ROW])
    shop_builder = _make_builder([SHOP_ROW])

    supabase_mock = AsyncMock()
    table_map = {
        "join_requests": jr_builder,
        "barber_shops": shop_builder,
    }
    supabase_mock.table = MagicMock(side_effect=lambda name: table_map.get(name, _make_builder([])))

    app.dependency_overrides[get_auth_user_id] = lambda: OTHER_USER_ID
    try:
        with __import__("unittest.mock", fromlist=["patch"]).patch(
            "app.api.v1.invitations.get_supabase", return_value=supabase_mock
        ):
            response = await client.post(
                f"/api/v1/join-requests/{JOIN_REQUEST_ID}/approve",
                headers={"Authorization": "Bearer fake-token"},
            )
    finally:
        app.dependency_overrides.pop(get_auth_user_id, None)

    assert response.status_code == 403
