"""Emit activity events for the cohort feed."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_event import ActivityEvent


async def emit_activity(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_type: str,
    payload: dict,
) -> ActivityEvent:
    """Create an activity event. Does NOT commit — caller manages the transaction."""
    event = ActivityEvent(
        user_id=user_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(event)
    return event
