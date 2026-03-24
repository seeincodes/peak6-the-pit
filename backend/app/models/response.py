import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    scenario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("scenarios.id"))
    conversation: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)
    event_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=True)
