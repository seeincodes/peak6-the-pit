"""Tests for MCQ pool service."""
import pytest
from unittest.mock import AsyncMock, patch

from app.services.mcq_pool import (
    get_from_pool,
    add_to_pool,
    pool_size,
    refill,
    prewarm,
    spawn_refill,
)


@pytest.mark.asyncio
async def test_get_from_pool_empty():
    """Empty pool returns None."""
    result = await get_from_pool("iv_analysis", "beginner")
    assert result is None


@pytest.mark.asyncio
async def test_add_and_get_from_pool():
    """Add MCQ to pool and retrieve it."""
    mcq_data = {
        "category": "iv_analysis",
        "difficulty": "beginner",
        "content": {
            "context": "Market setup",
            "question": "What trade?",
            "choices": [{"key": "A", "text": "Buy"}, {"key": "B", "text": "Sell"}],
            "correct_key": "A",
            "explanation": "Because",
        },
    }
    await add_to_pool("iv_analysis", "beginner", mcq_data)
    result = await get_from_pool("iv_analysis", "beginner")
    assert result is not None
    assert result["category"] == "iv_analysis"
    assert result["content"]["question"] == "What trade?"


@pytest.mark.asyncio
async def test_get_from_pool_consumes():
    """get_from_pool removes item from pool."""
    mcq_data = {"category": "x", "difficulty": "y", "content": {}}
    await add_to_pool("x", "y", mcq_data)
    first = await get_from_pool("x", "y")
    second = await get_from_pool("x", "y")
    assert first is not None
    assert second is None


@pytest.mark.asyncio
async def test_pool_size():
    """pool_size returns correct count."""
    mcq = {"category": "a", "difficulty": "b", "content": {}}
    assert await pool_size("a", "b") == 0
    await add_to_pool("a", "b", mcq)
    assert await pool_size("a", "b") == 1
    await add_to_pool("a", "b", {**mcq, "content": {"x": 1}})
    assert await pool_size("a", "b") == 2
    await get_from_pool("a", "b")
    assert await pool_size("a", "b") == 1


@pytest.mark.asyncio
async def test_refill_adds_to_pool():
    """refill generates MCQ and adds to pool."""
    mock_mcq = {
        "category": "refill_test",
        "difficulty": "beginner",
        "content": {
            "context": "C",
            "question": "Q",
            "choices": [],
            "correct_key": "A",
            "explanation": "E",
        },
    }

    with patch("app.services.mcq_pool.generate_mcq", new_callable=AsyncMock, return_value=mock_mcq):
        await refill("refill_test", "beginner")

    result = await get_from_pool("refill_test", "beginner")
    assert result is not None
    assert result["content"]["question"] == "Q"


@pytest.mark.asyncio
async def test_prewarm_spawns_refill():
    """prewarm spawns refill tasks for each category."""
    with patch("app.services.mcq_pool.spawn_refill") as mock_spawn:
        await prewarm([
            ("iv_analysis", "beginner"),
            ("greeks", "beginner"),
        ])
        assert mock_spawn.call_count == 2
        mock_spawn.assert_any_call("iv_analysis", "beginner")
        mock_spawn.assert_any_call("greeks", "beginner")


@pytest.mark.asyncio
async def test_spawn_refill_does_not_raise():
    """spawn_refill creates task without blocking."""
    spawn_refill("iv_analysis", "beginner")
    # Should not raise; task runs in background (needs running event loop)
