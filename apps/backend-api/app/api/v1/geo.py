from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, Query, status

from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.modules.geo.schemas import ShopLocationUpdate, ShopNearbyResult
from app.modules.geo.service import GeoService

log = structlog.get_logger()

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get(
    "/nearby",
    response_model=list[ShopNearbyResult],
    status_code=status.HTTP_200_OK,
)
async def get_nearby_shops(
    lat: float = Query(..., ge=-90, le=90, description="Latitude of the search origin"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude of the search origin"),
    radius_km: float = Query(default=5.0, gt=0, le=50.0, description="Search radius in km"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of results"),
) -> list[ShopNearbyResult]:
    """Return barber shops within the given radius. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = GeoService(supabase)
    return await service.get_nearby(lat, lng, radius_km, limit)


@router.get(
    "/search",
    response_model=list[dict[str, Any]],
    status_code=status.HTTP_200_OK,
)
async def search_shops(
    q: str | None = Query(default=None, description="Free-text search term (shop name)"),
    city: str | None = Query(default=None, description="Filter by city"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of results"),
) -> list[dict[str, Any]]:
    """Search barber shops by name or city. At least one of q or city is required.
    Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = GeoService(supabase)
    return await service.search(q, city, limit)


@router.patch(
    "/shops/{shop_id}/location",
    response_model=dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def update_shop_location(
    shop_id: str,
    body: ShopLocationUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> dict[str, Any]:
    """Update the geographic location of a shop. Only the shop owner can call this."""
    supabase = await get_supabase()
    service = GeoService(supabase)
    result = await service.update_location(shop_id, body, requester_id=user_id)
    log.info("shop_location_updated", shop_id=shop_id, requester_id=user_id)
    return result
