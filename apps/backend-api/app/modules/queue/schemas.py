from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class JoinQueueRequest(BaseModel):
    client_name: str = Field(..., min_length=1, max_length=120)
    service_id: UUID | None = None
    barber_id: UUID | None = None


class QueueEntryResponse(BaseModel):
    id: str
    shop_id: str
    client_name: str
    status: str
    position: int
    joined_at: str
    barber_id: str | None = None
    service_id: str | None = None


class QueueResponse(BaseModel):
    shop_id: str
    entries: list[QueueEntryResponse]
    total_waiting: int


# ---------------------------------------------------------------------------
# Anonymous QR queue schemas (issue #51)
# ---------------------------------------------------------------------------


class AnonymousQueueJoin(BaseModel):
    client_name: str = Field(..., min_length=1, max_length=100)
    service_id: Optional[UUID] = None
    service_name: Optional[str] = None  # free-text when not from catalog
    client_phone: Optional[str] = None


class AnonymousQueueEntry(BaseModel):
    entry_id: UUID
    position: int
    estimated_wait_minutes: int
    barber_name: str
    shop_name: str
    session_token: str  # used to track status without an account
    view_url: str       # barcutx.com/q/{barber_code}/{entry_id}


class PublicQueueStatus(BaseModel):
    barber_code: str
    barber_name: str
    shop_name: str
    is_available: bool
    queue_length: int
    estimated_wait_minutes: int
    current_client: Optional[str] = None  # first name only, no sensitive data
    services: List[dict]                  # barber's service catalog
