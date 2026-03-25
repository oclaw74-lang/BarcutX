from datetime import datetime, timezone
from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.schemas import ShopLocationUpdate, ShopNearbyResult
from app.modules.geo.repository import GeoRepository

log = structlog.get_logger()

# day_of_week index in business_hours: 0=Monday ... 6=Sunday
HOURS_TABLE = "business_hours"


class GeoService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = GeoRepository(client)
        self._client = client

    # -------------------------------------------------------------------------
    # Nearby shops
    # -------------------------------------------------------------------------

    async def get_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        limit: int,
    ) -> list[ShopNearbyResult]:
        rows = await self._repo.get_nearby_shops(lat, lng, radius_km, limit)
        if not rows:
            return []

        today_index = datetime.now(timezone.utc).weekday()  # 0=Monday
        results: list[ShopNearbyResult] = []

        for row in rows:
            shop_id = str(row["id"])
            is_open = await self._is_shop_open(shop_id, today_index)
            barber_count = await self._repo.count_barbers(shop_id)

            # Fetch extra fields (branding) from full shop row
            shop = await self._repo.get_by_id(shop_id)
            results.append(
                ShopNearbyResult(
                    id=row["id"],
                    name=row["name"],
                    slug=row.get("slug"),
                    address=row.get("address"),
                    latitude=row.get("latitude"),
                    longitude=row.get("longitude"),
                    distance_km=round(row["distance_km"], 3),
                    rating=None,  # ratings feature is out of scope for this issue
                    is_open=is_open,
                    accent_color=shop.get("accent_color") if shop else None,
                    logo_url=shop.get("logo_url") if shop else None,
                    barber_count=barber_count,
                )
            )

        return results

    # -------------------------------------------------------------------------
    # Search by name / city
    # -------------------------------------------------------------------------

    async def search(
        self,
        q: str | None,
        city: str | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        if not q and not city:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one of 'q' or 'city' is required",
            )
        return await self._repo.search_shops(q=q, city=city, limit=limit)

    # -------------------------------------------------------------------------
    # Update location
    # -------------------------------------------------------------------------

    async def update_location(
        self,
        shop_id: str,
        data: ShopLocationUpdate,
        requester_id: str,
    ) -> dict[str, Any]:
        shop = await self._repo.get_by_id(shop_id)
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber shop not found",
            )
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )
        updated = await self._repo.update_location(
            shop_id,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Location update failed",
            )
        log.info(
            "shop_location_updated",
            shop_id=shop_id,
            lat=data.latitude,
            lng=data.longitude,
        )
        return updated

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    async def _is_shop_open(self, shop_id: str, day_index: int) -> bool:
        """Check whether a shop is open today based on its business_hours rows."""
        try:
            result = (
                await self._client.table(HOURS_TABLE)
                .select("is_closed, open_time, close_time")
                .eq("barbershop_id", shop_id)
                .eq("day_of_week", day_index)
                .execute()
            )
            rows = result.data or []
            if not rows:
                return False
            row = rows[0]
            if row.get("is_closed"):
                return False
            # Optionally check current time within open/close window
            now_time = datetime.now(timezone.utc).strftime("%H:%M")
            open_t = row.get("open_time", "00:00")
            close_t = row.get("close_time", "23:59")
            return open_t <= now_time <= close_t
        except Exception as exc:
            log.warning("is_shop_open_failed", shop_id=shop_id, error=str(exc))
            return False
