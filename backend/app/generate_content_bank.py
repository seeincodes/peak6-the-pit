"""One-time batch generation of scenario and MCQ content banks.

Run via: python -m app.generate_content_bank
Generates N scenarios and M MCQs per (category, difficulty) slot, storing
them in the scenario_bank and mcq_bank tables for instant serving.

Idempotent: skips any slot that already has ≥ target count.
"""
import asyncio
import json
import logging
import sys

from sqlalchemy import select, func

from app.constants import SCENARIO_CATEGORIES
from app.database import async_session
from app.models.scenario_bank import ScenarioBank
from app.models.mcq_bank import MCQBank
from app.services.scenario_engine import (
    _get_context,
    build_scenario_prompt,
    build_rag_context,
    parse_scenario_json,
    generate_mcq,
)
from app.services.scenario_graph import run_scenario_graph

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

DIFFICULTIES = ["beginner", "intermediate", "advanced"]
TARGET_SCENARIOS_PER_SLOT = 5
TARGET_MCQS_PER_SLOT = 10
CONCURRENCY = 5


async def _count_existing(db, model, category: str, difficulty: str) -> int:
    result = await db.execute(
        select(func.count()).where(
            model.category == category,
            model.difficulty == difficulty,
        )
    )
    return result.scalar_one()


async def _generate_one_scenario(category: str, difficulty: str) -> dict | None:
    """Generate and return one scenario content dict."""
    try:
        async with async_session() as db:
            chunks, market_snapshot = await _get_context(db, category, difficulty)
            rag_context, _ = build_rag_context(chunks)
            prompt = build_scenario_prompt(category, difficulty, rag_context, market_snapshot)
            raw = await run_scenario_graph(prompt)
            return parse_scenario_json(raw)
    except Exception as e:
        logger.warning("Failed to generate scenario %s/%s: %s", category, difficulty, e)
        return None


async def _generate_one_mcq(category: str, difficulty: str) -> dict | None:
    """Generate and return one MCQ content dict."""
    try:
        async with async_session() as db:
            result = await generate_mcq(db, category, difficulty)
            return result.get("content")
    except Exception as e:
        logger.warning("Failed to generate MCQ %s/%s: %s", category, difficulty, e)
        return None


async def _fill_slot_scenarios(category: str, difficulty: str) -> int:
    """Fill scenario bank for one slot. Returns number of new scenarios."""
    async with async_session() as db:
        existing = await _count_existing(db, ScenarioBank, category, difficulty)
    needed = TARGET_SCENARIOS_PER_SLOT - existing
    if needed <= 0:
        return 0

    logger.info("Generating %d scenarios for %s/%s (have %d)", needed, category, difficulty, existing)
    added = 0
    for _ in range(needed):
        content = await _generate_one_scenario(category, difficulty)
        if content:
            async with async_session() as db:
                db.add(ScenarioBank(category=category, difficulty=difficulty, content=content))
                await db.commit()
            added += 1
    return added


async def _fill_slot_mcqs(category: str, difficulty: str) -> int:
    """Fill MCQ bank for one slot. Returns number of new MCQs."""
    async with async_session() as db:
        existing = await _count_existing(db, MCQBank, category, difficulty)
    needed = TARGET_MCQS_PER_SLOT - existing
    if needed <= 0:
        return 0

    logger.info("Generating %d MCQs for %s/%s (have %d)", needed, category, difficulty, existing)
    added = 0
    for _ in range(needed):
        content = await _generate_one_mcq(category, difficulty)
        if content:
            async with async_session() as db:
                db.add(MCQBank(category=category, difficulty=difficulty, content=content))
                await db.commit()
            added += 1
    return added


async def _process_slot(category: str, difficulty: str, semaphore: asyncio.Semaphore) -> tuple[int, int]:
    """Process one (category, difficulty) slot with concurrency control."""
    async with semaphore:
        scenarios = await _fill_slot_scenarios(category, difficulty)
        mcqs = await _fill_slot_mcqs(category, difficulty)
        return scenarios, mcqs


async def generate_all() -> None:
    """Generate content for all category/difficulty combinations."""
    slots = [(cat, diff) for cat in SCENARIO_CATEGORIES for diff in DIFFICULTIES]
    logger.info("Processing %d slots (concurrency=%d)", len(slots), CONCURRENCY)

    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = [_process_slot(cat, diff, semaphore) for cat, diff in slots]
    results = await asyncio.gather(*tasks)

    total_scenarios = sum(r[0] for r in results)
    total_mcqs = sum(r[1] for r in results)
    logger.info("Done. Generated %d scenarios, %d MCQs", total_scenarios, total_mcqs)


if __name__ == "__main__":
    asyncio.run(generate_all())
