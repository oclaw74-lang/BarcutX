# Re-export geo schemas from the barber_shops module for convenience
from app.modules.barber_shops.schemas import (  # noqa: F401
    ShopLocationUpdate,
    ShopNearbyQuery,
    ShopNearbyResult,
)
