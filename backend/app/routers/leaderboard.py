from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.xp_transaction import XPTransaction
from app.services.progression import get_level_title
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


def _start_of_week() -> datetime:
    """Return Monday 00:00 UTC of the current week."""
    now = datetime.now(timezone.utc)
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("")
async def get_leaderboard(
    period: str = Query("all_time", pattern=r"^(all_time|weekly)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if period == "all_time":
        result = await db.execute(
            select(User).order_by(User.xp_total.desc())
        )
        users = result.scalars().all()

        entries = []
        for rank, user in enumerate(users, 1):
            entries.append({
                "rank": rank,
                "user_id": str(user.id),
                "display_name": user.display_name,
                "xp": user.xp_total,
                "level": user.level,
                "level_title": get_level_title(user.level),
                "streak_days": user.streak_days,
                "is_current_user": user.id == current_user.id,
            })

        return {"period": "all_time", "entries": entries}

    else:  # weekly
        week_start = _start_of_week()

        result = await db.execute(
            select(
                XPTransaction.user_id,
                func.sum(XPTransaction.amount).label("weekly_xp"),
            )
            .where(XPTransaction.created_at >= week_start)
            .group_by(XPTransaction.user_id)
            .order_by(func.sum(XPTransaction.amount).desc())
        )
        weekly_rows = result.all()

        entries = []
        for rank, row in enumerate(weekly_rows, 1):
            user = await db.get(User, row.user_id)
            entries.append({
                "rank": rank,
                "user_id": str(row.user_id),
                "display_name": user.display_name,
                "xp": row.weekly_xp,
                "level": user.level,
                "level_title": get_level_title(user.level),
                "streak_days": user.streak_days,
                "is_current_user": row.user_id == current_user.id,
            })

        # Include users with 0 weekly XP at the bottom
        weekly_user_ids = {row.user_id for row in weekly_rows}
        all_users_result = await db.execute(select(User).order_by(User.display_name))
        all_users = all_users_result.scalars().all()
        for user in all_users:
            if user.id not in weekly_user_ids:
                entries.append({
                    "rank": len(entries) + 1,
                    "user_id": str(user.id),
                    "display_name": user.display_name,
                    "xp": 0,
                    "level": user.level,
                    "level_title": get_level_title(user.level),
                    "streak_days": user.streak_days,
                    "is_current_user": user.id == current_user.id,
                })

        return {"period": "weekly", "entries": entries}
