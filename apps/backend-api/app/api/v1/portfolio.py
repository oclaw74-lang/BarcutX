import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import UserPayload, get_current_user
from app.modules.portfolio.schemas import (
    PortfolioItemCreate,
    PortfolioItemResponse,
    PortfolioItemUpdate,
    PortfolioReorder,
)
from app.modules.portfolio.service import PortfolioService

log = structlog.get_logger()

router = APIRouter(tags=["portfolio"])


def _get_service(session: AsyncSession = Depends(get_db)) -> PortfolioService:
    return PortfolioService(session)


@router.get(
    "/barbers/{barber_id}/portfolio",
    response_model=list[PortfolioItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List portfolio items of a barber",
)
async def list_portfolio(
    barber_id: uuid.UUID,
    svc: Annotated[PortfolioService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> list[PortfolioItemResponse]:
    return await svc.list_portfolio(barber_id)


@router.post(
    "/barbers/{barber_id}/portfolio",
    response_model=PortfolioItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a portfolio item (barber only)",
)
async def add_portfolio_item(
    barber_id: uuid.UUID,
    data: PortfolioItemCreate,
    svc: Annotated[PortfolioService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> PortfolioItemResponse:
    log.info("add_portfolio_item_request", barber_id=str(barber_id), user_id=str(current_user.id))
    return await svc.add_item(barber_id, data, str(current_user.id))


@router.patch(
    "/portfolio/{item_id}",
    response_model=PortfolioItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a portfolio item (barber only)",
)
async def update_portfolio_item(
    item_id: uuid.UUID,
    data: PortfolioItemUpdate,
    svc: Annotated[PortfolioService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> PortfolioItemResponse:
    log.info("update_portfolio_item_request", item_id=str(item_id), user_id=str(current_user.id))
    return await svc.update_item(item_id, data, str(current_user.id))


@router.delete(
    "/portfolio/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a portfolio item (barber only)",
)
async def delete_portfolio_item(
    item_id: uuid.UUID,
    svc: Annotated[PortfolioService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> None:
    log.info("delete_portfolio_item_request", item_id=str(item_id), user_id=str(current_user.id))
    await svc.delete_item(item_id, str(current_user.id))


@router.post(
    "/barbers/{barber_id}/portfolio/reorder",
    response_model=list[PortfolioItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Reorder portfolio items (barber only)",
)
async def reorder_portfolio(
    barber_id: uuid.UUID,
    data: PortfolioReorder,
    svc: Annotated[PortfolioService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> list[PortfolioItemResponse]:
    log.info("reorder_portfolio_request", barber_id=str(barber_id), user_id=str(current_user.id))
    return await svc.reorder(barber_id, data, str(current_user.id))
