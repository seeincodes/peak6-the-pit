"""Seed badges into the database (idempotent)."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge
from app.services.badge_seed import BADGE_CATALOG


async def seed_badges(db: AsyncSession) -> int:
    """Insert any missing badges. Returns count of newly inserted badges."""
    result = await db.execute(select(Badge.slug))
    existing = {row[0] for row in result.all()}

    new_badges = []
    for b in BADGE_CATALOG:
        if b["slug"] not in existing:
            new_badges.append(Badge(**b))

    if new_badges:
        db.add_all(new_badges)
        await db.commit()

    return len(new_badges)
