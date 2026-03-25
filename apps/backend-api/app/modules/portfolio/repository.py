import uuid

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.portfolio.models import PortfolioItem

log = structlog.get_logger()


class PortfolioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_barber(self, barber_id: uuid.UUID) -> list[PortfolioItem]:
        result = await self._session.execute(
            select(PortfolioItem)
            .where(PortfolioItem.barber_id == barber_id)
            .order_by(PortfolioItem.display_order, PortfolioItem.created_at)
        )
        return list(result.scalars().all())

    async def get_by_id(self, item_id: uuid.UUID) -> PortfolioItem | None:
        result = await self._session.execute(
            select(PortfolioItem).where(PortfolioItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        barber_id: uuid.UUID,
        photo_url: str,
        caption: str | None,
        tags: list[str],
        display_order: int,
    ) -> PortfolioItem:
        item = PortfolioItem(
            barber_id=barber_id,
            photo_url=photo_url,
            caption=caption,
            tags=tags,
            display_order=display_order,
        )
        self._session.add(item)
        await self._session.flush()
        await self._session.refresh(item)
        log.info("portfolio_item_created", item_id=str(item.id), barber_id=str(barber_id))
        return item

    async def count_by_barber(self, barber_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(PortfolioItem).where(PortfolioItem.barber_id == barber_id)
        )
        return len(result.scalars().all())

    async def update(self, item: PortfolioItem, **fields: object) -> PortfolioItem:
        for key, value in fields.items():
            setattr(item, key, value)
        await self._session.flush()
        await self._session.refresh(item)
        log.info("portfolio_item_updated", item_id=str(item.id))
        return item

    async def delete(self, item: PortfolioItem) -> None:
        await self._session.delete(item)
        await self._session.flush()
        log.info("portfolio_item_deleted", item_id=str(item.id))

    async def bulk_update_order(
        self, barber_id: uuid.UUID, ordered_ids: list[uuid.UUID]
    ) -> list[PortfolioItem]:
        for position, item_id in enumerate(ordered_ids):
            await self._session.execute(
                update(PortfolioItem)
                .where(PortfolioItem.id == item_id, PortfolioItem.barber_id == barber_id)
                .values(display_order=position)
            )
        await self._session.flush()
        return await self.list_by_barber(barber_id)
