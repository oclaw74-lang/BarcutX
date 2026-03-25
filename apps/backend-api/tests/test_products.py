"""Unit tests for the products endpoints (issue #33)."""

import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

SHOP_ID = str(uuid.uuid4())
BARBER_ID = str(uuid.uuid4())
PRODUCT_ID = str(uuid.uuid4())
OWNER_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())

VALID_SHOP_PRODUCT_PAYLOAD = {
    "name": "Pomada fijadora",
    "description": "Fijacion media brillo",
    "price": "12.50",
    "stock_quantity": 20,
    "category": "styling",
}


def _make_product_response(
    product_id: str = PRODUCT_ID,
    shop_id: str = SHOP_ID,
    barber_id: str | None = None,
) -> "ProductResponse":
    from app.modules.products.schemas import ProductResponse

    return ProductResponse(
        id=uuid.UUID(product_id),
        shop_id=uuid.UUID(shop_id),
        barber_id=uuid.UUID(barber_id) if barber_id else None,
        name="Pomada fijadora",
        description="Fijacion media brillo",
        price=Decimal("12.50"),
        stock_quantity=20,
        photo_url=None,
        category="styling",
        is_active=True,
    )


def _override_db():
    from app.core.database import get_db
    from app.main import app

    async def _fake_db():  # type: ignore[return]
        yield AsyncMock()

    app.dependency_overrides[get_db] = _fake_db
    return get_db


def _override_auth(user_id: str = OWNER_ID, role: str = "owner"):
    from app.core.security import UserPayload, get_current_user
    from app.main import app

    async def _fake_auth() -> UserPayload:
        return UserPayload(id=uuid.UUID(user_id), email="owner@test.com", role=role)

    app.dependency_overrides[get_current_user] = _fake_auth
    return get_current_user


def _clear_overrides():
    from app.main import app

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /api/v1/shops/{shop_id}/products
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_shop_products(client: AsyncClient) -> None:
    """GET shop products returns 200 and a list."""
    from app.modules.products.service import ProductService

    _override_db()
    _override_auth()

    with patch.object(ProductService, "list_shop_products", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [_make_product_response()]

        response = await client.get(
            f"/api/v1/shops/{SHOP_ID}/products",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Pomada fijadora"
    assert data[0]["shop_id"] == SHOP_ID


@pytest.mark.asyncio
async def test_list_shop_products_without_auth_returns_401(client: AsyncClient) -> None:
    """GET shop products without auth returns 401."""
    _override_db()

    response = await client.get(f"/api/v1/shops/{SHOP_ID}/products")

    _clear_overrides()

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/v1/shops/{shop_id}/products
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_product_as_owner(client: AsyncClient) -> None:
    """POST shop product with valid auth creates product and returns 201."""
    from app.modules.products.service import ProductService

    _override_db()
    _override_auth()

    with patch.object(ProductService, "create_shop_product", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = _make_product_response()

        response = await client.post(
            f"/api/v1/shops/{SHOP_ID}/products",
            json=VALID_SHOP_PRODUCT_PAYLOAD,
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Pomada fijadora"
    assert data["shop_id"] == SHOP_ID
    assert data["barber_id"] is None
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_product_unauthorized(client: AsyncClient) -> None:
    """POST shop product without auth returns 401."""
    _override_db()

    response = await client.post(
        f"/api/v1/shops/{SHOP_ID}/products",
        json=VALID_SHOP_PRODUCT_PAYLOAD,
    )

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_product_invalid_payload_returns_422(client: AsyncClient) -> None:
    """POST with negative price returns 422."""
    _override_db()
    _override_auth()

    response = await client.post(
        f"/api/v1/shops/{SHOP_ID}/products",
        json={"name": "Bad product", "price": "-5.00", "stock_quantity": 1},
        headers={"Authorization": "Bearer fake.jwt.token"},
    )

    _clear_overrides()

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PATCH /api/v1/products/{product_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_product_ownership(client: AsyncClient) -> None:
    """PATCH product by non-owner raises 403."""
    from fastapi import HTTPException
    from app.modules.products.service import ProductService

    _override_db()
    _override_auth(user_id=OTHER_USER_ID)

    with patch.object(ProductService, "update_product", new_callable=AsyncMock) as mock_update:
        mock_update.side_effect = HTTPException(
            status_code=403, detail="Not authorized to modify this product"
        )

        response = await client.patch(
            f"/api/v1/products/{PRODUCT_ID}",
            json={"name": "Hacked product"},
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_product_success(client: AsyncClient) -> None:
    """PATCH product by owner returns 200 with updated data."""
    from app.modules.products.schemas import ProductResponse
    from app.modules.products.service import ProductService

    updated = ProductResponse(
        id=uuid.UUID(PRODUCT_ID),
        shop_id=uuid.UUID(SHOP_ID),
        barber_id=None,
        name="Pomada premium",
        description="Fijacion fuerte",
        price=Decimal("15.00"),
        stock_quantity=15,
        photo_url=None,
        category="styling",
        is_active=True,
    )

    _override_db()
    _override_auth()

    with patch.object(ProductService, "update_product", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = updated

        response = await client.patch(
            f"/api/v1/products/{PRODUCT_ID}",
            json={"name": "Pomada premium", "price": "15.00"},
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Pomada premium"
    assert data["price"] == "15.00"


# ---------------------------------------------------------------------------
# DELETE /api/v1/products/{product_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_product_without_auth_returns_401(client: AsyncClient) -> None:
    """DELETE without auth returns 401."""
    _override_db()

    response = await client.delete(f"/api/v1/products/{PRODUCT_ID}")

    _clear_overrides()

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_product_not_found(client: AsyncClient) -> None:
    """DELETE non-existent product returns 404."""
    from fastapi import HTTPException
    from app.modules.products.service import ProductService

    _override_db()
    _override_auth()

    with patch.object(ProductService, "delete_product", new_callable=AsyncMock) as mock_delete:
        mock_delete.side_effect = HTTPException(status_code=404, detail="Product not found")

        response = await client.delete(
            f"/api/v1/products/{PRODUCT_ID}",
            headers={"Authorization": "Bearer fake.jwt.token"},
        )

    _clear_overrides()

    assert response.status_code == 404
