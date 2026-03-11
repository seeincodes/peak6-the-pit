import uuid
from datetime import datetime

from sqlalchemy import Text, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class PeerReview(Base):
    __tablename__ = "peer_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    response_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("responses.id"), nullable=False)
    dimension_scores: Mapped[dict] = mapped_column(JSONB, nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    quality_score: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        UniqueConstraint("reviewer_id", "response_id", name="uq_reviewer_response"),
    )
