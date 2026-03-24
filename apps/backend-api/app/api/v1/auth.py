from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.database import get_supabase
from app.core.security import UserPayload, get_current_user
from app.modules.users.schemas import ProfileResponse, ProfileUpdate

log = structlog.get_logger()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: Annotated[UserPayload, Depends(get_current_user)],
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> ProfileResponse:
    """Return the authenticated user profile from the profiles table."""
    try:
        result = (
            await supabase.table("profiles")
            .select("*")
            .eq("id", str(current_user.id))
            .single()
            .execute()
        )
    except Exception as e:
        log.error("get_profile_failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return ProfileResponse(**result.data)


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: Annotated[UserPayload, Depends(get_current_user)],
    supabase: Annotated[AsyncClient, Depends(get_supabase)],
) -> ProfileResponse:
    """Update the authenticated user profile fields."""
    update_data = body.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided for update",
        )

    try:
        result = (
            await supabase.table("profiles")
            .update(update_data)
            .eq("id", str(current_user.id))
            .single()
            .execute()
        )
    except Exception as e:
        log.error("update_profile_failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return ProfileResponse(**result.data)
