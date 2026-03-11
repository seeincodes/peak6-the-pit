"""add daily challenges table

Revision ID: a1b2c3d4e5f6
Revises: f8a1b2c3d4e5
Create Date: 2026-03-11 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f8a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "daily_challenges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("challenge_type", sa.String(50), nullable=False),
        sa.Column("description", sa.String(200), nullable=False),
        sa.Column("target", sa.Integer, nullable=False),
        sa.Column("progress", sa.Integer, server_default="0", nullable=False),
        sa.Column("bonus_xp", sa.Integer, server_default="25", nullable=False),
        sa.Column("challenge_date", sa.Date, nullable=False),
        sa.Column("completed", sa.Boolean, server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_daily_challenges_user_date", "daily_challenges", ["user_id", "challenge_date"])


def downgrade() -> None:
    op.drop_index("ix_daily_challenges_user_date")
    op.drop_table("daily_challenges")
