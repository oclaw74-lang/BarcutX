from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.repository import BarberShopRepository
from app.modules.barber_shops.schemas import (
    BarberShopCreate,
    BarberShopUpdate,
    ShopBrandingUpdate,
    ShopHoursUpdate,
)

log = structlog.get_logger()

MAX_GALLERY_PHOTOS = 10


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

    # -------------------------------------------------------------------------
    # Branding
    # -------------------------------------------------------------------------

    async def update_branding(
        self, shop_id: str, data: ShopBrandingUpdate, requester_id: str
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

        # Unique slug check
        if "slug" in payload:
            existing = await self._repo.get_by_slug(payload["slug"])
            if existing and existing["id"] != shop_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A shop with this slug already exists",
                )

        updated = await self._repo.update_branding(shop_id, payload)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Branding update failed",
            )
        log.info("shop_branding_updated", shop_id=shop_id, fields=list(payload.keys()))
        return updated

    # -------------------------------------------------------------------------
    # Hours
    # -------------------------------------------------------------------------

    async def update_hours(
        self, shop_id: str, data: ShopHoursUpdate, requester_id: str
    ) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )

        day_map = data.to_day_index_map()
        if not day_map:
            # Nothing to update — return current hours
            hours_rows = await self._repo.get_hours_by_shop(shop_id)
            return _build_hours_response(shop_id, hours_rows)

        for day_index, day_hours in day_map.items():
            await self._repo.upsert_day_hours(
                shop_id=shop_id,
                day_index=day_index,
                open_time=day_hours.open,
                close_time=day_hours.close,
                is_closed=not day_hours.is_open,
            )

        hours_rows = await self._repo.get_hours_by_shop(shop_id)
        log.info("shop_hours_updated", shop_id=shop_id, days=list(day_map.keys()))
        return _build_hours_response(shop_id, hours_rows)

    # -------------------------------------------------------------------------
    # Gallery
    # -------------------------------------------------------------------------

    async def add_gallery_photo(
        self, shop_id: str, url: str, requester_id: str
    ) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )

        current_urls = await self._repo.get_gallery_urls(shop_id)
        if len(current_urls) >= MAX_GALLERY_PHOTOS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gallery is full — maximum {MAX_GALLERY_PHOTOS} photos allowed",
            )

        updated_urls = current_urls + [url]
        result = await self._repo.update_gallery_urls(shop_id, updated_urls)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update gallery",
            )
        log.info("gallery_photo_added", shop_id=shop_id, url=url)
        return {"shop_id": shop_id, "gallery_urls": result.get("gallery_urls") or updated_urls}

    async def remove_gallery_photo(
        self, shop_id: str, index: int, requester_id: str
    ) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )

        current_urls = await self._repo.get_gallery_urls(shop_id)
        if index < 0 or index >= len(current_urls):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Gallery photo at index {index} not found",
            )

        updated_urls = [u for i, u in enumerate(current_urls) if i != index]
        result = await self._repo.update_gallery_urls(shop_id, updated_urls)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update gallery",
            )
        log.info("gallery_photo_removed", shop_id=shop_id, index=index)
        return {"shop_id": shop_id, "gallery_urls": result.get("gallery_urls") or updated_urls}

    # -------------------------------------------------------------------------
    # Public profile
    # -------------------------------------------------------------------------

    async def get_public(self, shop_id: str) -> dict[str, Any]:
        shop = await self.get_or_404(shop_id)
        gallery_urls = await self._repo.get_gallery_urls(shop_id)
        return {**shop, "gallery_urls": gallery_urls}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DAY_NAMES = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def _build_hours_response(shop_id: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    hours: dict[str, Any] = {}
    for row in rows:
        day_index = row.get("day_of_week")
        if day_index is not None and 0 <= day_index <= 6:
            day_name = _DAY_NAMES[day_index]
            hours[day_name] = {
                "open": row.get("open_time"),
                "close": row.get("close_time"),
                "is_open": not row.get("is_closed", False),
            }
    return {"shop_id": shop_id, "hours": hours}
