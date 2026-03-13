"""Tests for MCQ pool service (persistent mcq_bank backend)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.mcq_pool import (
    get_from_pool,
    refill,
    prewarm,
    spawn_refill,
)


@pytest.mark.asyncio
async def test_get_from_pool_empty():
    """Empty bank returns None."""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.__aenter__ = AsyncMock(return_value=mock_db)
    mock_db.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.mcq_pool.async_session", return_value=mock_db):
        result = await get_from_pool("iv_analysis", "beginner")
    assert result is None


@pytest.mark.asyncio
async def test_get_from_pool_returns_content():
    """Bank row returned as mcq_data dict."""
    mock_row = MagicMock()
    mock_row.id = "fake-id"
    mock_row.content = {"question": "What?", "choices": [], "correct_key": "A", "explanation": "E"}
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_row

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.commit = AsyncMock()
    mock_db.__aenter__ = AsyncMock(return_value=mock_db)
    mock_db.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.mcq_pool.async_session", return_value=mock_db):
        result = await get_from_pool("iv_analysis", "beginner")

    assert result is not None
    assert result["category"] == "iv_analysis"
    assert result["difficulty"] == "beginner"
    assert result["content"]["question"] == "What?"


@pytest.mark.asyncio
async def test_refill_saves_to_bank():
    """refill generates MCQ via AI and saves to mcq_bank."""
    mock_mcq = {
        "category": "greeks",
        "difficulty": "beginner",
        "content": {"question": "Q", "choices": [], "correct_key": "A", "explanation": "E"},
    }

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.__aenter__ = AsyncMock(return_value=mock_db)
    mock_db.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.mcq_pool.async_session", return_value=mock_db), \
         patch("app.services.mcq_pool.generate_mcq", new_callable=AsyncMock, return_value=mock_mcq):
        await refill("greeks", "beginner")

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_spawn_refill_does_not_raise():
    """spawn_refill creates task without blocking."""
    spawn_refill("iv_analysis", "beginner")


@pytest.mark.asyncio
async def test_prewarm_checks_bank():
    """prewarm checks bank and spawns refills for empty slots."""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.__aenter__ = AsyncMock(return_value=mock_db)
    mock_db.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.mcq_pool.async_session", return_value=mock_db), \
         patch("app.services.mcq_pool.spawn_refill") as mock_spawn:
        await prewarm([("iv_analysis", "beginner"), ("greeks", "beginner")])
        assert mock_spawn.call_count == 2
