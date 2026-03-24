import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.notification_service import create_notification, get_unread_notifications, mark_read


@pytest.mark.asyncio
async def test_create_notification():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    result = await create_notification(
        db=db,
        user_id=uuid.uuid4(),
        type="mentorship_request",
        title="New mentorship request",
        body="Alice wants you as a mentor",
    )
    db.add.assert_called_once()
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_unread_notifications():
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_result)

    result = await get_unread_notifications(db=db, user_id=uuid.uuid4())
    assert result == []


@pytest.mark.asyncio
async def test_mark_read():
    db = AsyncMock()
    mock_notif = MagicMock()
    mock_notif.read_at = None
    db.get = AsyncMock(return_value=mock_notif)
    db.flush = AsyncMock()

    await mark_read(db=db, notification_id=uuid.uuid4())
    assert mock_notif.read_at is not None
