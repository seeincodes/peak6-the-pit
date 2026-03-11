import json
from pathlib import Path

from app.services.scenario_engine import build_scenario_prompt, parse_scenario_json


GOLDEN_DIR = Path(__file__).resolve().parents[1] / "evals" / "golden"


def test_scenario_prompt_golden_set():
    cases = json.loads((GOLDEN_DIR / "scenario_prompt_golden.json").read_text(encoding="utf-8"))
    assert cases, "scenario_prompt_golden.json should not be empty"

    for case in cases:
        prompt = build_scenario_prompt(
            case["category"],
            case["difficulty"],
            case["rag_context"],
            case["market_snapshot"],
        )
        for snippet in case["must_contain"]:
            assert snippet in prompt, f"{case['id']} missing expected snippet: {snippet}"


def test_scenario_output_golden_set():
    lines = (GOLDEN_DIR / "scenario_output_golden.jsonl").read_text(encoding="utf-8").splitlines()
    lines = [line for line in lines if line.strip()]
    assert lines, "scenario_output_golden.jsonl should not be empty"

    for line in lines:
        case = json.loads(line)
        parsed = parse_scenario_json(case["raw_output"])
        for key in case["required_keys"]:
            assert key in parsed, f"{case['id']} missing key: {key}"
        assert case["expected_title_contains"] in str(parsed.get("title", ""))
