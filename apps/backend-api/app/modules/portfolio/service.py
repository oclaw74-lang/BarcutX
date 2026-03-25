import uuid

import structlog
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.barbers.models import Barber
from app.modules.portfolio.repository import PortfolioRepository
from app.modules.portfolio.schemas import (
    PortfolioItemCreate,
    PortfolioItemResponse,
    PortfolioItemUpdate,
    PortfolioReorder,
)

log = structlog.get_logger()


def _to_response(item: object) -> PortfolioItemResponse:
    return PortfolioItemResponse(
        id=item.id,  # type: ignore[attr-defined]
        barber_id=item.barber_id,  # type: ignore[attr-defined]
        photo_url=item.photo_url,  # type: ignore[attr-defined]
        caption=item.caption,  # type: ignore[attr-defined]
        tags=item.tags or [],  # type: ignore[attr-defined]
        display_order=item.display_order,  # type: ignore[attr-defined]
    )


async def _require_barber_owner(
    session: AsyncSession, barber_id: uuid.UUID, user_id: str
) -> None:
    result = await session.execute(select(Barber).where(Barber.id == barber_id))
    barber = result.scalar_one_or_none()
    if barber is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")
    if str(barber.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this barber profile",
        )


class PortfolioService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = PortfolioRepository(session)
        self._session = session

    async def list_portfolio(self, barber_id: uuid.UUID) -> list[PortfolioItemResponse]:
        items = await self._repo.list_by_barber(barber_id)
        return [_to_response(i) for i in items]

    async def add_item(
        self, barber_id: uuid.UUID, data: PortfolioItemCreate, user_id: str
    ) -> PortfolioItemResponse:
        await _require_barber_owner(self._session, barber_id, user_id)
        count = await self._repo.count_by_barber(barber_id)
        item = await self._repo.create(
            barber_id=barber_id,
            photo_url=data.photo_url,
            caption=data.caption,
            tags=data.tags,
            display_order=count,
        )
        return _to_response(item)

    async def update_item(
        self, item_id: uuid.UUID, data: PortfolioItemUpdate, user_id: str
    ) -> PortfolioItemResponse:
        item = await self._repo.get_by_id(item_id)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found"
            )
        await _require_barber_owner(self._session, item.barber_id, user_id)
        update_fields = data.model_dump(exclude_none=True)
        item = await self._repo.update(item, **update_fields)
        return _to_response(item)

    async def delete_item(self, item_id: uuid.UUID, user_id: str) -> None:
        item = await self._repo.get_by_id(item_id)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found"
            )
        await _require_barber_owner(self._session, item.barber_id, user_id)
        await self._repo.delete(item)

    async def reorder(
        self, barber_id: uuid.UUID, data: PortfolioReorder, user_id: str
    ) -> list[PortfolioItemResponse]:
        await _require_barber_owner(self._session, barber_id, user_id)
        items = await self._repo.bulk_update_order(barber_id, data.ordered_ids)
        return [_to_response(i) for i in items]
