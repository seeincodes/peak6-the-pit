"""Tests for LangGraph-backed scenario generation flow."""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.scenario_engine import generate_scenario


@pytest.mark.asyncio
async def test_generate_scenario_uses_langgraph_runner():
    mock_db = AsyncMock()
    fake_chunks = [{"content": "chunk one"}, {"content": "chunk two"}]
    fake_model_json = (
        '{"title":"Test","setup":"Setup","question":"Question","hints":[],"expected_dimensions":[]}'
    )

    with (
        patch("app.services.scenario_engine._get_context", new_callable=AsyncMock, return_value=(fake_chunks, "snapshot")),
        patch("app.services.scenario_engine.run_scenario_graph", new_callable=AsyncMock, return_value=fake_model_json) as mock_run,
    ):
        result = await generate_scenario(mock_db, "iv_analysis", "beginner")

    assert result["category"] == "iv_analysis"
    assert result["content"]["title"] == "Test"
    assert result["context_chunks"] == ["chunk one", "chunk two"]
    mock_run.assert_awaited_once()
