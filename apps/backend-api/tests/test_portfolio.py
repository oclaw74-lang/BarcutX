"""Unit tests for the portfolio endpoints (issue #34)."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

BARBER_ID = str(uuid.uuid4())
ITEM_ID = str(uuid.uuid4())
BARBER_USER_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())

VALID_PORTFOLIO_PAYLOAD = {
    "photo_url": "https://example.com/photo.jpg",
    "caption": "Fade con diseno",
    "tags": ["fade", "design"],
}


def _make_portfolio_response(
    item_id: str = ITEM_ID,
    barber_id: str = BARBER_ID,
    display_order: int = 0,
) -> "PortfolioItemResponse":
    from app.modules.portfolio.schemas import PortfolioItemResponse

    return PortfolioItemResponse(
        id=uuid.UUID(item_id),
        barber_id=uuid.UUID(barber_id),
        photo_url="https://example.com/photo.jpg",
        caption="Fade con diseno",
        tags=["fade", "design"],
        display_order=display_order,
    )


def _override_db():
    from app.core.database import get_db
    from app.main import app

    async def _fake_db():  # type: ignore[return]
        yield AsyncMock()

    app.dependency_overrides[get_db] = _fake_db
    return get_db


def _override_auth(user_id: str = BARBER_USER_ID, role: str = "barber"):
    from app.core.security import UserPayload, get_current_user
    from app.main import app

    async def _fake_auth() -> UserPayload:
        return UserPayload(id=uuid.UUID(user_id), email="barber@test.com", role=role)

    app.dependency_overrides[get_current_user] = _fake_auth
    return get_current_user


def _clear_overrides():
    from app.main import app

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /api/v1/barbers/{barber_id}/portfolio
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_barber_portfolio(client: AsyncClient) -> None:
    """GET portfolio returns 200 and a list of items."""
    from app.modules.portfolio.service import PortfolioService

    _override_db()
    _override_auth()

    with patch.object(PortfolioService, "list_portfolio", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [_make_portfolio_response()]

        response = await client.get(
            f"/api/v1/barbers/{BARBER_ID}/portfolio",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["photo_url"] == "https://example.com/photo.jpg"
    assert data[0]["barber_id"] == BARBER_ID
    assert data[0]["tags"] == ["fade", "design"]


@pytest.mark.asyncio
async def test_list_portfolio_without_auth_returns_401(client: AsyncClient) -> None:
    """GET portfolio without auth returns 401."""
    _override_db()

    response = await client.get(f"/api/v1/barbers/{BARBER_ID}/portfolio")

    _clear_overrides()

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/v1/barbers/{barber_id}/portfolio
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_portfolio_item(client: AsyncClient) -> None:
    """POST portfolio item with valid auth returns 201."""
    from app.modules.portfolio.service import PortfolioService

    _override_db()
    _override_auth()

    with patch.object(PortfolioService, "add_item", new_callable=AsyncMock) as mock_add:
        mock_add.return_value = _make_portfolio_response()

        response = await client.post(
            f"/api/v1/barbers/{BARBER_ID}/portfolio",
            json=VALID_PORTFOLIO_PAYLOAD,
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 201
    data = response.json()
    assert data["photo_url"] == "https://example.com/photo.jpg"
    assert data["barber_id"] == BARBER_ID
    assert data["display_order"] == 0


@pytest.mark.asyncio
async def test_add_portfolio_item_without_auth_returns_401(client: AsyncClient) -> None:
    """POST portfolio item without auth returns 401."""
    _override_db()

    response = await client.post(
        f"/api/v1/barbers/{BARBER_ID}/portfolio",
        json=VALID_PORTFOLIO_PAYLOAD,
    )

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_portfolio_item_invalid_payload_returns_422(client: AsyncClient) -> None:
    """POST portfolio item with missing required fields returns 422."""
    _override_db()
    _override_auth()

    response = await client.post(
        f"/api/v1/barbers/{BARBER_ID}/portfolio",
        json={"caption": "no photo url here"},
        headers={"Authorization": "Bearer fake.jwt.token"},
    )

    _clear_overrides()

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/barbers/{barber_id}/portfolio/reorder
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reorder_portfolio(client: AsyncClient) -> None:
    """POST reorder returns 200 with items in new order."""
    from app.modules.portfolio.service import PortfolioService

    id_1 = str(uuid.uuid4())
    id_2 = str(uuid.uuid4())

    _override_db()
    _override_auth()

    with patch.object(PortfolioService, "reorder", new_callable=AsyncMock) as mock_reorder:
        mock_reorder.return_value = [
            _make_portfolio_response(item_id=id_1, display_order=0),
            _make_portfolio_response(item_id=id_2, display_order=1),
        ]

        response = await client.post(
            f"/api/v1/barbers/{BARBER_ID}/portfolio/reorder",
            json={"ordered_ids": [id_1, id_2]},
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["display_order"] == 0
    assert data[1]["display_order"] == 1


# ---------------------------------------------------------------------------
# DELETE /api/v1/portfolio/{item_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_portfolio_unauthorized(client: AsyncClient) -> None:
    """DELETE portfolio item by non-owner raises 403."""
    from fastapi import HTTPException
    from app.modules.portfolio.service import PortfolioService

    _override_db()
    _override_auth(user_id=OTHER_USER_ID)

    with patch.object(PortfolioService, "delete_item", new_callable=AsyncMock) as mock_delete:
        mock_delete.side_effect = HTTPException(
            status_code=403, detail="Not authorized for this barber profile"
        )

        response = await client.delete(
            f"/api/v1/portfolio/{ITEM_ID}",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_delete_portfolio_item_without_auth_returns_401(client: AsyncClient) -> None:
    """DELETE portfolio item without auth returns 401."""
    _override_db()

    response = await client.delete(f"/api/v1/portfolio/{ITEM_ID}")

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_portfolio_item_not_found(client: AsyncClient) -> None:
    """DELETE non-existent portfolio item returns 404."""
    from fastapi import HTTPException
    from app.modules.portfolio.service import PortfolioService

    _override_db()
    _override_auth()

    with patch.object(PortfolioService, "delete_item", new_callable=AsyncMock) as mock_delete:
        mock_delete.side_effect = HTTPException(
            status_code=404, detail="Portfolio item not found"
        )

        response = await client.delete(
            f"/api/v1/portfolio/{ITEM_ID}",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 404
    assert response.json()["detail"] == "Portfolio item not found"
