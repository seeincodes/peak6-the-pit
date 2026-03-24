"""Mastery calculation service with weighted scoring and decay."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def compute_mastery_level(scores: list[float]) -> float:
    """Compute mastery 0-100 from raw scores (0-5 scale) with recency bias."""
    if not scores:
        return 0.0
    from app.constants import MASTERY_SCENARIO_COUNT, MASTERY_RECENCY_WEIGHT
    recent = scores[-MASTERY_SCENARIO_COUNT:]
    n = len(recent)
    weights = []
    for i in range(n):
        w = 1.0 + (MASTERY_RECENCY_WEIGHT - 1.0) * (i / max(n - 1, 1))
        weights.append(w)
    weighted_sum = sum(s * w for s, w in zip(recent, weights))
    weight_total = sum(weights)
    avg = weighted_sum / weight_total
    return avg * 20.0  # Normalize 0-5 → 0-100


def apply_decay(mastery: float, peak: float, weeks_inactive: int) -> float:
    """Apply time-based mastery decay down to a floor of peak * MASTERY_DECAY_FLOOR_PCT."""
    from app.constants import MASTERY_DECAY_RATE, MASTERY_DECAY_FLOOR_PCT
    if weeks_inactive <= 0:
        return mastery
    floor = peak * MASTERY_DECAY_FLOOR_PCT
    decayed = mastery * ((1.0 - MASTERY_DECAY_RATE) ** weeks_inactive)
    return max(decayed, floor)


async def recalculate_mastery(
    db: AsyncSession, user_id, category: str
):
    """Query recent grades for a category and upsert the UserSkillMastery record.

    Returns the updated UserSkillMastery instance.
    """
    from app.models.response import Response
    from app.models.grade import Grade
    from app.models.scenario import Scenario
    from app.models.skill_node import UserSkillMastery
    from app.constants import MASTERY_SCENARIO_COUNT

    rows = (await db.execute(
        select(Grade.overall_score, Grade.graded_at)
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(
            Response.user_id == user_id,
            Response.is_complete == True,  # noqa: E712
            Scenario.category == category,
        )
        .order_by(Grade.graded_at.asc())
        .limit(MASTERY_SCENARIO_COUNT * 4)  # fetch enough history for calculation
    )).all()

    scores = [float(r.overall_score) for r in rows]
    last_attempt_at = rows[-1].graded_at if rows else None

    mastery_level = compute_mastery_level(scores)

    # Upsert
    existing = (await db.execute(
        select(UserSkillMastery).where(
            UserSkillMastery.user_id == user_id,
            UserSkillMastery.category == category,
        )
    )).scalar_one_or_none()

    if existing is None:
        record = UserSkillMastery(
            user_id=user_id,
            category=category,
            mastery_level=mastery_level,
            peak_mastery=mastery_level,
            scenarios_completed=len(scores),
            avg_score=sum(scores) / len(scores) if scores else 0.0,
            last_attempt_at=last_attempt_at,
        )
        db.add(record)
    else:
        existing.mastery_level = mastery_level
        if mastery_level > existing.peak_mastery:
            existing.peak_mastery = mastery_level
        existing.scenarios_completed = len(scores)
        existing.avg_score = sum(scores) / len(scores) if scores else 0.0
        existing.last_attempt_at = last_attempt_at
        record = existing

    await db.flush()
    return record


async def get_user_mastery(db: AsyncSession, user_id) -> list:
    """Return all UserSkillMastery records for a user."""
    from app.models.skill_node import UserSkillMastery

    rows = (await db.execute(
        select(UserSkillMastery).where(UserSkillMastery.user_id == user_id)
    )).scalars().all()
    return list(rows)


async def get_skill_tree(db: AsyncSession, org_id) -> list:
    """Return skill nodes with org override precedence.

    Org-specific nodes take priority; default nodes fill in categories
    not overridden by the org. Hidden nodes are excluded.
    """
    from app.models.skill_node import SkillNode

    # Fetch org-specific nodes
    org_nodes = (await db.execute(
        select(SkillNode).where(
            SkillNode.org_id == org_id,
            SkillNode.is_hidden == False,  # noqa: E712
        )
    )).scalars().all()

    org_categories = {n.category for n in org_nodes}

    # Fetch default nodes for categories not already covered by org
    default_nodes = (await db.execute(
        select(SkillNode).where(
            SkillNode.org_id == None,  # noqa: E711
            SkillNode.is_hidden == False,  # noqa: E712
            ~SkillNode.category.in_(org_categories) if org_categories else True,
        )
    )).scalars().all()

    return list(org_nodes) + list(default_nodes)
