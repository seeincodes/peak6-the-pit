import uuid
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        payload=payload,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def get_unread_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(and_(Notification.user_id == user_id, Notification.read_at.is_(None)))
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


async def get_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def mark_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
) -> None:
    notif = await db.get(Notification, notification_id)
    if notif and notif.read_at is None:
        notif.read_at = utc_now_naive()
        await db.flush()
