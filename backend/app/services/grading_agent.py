"""Grading and Socratic probing service using Claude."""
import json
import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.constants import DIFFICULTY_MULTIPLIER, XP_BASE
from app.prompts.grading_rubric import (
    GRADING_SYSTEM_PROMPT,
    PROBE_TEMPLATE,
    GRADE_TEMPLATE,
)

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*$", "", cleaned)
    return json.loads(cleaned.strip())


def parse_grade_json(raw: str) -> dict:
    return _parse_json(raw)


def parse_probe_json(raw: str) -> dict:
    return _parse_json(raw)


def compute_xp(overall_score: float, difficulty: str, streak_days: int) -> int:
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    quality = overall_score / 5.0
    base = int(XP_BASE * multiplier * quality)
    streak_bonus = min(streak_days * 2, 20)
    return base + streak_bonus


async def generate_probe(
    scenario_content: dict,
    user_response: str,
) -> dict:
    """Generate a Socratic follow-up question."""
    prompt = PROBE_TEMPLATE.format(
        title=scenario_content["title"],
        setup=scenario_content["setup"],
        question=scenario_content["question"],
        user_response=user_response,
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return parse_probe_json(message.content[0].text)


async def grade_response(
    scenario_content: dict,
    conversation: list[dict],
) -> dict:
    """Grade the full conversation (response + probe answer)."""
    conversation_text = "\n\n".join(
        f"**{turn['role'].title()}:** {turn['content']}" for turn in conversation
    )

    prompt = GRADE_TEMPLATE.format(
        title=scenario_content["title"],
        setup=scenario_content["setup"],
        question=scenario_content["question"],
        conversation_text=conversation_text,
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )

    return parse_grade_json(message.content[0].text)
