import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PortfolioItem(Base):
    __tablename__ = "barber_portfolio"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    barber_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags: Mapped[list] = mapped_column(ARRAY(String), nullable=False, default=list)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
