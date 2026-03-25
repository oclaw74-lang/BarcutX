import re
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator

_SLUG_RE = re.compile(r"^[a-z0-9-]{3,50}$")
_HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
_TIME_RE = re.compile(r"^\d{2}:\d{2}$")

DAYS_OF_WEEK = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


# ---------------------------------------------------------------------------
# Base / CRUD schemas
# ---------------------------------------------------------------------------


class BarberShopCreate(BaseModel):
    name: str
    description: str | None = None
    address: str
    city: str
    phone: str | None = None
    email: str | None = None


class BarberShopUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    is_active: bool | None = None


class BarberShopResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    description: str | None
    address: str
    city: str
    phone: str | None
    email: str | None
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Branding schemas
# ---------------------------------------------------------------------------


class ShopBrandingUpdate(BaseModel):
    slug: str | None = None
    accent_color: str | None = None
    tagline: str | None = None
    instagram_url: str | None = None
    whatsapp: str | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str | None) -> str | None:
        if v is not None and not _SLUG_RE.match(v):
            raise ValueError(
                "slug must match ^[a-z0-9-]{3,50}$ (lowercase letters, digits, hyphens only)"
            )
        return v

    @field_validator("accent_color")
    @classmethod
    def validate_accent_color(cls, v: str | None) -> str | None:
        if v is not None and not _HEX_COLOR_RE.match(v):
            raise ValueError("accent_color must be a valid hex color in the format #RRGGBB")
        return v


class ShopBrandingResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    slug: str | None
    accent_color: str | None
    tagline: str | None
    instagram_url: str | None
    whatsapp: str | None
    logo_url: str | None
    cover_url: str | None
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Hours schemas
# ---------------------------------------------------------------------------


class DayHours(BaseModel):
    open: str
    close: str
    is_open: bool = True

    @field_validator("open", "close")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        if not _TIME_RE.match(v):
            raise ValueError("Time must be in HH:MM format")
        return v

    @model_validator(mode="after")
    def validate_open_before_close(self) -> "DayHours":
        if self.is_open and self.open >= self.close:
            raise ValueError("open time must be before close time")
        return self


class ShopHoursUpdate(BaseModel):
    monday: DayHours | None = None
    tuesday: DayHours | None = None
    wednesday: DayHours | None = None
    thursday: DayHours | None = None
    friday: DayHours | None = None
    saturday: DayHours | None = None
    sunday: DayHours | None = None

    def to_day_index_map(self) -> dict[int, DayHours]:
        """Return a dict mapping day-of-week index (0=Monday) to DayHours."""
        mapping: dict[int, DayHours] = {}
        for idx, day in enumerate(DAYS_OF_WEEK):
            value = getattr(self, day)
            if value is not None:
                mapping[idx] = value
        return mapping


class ShopHoursResponse(BaseModel):
    shop_id: UUID
    hours: dict[str, Any]


# ---------------------------------------------------------------------------
# Gallery schemas
# ---------------------------------------------------------------------------


class GalleryAddRequest(BaseModel):
    url: str


class ShopGalleryResponse(BaseModel):
    shop_id: UUID
    gallery_urls: list[str]


# ---------------------------------------------------------------------------
# Public profile schema
# ---------------------------------------------------------------------------


class ShopPublicResponse(BaseModel):
    id: UUID
    name: str
    slug: str | None
    description: str | None
    address: str
    city: str
    phone: str | None
    email: str | None
    accent_color: str | None
    tagline: str | None
    instagram_url: str | None
    whatsapp: str | None
    logo_url: str | None
    cover_url: str | None
    gallery_urls: list[str]
    is_active: bool
    created_at: datetime
