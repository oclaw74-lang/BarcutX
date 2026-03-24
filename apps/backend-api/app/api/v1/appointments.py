from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_supabase
from app.core.security import get_auth_user_id
from app.modules.appointments.schemas import AppointmentCreate, AppointmentResponse
from app.modules.appointments.service import AppointmentService

log = structlog.get_logger()

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    body: AppointmentCreate,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> Any:
    """Create a new appointment. Requires authentication."""
    supabase = await get_supabase()
    svc = AppointmentService(supabase)
    row = await svc.create(body, client_id=user_id)
    log.info("appointment_created", appointment_id=row.get("id"), client_id=user_id)
    return AppointmentResponse(**row)


@router.get("", response_model=list[AppointmentResponse], status_code=status.HTTP_200_OK)
async def list_my_appointments(
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> Any:
    """List all appointments for the authenticated client."""
    supabase = await get_supabase()
    svc = AppointmentService(supabase)
    rows = await svc.list_mine(client_id=user_id)
    return [AppointmentResponse(**row) for row in rows]


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
)
async def get_appointment(
    appointment_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> Any:
    """Get a single appointment. Accessible by the client or shop staff."""
    supabase = await get_supabase()
    svc = AppointmentService(supabase)
    appt = await svc.get_or_404(appointment_id)
    if appt["client_id"] != user_id:
        is_staff = await svc.is_shop_staff(appt["shop_id"], user_id)
        if not is_staff:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
    return AppointmentResponse(**appt)


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
)
async def cancel_appointment(
    appointment_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> Any:
    """Cancel a pending appointment. Only the client can cancel their own appointment."""
    supabase = await get_supabase()
    svc = AppointmentService(supabase)
    row = await svc.cancel(appointment_id, requester_id=user_id)
    log.info("appointment_cancelled", appointment_id=appointment_id, requester_id=user_id)
    return AppointmentResponse(**row)


@router.post(
    "/{appointment_id}/confirm",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
)
async def confirm_appointment(
    appointment_id: str,
    user_id: Annotated[str, Depends(get_auth_user_id)],
) -> Any:
    """Confirm a pending appointment. Only shop owners or assigned barbers can confirm."""
    supabase = await get_supabase()
    svc = AppointmentService(supabase)
    row = await svc.confirm(appointment_id, requester_id=user_id)
    log.info("appointment_confirmed", appointment_id=appointment_id, requester_id=user_id)
    return AppointmentResponse(**row)
