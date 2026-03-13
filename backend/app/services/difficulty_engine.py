"""Adaptive difficulty engine.

Analyzes the last N attempts per (category, difficulty) to suggest
promotions or demotions, and computes the effective starting difficulty
for each category.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grade import Grade
from app.models.response import Response
from app.models.scenario import Scenario

WINDOW_SIZE = 5
PROMOTE_THRESHOLD = 4.0
PROMOTE_STREAK = 3
DEMOTE_THRESHOLD = 2.0
DEMOTE_STREAK = 3

DIFF_ORDER = ["beginner", "intermediate", "advanced"]


def _fetch_recent_scores_stmt(user_id):
    """Shared query: recent grades per category+difficulty for a user."""
    return (
        select(
            Scenario.category,
            Scenario.difficulty,
            Grade.overall_score,
            Grade.graded_at,
        )
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == user_id)
        .order_by(Grade.graded_at.desc())
    )


def _group_recent(rows) -> dict[tuple[str, str], list[float]]:
    """Group score rows by (category, difficulty), keeping last WINDOW_SIZE."""
    recent: dict[tuple[str, str], list[float]] = {}
    for row in rows:
        key = (row.category, row.difficulty)
        if key not in recent:
            recent[key] = []
        if len(recent[key]) < WINDOW_SIZE:
            recent[key].append(float(row.overall_score))
    return recent


def _has_promote_streak(scores: list[float]) -> bool:
    """Check if the most recent scores meet promotion criteria."""
    if len(scores) < PROMOTE_STREAK:
        return False
    consecutive = 0
    for s in scores:
        if s >= PROMOTE_THRESHOLD:
            consecutive += 1
        else:
            break
    return consecutive >= PROMOTE_STREAK


def _has_demote_streak(scores: list[float]) -> bool:
    """Check if the most recent scores meet demotion criteria."""
    if len(scores) < DEMOTE_STREAK:
        return False
    consecutive = 0
    for s in scores:
        if s <= DEMOTE_THRESHOLD:
            consecutive += 1
        else:
            break
    return consecutive >= DEMOTE_STREAK


async def get_effective_difficulties(
    db: AsyncSession,
    user_id,
    unlocked_categories: list[dict],
) -> dict[str, str]:
    """Compute the effective difficulty per category.

    Logic: every category starts at "beginner". If the user has a promote
    streak at a given difficulty AND the next level is unlocked, the
    effective difficulty moves up. If the user has a demote streak at
    their current level, it moves back down.

    Returns { category_slug: effective_difficulty }.
    """
    unlocked_set = {(c["category"], c["difficulty"]) for c in unlocked_categories}

    cat_diffs: dict[str, list[str]] = {}
    for c in unlocked_categories:
        cat_diffs.setdefault(c["category"], []).append(c["difficulty"])

    rows = (await db.execute(_fetch_recent_scores_stmt(user_id))).all()
    recent = _group_recent(rows)

    result: dict[str, str] = {}
    for category, diffs in cat_diffs.items():
        sorted_diffs = sorted(diffs, key=lambda d: DIFF_ORDER.index(d) if d in DIFF_ORDER else 99)
        effective = sorted_diffs[0]  # always start at lowest unlocked (beginner)

        # Walk up: if they've earned promotion at this level, move to next
        for diff in sorted_diffs:
            scores = recent.get((category, diff), [])
            if diff == effective and _has_promote_streak(scores):
                idx = DIFF_ORDER.index(diff) if diff in DIFF_ORDER else -1
                if idx < len(DIFF_ORDER) - 1:
                    next_diff = DIFF_ORDER[idx + 1]
                    if (category, next_diff) in unlocked_set:
                        effective = next_diff

        # Check demotion at the effective level
        eff_scores = recent.get((category, effective), [])
        if _has_demote_streak(eff_scores):
            idx = DIFF_ORDER.index(effective) if effective in DIFF_ORDER else 0
            if idx > 0:
                effective = DIFF_ORDER[idx - 1]

        result[category] = effective

    return result


async def get_difficulty_suggestions(
    db: AsyncSession,
    user_id,
    unlocked_categories: list[dict],
) -> list[dict]:
    """Return a list of difficulty change suggestions.

    Each suggestion has:
      - category, current_difficulty, suggested_difficulty
      - direction: "promote" | "demote"
      - reason: human-readable explanation
    """
    unlocked_set = {(c["category"], c["difficulty"]) for c in unlocked_categories}

    rows = (await db.execute(_fetch_recent_scores_stmt(user_id))).all()
    recent = _group_recent(rows)

    suggestions = []

    for (category, difficulty), scores in recent.items():
        if len(scores) < PROMOTE_STREAK:
            continue

        diff_idx = DIFF_ORDER.index(difficulty) if difficulty in DIFF_ORDER else -1

        consecutive_high = 0
        for s in scores:
            if s >= PROMOTE_THRESHOLD:
                consecutive_high += 1
            else:
                break

        if consecutive_high >= PROMOTE_STREAK and diff_idx < len(DIFF_ORDER) - 1:
            next_diff = DIFF_ORDER[diff_idx + 1]
            if (category, next_diff) in unlocked_set:
                suggestions.append({
                    "category": category,
                    "current_difficulty": difficulty,
                    "suggested_difficulty": next_diff,
                    "direction": "promote",
                    "reason": f"{consecutive_high} consecutive scores above {PROMOTE_THRESHOLD}",
                })
            continue

        consecutive_low = 0
        for s in scores:
            if s <= DEMOTE_THRESHOLD:
                consecutive_low += 1
            else:
                break

        if consecutive_low >= DEMOTE_STREAK and diff_idx > 0:
            prev_diff = DIFF_ORDER[diff_idx - 1]
            suggestions.append({
                "category": category,
                "current_difficulty": difficulty,
                "suggested_difficulty": prev_diff,
                "direction": "demote",
                "reason": f"{consecutive_low} consecutive scores below {DEMOTE_THRESHOLD}",
            })

    return suggestions
