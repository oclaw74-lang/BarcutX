from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class BarberCreate(BaseModel):
    profile_id: UUID
    bio: str | None = None


class BarberResponse(BaseModel):
    id: UUID
    shop_id: UUID
    profile_id: UUID
    bio: str | None
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Extended profile schemas (issue #37)
# ---------------------------------------------------------------------------


class BarberProfileUpdate(BaseModel):
    specialty: str | None = None
    bio: str | None = None
    is_available_for_hire: bool | None = None
    hire_type: Literal["full_time", "part_time", "freelance"] | None = None
    target_city: str | None = None
    avatar_url: str | None = None


class BarberAvailabilityUpdate(BaseModel):
    is_available_for_hire: bool


class ShopInfo(BaseModel):
    id: UUID
    name: str
    city: str


class BarberPublicProfile(BaseModel):
    id: UUID
    profile_id: UUID
    specialty: str | None
    bio: str | None
    avatar_url: str | None
    rating: float | None
    total_reviews: int | None
    is_available_for_hire: bool
    hire_type: str | None
    target_city: str | None
    qr_code: str | None
    shop: ShopInfo | None
