from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PortfolioItemBase(BaseModel):
    photo_url: str
    caption: Optional[str] = None
    tags: List[str] = []


class PortfolioItemCreate(PortfolioItemBase):
    pass


class PortfolioItemUpdate(BaseModel):
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    display_order: Optional[int] = None


class PortfolioItemResponse(PortfolioItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    barber_id: UUID
    display_order: int


class PortfolioReorder(BaseModel):
    ordered_ids: List[UUID]  # IDs en el nuevo orden
