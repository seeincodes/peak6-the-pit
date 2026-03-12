"""add activity events and study groups

Revision ID: d3e4f5a6b7c8
Revises: c7d8e9f0a1b2
Create Date: 2026-03-12
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = "d3e4f5a6b7c8"
down_revision: Union[str, None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Activity events
    op.create_table(
        "activity_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("payload", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_activity_events_user_id", "activity_events", ["user_id"])
    op.create_index("ix_activity_events_created_at", "activity_events", ["created_at"])

    # Study groups
    op.create_table(
        "study_groups",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("path_id", UUID(as_uuid=True), sa.ForeignKey("learning_paths.id"), nullable=False),
        sa.Column("invite_code", sa.String(8), unique=True, nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("max_members", sa.Integer, server_default="5"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_study_groups_path_id", "study_groups", ["path_id"])

    # Study group members
    op.create_table(
        "study_group_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("group_id", UUID(as_uuid=True), sa.ForeignKey("study_groups.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("joined_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )
    op.create_index("ix_study_group_members_group_id", "study_group_members", ["group_id"])
    op.create_index("ix_study_group_members_user_id", "study_group_members", ["user_id"])


def downgrade() -> None:
    op.drop_table("study_group_members")
    op.drop_table("study_groups")
    op.drop_table("activity_events")
