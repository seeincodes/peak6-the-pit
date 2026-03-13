from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.response import Response
from app.models.grade import Grade
from app.models.badge import UserBadge, Badge
from app.models.activity_event import ActivityEvent
from app.models.learning_path import UserPathProgress
from app.services.progression import get_mastery_gated_unlocks, get_level_title, compute_level_from_xp
from app.constants import SCENARIO_CATEGORIES
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

PRESET_AVATARS = [
    "default", "bull", "bear", "rocket", "chart", "diamond",
    "fire", "lightning", "shield", "star", "crown", "target", "brain",
]


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_id: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=200)
    cohort: Optional[str] = Field(None, max_length=50)


async def _user_response(user: User, db: AsyncSession):
    unlocked = await get_mastery_gated_unlocks(db, user.id, user.level)
    title = get_level_title(user.level)
    return {
        "id": str(user.id),
        "display_name": user.display_name,
        "avatar_id": user.avatar_id,
        "bio": user.bio,
        "role": user.role,
        "level": user.level,
        "level_title": title,
        "xp_total": user.xp_total,
        "streak_days": user.streak_days,
        "unlocked_categories": [
            {"category": ct.category, "difficulty": ct.difficulty}
            for ct in sorted(unlocked, key=lambda x: (x.category, x.difficulty))
        ],
        "all_categories": SCENARIO_CATEGORIES,
        "cohort": user.cohort,
        "has_onboarded": user.has_onboarded,
    }


@router.get("/me")
async def get_current_user_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    correct_level = compute_level_from_xp(user.xp_total)
    if user.level != correct_level:
        user.level = correct_level
        await db.commit()
    return await _user_response(user, db)


@router.patch("/me")
async def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.display_name is not None:
        user.display_name = req.display_name
    if req.avatar_id is not None:
        if req.avatar_id not in PRESET_AVATARS:
            raise HTTPException(status_code=400, detail="Invalid avatar_id")
        user.avatar_id = req.avatar_id
    if req.bio is not None:
        user.bio = req.bio
    if req.cohort is not None:
        user.cohort = req.cohort

    await db.commit()
    await db.refresh(user)

    return await _user_response(user, db)


@router.patch("/me/onboard")
async def mark_onboarded(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.has_onboarded = True
    await db.commit()
    return {"status": "onboarded"}


@router.get("/{user_id}/profile")
async def get_public_profile(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Public profile for any user."""
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Earned badges
    badge_rows = (await db.execute(
        select(Badge, UserBadge)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.awarded_at.desc())
    )).all()
    badges = [
        {
            "slug": b.slug,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "awarded_at": ub.awarded_at.isoformat(),
        }
        for b, ub in badge_rows
    ]

    # Stats
    total_result = await db.execute(
        select(func.count()).where(
            Response.user_id == user_id,
            Response.is_complete == True,  # noqa: E712
        )
    )
    total_scenarios = total_result.scalar()

    avg_result = await db.execute(
        select(func.avg(Grade.overall_score))
        .join(Response, Grade.response_id == Response.id)
        .where(Response.user_id == user_id)
    )
    avg_score = avg_result.scalar()

    paths_completed_result = await db.execute(
        select(func.count()).where(
            UserPathProgress.user_id == user_id,
            UserPathProgress.completed_at.isnot(None),
        )
    )
    paths_completed = paths_completed_result.scalar()

    # Recent activity (last 20)
    activity_rows = (await db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.user_id == user_id)
        .order_by(desc(ActivityEvent.created_at))
        .limit(20)
    )).scalars().all()

    recent_activity = [
        {
            "event_type": e.event_type,
            "payload": e.payload,
            "created_at": e.created_at.isoformat(),
        }
        for e in activity_rows
    ]

    return {
        "id": str(target.id),
        "display_name": target.display_name,
        "avatar_id": target.avatar_id or "default",
        "bio": target.bio,
        "level": target.level,
        "level_title": get_level_title(target.level),
        "xp_total": target.xp_total,
        "streak_days": target.streak_days,
        "cohort": target.cohort,
        "badges": badges,
        "stats": {
            "total_scenarios": total_scenarios,
            "avg_score": round(float(avg_score), 2) if avg_score else None,
            "paths_completed": paths_completed,
        },
        "recent_activity": recent_activity,
        "is_self": target.id == current_user.id,
    }
