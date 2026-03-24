"""
Unit tests for GET /api/v1/auth/me and PATCH /api/v1/auth/me endpoints.

Strategy:
- JWT validation is isolated by patching `app.core.security.jwt.decode`
- Supabase dependency is overridden via FastAPI `app.dependency_overrides`
- No real network calls are made
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient

VALID_USER_ID = str(uuid4())
VALID_EMAIL = "barber@barcutx.com"

_VALID_JWT_PAYLOAD = {
    "sub": VALID_USER_ID,
    "email": VALID_EMAIL,
    "aud": "authenticated",
    "app_metadata": {"role": "barber"},
}

_PROFILE_ROW = {
    "id": VALID_USER_ID,
    "full_name": "John Barber",
    "phone": "+34600000000",
    "avatar_url": None,
    "role": "barber",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "updated_at": datetime.now(timezone.utc).isoformat(),
}


def _make_supabase_mock(
    row: dict | None = None,
    side_effect: Exception | None = None,
) -> MagicMock:
    """Build a mock supabase client whose fluent query chain returns row."""
    mock_result = MagicMock()
    mock_result.data = row

    mock_query = MagicMock()
    mock_query.select.return_value = mock_query
    mock_query.update.return_value = mock_query
    mock_query.eq.return_value = mock_query
    mock_query.single.return_value = mock_query

    if side_effect is not None:
        mock_query.execute = AsyncMock(side_effect=side_effect)
    else:
        mock_query.execute = AsyncMock(return_value=mock_result)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = mock_query
    return mock_supabase


# ---------------------------------------------------------------------------
# GET /api/v1/auth/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_me_without_token_returns_401(client: AsyncClient) -> None:
    """Request without Authorization header must be rejected with 401."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401(client: AsyncClient) -> None:
    """A token that fails JWT validation must return 401."""
    from jose import JWTError

    with patch("app.core.security.jwt.decode", side_effect=JWTError("bad token")):
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )

    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_with_valid_token_returns_profile(client: AsyncClient) -> None:
    """A valid JWT with an existing profile must return 200 and the profile data."""
    from app.core.database import get_supabase
    from app.main import app

    mock_supabase = _make_supabase_mock(row=_PROFILE_ROW)

    async def _override():
        return mock_supabase

    app.dependency_overrides[get_supabase] = _override
    try:
        with patch("app.core.security.jwt.decode", return_value=_VALID_JWT_PAYLOAD):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer valid.mocked.token"},
            )
    finally:
        app.dependency_overrides.pop(get_supabase, None)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == VALID_USER_ID
    assert data["role"] == "barber"
    assert data["full_name"] == "John Barber"


@pytest.mark.asyncio
async def test_me_profile_not_found_returns_404(client: AsyncClient) -> None:
    """When the profile row does not exist the endpoint must return 404."""
    from app.core.database import get_supabase
    from app.main import app

    mock_supabase = _make_supabase_mock(
        side_effect=Exception("PGRST116 no rows returned")
    )

    async def _override():
        return mock_supabase

    app.dependency_overrides[get_supabase] = _override
    try:
        with patch("app.core.security.jwt.decode", return_value=_VALID_JWT_PAYLOAD):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer valid.mocked.token"},
            )
    finally:
        app.dependency_overrides.pop(get_supabase, None)

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /api/v1/auth/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patch_me_without_token_returns_401(client: AsyncClient) -> None:
    """PATCH without Authorization header must return 401."""
    response = await client.patch("/api/v1/auth/me", json={"full_name": "New Name"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_patch_me_with_valid_data_returns_updated_profile(
    client: AsyncClient,
) -> None:
    """A valid PATCH request must update the profile and return 200."""
    from app.core.database import get_supabase
    from app.main import app

    updated_row = {**_PROFILE_ROW, "full_name": "Updated Name"}
    mock_supabase = _make_supabase_mock(row=updated_row)

    async def _override():
        return mock_supabase

    app.dependency_overrides[get_supabase] = _override
    try:
        with patch("app.core.security.jwt.decode", return_value=_VALID_JWT_PAYLOAD):
            response = await client.patch(
                "/api/v1/auth/me",
                json={"full_name": "Updated Name"},
                headers={"Authorization": "Bearer valid.mocked.token"},
            )
    finally:
        app.dependency_overrides.pop(get_supabase, None)

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_patch_me_empty_body_returns_422(client: AsyncClient) -> None:
    """PATCH with an empty body must return 422 because no fields are updatable."""
    from app.core.database import get_supabase
    from app.main import app

    # get_supabase is resolved by FastAPI before the handler runs
    mock_supabase = _make_supabase_mock()

    async def _override():
        return mock_supabase

    app.dependency_overrides[get_supabase] = _override
    try:
        with patch("app.core.security.jwt.decode", return_value=_VALID_JWT_PAYLOAD):
            response = await client.patch(
                "/api/v1/auth/me",
                json={},
                headers={"Authorization": "Bearer valid.mocked.token"},
            )
    finally:
        app.dependency_overrides.pop(get_supabase, None)

    assert response.status_code == 422
