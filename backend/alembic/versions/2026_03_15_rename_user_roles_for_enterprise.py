"""Rename user roles to enterprise taxonomy.

Revision ID: q8r9s0t1u2v3
Revises: m3n4o5p6q7r8
Create Date: 2026-03-15
"""

from alembic import op
import sqlalchemy as sa


revision = "q8r9s0t1u2v3"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def _drop_role_checks(table_name: str) -> None:
    op.execute(
        sa.text(
            f"""
            DO $$
            DECLARE r RECORD;
            BEGIN
              FOR r IN
                SELECT conname
                FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE t.relname = '{table_name}'
                  AND c.contype = 'c'
                  AND pg_get_constraintdef(c.oid) ILIKE '%role IN%'
              LOOP
                EXECUTE format('ALTER TABLE {table_name} DROP CONSTRAINT %I', r.conname);
              END LOOP;
            END $$;
            """
        )
    )


def upgrade() -> None:
    op.execute(sa.text("UPDATE users SET role = 'analyst' WHERE role = 'ta'"))
    op.execute(sa.text("UPDATE users SET role = 'associate' WHERE role = 'experienced'"))
    op.execute(sa.text("UPDATE users SET role = 'trainer' WHERE role = 'educator'"))
    op.execute(sa.text("UPDATE users SET role = 'org_admin' WHERE role = 'admin'"))

    op.execute(sa.text("UPDATE org_invites SET role = 'analyst' WHERE role = 'ta'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'associate' WHERE role = 'experienced'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'trainer' WHERE role = 'educator'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'org_admin' WHERE role = 'admin'"))

    _drop_role_checks("users")
    _drop_role_checks("org_invites")

    op.create_check_constraint(
        "ck_users_role_enterprise",
        "users",
        "role IN ('intern', 'analyst', 'associate', 'trainer', 'org_admin')",
    )
    op.create_check_constraint(
        "ck_org_invites_role_enterprise",
        "org_invites",
        "role IN ('intern', 'analyst', 'associate', 'trainer', 'org_admin')",
    )

    op.alter_column(
        "org_invites",
        "role",
        existing_type=sa.String(length=20),
        server_default=sa.text("'analyst'"),
    )


def downgrade() -> None:
    op.execute(sa.text("UPDATE users SET role = 'ta' WHERE role = 'analyst'"))
    op.execute(sa.text("UPDATE users SET role = 'experienced' WHERE role = 'associate'"))
    op.execute(sa.text("UPDATE users SET role = 'educator' WHERE role = 'trainer'"))
    op.execute(sa.text("UPDATE users SET role = 'admin' WHERE role = 'org_admin'"))

    op.execute(sa.text("UPDATE org_invites SET role = 'ta' WHERE role = 'analyst'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'experienced' WHERE role = 'associate'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'educator' WHERE role = 'trainer'"))
    op.execute(sa.text("UPDATE org_invites SET role = 'admin' WHERE role = 'org_admin'"))

    op.drop_constraint("ck_users_role_enterprise", "users", type_="check")
    op.drop_constraint("ck_org_invites_role_enterprise", "org_invites", type_="check")

    op.create_check_constraint(
        "ck_users_role_legacy",
        "users",
        "role IN ('ta', 'intern', 'experienced', 'educator', 'admin')",
    )
    op.create_check_constraint(
        "ck_org_invites_role_legacy",
        "org_invites",
        "role IN ('ta', 'intern', 'experienced', 'educator', 'admin')",
    )
    op.alter_column(
        "org_invites",
        "role",
        existing_type=sa.String(length=20),
        server_default=sa.text("'ta'"),
    )
