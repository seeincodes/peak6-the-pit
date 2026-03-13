"""Tests for MCQ generation service."""
from unittest.mock import AsyncMock, patch, MagicMock
import pytest

from app.services.scenario_engine import generate_mcq, parse_scenario_json


def test_parse_mcq_json():
    raw = '```json\n{"context": "Market setup", "question": "What?", "choices": [{"key": "A", "text": "opt1"}, {"key": "B", "text": "opt2"}, {"key": "C", "text": "opt3"}, {"key": "D", "text": "opt4"}], "correct_key": "B", "explanation": "Because B"}\n```'
    result = parse_scenario_json(raw)
    assert result["correct_key"] == "B"
    assert len(result["choices"]) == 4


def test_parse_mcq_json_no_fences():
    raw = '{"context": "Setup", "question": "Q?", "choices": [{"key": "A", "text": "a"}, {"key": "B", "text": "b"}, {"key": "C", "text": "c"}, {"key": "D", "text": "d"}], "correct_key": "C", "explanation": "C is right"}'
    result = parse_scenario_json(raw)
    assert result["correct_key"] == "C"


@pytest.mark.asyncio
async def test_generate_mcq_calls_claude():
    mock_db = AsyncMock()
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text='{"concept_explainer":"IV reflects expected movement priced into options.","context": "SPX vol is elevated", "question": "What trade?", "choices": [{"key": "A", "text": "Buy calls"}, {"key": "B", "text": "Sell straddle"}, {"key": "C", "text": "Buy puts"}, {"key": "D", "text": "Sell calls"}], "correct_key": "B", "explanation": "Vol is rich"}')]

    with patch("app.services.scenario_engine.retrieve_chunks", new_callable=AsyncMock, return_value=[]), \
         patch("app.services.scenario_engine.anthropic_client") as mock_client:
        mock_client.messages.create = AsyncMock(return_value=mock_message)
        result = await generate_mcq(mock_db, "iv_analysis", "beginner")

    assert result["category"] == "iv_analysis"
    assert result["content"]["correct_key"] == "B"
    assert len(result["content"]["choices"]) == 4
    assert result["content"]["concept_explainer"].startswith("IV reflects")
    assert "signature" in result


@pytest.mark.asyncio
async def test_generate_mcq_includes_learning_objective_in_prompt():
    mock_db = AsyncMock()
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text='{"concept_explainer":"Delta measures directional sensitivity.","context":"Setup","question":"Q?","choices":[{"key":"A","text":"a"},{"key":"B","text":"b"},{"key":"C","text":"c"},{"key":"D","text":"d"}],"correct_key":"A","explanation":"Because"}')]

    with patch("app.services.scenario_engine.retrieve_chunks", new_callable=AsyncMock, return_value=[]), \
         patch("app.services.scenario_engine.anthropic_client") as mock_client:
        mock_client.messages.create = AsyncMock(return_value=mock_message)
        await generate_mcq(
            mock_db,
            "greeks",
            "beginner",
            user_id="user-123",
            learning_objective="Explain delta and how traders use it.",
        )

    prompt = mock_client.messages.create.await_args.kwargs["messages"][0]["content"]
    assert "Learning objective for this question" in prompt
    assert "Explain delta and how traders use it." in prompt
