"""Mastery-gated progression system.

Categories unlock when BOTH conditions are met:
  1. The user's XP-derived level is high enough
  2. The parent category (from CATEGORY_PREREQUISITES) has been mastered
     (avg score >= MASTERY_THRESHOLD over last MASTERY_SCENARIO_COUNT attempts)
"""
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    CATEGORY_PREREQUISITES,
    LEVEL_UNLOCKS,
    MASTERY_THRESHOLD,
    MASTERY_SCENARIO_COUNT,
    LEVEL_TITLES,
    XP_THRESHOLDS,
    CategoryTier,
)


def get_unlocked_categories(level: int) -> set[CategoryTier]:
    """Return all category/difficulty pairs unlocked at a given level (ignoring mastery)."""
    unlocked: set[CategoryTier] = set()
    for lvl in range(1, level + 1):
        for ct in LEVEL_UNLOCKS.get(lvl, []):
            unlocked.add(ct)
    return unlocked


def check_mastery(scores: list[float]) -> bool:
    """Check if a list of scores meets mastery requirements."""
    if len(scores) < MASTERY_SCENARIO_COUNT:
        return False
    recent = scores[-MASTERY_SCENARIO_COUNT:]
    return (sum(recent) / len(recent)) >= MASTERY_THRESHOLD


async def get_mastered_categories(db: AsyncSession, user_id) -> set[str]:
    """Return the set of category slugs the user has mastered.

    A category is mastered when the user's last MASTERY_SCENARIO_COUNT
    graded attempts average >= MASTERY_THRESHOLD.
    """
    from app.models.response import Response
    from app.models.grade import Grade
    from app.models.scenario import Scenario

    rows = (await db.execute(
        select(Scenario.category, Grade.overall_score)
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == user_id, Response.is_complete == True)  # noqa: E712
        .order_by(Grade.graded_at.asc())
    )).all()

    scores_by_cat: dict[str, list[float]] = defaultdict(list)
    for category, score in rows:
        scores_by_cat[category].append(float(score))

    mastered: set[str] = set()
    for cat, scores in scores_by_cat.items():
        if check_mastery(scores):
            mastered.add(cat)
    return mastered


def _prerequisites_met(category: str, mastered: set[str]) -> bool:
    """Walk the prerequisite chain — all ancestors must be mastered."""
    parent = CATEGORY_PREREQUISITES.get(category)
    while parent:
        if parent not in mastered:
            return False
        parent = CATEGORY_PREREQUISITES.get(parent)
    return True


async def get_mastery_gated_unlocks(
    db: AsyncSession, user_id, level: int
) -> set[CategoryTier]:
    """Return categories unlocked at `level` AND whose prerequisite chain is mastered.

    Foundation categories (no prerequisites) are always available at the right level.
    """
    all_at_level = get_unlocked_categories(level)
    mastered = await get_mastered_categories(db, user_id)

    gated: set[CategoryTier] = set()
    for ct in all_at_level:
        if _prerequisites_met(ct.category, mastered):
            gated.add(ct)
    return gated


def compute_level(masteries: set[tuple[str, str]]) -> int:
    """Compute the highest level achieved given a set of mastered category/difficulty pairs."""
    level = 1
    for lvl in range(2, 11):
        required = LEVEL_UNLOCKS.get(lvl, [])
        if not required:
            continue
        prev_unlocks = set()
        for prev_lvl in range(1, lvl):
            for ct in LEVEL_UNLOCKS.get(prev_lvl, []):
                prev_unlocks.add((ct.category, ct.difficulty))
        if prev_unlocks.issubset(masteries):
            level = lvl
        else:
            break
    return level


def compute_level_from_xp(xp_total: int) -> int:
    """Derive level from cumulative XP using XP_THRESHOLDS."""
    level = 1
    for lvl in range(2, len(XP_THRESHOLDS)):
        if xp_total >= XP_THRESHOLDS[lvl]:
            level = lvl
        else:
            break
    return level


def get_level_title(level: int) -> str:
    return LEVEL_TITLES.get(level, f"Level {level}")
