"""Grading and Socratic probing service using Claude."""
import json
import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.constants import DIFFICULTY_MULTIPLIER, XP_BASE
from app.constants import (
    MCQ_XP_CORRECT_GOOD,
    MCQ_XP_CORRECT_WEAK,
    MCQ_XP_WRONG_GOOD,
    MCQ_XP_WRONG_WEAK,
    MCQ_STREAK_BONUS,
    MCQ_STREAK_MAX_BONUS,
)
from app.prompts.grading_rubric import (
    GRADING_SYSTEM_PROMPT,
    PROBE_TEMPLATE,
    GRADE_TEMPLATE,
)
from app.prompts.mcq_generation import MCQ_JUSTIFY_GRADE_TEMPLATE

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


async def grade_mcq_justification(
    question: str,
    chosen_key: str,
    chosen_text: str,
    correct_key: str,
    correct_text: str,
    justification: str,
) -> dict:
    """Grade the quality of an MCQ justification."""
    prompt = MCQ_JUSTIFY_GRADE_TEMPLATE.format(
        question=question,
        chosen_key=chosen_key,
        chosen_text=chosen_text,
        correct_key=correct_key,
        correct_text=correct_text,
        justification=justification,
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )

    return _parse_json(message.content[0].text)


def compute_mcq_xp(is_correct: bool, justification_quality: str, streak_count: int) -> int:
    """Compute XP for an MCQ response.

    XP rewards both correctness and reasoning quality:
    - Correct + good reasoning: 8 XP base + streak bonus
    - Correct + weak reasoning: 5 XP base + reduced streak bonus
    - Wrong + good reasoning: 3 XP (partial credit for sound thinking)
    - Wrong + weak reasoning: 1 XP

    streak_count: number of consecutive correct answers (0-based, before this answer).
    """
    if not is_correct:
        return MCQ_XP_WRONG_GOOD if justification_quality == "good" else MCQ_XP_WRONG_WEAK

    if justification_quality == "good":
        base = MCQ_XP_CORRECT_GOOD
        streak_bonus = min(streak_count * MCQ_STREAK_BONUS, MCQ_STREAK_MAX_BONUS)
    else:
        base = MCQ_XP_CORRECT_WEAK
        streak_bonus = min(streak_count * (MCQ_STREAK_BONUS // 2), MCQ_STREAK_MAX_BONUS // 2)

    return base + streak_bonus
