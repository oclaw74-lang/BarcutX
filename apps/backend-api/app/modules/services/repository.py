import uuid
from decimal import Decimal

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.services.models import Service

log = structlog.get_logger()


class ServiceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active_by_shop(self, shop_id: uuid.UUID) -> list[Service]:
        result = await self._session.execute(
            select(Service)
            .where(Service.barbershop_id == shop_id, Service.is_active.is_(True))
            .order_by(Service.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, service_id: uuid.UUID, shop_id: uuid.UUID) -> Service | None:
        result = await self._session.execute(
            select(Service).where(
                Service.id == service_id,
                Service.barbershop_id == shop_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        shop_id: uuid.UUID,
        name: str,
        description: str | None,
        price: Decimal,
        duration_minutes: int,
    ) -> Service:
        service = Service(
            barbershop_id=shop_id,
            name=name,
            description=description,
            price=price,
            duration_minutes=duration_minutes,
        )
        self._session.add(service)
        await self._session.flush()
        await self._session.refresh(service)
        log.info("service_created", service_id=str(service.id), shop_id=str(shop_id))
        return service

    async def update(self, service: Service, **fields: object) -> Service:
        for key, value in fields.items():
            if value is not None:
                setattr(service, key, value)
        await self._session.flush()
        await self._session.refresh(service)
        log.info("service_updated", service_id=str(service.id))
        return service

    async def deactivate(self, service: Service) -> Service:
        service.is_active = False
        await self._session.flush()
        log.info("service_deactivated", service_id=str(service.id))
        return service
