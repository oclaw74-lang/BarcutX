from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    photo_url: Optional[str] = None
    category: str = "other"

    @field_validator("price")
    @classmethod
    def price_must_be_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("price must be >= 0")
        return v


class ProductCreate(ProductBase):
    barber_id: Optional[UUID] = None  # None = producto del shop


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    photo_url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("price")
    @classmethod
    def price_must_be_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("price must be >= 0")
        return v


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    shop_id: UUID
    barber_id: Optional[UUID] = None
    is_active: bool
