"""Tests for LangGraph-backed scenario generation flow."""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.scenario_engine import generate_scenario


@pytest.mark.asyncio
async def test_generate_scenario_uses_langgraph_runner():
    mock_db = AsyncMock()
    fake_chunks = [{"content": "chunk one unique"}, {"content": "chunk two unique"}]
    fake_model_json = (
        '{"title":"Test","setup":"Setup","question":"Question","hints":[],"expected_dimensions":[]}'
    )

    with (
        patch("app.services.scenario_engine._get_context", new_callable=AsyncMock, return_value=(fake_chunks, "snapshot unique")),
        patch("app.services.scenario_engine.run_scenario_graph", new_callable=AsyncMock, return_value=fake_model_json) as mock_run,
    ):
        result = await generate_scenario(mock_db, "iv_analysis_unique", "beginner")
        # Identical prompt should use the short-lived generation cache.
        result_again = await generate_scenario(mock_db, "iv_analysis_unique", "beginner")

    assert result["category"] == "iv_analysis_unique"
    assert result["content"]["title"] == "Test"
    assert result["context_chunks"] == ["chunk one unique", "chunk two unique"]
    assert result_again["content"]["title"] == "Test"
    mock_run.assert_awaited_once()


@pytest.mark.asyncio
async def test_cached_scenario_not_reused_for_same_user():
    mock_db = AsyncMock()
    fake_chunks = [{"content": "chunk same-user"}]
    first = '{"title":"First","setup":"S","question":"Q","hints":[],"expected_dimensions":[]}'
    second = '{"title":"Second","setup":"S","question":"Q","hints":[],"expected_dimensions":[]}'

    with (
        patch("app.services.scenario_engine._get_context", new_callable=AsyncMock, return_value=(fake_chunks, "snapshot same-user")),
        patch("app.services.scenario_engine.run_scenario_graph", new_callable=AsyncMock, side_effect=[first, second]) as mock_run,
    ):
        one = await generate_scenario(mock_db, "order_flow_unique", "beginner", user_id="user-1")
        two = await generate_scenario(mock_db, "order_flow_unique", "beginner", user_id="user-1")
        three = await generate_scenario(mock_db, "order_flow_unique", "beginner", user_id="user-2")

    assert one["content"]["title"] == "First"
    assert two["content"]["title"] == "Second"  # Same user forces regeneration
    assert three["content"]["title"] == "Second"  # Different user can reuse cache
    assert mock_run.await_count == 2
