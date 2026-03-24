from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class AppointmentStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"


class AppointmentCreate(BaseModel):
    shop_id: UUID
    barber_id: UUID | None = None
    service_id: UUID
    scheduled_at: datetime
    notes: str | None = Field(default=None, max_length=1000)


class AppointmentResponse(BaseModel):
    id: UUID
    shop_id: UUID
    barber_id: UUID | None
    client_id: UUID
    service_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    notes: str | None
    created_at: datetime
