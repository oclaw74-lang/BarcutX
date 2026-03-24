from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.repository import BarberShopRepository
from app.modules.barber_shops.schemas import BarberShopCreate, BarberShopUpdate

log = structlog.get_logger()


class BarberShopService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = BarberShopRepository(client)

    async def list_active(self) -> list[dict[str, Any]]:
        return await self._repo.list_active()

    async def get_or_404(self, shop_id: str) -> dict[str, Any]:
        shop = await self._repo.get_by_id(shop_id)
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber shop not found",
            )
        return shop

    async def create(self, data: BarberShopCreate, owner_id: str) -> dict[str, Any]:
        payload = data.model_dump(exclude_none=True)
        payload["owner_id"] = owner_id
        try:
            return await self._repo.create(payload)
        except Exception as exc:
            log.error("barber_shop_create_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create barber shop",
            ) from exc

    async def update(
        self, shop_id: str, data: BarberShopUpdate, requester_id: str
    ) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )
        payload = data.model_dump(exclude_none=True)
        if not payload:
            return shop
        updated = await self._repo.update(shop_id, payload)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Update failed",
            )
        return updated

    async def deactivate(self, shop_id: str, requester_id: str) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )
        result = await self._repo.deactivate(shop_id)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Deactivation failed",
            )
        return result
