"""Add scenario_bank, mcq_bank, model_answer_bank tables

Revision ID: a1b2c3d4e5f6
Revises: f5a6b7c8d9e0
Create Date: 2026-03-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "g6h7i8j9k0l1"
down_revision = "f5a6b7c8d9e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scenario_bank",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False),
        sa.Column("content", JSONB, nullable=False),
        sa.Column("times_served", sa.Integer, server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_scenario_bank_cat_diff", "scenario_bank", ["category", "difficulty"])

    op.create_table(
        "mcq_bank",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False),
        sa.Column("content", JSONB, nullable=False),
        sa.Column("learning_objective", sa.String(500), nullable=True),
        sa.Column("times_served", sa.Integer, server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_mcq_bank_cat_diff", "mcq_bank", ["category", "difficulty"])

    op.create_table(
        "model_answer_bank",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("scenario_id", UUID(as_uuid=True), sa.ForeignKey("scenarios.id"), nullable=False, unique=True),
        sa.Column("answer_text", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_model_answer_bank_scenario_id", "model_answer_bank", ["scenario_id"])


def downgrade() -> None:
    op.drop_table("model_answer_bank")
    op.drop_table("mcq_bank")
    op.drop_table("scenario_bank")
