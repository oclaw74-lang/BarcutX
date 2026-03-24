from typing import Annotated
from uuid import UUID

import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

log = structlog.get_logger()

bearer_scheme = HTTPBearer()


class UserPayload(BaseModel):
    id: UUID
    email: str
    role: str


def verify_jwt(token: str) -> dict:
    """Validate a Supabase-issued JWT and return its payload."""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as e:
        log.warning("jwt_validation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


decode_supabase_jwt = verify_jwt


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> UserPayload:
    """FastAPI dependency that extracts and validates the authenticated user from JWT."""
    payload = verify_jwt(credentials.credentials)

    user_id: str | None = payload.get("sub")
    email: str | None = payload.get("email")

    if not user_id or not email:
        log.warning("jwt_missing_claims", sub=user_id, email=email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app_metadata: dict = payload.get("app_metadata", {})
    role: str = app_metadata.get("role", "client")

    return UserPayload(id=UUID(user_id), email=email, role=role)


def require_role(*roles: str):
    """FastAPI dependency factory that raises 403 if the user role is not in roles."""

    async def _check_role(
        current_user: Annotated[UserPayload, Depends(get_current_user)],
    ) -> UserPayload:
        if current_user.role not in roles:
            log.warning(
                "authorization_denied",
                user_id=str(current_user.id),
                user_role=current_user.role,
                required_roles=roles,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized for this resource",
            )
        return current_user

    return _check_role


async def get_auth_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> str:
    """Legacy dependency that returns the authenticated user ID as a string."""
    payload = verify_jwt(credentials.credentials)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
