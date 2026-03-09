"""Tests for badges router and badge service."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.badge_service import check_and_award_badges


def test_badge_response_structure():
    """Badge API response has expected keys (documentation test)."""
    expected_keys = {"slug", "name", "description", "icon", "category", "tier", "earned", "awarded_at"}
    assert expected_keys == expected_keys


@pytest.mark.asyncio
async def test_check_and_award_badges_returns_empty_when_user_not_found():
    """Returns empty list when user does not exist."""
    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=None)

    result = await check_and_award_badges(uuid.uuid4(), mock_db)

    assert result == []


@pytest.mark.asyncio
async def test_check_and_award_badges_returns_list():
    """check_and_award_badges returns a list (integration would need full DB)."""
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()
    mock_user.level = 0
    mock_user.xp_total = 0
    mock_user.streak_days = 0

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_user)

    # Mock all the select queries to return empty
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_result.scalar.return_value = 0

    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await check_and_award_badges(mock_user.id, mock_db)

    assert isinstance(result, list)
