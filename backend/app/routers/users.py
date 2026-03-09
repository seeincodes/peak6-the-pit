from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.progression import get_unlocked_categories, get_level_title
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


def _user_response(user: User):
    unlocked = get_unlocked_categories(user.level)
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
    }


@router.get("/me")
async def get_current_user_profile(
    user: User = Depends(get_current_user),
):
    return _user_response(user)


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

    await db.commit()
    await db.refresh(user)

    return _user_response(user)
