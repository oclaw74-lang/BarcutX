from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, status

from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.modules.barber_shops.schemas import (
    BarberShopCreate,
    BarberShopResponse,
    BarberShopUpdate,
    GalleryAddRequest,
    ShopBrandingResponse,
    ShopBrandingUpdate,
    ShopGalleryResponse,
    ShopHoursResponse,
    ShopHoursUpdate,
    ShopPublicResponse,
)
from app.modules.barber_shops.service import BarberShopService
from app.modules.barbers.schemas import BarberCreate, BarberResponse
from app.modules.barbers.service import BarberService

log = structlog.get_logger()

router = APIRouter(prefix="/barber-shops", tags=["barber-shops"])


# ---------------------------------------------------------------------------
# Barber Shops — CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=list[BarberShopResponse], status_code=status.HTTP_200_OK)
async def list_barber_shops() -> list[BarberShopResponse]:
    """List all active barber shops. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    rows = await service.list_active()
    return [BarberShopResponse(**row) for row in rows]


@router.post("", response_model=BarberShopResponse, status_code=status.HTTP_201_CREATED)
async def create_barber_shop(
    body: BarberShopCreate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberShopResponse:
    """Create a new barber shop. Requires authentication."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.create(body, owner_id=user_id)
    log.info("barber_shop_created", shop_id=row.get("id"), owner_id=user_id)
    return BarberShopResponse(**row)


@router.get("/{shop_id}", response_model=BarberShopResponse, status_code=status.HTTP_200_OK)
async def get_barber_shop(shop_id: str) -> BarberShopResponse:
    """Get a single barber shop by ID. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.get_or_404(shop_id)
    return BarberShopResponse(**row)


@router.patch("/{shop_id}", response_model=BarberShopResponse, status_code=status.HTTP_200_OK)
async def update_barber_shop(
    shop_id: str,
    body: BarberShopUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberShopResponse:
    """Update a barber shop. Only the owner can update their shop."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.update(shop_id, body, requester_id=user_id)
    log.info("barber_shop_updated", shop_id=shop_id, requester_id=user_id)
    return BarberShopResponse(**row)


@router.delete("/{shop_id}", response_model=BarberShopResponse, status_code=status.HTTP_200_OK)
async def deactivate_barber_shop(
    shop_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberShopResponse:
    """Soft-delete (deactivate) a barber shop. Only the owner can deactivate."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.deactivate(shop_id, requester_id=user_id)
    log.info("barber_shop_deactivated", shop_id=shop_id, requester_id=user_id)
    return BarberShopResponse(**row)


# ---------------------------------------------------------------------------
# Barber Shops — Branding
# ---------------------------------------------------------------------------


@router.patch(
    "/{shop_id}/branding",
    response_model=ShopBrandingResponse,
    status_code=status.HTTP_200_OK,
)
async def update_shop_branding(
    shop_id: str,
    body: ShopBrandingUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> ShopBrandingResponse:
    """Update shop branding (slug, accent color, tagline, social links). Owner only."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.update_branding(shop_id, body, requester_id=user_id)
    log.info("shop_branding_updated", shop_id=shop_id, requester_id=user_id)
    return ShopBrandingResponse(**row)


# ---------------------------------------------------------------------------
# Barber Shops — Hours
# ---------------------------------------------------------------------------


@router.patch(
    "/{shop_id}/hours",
    response_model=ShopHoursResponse,
    status_code=status.HTTP_200_OK,
)
async def update_shop_hours(
    shop_id: str,
    body: ShopHoursUpdate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> ShopHoursResponse:
    """Update shop business hours per day. Owner only."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    result = await service.update_hours(shop_id, body, requester_id=user_id)
    log.info("shop_hours_updated", shop_id=shop_id, requester_id=user_id)
    return ShopHoursResponse(**result)


# ---------------------------------------------------------------------------
# Barber Shops — Gallery
# ---------------------------------------------------------------------------


@router.post(
    "/{shop_id}/gallery",
    response_model=ShopGalleryResponse,
    status_code=status.HTTP_200_OK,
)
async def add_gallery_photo(
    shop_id: str,
    body: GalleryAddRequest,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> ShopGalleryResponse:
    """Add a photo URL to the shop gallery. Owner only. Maximum 10 photos."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    result = await service.add_gallery_photo(shop_id, body.url, requester_id=user_id)
    log.info("gallery_photo_added", shop_id=shop_id, requester_id=user_id)
    return ShopGalleryResponse(**result)


@router.delete(
    "/{shop_id}/gallery/{index}",
    response_model=ShopGalleryResponse,
    status_code=status.HTTP_200_OK,
)
async def remove_gallery_photo(
    shop_id: str,
    index: int,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> ShopGalleryResponse:
    """Remove a photo from the shop gallery by its index. Owner only."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    result = await service.remove_gallery_photo(shop_id, index, requester_id=user_id)
    log.info("gallery_photo_removed", shop_id=shop_id, index=index, requester_id=user_id)
    return ShopGalleryResponse(**result)


# ---------------------------------------------------------------------------
# Barber Shops — Public profile
# ---------------------------------------------------------------------------


@router.get(
    "/{shop_id}/public",
    response_model=ShopPublicResponse,
    status_code=status.HTTP_200_OK,
)
async def get_shop_public(shop_id: str) -> ShopPublicResponse:
    """Get the full public profile of a shop, including branding and gallery."""
    supabase = await get_supabase()
    service = BarberShopService(supabase)
    row = await service.get_public(shop_id)
    return ShopPublicResponse(**row)


# ---------------------------------------------------------------------------
# Barbers (nested under barber shops)
# ---------------------------------------------------------------------------


@router.get(
    "/{shop_id}/barbers",
    response_model=list[BarberResponse],
    status_code=status.HTTP_200_OK,
)
async def list_barbers(shop_id: str) -> list[BarberResponse]:
    """List all barbers in a shop. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    rows = await service.list_by_shop(shop_id)
    return [BarberResponse(**row) for row in rows]


@router.post(
    "/{shop_id}/barbers",
    response_model=BarberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_barber(
    shop_id: str,
    body: BarberCreate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> BarberResponse:
    """Add a barber to a shop. Only the shop owner can perform this action."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    row = await service.add_barber(shop_id, body, requester_id=user_id)
    log.info("barber_added", shop_id=shop_id, barber_profile_id=str(body.profile_id))
    return BarberResponse(**row)


@router.delete(
    "/{shop_id}/barbers/{barber_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_barber(
    shop_id: str,
    barber_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> None:
    """Remove a barber from a shop. Only the shop owner can perform this action."""
    supabase = await get_supabase()
    service = BarberService(supabase)
    await service.remove_barber(shop_id, barber_id, requester_id=user_id)
    log.info("barber_removed", shop_id=shop_id, barber_id=barber_id)
