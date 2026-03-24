import uuid

import structlog
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.barber_shops.models import BarberShop
from app.modules.services.repository import ServiceRepository
from app.modules.services.schemas import ServiceCreate, ServiceResponse, ServiceUpdate

log = structlog.get_logger()


async def _require_shop_owner(
    session: AsyncSession,
    shop_id: uuid.UUID,
    user_id: str,
) -> None:
    """Raise 403 if user is not the owner of the shop, 404 if shop does not exist."""
    from sqlalchemy import select

    result = await session.execute(
        select(BarberShop).where(BarberShop.id == shop_id)
    )
    shop = result.scalar_one_or_none()
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber shop not found")
    if str(shop.owner_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the shop owner")


def _to_response(service: object) -> ServiceResponse:
    """Map ORM Service to ServiceResponse, aliasing barbershop_id -> shop_id."""
    return ServiceResponse(
        id=service.id,  # type: ignore[attr-defined]
        shop_id=service.barbershop_id,  # type: ignore[attr-defined]
        name=service.name,  # type: ignore[attr-defined]
        description=service.description,  # type: ignore[attr-defined]
        price=service.price,  # type: ignore[attr-defined]
        duration_minutes=service.duration_minutes,  # type: ignore[attr-defined]
        is_active=service.is_active,  # type: ignore[attr-defined]
        created_at=service.created_at,  # type: ignore[attr-defined]
    )


class ServiceService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ServiceRepository(session)
        self._session = session

    async def list_services(self, shop_id: uuid.UUID) -> list[ServiceResponse]:
        services = await self._repo.list_active_by_shop(shop_id)
        return [_to_response(s) for s in services]

    async def get_service(self, shop_id: uuid.UUID, service_id: uuid.UUID) -> ServiceResponse:
        service = await self._repo.get_by_id(service_id, shop_id)
        if service is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        return _to_response(service)

    async def create_service(
        self,
        shop_id: uuid.UUID,
        data: ServiceCreate,
        user_id: str,
    ) -> ServiceResponse:
        await _require_shop_owner(self._session, shop_id, user_id)
        service = await self._repo.create(
            shop_id=shop_id,
            name=data.name,
            description=data.description,
            price=data.price,
            duration_minutes=data.duration_minutes,
        )
        return _to_response(service)

    async def update_service(
        self,
        shop_id: uuid.UUID,
        service_id: uuid.UUID,
        data: ServiceUpdate,
        user_id: str,
    ) -> ServiceResponse:
        await _require_shop_owner(self._session, shop_id, user_id)
        service = await self._repo.get_by_id(service_id, shop_id)
        if service is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        update_fields = data.model_dump(exclude_none=True)
        service = await self._repo.update(service, **update_fields)
        return _to_response(service)

    async def delete_service(
        self,
        shop_id: uuid.UUID,
        service_id: uuid.UUID,
        user_id: str,
    ) -> None:
        await _require_shop_owner(self._session, shop_id, user_id)
        service = await self._repo.get_by_id(service_id, shop_id)
        if service is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        await self._repo.deactivate(service)
