import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Boolean, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    avatar_id: Mapped[str] = mapped_column(String(50), default="default")
    bio: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ta_phase: Mapped[int | None] = mapped_column(Integer, nullable=True)
    xp_total: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    cohort: Mapped[str | None] = mapped_column(String(50), nullable=True)
    has_onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        CheckConstraint("role IN ('ta', 'intern', 'experienced', 'educator', 'admin')"),
        CheckConstraint("ta_phase IS NULL OR (ta_phase >= 1 AND ta_phase <= 4)"),
        CheckConstraint("xp_total >= 0", name="ck_users_xp_non_negative"),
        CheckConstraint("level >= 1", name="ck_users_level_positive"),
    )
