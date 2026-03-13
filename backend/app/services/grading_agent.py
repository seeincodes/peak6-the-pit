"""Grading and Socratic probing service using Claude."""
import json
import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.database import async_session as session_factory
from app.services.rag import build_retrieval_query, retrieve_chunks
from app.constants import (
    DIFFICULTY_MULTIPLIER, XP_BASE, HINT_XP_PENALTY,
    PERFECT_SCORE_BONUS, NO_HINTS_BONUS, DAILY_FIRST_SCENARIO_BONUS,
    STREAK_XP_PER_DAY, STREAK_XP_MAX, XP_FLOOR,
    MCQ_XP_CORRECT_GOOD, MCQ_XP_CORRECT_WEAK,
    MCQ_XP_WRONG_GOOD, MCQ_XP_WRONG_WEAK,
    MCQ_STREAK_BONUS, MCQ_STREAK_MAX_BONUS,
    DAILY_FIRST_MCQ_BONUS,
)
from app.prompts.grading_rubric import (
    GRADING_SYSTEM_PROMPT,
    PROBE_TEMPLATE,
    GRADE_TEMPLATE,
    MODEL_ANSWER_TEMPLATE,
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


def compute_xp_breakdown(
    overall_score: float,
    difficulty: str,
    streak_days: int,
    hints_used: int = 0,
    is_daily_first: bool = False,
) -> dict:
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    quality = overall_score / 5.0
    base = int(XP_BASE * multiplier * quality)

    hint_penalty_pct = 0
    if hints_used > 0:
        hint_penalty_pct = min(hints_used * int(HINT_XP_PENALTY * 100), 80)
        penalty = min(hints_used * HINT_XP_PENALTY, 0.8)
        base = int(base * (1.0 - penalty))

    # Keep XP intentionally low for weak answers by suppressing non-base bonuses.
    bonus_eligible = overall_score >= 3.0
    streak_bonus = min(streak_days * STREAK_XP_PER_DAY, STREAK_XP_MAX) if bonus_eligible else 0
    perfect_bonus = PERFECT_SCORE_BONUS if overall_score >= 4.5 else 0
    no_hints_bonus = NO_HINTS_BONUS if (hints_used == 0 and bonus_eligible) else 0
    daily_first_bonus = DAILY_FIRST_SCENARIO_BONUS if (is_daily_first and bonus_eligible) else 0

    total = base + streak_bonus + perfect_bonus + no_hints_bonus + daily_first_bonus
    total = max(total, XP_FLOOR)

    return {
        "base": base,
        "streak_bonus": streak_bonus,
        "perfect_bonus": perfect_bonus,
        "no_hints_bonus": no_hints_bonus,
        "daily_first_bonus": daily_first_bonus,
        "hint_penalty_pct": hint_penalty_pct,
        "total": total,
    }


def compute_xp(
    overall_score: float,
    difficulty: str,
    streak_days: int,
    hints_used: int = 0,
    is_daily_first: bool = False,
) -> int:
    return compute_xp_breakdown(overall_score, difficulty, streak_days, hints_used, is_daily_first)["total"]


async def _get_grading_context(category: str, difficulty: str) -> str:
    """Retrieve RAG context for grading based on scenario category."""
    query = build_retrieval_query(category, difficulty)
    async with session_factory() as db:
        chunks = await retrieve_chunks(db, query, top_k=3)
    if not chunks:
        return "No specific reference material available."
    return "\n\n---\n\n".join(c["content"] for c in chunks)


async def generate_probe(
    scenario_content: dict,
    user_response: str,
    category: str = "",
    difficulty: str = "beginner",
) -> dict:
    """Generate a Socratic follow-up question."""
    rag_context = await _get_grading_context(category, difficulty) if category else "No specific reference material available."

    prompt = PROBE_TEMPLATE.format(
        title=scenario_content["title"],
        setup=scenario_content["setup"],
        question=scenario_content["question"],
        user_response=user_response,
        rag_context=rag_context,
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
    category: str = "",
    difficulty: str = "beginner",
) -> dict:
    """Grade the full conversation (response + probe answer)."""
    rag_context = await _get_grading_context(category, difficulty) if category else "No specific reference material available."

    conversation_text = "\n\n".join(
        f"**{turn['role'].title()}:** {turn['content']}" for turn in conversation
    )

    prompt = GRADE_TEMPLATE.format(
        title=scenario_content["title"],
        setup=scenario_content["setup"],
        question=scenario_content["question"],
        conversation_text=conversation_text,
        rag_context=rag_context,
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )

    return parse_grade_json(message.content[0].text)


async def generate_model_answer(
    scenario_content: dict,
    category: str = "",
    difficulty: str = "beginner",
) -> str:
    """Generate a model (ideal) answer for a scenario."""
    rag_context = await _get_grading_context(category, difficulty) if category else "No specific reference material available."

    prompt = MODEL_ANSWER_TEMPLATE.format(
        title=scenario_content["title"],
        setup=scenario_content["setup"],
        question=scenario_content["question"],
        rag_context=rag_context,
    )

    message = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    result = _parse_json(message.content[0].text)
    return result["model_answer"]


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
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )

    return _parse_json(message.content[0].text)


def compute_mcq_xp_breakdown(
    is_correct: bool,
    justification_quality: str,
    streak_count: int,
    is_daily_first: bool = False,
) -> dict:
    """Compute XP breakdown for an MCQ response."""
    daily_first_bonus = DAILY_FIRST_MCQ_BONUS if is_daily_first else 0

    if not is_correct:
        base = MCQ_XP_WRONG_GOOD if justification_quality == "good" else MCQ_XP_WRONG_WEAK
        return {"base": base, "streak_bonus": 0, "daily_first_bonus": daily_first_bonus, "total": base + daily_first_bonus}

    if justification_quality == "good":
        base = MCQ_XP_CORRECT_GOOD
        streak_bonus = min(streak_count * MCQ_STREAK_BONUS, MCQ_STREAK_MAX_BONUS)
    else:
        base = MCQ_XP_CORRECT_WEAK
        streak_bonus = min(streak_count * (MCQ_STREAK_BONUS // 2), MCQ_STREAK_MAX_BONUS // 2)

    total = base + streak_bonus + daily_first_bonus
    return {"base": base, "streak_bonus": streak_bonus, "daily_first_bonus": daily_first_bonus, "total": total}


def compute_mcq_xp(
    is_correct: bool,
    justification_quality: str,
    streak_count: int,
    is_daily_first: bool = False,
) -> int:
    return compute_mcq_xp_breakdown(is_correct, justification_quality, streak_count, is_daily_first)["total"]
