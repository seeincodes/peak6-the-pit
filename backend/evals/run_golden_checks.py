"""Run deterministic golden-set checks for scenario prompting/parsing."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.scenario_engine import build_scenario_prompt, parse_scenario_json


GOLDEN_DIR = ROOT / "golden"


def _load_prompt_cases() -> list[dict]:
    with (GOLDEN_DIR / "scenario_prompt_golden.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_output_cases() -> list[dict]:
    cases: list[dict] = []
    with (GOLDEN_DIR / "scenario_output_golden.jsonl").open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            cases.append(json.loads(line))
    return cases


def run_prompt_checks() -> tuple[int, int]:
    passed = 0
    failed = 0
    for case in _load_prompt_cases():
        prompt = build_scenario_prompt(
            case["category"],
            case["difficulty"],
            case["rag_context"],
            case["market_snapshot"],
        )
        missing = [snippet for snippet in case["must_contain"] if snippet not in prompt]
        if missing:
            failed += 1
            print(f"[FAIL] prompt::{case['id']} missing snippets: {missing}")
            continue
        passed += 1
        print(f"[PASS] prompt::{case['id']}")
    return passed, failed


def run_output_checks() -> tuple[int, int]:
    passed = 0
    failed = 0
    for case in _load_output_cases():
        try:
            parsed = parse_scenario_json(case["raw_output"])
        except Exception as exc:
            failed += 1
            print(f"[FAIL] output::{case['id']} parse error: {exc}")
            continue

        missing = [k for k in case["required_keys"] if k not in parsed]
        title = str(parsed.get("title", ""))
        if missing or case["expected_title_contains"] not in title:
            failed += 1
            print(
                f"[FAIL] output::{case['id']} "
                f"missing_keys={missing} title={title!r}"
            )
            continue
        passed += 1
        print(f"[PASS] output::{case['id']}")
    return passed, failed


def main() -> int:
    prompt_passed, prompt_failed = run_prompt_checks()
    output_passed, output_failed = run_output_checks()
    total_passed = prompt_passed + output_passed
    total_failed = prompt_failed + output_failed
    print(f"Summary: passed={total_passed}, failed={total_failed}")
    return 1 if total_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
