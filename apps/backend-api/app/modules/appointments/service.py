from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.appointments.repository import AppointmentRepository
from app.modules.appointments.schemas import AppointmentCreate, AppointmentStatus

log = structlog.get_logger()

BARBER_SHOPS_TABLE = "barber_shops"
BARBERS_TABLE = "barbers"


class AppointmentService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = AppointmentRepository(client)
        self._client = client

    async def create(self, data: AppointmentCreate, client_id: str) -> dict[str, Any]:
        duration = await self._repo.get_service_duration(str(data.service_id))
        if duration is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )
        payload: dict[str, Any] = {
            "shop_id": str(data.shop_id),
            "service_id": str(data.service_id),
            "client_id": client_id,
            "scheduled_at": data.scheduled_at.isoformat(),
            "duration_minutes": duration,
            "status": AppointmentStatus.pending.value,
        }
        if data.barber_id is not None:
            payload["barber_id"] = str(data.barber_id)
        if data.notes is not None:
            payload["notes"] = data.notes
        try:
            return await self._repo.create(payload)
        except Exception as exc:
            log.error("appointment_create_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create appointment",
            ) from exc

    async def list_mine(self, client_id: str) -> list[dict[str, Any]]:
        return await self._repo.list_by_client(client_id)

    async def get_or_404(self, appointment_id: str) -> dict[str, Any]:
        appt = await self._repo.get_by_id(appointment_id)
        if not appt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        return appt

    async def cancel(self, appointment_id: str, requester_id: str) -> dict[str, Any]:
        appt = await self.get_or_404(appointment_id)
        if appt["client_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the client of this appointment",
            )
        if appt["status"] != AppointmentStatus.pending.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending appointments can be cancelled",
            )
        result = await self._repo.update_status(
            appointment_id, AppointmentStatus.cancelled.value
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cancellation failed",
            )
        log.info("appointment_cancelled", appointment_id=appointment_id, by=requester_id)
        return result

    async def confirm(self, appointment_id: str, requester_id: str) -> dict[str, Any]:
        appt = await self.get_or_404(appointment_id)
        shop_id = appt["shop_id"]

        is_staff = await self.is_shop_staff(shop_id, requester_id)
        if not is_staff:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only shop staff can confirm appointments",
            )
        if appt["status"] != AppointmentStatus.pending.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending appointments can be confirmed",
            )
        result = await self._repo.update_status(
            appointment_id, AppointmentStatus.confirmed.value
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Confirmation failed",
            )
        log.info("appointment_confirmed", appointment_id=appointment_id, by=requester_id)
        return result

    async def is_shop_staff(self, shop_id: str, user_id: str) -> bool:
        """Return True if user is the shop owner or an assigned barber."""
        owner_result = (
            await self._client.table(BARBER_SHOPS_TABLE)
            .select("id")
            .eq("id", shop_id)
            .eq("owner_id", user_id)
            .execute()
        )
        if owner_result.data:
            return True

        barber_result = (
            await self._client.table(BARBERS_TABLE)
            .select("id")
            .eq("shop_id", shop_id)
            .eq("profile_id", user_id)
            .execute()
        )
        return bool(barber_result.data)
