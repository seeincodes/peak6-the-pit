from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid as _uuid

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification as NotifModel
from app.services.notification_service import get_notifications, get_unread_notifications, mark_read

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await get_notifications(db, user.id)
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "metadata": n.payload,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.get("/unread/count")
async def unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await get_unread_notifications(db, user.id)
    return {"count": len(notifs)}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif = await db.get(NotifModel, _uuid.UUID(notification_id))
    if not notif or notif.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    await mark_read(db, _uuid.UUID(notification_id))
    await db.commit()
    return {"status": "ok"}
