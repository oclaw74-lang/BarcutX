from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    environment: str = "development"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Database (optional — Supabase cloud is the primary DB)
    database_url: Optional[str] = None  # asyncpg: postgresql+asyncpg://user:pass@host/db

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_platform_fee_percent: int = 7

    # Google Maps
    google_maps_api_key: str = ""


settings = Settings()  # type: ignore[call-arg]
