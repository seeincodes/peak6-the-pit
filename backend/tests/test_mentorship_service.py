"""Tests for mentorship_service."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.mentorship_service import request_mentorship, create_goal


def _make_db():
    """Return a mock AsyncSession with common setup."""
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.execute = AsyncMock()
    db.get = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_request_mentorship_creates_pending():
    """request_mentorship creates a Mentorship with status=pending when no active exists."""
    db = _make_db()
    org_id = uuid.uuid4()
    mentor_id = uuid.uuid4()
    mentee_id = uuid.uuid4()

    # Simulate no existing active mentorship
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    mentorship = await request_mentorship(
        db=db,
        org_id=org_id,
        mentor_id=mentor_id,
        mentee_id=mentee_id,
    )

    assert db.add.call_count >= 1  # mentorship + notification
    db.flush.assert_awaited()
    assert mentorship.org_id == org_id
    assert mentorship.mentor_id == mentor_id
    assert mentorship.mentee_id == mentee_id
    assert mentorship.status == "pending"


@pytest.mark.asyncio
async def test_request_mentorship_raises_if_active_exists():
    """request_mentorship raises ValueError if an active mentorship already exists."""
    db = _make_db()
    org_id = uuid.uuid4()
    mentor_id = uuid.uuid4()
    mentee_id = uuid.uuid4()

    # Simulate an existing active mentorship
    existing_mentorship = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_mentorship
    db.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(ValueError, match="active mentorship already exists"):
        await request_mentorship(
            db=db,
            org_id=org_id,
            mentor_id=mentor_id,
            mentee_id=mentee_id,
        )


@pytest.mark.asyncio
async def test_create_goal_returns_goal():
    """create_goal creates and flushes a MentorshipGoal."""
    db = _make_db()
    mentorship_id = uuid.uuid4()

    goal = await create_goal(
        db=db,
        mentorship_id=mentorship_id,
        category="options_pricing",
        target_mastery=80.0,
    )

    db.add.assert_called_once()
    db.flush.assert_awaited_once()
    assert goal.mentorship_id == mentorship_id
    assert goal.category == "options_pricing"
    assert goal.target_mastery == 80.0
    assert goal.current_mastery == 0.0
