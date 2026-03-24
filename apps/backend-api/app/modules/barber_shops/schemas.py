from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
