import uuid
from decimal import Decimal

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Product

log = structlog.get_logger()


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_shop(self, shop_id: uuid.UUID, include_barbers: bool = False) -> list[Product]:
        if include_barbers:
            stmt = (
                select(Product)
                .where(Product.shop_id == shop_id, Product.is_active.is_(True))
                .order_by(Product.name)
            )
        else:
            stmt = (
                select(Product)
                .where(
                    Product.shop_id == shop_id,
                    Product.barber_id.is_(None),
                    Product.is_active.is_(True),
                )
                .order_by(Product.name)
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_barber(self, barber_id: uuid.UUID) -> list[Product]:
        result = await self._session.execute(
            select(Product)
            .where(Product.barber_id == barber_id, Product.is_active.is_(True))
            .order_by(Product.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, product_id: uuid.UUID) -> Product | None:
        result = await self._session.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        shop_id: uuid.UUID,
        barber_id: uuid.UUID | None,
        name: str,
        description: str | None,
        price: Decimal,
        stock_quantity: int,
        photo_url: str | None,
        category: str,
    ) -> Product:
        product = Product(
            shop_id=shop_id,
            barber_id=barber_id,
            name=name,
            description=description,
            price=price,
            stock_quantity=stock_quantity,
            photo_url=photo_url,
            category=category,
        )
        self._session.add(product)
        await self._session.flush()
        await self._session.refresh(product)
        log.info("product_created", product_id=str(product.id), shop_id=str(shop_id))
        return product

    async def update(self, product: Product, **fields: object) -> Product:
        for key, value in fields.items():
            setattr(product, key, value)
        await self._session.flush()
        await self._session.refresh(product)
        log.info("product_updated", product_id=str(product.id))
        return product

    async def deactivate(self, product: Product) -> None:
        product.is_active = False
        await self._session.flush()
        log.info("product_deactivated", product_id=str(product.id))
