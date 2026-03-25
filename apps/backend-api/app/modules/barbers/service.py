import io
from typing import Any

import structlog
from fastapi import HTTPException, status
from supabase import AsyncClient

from app.modules.barber_shops.repository import BarberShopRepository
from app.modules.barbers.repository import BarberRepository
from app.modules.barbers.schemas import BarberCreate, BarberProfileUpdate

log = structlog.get_logger()

try:
    import qrcode
    import qrcode.image.svg

    _QR_AVAILABLE = True
except ImportError:  # pragma: no cover
    _QR_AVAILABLE = False


class BarberService:
    def __init__(self, client: AsyncClient) -> None:
        self._repo = BarberRepository(client)
        self._shop_repo = BarberShopRepository(client)

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

    def _generate_qr_code(self, barber_id: str) -> str | None:
        """Generate a QR code SVG string for the barber public profile URL."""
        if not _QR_AVAILABLE:
            log.warning("qrcode_library_not_installed", barber_id=barber_id)
            return None
        url = f"https://barcutx.app/barbers/{barber_id}/public"
        factory = qrcode.image.svg.SvgImage
        img = qrcode.make(url, image_factory=factory)
        buffer = io.BytesIO()
        img.save(buffer)
        return buffer.getvalue().decode("utf-8")

    async def list_by_shop(self, shop_id: str) -> list[dict[str, Any]]:
        await self._get_shop_or_404(shop_id)
        return await self._repo.list_by_shop(shop_id)

    async def add_barber(
        self, shop_id: str, data: BarberCreate, requester_id: str
    ) -> dict[str, Any]:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, requester_id)
        payload = data.model_dump(exclude_none=True)
        payload["shop_id"] = shop_id
        payload["profile_id"] = str(data.profile_id)
        try:
            return await self._repo.create(payload)
        except Exception as exc:
            log.error("barber_add_failed", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not add barber",
            ) from exc

    async def remove_barber(
        self, shop_id: str, barber_id: str, requester_id: str
    ) -> None:
        shop = await self._get_shop_or_404(shop_id)
        self._assert_owner(shop, requester_id)
        barber = await self._repo.get_by_id(barber_id)
        if not barber or barber["shop_id"] != shop_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found in this shop",
            )
        await self._repo.delete(barber_id)

    # ------------------------------------------------------------------
    # Extended profile methods (issue #37)
    # ------------------------------------------------------------------

    async def get_public_profile(self, barber_id: str) -> dict[str, Any]:
        barber = await self._repo.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        # Generate and persist QR code if missing
        if not barber.get("qr_code"):
            qr_svg = self._generate_qr_code(barber_id)
            if qr_svg:
                updated = await self._repo.update(barber_id, {"qr_code": qr_svg})
                if updated:
                    barber = updated

        # Attach shop info if barber belongs to a shop
        shop_info = None
        shop_id = barber.get("shop_id")
        if shop_id:
            shop = await self._shop_repo.get_by_id(shop_id)
            if shop:
                shop_info = {
                    "id": shop["id"],
                    "name": shop["name"],
                    "city": shop["city"],
                }

        barber["shop"] = shop_info
        return barber

    async def update_profile(
        self, barber_id: str, data: BarberProfileUpdate, requester_id: str
    ) -> dict[str, Any]:
        barber = await self._repo.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )
        if barber["profile_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile",
            )

        payload = data.model_dump(exclude_none=True)
        if not payload:
            return barber

        updated = await self._repo.update(barber_id, payload)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update barber profile",
            )
        return updated

    async def toggle_availability(
        self, barber_id: str, is_available: bool, requester_id: str
    ) -> dict[str, Any]:
        barber = await self._repo.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )
        if barber["profile_id"] != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own availability",
            )

        updated = await self._repo.update(
            barber_id, {"is_available_for_hire": is_available}
        )
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update availability",
            )
        log.info(
            "barber_availability_toggled",
            barber_id=barber_id,
            is_available_for_hire=is_available,
        )
        return updated

    async def list_available(
        self,
        city: str | None = None,
        specialty: str | None = None,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_available(city=city, specialty=specialty)
