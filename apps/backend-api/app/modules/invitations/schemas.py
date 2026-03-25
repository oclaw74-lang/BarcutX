from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------------
# Invitations
# ---------------------------------------------------------------------------


class InvitationCreate(BaseModel):
    invited_email: EmailStr
    message: str | None = None


class InvitationResponse(BaseModel):
    id: UUID
    shop_id: UUID
    invited_email: str
    status: str
    expires_at: datetime
    token: str
    message: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Join Requests
# ---------------------------------------------------------------------------


class JoinRequestCreate(BaseModel):
    message: str | None = None


class JoinRequestResponse(BaseModel):
    id: UUID
    shop_id: UUID
    requester_id: UUID
    status: str
    message: str | None
    created_at: datetime
    updated_at: datetime


class JoinRequestReview(BaseModel):
    action: Literal["approve", "reject"]
    message: str | None = None
