from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, status

from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.modules.invitations.schemas import (
    InvitationCreate,
    InvitationResponse,
    JoinRequestCreate,
    JoinRequestResponse,
    JoinRequestReview,
)
from app.modules.invitations.service import InvitationService

log = structlog.get_logger()

router = APIRouter(tags=["invitations"])


# ---------------------------------------------------------------------------
# Shop invitations
# ---------------------------------------------------------------------------


@router.post(
    "/shops/{shop_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invitation(
    shop_id: str,
    body: InvitationCreate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> InvitationResponse:
    """Owner invites a barber by email. Requires owner auth."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.create_invitation(shop_id, body, owner_id=user_id)
    log.info("invitation_created", shop_id=shop_id, invited_email=body.invited_email)
    return InvitationResponse(**row)


@router.get(
    "/shops/{shop_id}/invitations",
    response_model=list[InvitationResponse],
    status_code=status.HTTP_200_OK,
)
async def list_invitations(
    shop_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> list[InvitationResponse]:
    """List all invitations for a shop. Owner only."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    rows = await service.list_invitations(shop_id, owner_id=user_id)
    return [InvitationResponse(**row) for row in rows]


@router.delete(
    "/invitations/{invitation_id}",
    response_model=InvitationResponse,
    status_code=status.HTTP_200_OK,
)
async def cancel_invitation(
    invitation_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> InvitationResponse:
    """Cancel a pending invitation. Owner only."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.cancel_invitation(invitation_id, owner_id=user_id)
    log.info("invitation_cancelled", invitation_id=invitation_id)
    return InvitationResponse(**row)


@router.get(
    "/invitations/{token}",
    response_model=InvitationResponse,
    status_code=status.HTTP_200_OK,
)
async def get_invitation_by_token(token: str) -> InvitationResponse:
    """Get invitation details by token. Public endpoint — no auth required."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.get_by_token(token)
    return InvitationResponse(**row)


@router.post(
    "/invitations/{token}/accept",
    response_model=InvitationResponse,
    status_code=status.HTTP_200_OK,
)
async def accept_invitation(
    token: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> InvitationResponse:
    """Accept an invitation. The authenticated user becomes a barber in the shop."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.accept_invitation(token, user_id=user_id)
    log.info("invitation_accepted_endpoint", token=token, user_id=user_id)
    return InvitationResponse(**row)


@router.post(
    "/invitations/{token}/reject",
    response_model=InvitationResponse,
    status_code=status.HTTP_200_OK,
)
async def reject_invitation(
    token: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> InvitationResponse:
    """Reject an invitation."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.reject_invitation(token, user_id=user_id)
    log.info("invitation_rejected_endpoint", token=token, user_id=user_id)
    return InvitationResponse(**row)


# ---------------------------------------------------------------------------
# Join requests
# ---------------------------------------------------------------------------


@router.post(
    "/shops/{shop_id}/join-requests",
    response_model=JoinRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_join_request(
    shop_id: str,
    body: JoinRequestCreate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> JoinRequestResponse:
    """A barber requests to join a shop."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    row = await service.create_join_request(shop_id, body, requester_id=user_id)
    log.info("join_request_created", shop_id=shop_id, requester_id=user_id)
    return JoinRequestResponse(**row)


@router.get(
    "/shops/{shop_id}/join-requests",
    response_model=list[JoinRequestResponse],
    status_code=status.HTTP_200_OK,
)
async def list_join_requests(
    shop_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> list[JoinRequestResponse]:
    """List all join requests for a shop. Owner only."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    rows = await service.list_join_requests(shop_id, owner_id=user_id)
    return [JoinRequestResponse(**row) for row in rows]


@router.post(
    "/join-requests/{request_id}/approve",
    response_model=JoinRequestResponse,
    status_code=status.HTTP_200_OK,
)
async def approve_join_request(
    request_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> JoinRequestResponse:
    """Owner approves a join request. The requester becomes a barber in the shop."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    review = JoinRequestReview(action="approve")
    row = await service.review_join_request(request_id, review, owner_id=user_id)
    log.info("join_request_approved_endpoint", request_id=request_id)
    return JoinRequestResponse(**row)


@router.post(
    "/join-requests/{request_id}/reject",
    response_model=JoinRequestResponse,
    status_code=status.HTTP_200_OK,
)
async def reject_join_request(
    request_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> JoinRequestResponse:
    """Owner rejects a join request."""
    supabase = await get_supabase()
    service = InvitationService(supabase)
    review = JoinRequestReview(action="reject")
    row = await service.review_join_request(request_id, review, owner_id=user_id)
    log.info("join_request_rejected_endpoint", request_id=request_id)
    return JoinRequestResponse(**row)
