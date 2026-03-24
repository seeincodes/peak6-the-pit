import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class MarketEvent(Base):
    __tablename__ = "market_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scenario_pool: Mapped[dict] = mapped_column(JSONB, nullable=False)
    scoring_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    max_scenarios_per_user: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'active', 'completed')", name="ck_market_event_status"),
    )


class EventParticipation(Base):
    __tablename__ = "event_participations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_identifier: Mapped[str | None] = mapped_column(String(100), nullable=True)
    individual_score: Mapped[float] = mapped_column(Float, default=0.0)
    scenarios_completed: Mapped[int] = mapped_column(Integer, default=0)
    best_dimension_scores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_participation_event_user"),
    )


class EventTeamScore(Base):
    __tablename__ = "event_team_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=False)
    team_identifier: Mapped[str] = mapped_column(String(100), nullable=False)
    aggregate_score: Mapped[float] = mapped_column(Float, default=0.0)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
