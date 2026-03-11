"""Scale existing user xp_total by 2.5x for new XP economy.

XP_BASE increased from 20 to 50 (2.5x), MCQ rewards scaled similarly.
This migration preserves relative user positions on the leaderboard.

Revision ID: a7b9d3f1c8e2
Revises: None
Create Date: 2026-03-11
"""

from alembic import op

revision = "a7b9d3f1c8e2"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET xp_total = CAST(xp_total * 2.5 AS INTEGER)")


def downgrade() -> None:
    op.execute("UPDATE users SET xp_total = CAST(xp_total / 2.5 AS INTEGER)")
