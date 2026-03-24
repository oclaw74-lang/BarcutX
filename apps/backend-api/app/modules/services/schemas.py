from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(..., ge=Decimal("0"), decimal_places=2)
    duration_minutes: int = Field(..., gt=0)


class ServiceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(None, ge=Decimal("0"), decimal_places=2)
    duration_minutes: int | None = Field(None, gt=0)
    is_active: bool | None = None


class ServiceResponse(BaseModel):
    id: UUID
    shop_id: UUID
    name: str
    description: str | None
    price: Decimal
    duration_minutes: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
