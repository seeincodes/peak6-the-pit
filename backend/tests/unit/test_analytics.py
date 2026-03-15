import pytest
from datetime import datetime, timedelta
from uuid import UUID
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.analytics import (
    get_learning_progress,
    get_activity_metrics,
    get_content_performance,
)


@pytest.mark.asyncio
async def test_learning_progress_empty_org():
    """Should return zeros for org with no users."""
    mock_db = AsyncMock(spec=AsyncSession)
    mock_result = AsyncMock()
    mock_result.__aiter__ = lambda self: iter([])
    mock_db.execute.return_value = mock_result

    org_id = UUID("00000000-0000-0000-0000-000000000001")
    start = datetime.now() - timedelta(days=30)
    end = datetime.now()

    result = await get_learning_progress(mock_db, org_id, start, end)

    assert result.total_scenarios_completed == 0
    assert result.level_distribution == {}


@pytest.mark.asyncio
async def test_activity_metrics_returns_correct_structure():
    """Activity metrics should return expected structure."""
    mock_db = AsyncMock(spec=AsyncSession)

    org_id = UUID("00000000-0000-0000-0000-000000000001")
    start = datetime.now() - timedelta(days=30)
    end = datetime.now()

    result = await get_activity_metrics(mock_db, org_id, start, end)

    assert hasattr(result, "completions_over_time")
    assert hasattr(result, "active_users")
    assert hasattr(result, "peak_hours")
    assert hasattr(result, "total_completions")
