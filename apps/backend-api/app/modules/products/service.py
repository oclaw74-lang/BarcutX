import uuid

import structlog
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.barber_shops.models import BarberShop
from app.modules.barbers.models import Barber
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductCreate, ProductResponse, ProductUpdate

log = structlog.get_logger()


def _to_response(product: object) -> ProductResponse:
    return ProductResponse(
        id=product.id,  # type: ignore[attr-defined]
        shop_id=product.shop_id,  # type: ignore[attr-defined]
        barber_id=product.barber_id,  # type: ignore[attr-defined]
        name=product.name,  # type: ignore[attr-defined]
        description=product.description,  # type: ignore[attr-defined]
        price=product.price,  # type: ignore[attr-defined]
        stock_quantity=product.stock_quantity,  # type: ignore[attr-defined]
        photo_url=product.photo_url,  # type: ignore[attr-defined]
        category=product.category,  # type: ignore[attr-defined]
        is_active=product.is_active,  # type: ignore[attr-defined]
    )


async def _require_shop_owner(session: AsyncSession, shop_id: uuid.UUID, user_id: str) -> None:
    result = await session.execute(select(BarberShop).where(BarberShop.id == shop_id))
    shop = result.scalar_one_or_none()
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber shop not found")
    if str(shop.owner_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the shop owner")


async def _require_barber_owner(
    session: AsyncSession, barber_id: uuid.UUID, user_id: str
) -> BarberShop:
    result = await session.execute(select(Barber).where(Barber.id == barber_id))
    barber = result.scalar_one_or_none()
    if barber is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")
    if str(barber.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this barber profile"
        )
    shop_result = await session.execute(
        select(BarberShop).where(BarberShop.id == barber.barbershop_id)
    )
    shop = shop_result.scalar_one_or_none()
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber shop not found")
    return shop


class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ProductRepository(session)
        self._session = session

    async def list_shop_products(
        self, shop_id: uuid.UUID, include_barbers: bool = False
    ) -> list[ProductResponse]:
        products = await self._repo.list_by_shop(shop_id, include_barbers=include_barbers)
        return [_to_response(p) for p in products]

    async def list_barber_products(self, barber_id: uuid.UUID) -> list[ProductResponse]:
        products = await self._repo.list_by_barber(barber_id)
        return [_to_response(p) for p in products]

    async def create_shop_product(
        self, shop_id: uuid.UUID, data: ProductCreate, user_id: str
    ) -> ProductResponse:
        await _require_shop_owner(self._session, shop_id, user_id)
        product = await self._repo.create(
            shop_id=shop_id,
            barber_id=None,
            name=data.name,
            description=data.description,
            price=data.price,
            stock_quantity=data.stock_quantity,
            photo_url=data.photo_url,
            category=data.category,
        )
        return _to_response(product)

    async def create_barber_product(
        self, barber_id: uuid.UUID, data: ProductCreate, user_id: str
    ) -> ProductResponse:
        shop = await _require_barber_owner(self._session, barber_id, user_id)
        product = await self._repo.create(
            shop_id=shop.id,
            barber_id=barber_id,
            name=data.name,
            description=data.description,
            price=data.price,
            stock_quantity=data.stock_quantity,
            photo_url=data.photo_url,
            category=data.category,
        )
        return _to_response(product)

    async def update_product(
        self, product_id: uuid.UUID, data: ProductUpdate, user_id: str
    ) -> ProductResponse:
        product = await self._repo.get_by_id(product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await self._verify_product_ownership(product, user_id)
        update_fields = data.model_dump(exclude_none=True)
        product = await self._repo.update(product, **update_fields)
        return _to_response(product)

    async def delete_product(self, product_id: uuid.UUID, user_id: str) -> None:
        product = await self._repo.get_by_id(product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await self._verify_product_ownership(product, user_id)
        await self._repo.deactivate(product)

    async def _verify_product_ownership(self, product: object, user_id: str) -> None:
        if product.barber_id is not None:  # type: ignore[attr-defined]
            result = await self._session.execute(
                select(Barber).where(Barber.id == product.barber_id)  # type: ignore[attr-defined]
            )
            barber = result.scalar_one_or_none()
            if barber is None or str(barber.user_id) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this product",
                )
        else:
            result = await self._session.execute(
                select(BarberShop).where(BarberShop.id == product.shop_id)  # type: ignore[attr-defined]
            )
            shop = result.scalar_one_or_none()
            if shop is None or str(shop.owner_id) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this product",
                )
