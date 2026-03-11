"""Scenario generation service using Claude + RAG context."""
import asyncio
import json
import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.prompts.scenario_generation import (
    SYSTEM_PROMPT,
    SCENARIO_TEMPLATE,
    CATEGORY_DISPLAY,
)
from app.prompts.mcq_generation import (
    MCQ_SYSTEM_PROMPT,
    MCQ_TEMPLATE,
)
from app.services.rag import build_retrieval_query, retrieve_chunks
from app.services.market_data import get_market_snapshot
from app.services.scenario_graph import run_scenario_graph

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

# Categories where the model's built-in knowledge is sufficient.
# These skip the RAG embedding lookup + pgvector query (~0.5-1s saved).
SKIP_RAG_CATEGORIES = {
    "greeks",
    "macro",
    "technical_analysis",
    "risk_management",
    "position_sizing",
    "fundamentals",
    "commodities",
    "crypto",
    "fixed_income",
    "sentiment",
    "portfolio_mgmt",
}


def _needs_rag(category: str) -> bool:
    return category not in SKIP_RAG_CATEGORIES


def parse_scenario_json(raw: str) -> dict:
    """Parse LLM output into scenario dict, handling markdown fences."""
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*$", "", cleaned)
    return json.loads(cleaned.strip())


def build_scenario_prompt(
    category: str,
    difficulty: str,
    rag_context: str,
    market_snapshot: str,
) -> str:
    """Build the user prompt for scenario generation."""
    category_display = CATEGORY_DISPLAY.get(category, category.replace("_", " ").title())
    return SCENARIO_TEMPLATE.format(
        difficulty=difficulty,
        category_display=category_display,
        rag_context=rag_context
        if rag_context
        else "No specific context available. Use general options trading knowledge.",
        market_snapshot=market_snapshot,
    )


async def _get_context(db, category: str, difficulty: str) -> tuple[list[dict], str]:
    """Return (chunks, market_snapshot). Skips RAG for common categories."""
    market_task = get_market_snapshot()

    if _needs_rag(category):
        query = build_retrieval_query(category, difficulty)
        chunks, market_snapshot = await asyncio.gather(
            retrieve_chunks(db, query, top_k=3), market_task
        )
    else:
        chunks = []
        market_snapshot = await market_task

    return chunks, market_snapshot


async def generate_scenario(
    db,
    category: str,
    difficulty: str = "beginner",
) -> dict:
    """Generate a single scenario using optional RAG context + Claude."""
    chunks, market_snapshot = await _get_context(db, category, difficulty)
    rag_context = "\n\n---\n\n".join(c["content"] for c in chunks)
    prompt = build_scenario_prompt(category, difficulty, rag_context, market_snapshot)

    raw_text = await run_scenario_graph(prompt)
    scenario_data = parse_scenario_json(raw_text)

    return {
        "category": category,
        "difficulty": difficulty,
        "content": scenario_data,
        "context_chunks": [c["content"] for c in chunks],
    }


async def generate_mcq(
    db,
    category: str,
    difficulty: str = "beginner",
) -> dict:
    """Generate a single MCQ using optional RAG context + Claude."""
    chunks, market_snapshot = await _get_context(db, category, difficulty)
    rag_context = "\n\n---\n\n".join(c["content"] for c in chunks)

    category_display = CATEGORY_DISPLAY.get(category, category.replace("_", " ").title())

    prompt = MCQ_TEMPLATE.format(
        difficulty=difficulty,
        category_display=category_display,
        rag_context=rag_context if rag_context else "No specific context available. Use general options trading knowledge.",
        market_snapshot=market_snapshot,
    )

    message = await anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=MCQ_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
    )

    raw_text = message.content[0].text
    mcq_data = parse_scenario_json(raw_text)

    return {
        "category": category,
        "difficulty": difficulty,
        "content": mcq_data,
        "context_chunks": [c["content"] for c in chunks],
    }
