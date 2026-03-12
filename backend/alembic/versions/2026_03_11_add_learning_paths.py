"""add learning paths tables

Revision ID: a1b2c3d4e5f6
Revises: e4f5a6b7c8d9
Create Date: 2026-03-11
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "learning_paths",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon", sa.String(50), server_default="BookOpen", nullable=False),
        sa.Column("difficulty_level", sa.String(20), nullable=False),
        sa.Column("estimated_minutes", sa.Integer, nullable=False, server_default="60"),
        sa.Column("steps", JSONB, nullable=False),
        sa.Column("display_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "user_path_progress",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("path_id", UUID(as_uuid=True), sa.ForeignKey("learning_paths.id"), nullable=False),
        sa.Column("current_step", sa.Integer, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "path_id", name="uq_user_path"),
    )
    op.create_index("ix_user_path_progress_user_id", "user_path_progress", ["user_id"])
    op.create_index("ix_user_path_progress_path_id", "user_path_progress", ["path_id"])


def downgrade() -> None:
    op.drop_index("ix_user_path_progress_path_id")
    op.drop_index("ix_user_path_progress_user_id")
    op.drop_table("user_path_progress")
    op.drop_table("learning_paths")
