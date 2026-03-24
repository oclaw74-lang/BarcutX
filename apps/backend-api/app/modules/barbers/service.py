from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.repository import BarberShopRepository
from app.modules.barbers.repository import BarberRepository
from app.modules.barbers.schemas import BarberCreate

log = structlog.get_logger()


class BarberService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = BarberRepository(client)
        self._shop_repo = BarberShopRepository(client)

    async def _get_shop_or_404(self, shop_id: str) -> dict[str, Any]:
        shop = await self._shop_repo.get_by_id(shop_id)
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber shop not found",
            )
        return shop

    def _assert_owner(self, shop: dict[str, Any], requester_id: str) -> None:
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        await self._get_shop_or_404(shop_id)
        return await self._repo.list_by_shop(shop_id)

    async def add_barber(
        self, shop_id: str, data: BarberCreate, requester_id: str
    ) -> dict[str, Any]:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, requester_id)
        payload = data.model_dump(exclude_none=True)
        payload["shop_id"] = shop_id
        payload["profile_id"] = str(data.profile_id)
        try:
            return await self._repo.create(payload)
        except Exception as exc:
            log.error("barber_add_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not add barber",
            ) from exc

    async def remove_barber(
        self, shop_id: str, barber_id: str, requester_id: str
    ) -> None:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, requester_id)
        barber = await self._repo.get_by_id(barber_id)
        if not barber or barber["shop_id"] != shop_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found in this shop",
            )
        await self._repo.delete(barber_id)
