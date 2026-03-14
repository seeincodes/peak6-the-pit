"""Daily challenge generation and tracking."""
import random
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import DailyChallenge
from app.models.xp_transaction import XPTransaction
from app.models.user import User
from app.services.progression import compute_level_from_xp

CHALLENGE_TEMPLATES = [
    {"type": "complete_scenarios", "desc": "Complete {n} Deep Analysis scenarios", "targets": [2, 3, 5], "xp": [50, 75, 125]},
    {"type": "complete_mcq", "desc": "Answer {n} Quick Fire questions", "targets": [5, 10, 15], "xp": [40, 65, 100]},
    {"type": "score_high", "desc": "Score 4.0+ on {n} scenario(s)", "targets": [1, 2, 3], "xp": [65, 100, 150]},
    {"type": "try_category", "desc": "Try a scenario in a new category", "targets": [1], "xp": [50]},
    {"type": "streak_keep", "desc": "Maintain your streak today", "targets": [1], "xp": [40]},
]

CHALLENGES_PER_DAY = 3


async def get_or_create_daily_challenges(
    user_id: UUID, db: AsyncSession
) -> list[dict]:
    """Get today's challenges for a user, creating them if they don't exist."""
    today = date.today()

    stmt = select(DailyChallenge).where(
        DailyChallenge.user_id == user_id,
        DailyChallenge.challenge_date == today,
    )
    existing = (await db.execute(stmt)).scalars().all()

    if existing:
        return [_to_dict(c) for c in existing]

    # Generate new challenges for today
    rng = random.Random(f"{user_id}-{today.isoformat()}")
    templates = rng.sample(CHALLENGE_TEMPLATES, min(CHALLENGES_PER_DAY, len(CHALLENGE_TEMPLATES)))

    challenges = []
    for tmpl in templates:
        idx = rng.randrange(len(tmpl["targets"]))
        target = tmpl["targets"][idx]
        xp = tmpl["xp"][idx]
        desc = tmpl["desc"].format(n=target)

        c = DailyChallenge(
            user_id=user_id,
            challenge_type=tmpl["type"],
            description=desc,
            target=target,
            bonus_xp=xp,
            challenge_date=today,
        )
        db.add(c)
        challenges.append(c)

    await db.commit()
    return [_to_dict(c) for c in challenges]


async def increment_challenge_progress(
    user_id: UUID, challenge_type: str, db: AsyncSession, amount: int = 1
) -> list[dict]:
    """Increment progress on matching challenges. Returns newly completed challenges.

    Auto-creates today's challenges if they haven't been generated yet,
    so progress isn't lost when a user acts before viewing the challenges page.
    """
    today = date.today()

    # Ensure today's challenges exist
    exists_stmt = select(DailyChallenge.id).where(
        DailyChallenge.user_id == user_id,
        DailyChallenge.challenge_date == today,
    ).limit(1)
    if (await db.execute(exists_stmt)).first() is None:
        await get_or_create_daily_challenges(user_id, db)

    stmt = select(DailyChallenge).where(
        DailyChallenge.user_id == user_id,
        DailyChallenge.challenge_date == today,
        DailyChallenge.challenge_type == challenge_type,
        DailyChallenge.completed == False,  # noqa: E712
    )
    challenges = (await db.execute(stmt)).scalars().all()

    newly_completed = []
    for c in challenges:
        c.progress = min(c.progress + amount, c.target)
        if c.progress >= c.target:
            c.completed = True
            # Award bonus XP
            user = await db.get(User, user_id)
            if user:
                xp_tx = XPTransaction(
                    user_id=user_id,
                    amount=c.bonus_xp,
                    source="challenge",
                    reference_id=c.id,
                )
                db.add(xp_tx)
                user.xp_total += c.bonus_xp
                user.level = compute_level_from_xp(user.xp_total)
            newly_completed.append(_to_dict(c))

    await db.commit()
    return newly_completed


def _to_dict(c: DailyChallenge) -> dict:
    return {
        "id": str(c.id),
        "type": c.challenge_type,
        "description": c.description,
        "target": c.target,
        "progress": c.progress,
        "bonus_xp": c.bonus_xp,
        "completed": c.completed,
    }
