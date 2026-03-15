"""Add org_id to users table

Revision ID: h7i8j9k0l1m2
Revises: g6h7i8j9k0l1
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "h7i8j9k0l1m2"
down_revision = "g6h7i8j9k0l1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the organizations table first
    op.create_table(
        "organizations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    
    # Add org_id column to users table
    op.add_column("users", sa.Column("org_id", UUID(as_uuid=True), nullable=False))
    
    # Add foreign key constraint
    op.create_foreign_key("fk_users_org_id", "users", "organizations", ["org_id"], ["id"])


def downgrade() -> None:
    # Remove foreign key constraint
    op.drop_constraint("fk_users_org_id", "users", type_="foreignkey")
    
    # Remove org_id column
    op.drop_column("users", "org_id")
    
    # Drop organizations table
    op.drop_table("organizations")
