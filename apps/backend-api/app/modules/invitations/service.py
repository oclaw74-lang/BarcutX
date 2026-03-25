import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.repository import BarberShopRepository
from app.modules.barbers.repository import BarberRepository
from app.modules.invitations.repository import InvitationRepository, JoinRequestRepository
from app.modules.invitations.schemas import InvitationCreate, JoinRequestCreate, JoinRequestReview

log = structlog.get_logger()

INVITATION_TTL_DAYS = 7


class InvitationService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = InvitationRepository(client)
        self._join_repo = JoinRequestRepository(client)
        self._shop_repo = BarberShopRepository(client)
        self._barber_repo = BarberRepository(client)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_shop_or_404(self, shop_id: str) -> dict[str, Any]:
        shop = await self._shop_repo.get_by_id(shop_id)
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber shop not found",
            )
        return shop

    def _assert_owner(self, shop: dict[str, Any], requester_id: str) -> None:
        if shop["owner_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the owner of this shop",
            )

    def _assert_invitation_valid(self, invitation: dict[str, Any]) -> None:
        expires_at = invitation.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_410_GONE,
                    detail="Invitation has expired",
                )
        if invitation.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Invitation is already {invitation.get('status')}",
            )

    # ------------------------------------------------------------------
    # Invitations
    # ------------------------------------------------------------------

    async def create_invitation(
        self, shop_id: str, data: InvitationCreate, owner_id: str
    ) -> dict[str, Any]:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, owner_id)

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=INVITATION_TTL_DAYS)

        payload = {
            "shop_id": shop_id,
            "invited_email": data.invited_email,
            "message": data.message,
            "token": token,
            "status": "pending",
            "expires_at": expires_at.isoformat(),
        }

        try:
            return await self._repo.create(payload)
        except Exception as exc:
            log.error("invitation_create_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create invitation",
            ) from exc

    async def list_invitations(
        self, shop_id: str, owner_id: str
    ) -> list[dict[str, Any]]:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, owner_id)
        return await self._repo.list_by_shop(shop_id)

    async def cancel_invitation(
        self, invitation_id: str, owner_id: str
    ) -> dict[str, Any]:
        invitation = await self._repo.get_by_id(invitation_id)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        shop = await self._get_shop_or_404(invitation["shop_id"])
        self._assert_owner(shop, owner_id)

        updated = await self._repo.update_status(invitation_id, "cancelled")
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not cancel invitation",
            )
        return updated

    async def get_by_token(self, token: str) -> dict[str, Any]:
        invitation = await self._repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        return invitation

    async def accept_invitation(
        self, token: str, user_id: str
    ) -> dict[str, Any]:
        invitation = await self._repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        self._assert_invitation_valid(invitation)

        updated = await self._repo.update_status(invitation["id"], "accepted")
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not accept invitation",
            )

        # Link barber to shop
        barber_payload = {
            "shop_id": invitation["shop_id"],
            "profile_id": user_id,
            "is_active": True,
        }
        try:
            await self._barber_repo.create(barber_payload)
        except Exception as exc:
            log.error("barber_link_failed_on_accept", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not link barber to shop",
            ) from exc

        log.info(
            "invitation_accepted",
            invitation_id=invitation["id"],
            shop_id=invitation["shop_id"],
            user_id=user_id,
        )
        return updated

    async def reject_invitation(self, token: str, user_id: str) -> dict[str, Any]:
        invitation = await self._repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        self._assert_invitation_valid(invitation)

        updated = await self._repo.update_status(invitation["id"], "rejected")
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not reject invitation",
            )
        log.info("invitation_rejected", invitation_id=invitation["id"], user_id=user_id)
        return updated

    # ------------------------------------------------------------------
    # Join Requests
    # ------------------------------------------------------------------

    async def create_join_request(
        self, shop_id: str, data: JoinRequestCreate, requester_id: str
    ) -> dict[str, Any]:
        await self._get_shop_or_404(shop_id)

        payload = {
            "shop_id": shop_id,
            "requester_id": requester_id,
            "message": data.message,
            "status": "pending",
        }
        try:
            return await self._join_repo.create(payload)
        except Exception as exc:
            log.error("join_request_create_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create join request",
            ) from exc

    async def list_join_requests(
        self, shop_id: str, owner_id: str
    ) -> list[dict[str, Any]]:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, owner_id)
        return await self._join_repo.list_by_shop(shop_id)

    async def review_join_request(
        self, request_id: str, review: JoinRequestReview, owner_id: str
    ) -> dict[str, Any]:
        join_request = await self._join_repo.get_by_id(request_id)
        if not join_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Join request not found",
            )
        shop = await self._get_shop_or_404(join_request["shop_id"])
        self._assert_owner(shop, owner_id)

        if join_request.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Join request is already {join_request.get('status')}",
            )

        new_status = "approved" if review.action == "approve" else "rejected"
        updated = await self._join_repo.update_status(request_id, new_status)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update join request",
            )

        if review.action == "approve":
            barber_payload = {
                "shop_id": join_request["shop_id"],
                "profile_id": join_request["requester_id"],
                "is_active": True,
            }
            try:
                await self._barber_repo.create(barber_payload)
            except Exception as exc:
                log.error("barber_link_failed_on_approve", error=str(exc))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not link barber to shop",
                ) from exc

            log.info(
                "join_request_approved",
                request_id=request_id,
                requester_id=join_request["requester_id"],
                shop_id=join_request["shop_id"],
            )

        return updated
