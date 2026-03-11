"""Add cohort to users and peer_reviews table.

Revision ID: e4f5a6b7c8d9
Revises: 7a2758e0abf9
Create Date: 2026-03-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, None] = "7a2758e0abf9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add cohort to users
    op.add_column("users", sa.Column("cohort", sa.String(50), nullable=True))
    op.create_index("ix_users_cohort", "users", ["cohort"])

    # Create peer_reviews table
    op.create_table(
        "peer_reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("reviewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("response_id", UUID(as_uuid=True), sa.ForeignKey("responses.id"), nullable=False),
        sa.Column("dimension_scores", JSONB, nullable=False),
        sa.Column("feedback", sa.Text, nullable=False),
        sa.Column("quality_score", sa.Numeric(3, 2), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("reviewer_id", "response_id", name="uq_reviewer_response"),
    )
    op.create_index("ix_peer_reviews_reviewer_id", "peer_reviews", ["reviewer_id"])
    op.create_index("ix_peer_reviews_response_id", "peer_reviews", ["response_id"])


def downgrade() -> None:
    op.drop_index("ix_peer_reviews_response_id")
    op.drop_index("ix_peer_reviews_reviewer_id")
    op.drop_table("peer_reviews")
    op.drop_index("ix_users_cohort")
    op.drop_column("users", "cohort")
