import json
from app.services.scenario_engine import parse_scenario_json, build_rag_context


def test_parse_scenario_json_valid():
    raw = json.dumps({
        "title": "IV Spike Analysis",
        "setup": "SPX 30-day IV has risen from 15 to 22 in two days.",
        "question": "What is driving this move and how should you position?",
        "hints": ["Check VIX term structure", "Look at put skew"],
        "expected_dimensions": ["reasoning", "trade_logic"],
    })
    result = parse_scenario_json(raw)
    assert result["title"] == "IV Spike Analysis"
    assert "setup" in result
    assert "question" in result


def test_parse_scenario_json_strips_markdown():
    raw = '```json\n{"title": "Test", "setup": "S", "question": "Q", "hints": [], "expected_dimensions": []}\n```'
    result = parse_scenario_json(raw)
    assert result["title"] == "Test"


def test_build_rag_context_trims_payload():
    chunks = [
        {"content": "A" * 5000},
        {"content": "B" * 5000},
    ]
    context, used_chunks = build_rag_context(chunks)
    assert len(context) <= 2200
    assert used_chunks
