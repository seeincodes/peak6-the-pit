"""Add org slug, invite-only signup, and org invites.

Revision ID: m3n4o5p6q7r8
Revises: h7i8j9k0l1m2
Create Date: 2026-03-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "m3n4o5p6q7r8"
down_revision = "h7i8j9k0l1m2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("slug", sa.String(length=80), nullable=True))
    op.add_column(
        "organizations",
        sa.Column("invite_only_signup", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.execute(
        sa.text(
            "UPDATE organizations SET slug = 'peak6' WHERE id = '00000000-0000-0000-0000-000000000099'"
        )
    )
    op.execute(
        sa.text("UPDATE organizations SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL")
    )

    op.alter_column("organizations", "slug", existing_type=sa.String(length=80), nullable=False)
    op.create_unique_constraint("uq_organizations_slug", "organizations", ["slug"])

    try:
        op.drop_constraint("users_email_key", "users", type_="unique")
    except Exception:
        # Constraint may already be absent in some environments.
        pass
    op.create_unique_constraint("uq_users_org_email", "users", ["org_id", "email"])

    op.create_table(
        "org_invites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="ta"),
        sa.Column("token", sa.String(length=128), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("created_by_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('ta', 'intern', 'experienced', 'educator', 'admin')"),
    )


def downgrade() -> None:
    op.drop_table("org_invites")
    op.drop_constraint("uq_users_org_email", "users", type_="unique")
    op.create_unique_constraint("users_email_key", "users", ["email"])
    op.drop_constraint("uq_organizations_slug", "organizations", type_="unique")
    op.drop_column("organizations", "invite_only_signup")
    op.drop_column("organizations", "slug")
