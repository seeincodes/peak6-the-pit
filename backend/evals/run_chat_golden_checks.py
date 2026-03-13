"""Run golden-set checks for the AI chat system.

Layer 1 (deterministic, no LLM): tool outputs, routing, prompt templates
Layer 2 (mock by default): response quality checks on mock responses
Layer 2+3 (--live flag): real LLM calls for tool calling accuracy

Usage:
    python evals/run_chat_golden_checks.py          # deterministic + mock checks
    python evals/run_chat_golden_checks.py --live   # includes real LLM calls
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

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

GOLDEN_DIR = ROOT / "golden"

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


def _load_json(filename: str) -> list[dict]:
    with (GOLDEN_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_jsonl(filename: str) -> list[dict]:
    cases: list[dict] = []
    with (GOLDEN_DIR / filename).open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                cases.append(json.loads(line))
    return cases


# ── Layer 1A: Tool output validation ──────────────────────────────

def _check_data_assertions(data: list[dict], assertions: list[dict]) -> list[str]:
    """Run data-level assertions against tool output data array."""
    errors: list[str] = []
    for assertion in assertions:
        if "find_data_where" in assertion:
            criteria = assertion["find_data_where"]
            matching = [
                d for d in data
                if all(abs(d.get(k, float("inf")) - v) < 0.01 for k, v in criteria.items())
            ]
            if not matching:
                errors.append(f"{assertion['description']}: no matching data point for {criteria}")
                continue
            point = matching[0]
            # Check expected exact values (expected_pnl, expected_iv, expected_price, ...)
            for key, val in assertion.items():
                if key.startswith("expected_") and key != "expected_tool_called":
                    field = key.replace("expected_", "")
                    if field in point and abs(point[field] - val) > 0.01:
                        errors.append(
                            f"{assertion['description']}: {field}={point[field]} != {val}"
                        )

        if "all_data_field" in assertion:
            field = assertion["all_data_field"]
            lo, hi = assertion["range"]
            for i, point in enumerate(data):
                val = point.get(field)
                if val is None:
                    errors.append(f"{assertion['description']}: missing field {field} at index {i}")
                    break
                if lo is not None and val < lo - 0.001:
                    errors.append(f"{assertion['description']}: {field}={val} < {lo} at index {i}")
                    break
                if hi is not None and val > hi + 0.001:
                    errors.append(f"{assertion['description']}: {field}={val} > {hi} at index {i}")
                    break
    return errors


def run_tool_checks() -> tuple[int, int]:
    """Layer 1A: Deterministic tool output validation."""
    passed = failed = 0
    for case in _load_json("chat_tool_golden.json"):
        tool_fn = TOOL_MAP[case["tool"]]
        result = tool_fn.invoke(case["args"])
        errors: list[str] = []

        if result.get("chart_type") != case["expected_chart_type"]:
            errors.append(f"chart_type: {result.get('chart_type')} != {case['expected_chart_type']}")

        if case["expected_title_contains"] not in result.get("title", ""):
            errors.append(f"title missing: {case['expected_title_contains']}")

        missing_keys = [k for k in case["expected_keys"] if k not in result]
        if missing_keys:
            errors.append(f"missing keys: {missing_keys}")

        data = result.get("data", [])
        if len(data) != case["expected_data_length"]:
            errors.append(f"data length: {len(data)} != {case['expected_data_length']}")

        if data:
            missing_dp_keys = [k for k in case["expected_data_point_keys"] if k not in data[0]]
            if missing_dp_keys:
                errors.append(f"data point missing keys: {missing_dp_keys}")

        for check in case.get("spot_checks", []):
            if result.get(check["field"]) != check["equals"]:
                errors.append(f"spot check {check['field']}: {result.get(check['field'])} != {check['equals']}")

        errors.extend(_check_data_assertions(data, case.get("data_assertions", [])))

        if errors:
            failed += 1
            print(f"[FAIL] tool::{case['id']} {errors}")
        else:
            passed += 1
            print(f"[PASS] tool::{case['id']}")
    return passed, failed


# ── Layer 1B: Routing detection ────────────────────────────────────

def run_routing_checks() -> tuple[int, int]:
    """Layer 1B: Lesson request detection routing."""
    passed = failed = 0
    for case in _load_json("chat_routing_golden.json"):
        state = {"user_message": case["user_message"]}
        result = detect_lesson_request(state)
        if result != case["expected_route"]:
            failed += 1
            print(f"[FAIL] routing::{case['id']} got={result} expected={case['expected_route']}")
        else:
            passed += 1
            print(f"[PASS] routing::{case['id']}")
    return passed, failed


# ── Layer 1C: Prompt template validation ───────────────────────────

def run_prompt_checks() -> tuple[int, int]:
    """Layer 1C: Prompt template must_contain validation."""
    passed = failed = 0
    for case in _load_json("chat_prompt_golden.json"):
        template_key = case["template"]
        if template_key == "system_prompt":
            text = CHAT_SYSTEM_PROMPT
        else:
            text = TEMPLATE_MAP[template_key].format(**case["inputs"])

        missing = [s for s in case["must_contain"] if s not in text]
        if missing:
            failed += 1
            print(f"[FAIL] prompt::{case['id']} missing: {missing}")
        else:
            passed += 1
            print(f"[PASS] prompt::{case['id']}")
    return passed, failed


# ── Layer 2A: Response quality checks ──────────────────────────────

MARKDOWN_PATTERNS = {
    "heading": r"#{1,6}\s",
    "bold": r"\*\*.+?\*\*",
    "list": r"^[\s]*[-*]\s|^\s*\d+\.\s",
    "table": r"\|.*\|",
    "code_block": r"```",
}


def _check_response_quality(text: str, case: dict) -> list[str]:
    """Shared quality check logic for response text."""
    errors: list[str] = []

    if case.get("must_contain_any"):
        if not any(term in text for term in case["must_contain_any"]):
            errors.append(f"missing any of: {case['must_contain_any']}")

    for term in case.get("must_contain_all", []):
        if term.lower() not in text.lower():
            errors.append(f"missing required term: {term}")

    for term in case.get("must_not_contain", []):
        if term.lower() in text.lower():
            errors.append(f"contains forbidden term: {term}")

    if len(text) < case.get("min_length", 0):
        errors.append(f"too short: {len(text)} < {case['min_length']}")

    if len(text) > case.get("max_length", float("inf")):
        errors.append(f"too long: {len(text)} > {case['max_length']}")

    for element in case.get("expected_markdown_elements", []):
        pattern = MARKDOWN_PATTERNS.get(element)
        if pattern and not re.search(pattern, text, re.MULTILINE):
            errors.append(f"missing markdown element: {element}")

    return errors


def run_response_quality_checks() -> tuple[int, int]:
    """Layer 2A: Response quality on mock responses."""
    passed = failed = 0
    for case in _load_jsonl("chat_response_golden.jsonl"):
        text = case["mock_response"]
        errors = _check_response_quality(text, case)
        if errors:
            failed += 1
            print(f"[FAIL] response::{case['id']} {errors}")
        else:
            passed += 1
            print(f"[PASS] response::{case['id']}")
    return passed, failed


# ── Layer 2B+3: Live LLM checks (--live only) ─────────────────────

async def _run_live_tool_calling_checks() -> tuple[int, int]:
    """Layer 2B: Call model with tools and check it picks the right one."""
    from langchain_core.messages import HumanMessage, SystemMessage
    from app.services.chat_graph import _response_model_with_tools

    passed = failed = 0
    for case in _load_jsonl("chat_tool_calling_golden.jsonl"):
        prompt = CHAT_RESPONSE_TEMPLATE.format(
            rag_context="",
            conversation_history="",
            user_message=case["user_message"],
        )
        messages = [
            SystemMessage(content=CHAT_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
        try:
            response = await _response_model_with_tools.ainvoke(messages)
        except Exception as exc:
            failed += 1
            print(f"[FAIL] tool_calling::{case['id']} API error: {exc}")
            continue

        errors: list[str] = []
        has_tool_calls = bool(response.tool_calls)

        if case["expected_tool_called"] and not has_tool_calls:
            errors.append("expected tool call but none made")
        elif not case["expected_tool_called"] and has_tool_calls:
            errors.append(f"unexpected tool call: {response.tool_calls[0]['name']}")
        elif case["expected_tool_called"] and has_tool_calls:
            tc = response.tool_calls[0]
            if tc["name"] != case["expected_tool_name"]:
                errors.append(f"wrong tool: {tc['name']} != {case['expected_tool_name']}")
            for key, expected_val in case.get("expected_args_contain", {}).items():
                actual_val = tc["args"].get(key)
                if actual_val is None:
                    errors.append(f"missing arg: {key}")
                elif isinstance(expected_val, str) and actual_val != expected_val:
                    errors.append(f"arg {key}: {actual_val} != {expected_val}")

        if errors:
            failed += 1
            print(f"[FAIL] tool_calling::{case['id']} {errors}")
        else:
            passed += 1
            print(f"[PASS] tool_calling::{case['id']}")

    return passed, failed


# ── Main ───────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Chat AI golden set checks")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Run LLM-dependent checks (requires API key)",
    )
    args = parser.parse_args()

    results: list[tuple[str, tuple[int, int]]] = []

    # Layer 1: Always run (deterministic)
    results.append(("tool_outputs", run_tool_checks()))
    results.append(("routing", run_routing_checks()))
    results.append(("prompts", run_prompt_checks()))

    # Layer 2A: Mock response quality (always runs)
    results.append(("response_quality", run_response_quality_checks()))

    # Layer 2B: Live tool calling (only with --live)
    if args.live:
        print("\n── Live LLM checks ──")
        live_result = asyncio.run(_run_live_tool_calling_checks())
        results.append(("tool_calling_live", live_result))

    total_passed = sum(p for _, (p, _) in results)
    total_failed = sum(f for _, (_, f) in results)

    print(f"\n{'=' * 50}")
    for name, (p, f) in results:
        status = "PASS" if f == 0 else "FAIL"
        print(f"  [{status}] {name}: passed={p} failed={f}")
    print(f"  TOTAL: passed={total_passed} failed={total_failed}")
    print(f"{'=' * 50}")

    return 1 if total_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
