"""Adaptive difficulty engine.

Analyzes the last N attempts per (category, difficulty) to suggest
promotions or demotions.
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
    # Build set of unlocked (category, difficulty) for fast lookup
    unlocked_set = {(c["category"], c["difficulty"]) for c in unlocked_categories}

    # Group unlocked by category -> list of difficulties
    cat_diffs: dict[str, list[str]] = {}
    for c in unlocked_categories:
        cat_diffs.setdefault(c["category"], []).append(c["difficulty"])

    # Fetch recent grades per category+difficulty
    stmt = (
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
    rows = (await db.execute(stmt)).all()

    # Group scores by (category, difficulty), keeping only last WINDOW_SIZE
    recent: dict[tuple[str, str], list[float]] = {}
    for row in rows:
        key = (row.category, row.difficulty)
        if key not in recent:
            recent[key] = []
        if len(recent[key]) < WINDOW_SIZE:
            recent[key].append(float(row.overall_score))

    suggestions = []

    for (category, difficulty), scores in recent.items():
        if len(scores) < PROMOTE_STREAK:
            continue  # not enough data

        diff_idx = DIFF_ORDER.index(difficulty) if difficulty in DIFF_ORDER else -1

        # Check for promotion
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
            continue  # don't also suggest demote for same category

        # Check for demotion
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
