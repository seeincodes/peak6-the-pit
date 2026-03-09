from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/users/me/badges", tags=["badges"])


@router.get("")
async def get_my_badges(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Badge).order_by(Badge.sort_order))
    all_badges = result.scalars().all()

    result = await db.execute(
        select(UserBadge.badge_id, UserBadge.awarded_at).where(UserBadge.user_id == user.id)
    )
    earned = {row[0]: row[1] for row in result.all()}

    return [
        {
            "slug": b.slug,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "category": b.category,
            "tier": b.tier,
            "earned": b.id in earned,
            "awarded_at": earned[b.id].isoformat() if b.id in earned else None,
        }
        for b in all_badges
    ]
