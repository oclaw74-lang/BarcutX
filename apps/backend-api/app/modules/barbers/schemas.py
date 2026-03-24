from datetime import datetime
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
