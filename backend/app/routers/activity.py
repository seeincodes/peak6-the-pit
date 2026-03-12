"""Activity feed — recent events from cohort or all users."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity_event import ActivityEvent
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/feed")
async def get_feed(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return recent activity events (last 7 days) from same-cohort users, or all users if no cohort."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).replace(tzinfo=None)

    stmt = (
        select(ActivityEvent, User)
        .join(User, ActivityEvent.user_id == User.id)
        .where(ActivityEvent.created_at >= cutoff)
    )

    # Filter to same cohort if user has one
    if user.cohort:
        stmt = stmt.where(User.cohort == user.cohort)

    stmt = stmt.order_by(desc(ActivityEvent.created_at)).offset(offset).limit(limit)
    rows = (await db.execute(stmt)).all()

    return [
        {
            "id": str(event.id),
            "user_id": str(event.user_id),
            "display_name": u.display_name,
            "avatar_id": u.avatar_id or "default",
            "event_type": event.event_type,
            "payload": event.payload,
            "created_at": event.created_at.isoformat(),
        }
        for event, u in rows
    ]
