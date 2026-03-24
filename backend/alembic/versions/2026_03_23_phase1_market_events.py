"""phase1 market events

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # ── market_events ──────────────────────────────────────────────────────────
    op.create_table(
        "market_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("theme", sa.String(100), nullable=False),
        sa.Column("start_at", sa.DateTime, nullable=False),
        sa.Column("end_at", sa.DateTime, nullable=False),
        sa.Column("scenario_pool", JSONB, nullable=False),
        sa.Column("scoring_config", JSONB, nullable=False),
        sa.Column("max_scenarios_per_user", sa.Integer, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.CheckConstraint("status IN ('draft', 'active', 'completed')", name="ck_market_event_status"),
    )

    # ── event_participations ───────────────────────────────────────────────────
    op.create_table(
        "event_participations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("market_events.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("team_identifier", sa.String(100), nullable=True),
        sa.Column("individual_score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("scenarios_completed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("best_dimension_scores", JSONB, nullable=True),
        sa.Column("joined_at", sa.DateTime, nullable=False),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_participation_event_user"),
    )

    # ── event_team_scores ──────────────────────────────────────────────────────
    op.create_table(
        "event_team_scores",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("market_events.id"), nullable=False),
        sa.Column("team_identifier", sa.String(100), nullable=False),
        sa.Column("aggregate_score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("member_count", sa.Integer, nullable=False, server_default="0"),
    )

    # ── event_id on user_badges ────────────────────────────────────────────────
    op.add_column(
        "user_badges",
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("market_events.id"), nullable=True),
    )

    # Drop old unique constraint on user_badges (user_id, badge_id)
    op.drop_constraint("user_badges_user_id_badge_id_key", "user_badges", type_="unique")

    # Partial unique indexes replacing the old constraint
    op.execute(
        "CREATE UNIQUE INDEX uq_user_badge_event ON user_badges (user_id, badge_id, event_id) WHERE event_id IS NOT NULL"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_user_badge_permanent ON user_badges (user_id, badge_id) WHERE event_id IS NULL"
    )

    # ── event_id on responses ──────────────────────────────────────────────────
    op.add_column(
        "responses",
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("market_events.id"), nullable=True),
    )


def downgrade():
    # responses
    op.drop_column("responses", "event_id")

    # user_badges partial indexes
    op.execute("DROP INDEX IF EXISTS uq_user_badge_event")
    op.execute("DROP INDEX IF EXISTS uq_user_badge_permanent")

    # Restore old unique constraint
    op.create_unique_constraint("user_badges_user_id_badge_id_key", "user_badges", ["user_id", "badge_id"])

    op.drop_column("user_badges", "event_id")

    op.drop_table("event_team_scores")
    op.drop_table("event_participations")
    op.drop_table("market_events")
