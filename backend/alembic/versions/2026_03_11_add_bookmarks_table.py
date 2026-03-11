"""add bookmarks table

Revision ID: f8a1b2c3d4e5
Revises: cd03d012ae68
Create Date: 2026-03-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "f8a1b2c3d4e5"
down_revision: Union[str, None] = "cd03d012ae68"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookmarks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scenario_id", UUID(as_uuid=True), sa.ForeignKey("scenarios.id"), nullable=False),
        sa.Column("tag", sa.String(20), server_default="reference", nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "scenario_id", name="uq_user_scenario_bookmark"),
    )
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_bookmarks_user_id")
    op.drop_table("bookmarks")
