"""Check and award badges after XP events."""
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.models.response import Response
from app.models.grade import Grade
from app.models.xp_transaction import XPTransaction


async def check_and_award_badges(user_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    """Check all badge conditions and award any newly earned badges.
    Returns list of newly awarded badge dicts."""

    user = await db.get(User, user_id)
    if not user:
        return []

    # Get already-earned badge slugs
    result = await db.execute(
        select(Badge.slug)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
    )
    earned_slugs = {row[0] for row in result.all()}

    # Get all badges
    result = await db.execute(select(Badge))
    all_badges = {b.slug: b for b in result.scalars().all()}

    # Count completed scenarios
    scenario_count_result = await db.execute(
        select(func.count()).select_from(Response).where(
            Response.user_id == user_id, Response.is_complete == True  # noqa: E712
        )
    )
    scenario_count = scenario_count_result.scalar() or 0

    # Count MCQ responses
    mcq_count_result = await db.execute(
        select(func.count()).select_from(XPTransaction).where(
            XPTransaction.user_id == user_id, XPTransaction.source == "mcq"
        )
    )
    mcq_count = mcq_count_result.scalar() or 0

    # Check for perfect score on any scenario
    perfect_result = await db.execute(
        select(func.count()).select_from(Grade)
        .join(Response, Response.id == Grade.response_id)
        .where(Response.user_id == user_id, Grade.overall_score >= 5.0)
    )
    has_perfect = (perfect_result.scalar() or 0) > 0

    # Badge trigger conditions
    conditions: dict[str, bool] = {
        "first_steps": scenario_count >= 1,
        "rising_star": user.level >= 3,
        "veteran": user.level >= 7,
        "desk_head": user.level >= 10,
        "century_club": user.xp_total >= 100,
        "xp_thousandaire": user.xp_total >= 1000,
        "xp_legend": user.xp_total >= 3000,
        "on_fire": user.streak_days >= 7,
        "unstoppable": user.streak_days >= 30,
        "quick_draw": mcq_count >= 10,
        "perfectionist": has_perfect,
    }

    newly_awarded = []
    for slug, condition in conditions.items():
        if condition and slug not in earned_slugs and slug in all_badges:
            badge = all_badges[slug]
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))
            newly_awarded.append({
                "slug": badge.slug,
                "name": badge.name,
                "icon": badge.icon,
                "tier": badge.tier,
            })

    if newly_awarded:
        await db.flush()

    return newly_awarded
