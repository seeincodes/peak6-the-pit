"""Add check constraints for xp_total >= 0 and level >= 1.

Revision ID: f3a8c1d2e4b5
Revises: None
Create Date: 2026-03-11
"""

from alembic import op

revision = "f3a8c1d2e4b5"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint("ck_users_xp_non_negative", "users", "xp_total >= 0")
    op.create_check_constraint("ck_users_level_positive", "users", "level >= 1")


def downgrade() -> None:
    op.drop_constraint("ck_users_level_positive", "users", type_="check")
    op.drop_constraint("ck_users_xp_non_negative", "users", type_="check")
