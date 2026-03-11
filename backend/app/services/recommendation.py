"""Spaced repetition recommendation engine.

Analyzes grade history to surface weak categories and dimensions,
weighting recent attempts higher and low scores higher.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grade import Grade
from app.models.response import Response
from app.models.scenario import Scenario
from app.constants import RUBRIC_DIMENSIONS


async def get_recommendations(
    db: AsyncSession,
    user_id,
    unlocked_categories: list[dict],
    limit: int = 3,
) -> list[dict]:
    """Return up to `limit` recommended categories with difficulty and reason.

    Algorithm:
    1. Fetch all graded attempts for the user in the last 90 days.
    2. Compute a weighted weakness score per (category, difficulty):
       - Recency weight: more recent attempts count more (exponential decay).
       - Inversion: lower scores contribute more to weakness.
    3. Categories with no attempts get a moderate priority boost ("unexplored").
    4. Return the top-N weakest (category, difficulty) pairs the user has unlocked.
    """
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=90)

    stmt = (
        select(
            Scenario.category,
            Scenario.difficulty,
            Grade.overall_score,
            Grade.dimension_scores,
            Grade.graded_at,
        )
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == user_id)
        .where(Grade.graded_at >= cutoff)
        .order_by(Grade.graded_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    # Build unlocked set for fast lookup
    unlocked_set = {(c["category"], c["difficulty"]) for c in unlocked_categories}

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    scores: dict[tuple[str, str], list[tuple[float, float]]] = {}

    for row in rows:
        key = (row.category, row.difficulty)
        if key not in unlocked_set:
            continue
        days_ago = max((now - row.graded_at).total_seconds() / 86400, 0.1)
        recency_weight = 1.0 / (1.0 + days_ago / 7.0)  # half-weight at ~7 days
        weakness = 5.0 - float(row.overall_score)  # invert: low score = high weakness
        scores.setdefault(key, []).append((weakness * recency_weight, recency_weight))

    # Compute weighted weakness per category+difficulty
    weakness_scores: dict[tuple[str, str], float] = {}
    for key, entries in scores.items():
        total_weight = sum(w for _, w in entries)
        if total_weight > 0:
            weighted_weakness = sum(s for s, _ in entries) / total_weight
        else:
            weighted_weakness = 0
        weakness_scores[key] = weighted_weakness

    # Find weakest dimension per category for the reason text
    dim_weakness: dict[tuple[str, str], str] = {}
    for row in rows:
        key = (row.category, row.difficulty)
        if key not in unlocked_set:
            continue
        if key in dim_weakness:
            continue  # use most recent attempt's dimensions
        if isinstance(row.dimension_scores, dict):
            worst_dim = None
            worst_val = 6.0
            for dim in RUBRIC_DIMENSIONS:
                val = row.dimension_scores.get(dim)
                if val is not None and float(val) < worst_val:
                    worst_val = float(val)
                    worst_dim = dim
            if worst_dim:
                dim_weakness[key] = worst_dim

    # Add unexplored categories with a moderate weakness score
    attempted_keys = set(scores.keys())
    for cat in unlocked_categories:
        key = (cat["category"], cat["difficulty"])
        if key not in attempted_keys:
            weakness_scores[key] = 2.5  # moderate priority for unexplored

    # Sort by weakness descending, take top N
    ranked = sorted(weakness_scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for (category, difficulty), score in ranked[:limit]:
        if (category, difficulty) in attempted_keys:
            weak_dim = dim_weakness.get((category, difficulty))
            reason = f"Weak in {weak_dim.replace('_', ' ')}" if weak_dim else "Low recent scores"
        else:
            reason = "Not yet attempted"
        results.append({
            "category": category,
            "difficulty": difficulty,
            "weakness_score": round(score, 2),
            "reason": reason,
        })

    return results
