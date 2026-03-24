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
