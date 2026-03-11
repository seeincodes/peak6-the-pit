"""merge_heads

Revision ID: 7a2758e0abf9
Revises: b2c3d4e5f6a7, f3a8c1d2e4b5, a7b9d3f1c8e2
Create Date: 2026-03-11 20:59:59.217365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a2758e0abf9'
down_revision: Union[str, None] = ('b2c3d4e5f6a7', 'f3a8c1d2e4b5', 'a7b9d3f1c8e2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
