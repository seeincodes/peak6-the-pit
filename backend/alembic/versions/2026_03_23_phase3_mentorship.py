"""phase3 mentorship tables

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade():
    # ── organizations: add mentorship_config ───────────────────────────────────
    op.add_column(
        "organizations",
        sa.Column("mentorship_config", JSONB, nullable=True),
    )

    # ── mentorships ────────────────────────────────────────────────────────────
    op.create_table(
        "mentorships",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("mentor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("mentee_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("started_at", sa.DateTime, nullable=False),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.CheckConstraint(
            "status IN ('active', 'completed', 'cancelled', 'declined', 'pending')",
            name="ck_mentorships_status",
        ),
    )
    op.create_index("ix_mentorships_org_id", "mentorships", ["org_id"])
    op.create_index("ix_mentorships_mentor_id", "mentorships", ["mentor_id"])
    op.create_index("ix_mentorships_mentee_id", "mentorships", ["mentee_id"])

    # Partial unique index: only one active mentorship per mentor-mentee pair
    op.execute(
        "CREATE UNIQUE INDEX uq_active_mentorship ON mentorships (mentor_id, mentee_id) WHERE status = 'active';"
    )

    # ── mentorship_goals ───────────────────────────────────────────────────────
    op.create_table(
        "mentorship_goals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("mentorship_id", UUID(as_uuid=True), sa.ForeignKey("mentorships.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("target_mastery", sa.Float, nullable=False),
        sa.Column("current_mastery", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("achieved_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_mentorship_goals_mentorship_id", "mentorship_goals", ["mentorship_id"])


def downgrade():
    op.drop_index("ix_mentorship_goals_mentorship_id", table_name="mentorship_goals")
    op.drop_table("mentorship_goals")

    op.execute("DROP INDEX IF EXISTS uq_active_mentorship;")
    op.drop_index("ix_mentorships_mentee_id", table_name="mentorships")
    op.drop_index("ix_mentorships_mentor_id", table_name="mentorships")
    op.drop_index("ix_mentorships_org_id", table_name="mentorships")
    op.drop_table("mentorships")

    op.drop_column("organizations", "mentorship_config")
