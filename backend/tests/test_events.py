"""Tests for event_service."""
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.event_service import create_event, join_event, update_participation_score


def _make_db():
    """Return a mock AsyncSession with common setup."""
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.execute = AsyncMock()
    db.get = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_create_event_returns_market_event():
    """create_event creates and flushes a MarketEvent."""
    db = _make_db()
    org_id = uuid.uuid4()
    created_by = uuid.uuid4()
    start_at = datetime(2026, 4, 1)
    end_at = datetime(2026, 4, 7)

    event = await create_event(
        db=db,
        org_id=org_id,
        created_by=created_by,
        title="Volatility Spike Event",
        description="A high-volatility trading event.",
        theme="volatility",
        start_at=start_at,
        end_at=end_at,
        scenario_pool={"scenario_ids": []},
        scoring_config={"multiplier": 1.5},
        max_scenarios_per_user=10,
    )

    db.add.assert_called_once()
    db.flush.assert_awaited_once()
    assert event.title == "Volatility Spike Event"
    assert event.status == "draft"
    assert event.org_id == org_id
    assert event.created_by == created_by
    assert event.max_scenarios_per_user == 10


@pytest.mark.asyncio
async def test_join_event_creates_participation():
    """join_event creates an EventParticipation when user is not already joined."""
    db = _make_db()
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # Simulate no existing participation
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    participation = await join_event(
        db=db,
        event_id=event_id,
        user_id=user_id,
        team_identifier="team_alpha",
    )

    db.add.assert_called_once()
    db.flush.assert_awaited_once()
    assert participation.event_id == event_id
    assert participation.user_id == user_id
    assert participation.team_identifier == "team_alpha"
    assert participation.individual_score == 0.0
    assert participation.scenarios_completed == 0


@pytest.mark.asyncio
async def test_join_event_raises_if_already_joined():
    """join_event raises ValueError when user has already joined the event."""
    db = _make_db()
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()

    existing_participation = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_participation
    db.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(ValueError, match="already joined"):
        await join_event(db=db, event_id=event_id, user_id=user_id)


@pytest.mark.asyncio
async def test_update_participation_score_increments():
    """update_participation_score increments score and count."""
    db = _make_db()
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()

    mock_participation = MagicMock()
    mock_participation.individual_score = 3.0
    mock_participation.scenarios_completed = 2

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_participation
    db.execute = AsyncMock(return_value=mock_result)

    await update_participation_score(db=db, event_id=event_id, user_id=user_id, score=4.5)

    assert mock_participation.individual_score == 7.5
    assert mock_participation.scenarios_completed == 3
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_participation_score_no_op_if_no_participation():
    """update_participation_score does nothing when user has no participation."""
    db = _make_db()
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    # Should not raise
    await update_participation_score(db=db, event_id=event_id, user_id=user_id, score=4.5)

    db.flush.assert_not_awaited()
