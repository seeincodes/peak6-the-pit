"""Pytest wrapper for chat golden-set checks (deterministic, no LLM calls)."""

import json
import re
from pathlib import Path

from app.services.chat_tools import (
    option_payoff_chart,
    greeks_chart,
    volatility_smile_chart,
    price_history_chart,
)
from app.services.chat_graph import detect_lesson_request
from app.prompts.chat_prompts import (
    CHAT_SYSTEM_PROMPT,
    CHAT_RESPONSE_TEMPLATE,
    LESSON_PLAN_TEMPLATE,
)

GOLDEN_DIR = Path(__file__).resolve().parents[1] / "evals" / "golden"

TOOL_MAP = {
    "option_payoff_chart": option_payoff_chart,
    "greeks_chart": greeks_chart,
    "volatility_smile_chart": volatility_smile_chart,
    "price_history_chart": price_history_chart,
}

TEMPLATE_MAP = {
    "chat_response": CHAT_RESPONSE_TEMPLATE,
    "lesson_plan": LESSON_PLAN_TEMPLATE,
    "system_prompt": CHAT_SYSTEM_PROMPT,
}

MARKDOWN_PATTERNS = {
    "heading": r"#{1,6}\s",
    "bold": r"\*\*.+?\*\*",
    "list": r"^[\s]*[-*]\s|^\s*\d+\.\s",
    "table": r"\|.*\|",
    "code_block": r"```",
}


# ── Layer 1A: Tool output golden set ───────────────────────────────

def test_chat_tool_golden_set():
    cases = json.loads((GOLDEN_DIR / "chat_tool_golden.json").read_text(encoding="utf-8"))
    assert cases, "chat_tool_golden.json should not be empty"

    for case in cases:
        tool_fn = TOOL_MAP[case["tool"]]
        result = tool_fn.invoke(case["args"])

        assert result["chart_type"] == case["expected_chart_type"], (
            f"{case['id']}: chart_type {result['chart_type']} != {case['expected_chart_type']}"
        )
        assert case["expected_title_contains"] in result["title"], (
            f"{case['id']}: title missing '{case['expected_title_contains']}'"
        )
        for key in case["expected_keys"]:
            assert key in result, f"{case['id']}: missing key {key}"

        data = result["data"]
        assert len(data) == case["expected_data_length"], (
            f"{case['id']}: data length {len(data)} != {case['expected_data_length']}"
        )
        for key in case["expected_data_point_keys"]:
            assert key in data[0], f"{case['id']}: data point missing key {key}"

        for check in case.get("spot_checks", []):
            assert result[check["field"]] == check["equals"], (
                f"{case['id']}: {check['field']} = {result[check['field']]} != {check['equals']}"
            )

        # Data assertions
        for assertion in case.get("data_assertions", []):
            if "find_data_where" in assertion:
                criteria = assertion["find_data_where"]
                matching = [
                    d for d in data
                    if all(abs(d.get(k, float("inf")) - v) < 0.01 for k, v in criteria.items())
                ]
                assert matching, (
                    f"{case['id']}: {assertion['description']} - no match for {criteria}"
                )
                point = matching[0]
                for key, val in assertion.items():
                    if key.startswith("expected_") and key != "expected_tool_called":
                        field = key.replace("expected_", "")
                        if field in point:
                            assert abs(point[field] - val) < 0.01, (
                                f"{case['id']}: {assertion['description']} - "
                                f"{field}={point[field]} != {val}"
                            )

            if "all_data_field" in assertion:
                field = assertion["all_data_field"]
                lo, hi = assertion["range"]
                for point in data:
                    val = point[field]
                    if lo is not None:
                        assert val >= lo - 0.001, (
                            f"{case['id']}: {assertion['description']} - "
                            f"{field}={val} < {lo}"
                        )
                    if hi is not None:
                        assert val <= hi + 0.001, (
                            f"{case['id']}: {assertion['description']} - "
                            f"{field}={val} > {hi}"
                        )


# ── Layer 1B: Routing golden set ───────────────────────────────────

def test_chat_routing_golden_set():
    cases = json.loads((GOLDEN_DIR / "chat_routing_golden.json").read_text(encoding="utf-8"))
    assert cases, "chat_routing_golden.json should not be empty"

    for case in cases:
        result = detect_lesson_request({"user_message": case["user_message"]})
        assert result == case["expected_route"], (
            f"{case['id']}: got {result}, expected {case['expected_route']} "
            f"for message: {case['user_message']!r}"
        )


# ── Layer 1C: Prompt template golden set ───────────────────────────

def test_chat_prompt_golden_set():
    cases = json.loads((GOLDEN_DIR / "chat_prompt_golden.json").read_text(encoding="utf-8"))
    assert cases, "chat_prompt_golden.json should not be empty"

    for case in cases:
        template_key = case["template"]
        if template_key == "system_prompt":
            text = CHAT_SYSTEM_PROMPT
        else:
            text = TEMPLATE_MAP[template_key].format(**case["inputs"])

        for snippet in case["must_contain"]:
            assert snippet in text, (
                f"{case['id']}: missing expected snippet: {snippet!r}"
            )


# ── Layer 2A: Response quality golden set ──────────────────────────

def test_chat_response_quality_golden_set():
    """Validate mock responses against quality criteria (no LLM calls)."""
    lines = (GOLDEN_DIR / "chat_response_golden.jsonl").read_text(encoding="utf-8").splitlines()
    lines = [line for line in lines if line.strip()]
    assert lines, "chat_response_golden.jsonl should not be empty"

    for line in lines:
        case = json.loads(line)
        text = case["mock_response"]

        # must_contain_any
        if case.get("must_contain_any"):
            assert any(term in text for term in case["must_contain_any"]), (
                f"{case['id']}: missing any of {case['must_contain_any']}"
            )

        # must_contain_all
        for term in case.get("must_contain_all", []):
            assert term.lower() in text.lower(), (
                f"{case['id']}: missing required term: {term}"
            )

        # must_not_contain
        for term in case.get("must_not_contain", []):
            assert term.lower() not in text.lower(), (
                f"{case['id']}: contains forbidden term: {term}"
            )

        # Length bounds
        assert len(text) >= case.get("min_length", 0), (
            f"{case['id']}: too short: {len(text)}"
        )
        assert len(text) <= case.get("max_length", float("inf")), (
            f"{case['id']}: too long: {len(text)}"
        )

        # Markdown elements
        for element in case.get("expected_markdown_elements", []):
            pattern = MARKDOWN_PATTERNS.get(element)
            if pattern:
                assert re.search(pattern, text, re.MULTILINE), (
                    f"{case['id']}: missing markdown element: {element}"
                )
