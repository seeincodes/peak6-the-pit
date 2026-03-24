"""phase2 skill tree tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    # ── skill_nodes ────────────────────────────────────────────────────────────
    op.create_table(
        "skill_nodes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        # null org_id = default node visible to all orgs
        sa.Column("org_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon", sa.String(50), nullable=False, server_default="circle"),
        sa.Column("prerequisites", JSONB, nullable=False, server_default="[]"),
        sa.Column("position_x", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("position_y", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("tier", sa.Integer, nullable=False),
        sa.Column("is_hidden", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_skill_nodes_org_category", "skill_nodes", ["org_id", "category"])

    # ── user_skill_mastery ──────────────────────────────────────────────────────
    op.create_table(
        "user_skill_mastery",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("mastery_level", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("peak_mastery", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("scenarios_completed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("avg_score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("last_attempt_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "category", name="uq_user_skill_mastery_user_category"),
    )
    op.create_index("ix_user_skill_mastery_user_id", "user_skill_mastery", ["user_id"])


def downgrade():
    op.drop_index("ix_user_skill_mastery_user_id", table_name="user_skill_mastery")
    op.drop_table("user_skill_mastery")
    op.drop_index("ix_skill_nodes_org_category", table_name="skill_nodes")
    op.drop_table("skill_nodes")
