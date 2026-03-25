from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Query, status

from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.modules.barbers.schemas import (
    BarberAvailabilityUpdate,
    BarberProfileUpdate,
    BarberPublicProfile,
    ShopInfo,
)
from app.modules.barbers.service import BarberService

log = structlog.get_logger()

router = APIRouter(prefix="/barbers", tags=["barbers"])


@router.get(
    "/available",
    response_model=list[BarberPublicProfile],
    status_code=status.HTTP_200_OK,
)
async def list_available_barbers(
    city: str | None = Query(default=None, description="Filter by target city"),
    specialty: str | None = Query(default=None, description="Filter by specialty"),
) -> list[BarberPublicProfile]:
    """List barbers available for hire. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    rows = await service.list_available(city=city, specialty=specialty)
    return [_to_public_profile(row) for row in rows]


@router.get(
    "/{barber_id}/public",
    response_model=BarberPublicProfile,
    status_code=status.HTTP_200_OK,
)
async def get_barber_public_profile(barber_id: str) -> BarberPublicProfile:
    """Get the public profile of a barber. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    row = await service.get_public_profile(barber_id)
    return _to_public_profile(row)


@router.patch(
    "/{barber_id}/profile",
    response_model=BarberPublicProfile,
    status_code=status.HTTP_200_OK,
)
async def update_barber_profile(
    barber_id: str,
    body: BarberProfileUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberPublicProfile:
    """Update barber's own profile. Only the barber themselves can update."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    row = await service.update_profile(barber_id, body, requester_id=user_id)
    log.info("barber_profile_updated", barber_id=barber_id, user_id=user_id)
    return _to_public_profile(row)


@router.patch(
    "/{barber_id}/availability",
    response_model=BarberPublicProfile,
    status_code=status.HTTP_200_OK,
)
async def update_barber_availability(
    barber_id: str,
    body: BarberAvailabilityUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberPublicProfile:
    """Toggle the barber's availability for hire. Only the barber themselves can update."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    row = await service.toggle_availability(
        barber_id, body.is_available_for_hire, requester_id=user_id
    )
    log.info(
        "barber_availability_updated",
        barber_id=barber_id,
        is_available_for_hire=body.is_available_for_hire,
    )
    return _to_public_profile(row)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------


def _to_public_profile(row: dict) -> BarberPublicProfile:
    shop_data = row.get("shop")
    shop_info: ShopInfo | None = None
    if shop_data and isinstance(shop_data, dict):
        shop_info = ShopInfo(**shop_data)

    return BarberPublicProfile(
        id=row["id"],
        profile_id=row["profile_id"],
        specialty=row.get("specialty"),
        bio=row.get("bio"),
        avatar_url=row.get("avatar_url"),
        rating=row.get("rating"),
        total_reviews=row.get("total_reviews"),
        is_available_for_hire=row.get("is_available_for_hire", False),
        hire_type=row.get("hire_type"),
        target_city=row.get("target_city"),
        qr_code=row.get("qr_code"),
        shop=shop_info,
    )
