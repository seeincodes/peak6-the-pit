from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.progression import get_unlocked_categories, get_level_title
from app.constants import SCENARIO_CATEGORIES
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_current_user_profile(
    user: User = Depends(get_current_user),
):
    unlocked = get_unlocked_categories(user.level)
    title = get_level_title(user.level)

    return {
        "id": str(user.id),
        "display_name": user.display_name,
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
