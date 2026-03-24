"""phase0 prerequisites: notifications, peer_review extensions

Revision ID: phase0_20260323
Revises: q8r9s0t1u2v3
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "phase0_20260323"
down_revision = "q8r9s0t1u2v3"
branch_labels = None
depends_on = None


def upgrade():
    # Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("read_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "read_at"])

    # Extend peer_reviews table
    op.add_column(
        "peer_reviews",
        sa.Column("review_type", sa.String(20), nullable=False, server_default="peer"),
    )
    op.add_column(
        "peer_reviews",
        sa.Column("requested_reviewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )


def downgrade():
    op.drop_column("peer_reviews", "requested_reviewer_id")
    op.drop_column("peer_reviews", "review_type")
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")
