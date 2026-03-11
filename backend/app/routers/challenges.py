from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.challenges import get_or_create_daily_challenges

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.get("/today")
async def get_today_challenges(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_or_create_daily_challenges(user.id, db)
