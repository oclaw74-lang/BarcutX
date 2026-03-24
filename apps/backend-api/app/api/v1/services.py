import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import UserPayload, get_current_user
from app.modules.services.schemas import ServiceCreate, ServiceResponse, ServiceUpdate
from app.modules.services.service import ServiceService

log = structlog.get_logger()

router = APIRouter(tags=["services"])


def _get_service(session: AsyncSession = Depends(get_db)) -> ServiceService:
    return ServiceService(session)


@router.get(
    "/barber-shops/{shop_id}/services",
    response_model=list[ServiceResponse],
    status_code=status.HTTP_200_OK,
    summary="List active services of a barber shop (public)",
)
async def list_services(
    shop_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(_get_service)],
) -> list[ServiceResponse]:
    return await svc.list_services(shop_id)


@router.post(
    "/barber-shops/{shop_id}/services",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a service for a barber shop (owner only)",
)
async def create_service(
    shop_id: uuid.UUID,
    data: ServiceCreate,
    svc: Annotated[ServiceService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> ServiceResponse:
    log.info("create_service_request", shop_id=str(shop_id), user_id=str(current_user.id))
    return await svc.create_service(shop_id, data, str(current_user.id))


@router.get(
    "/barber-shops/{shop_id}/services/{service_id}",
    response_model=ServiceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a single service detail",
)
async def get_service(
    shop_id: uuid.UUID,
    service_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(_get_service)],
) -> ServiceResponse:
    return await svc.get_service(shop_id, service_id)


@router.patch(
    "/barber-shops/{shop_id}/services/{service_id}",
    response_model=ServiceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a service (owner only)",
)
async def update_service(
    shop_id: uuid.UUID,
    service_id: uuid.UUID,
    data: ServiceUpdate,
    svc: Annotated[ServiceService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> ServiceResponse:
    log.info(
        "update_service_request",
        shop_id=str(shop_id),
        service_id=str(service_id),
        user_id=str(current_user.id),
    )
    return await svc.update_service(shop_id, service_id, data, str(current_user.id))


@router.delete(
    "/barber-shops/{shop_id}/services/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a service (owner only)",
)
async def delete_service(
    shop_id: uuid.UUID,
    service_id: uuid.UUID,
    svc: Annotated[ServiceService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> None:
    log.info(
        "delete_service_request",
        shop_id=str(shop_id),
        service_id=str(service_id),
        user_id=str(current_user.id),
    )
    await svc.delete_service(shop_id, service_id, str(current_user.id))
