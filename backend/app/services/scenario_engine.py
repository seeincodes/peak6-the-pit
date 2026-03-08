"""Scenario generation service using Claude + RAG context."""
import json
import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.prompts.scenario_generation import (
    SYSTEM_PROMPT,
    SCENARIO_TEMPLATE,
    CATEGORY_DISPLAY,
)
from app.services.rag import build_retrieval_query, retrieve_chunks

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)


def parse_scenario_json(raw: str) -> dict:
    """Parse LLM output into scenario dict, handling markdown fences."""
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*$", "", cleaned)
    return json.loads(cleaned.strip())


async def generate_scenario(
    db,
    category: str,
    difficulty: str = "beginner",
) -> dict:
    """Generate a single scenario using RAG context + Claude."""
    query = build_retrieval_query(category, difficulty)
    chunks = await retrieve_chunks(db, query, top_k=5)
    rag_context = "\n\n---\n\n".join(c["content"] for c in chunks)

    category_display = CATEGORY_DISPLAY.get(category, category.replace("_", " ").title())

    prompt = SCENARIO_TEMPLATE.format(
        difficulty=difficulty,
        category_display=category_display,
        rag_context=rag_context if rag_context else "No specific context available. Use general options trading knowledge.",
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    raw_text = message.content[0].text
    scenario_data = parse_scenario_json(raw_text)

    return {
        "category": category,
        "difficulty": difficulty,
        "content": scenario_data,
        "context_chunks": [c["content"] for c in chunks],
    }
