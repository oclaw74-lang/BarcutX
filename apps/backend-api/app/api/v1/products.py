import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import UserPayload, get_current_user
from app.modules.products.schemas import ProductCreate, ProductResponse, ProductUpdate
from app.modules.products.service import ProductService

log = structlog.get_logger()

router = APIRouter(tags=["products"])


def _get_service(session: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(session)


@router.get(
    "/shops/{shop_id}/products",
    response_model=list[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List products of a barber shop",
)
async def list_shop_products(
    shop_id: uuid.UUID,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
    include_barbers: bool = Query(default=False, description="Include barber products"),
) -> list[ProductResponse]:
    return await svc.list_shop_products(shop_id, include_barbers=include_barbers)


@router.post(
    "/shops/{shop_id}/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product for a barber shop (owner only)",
)
async def create_shop_product(
    shop_id: uuid.UUID,
    data: ProductCreate,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> ProductResponse:
    log.info("create_shop_product_request", shop_id=str(shop_id), user_id=str(current_user.id))
    return await svc.create_shop_product(shop_id, data, str(current_user.id))


@router.get(
    "/barbers/{barber_id}/products",
    response_model=list[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List products of a barber",
)
async def list_barber_products(
    barber_id: uuid.UUID,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> list[ProductResponse]:
    return await svc.list_barber_products(barber_id)


@router.post(
    "/barbers/{barber_id}/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product as a barber",
)
async def create_barber_product(
    barber_id: uuid.UUID,
    data: ProductCreate,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> ProductResponse:
    log.info("create_barber_product_request", barber_id=str(barber_id), user_id=str(current_user.id))
    return await svc.create_barber_product(barber_id, data, str(current_user.id))


@router.patch(
    "/products/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a product (owner only)",
)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> ProductResponse:
    log.info("update_product_request", product_id=str(product_id), user_id=str(current_user.id))
    return await svc.update_product(product_id, data, str(current_user.id))


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a product (owner only)",
)
async def delete_product(
    product_id: uuid.UUID,
    svc: Annotated[ProductService, Depends(_get_service)],
    current_user: Annotated[UserPayload, Depends(get_current_user)],
) -> None:
    log.info("delete_product_request", product_id=str(product_id), user_id=str(current_user.id))
    await svc.delete_product(product_id, str(current_user.id))
