"""Daily streak tracking — update last_active_at and streak_days on scored activity."""
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

MILESTONES = {3, 7, 14, 21, 30, 50, 100}


async def update_streak(user: User, db: AsyncSession) -> dict:
    """Call after any scored activity (scenario grade, MCQ submit, peer review).

    Returns dict with old_streak, new_streak, and milestone (if any).
    Does NOT commit — caller manages the transaction.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    old_streak = user.streak_days
    last_active = user.last_active_at

    if last_active is None:
        # First ever activity
        user.streak_days = 1
    elif last_active >= today:
        # Already active today — no change
        pass
    elif last_active >= yesterday:
        # Active yesterday — increment streak
        user.streak_days += 1
    else:
        # Missed a day (or more) — reset to 1
        user.streak_days = 1

    user.last_active_at = now

    new_streak = user.streak_days
    milestone = None
    if new_streak in MILESTONES and new_streak != old_streak:
        milestone = new_streak

    return {
        "old_streak": old_streak,
        "new_streak": new_streak,
        "milestone": milestone,
    }
