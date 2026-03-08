from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.response import Response
from app.models.grade import Grade
from app.models.xp_transaction import XPTransaction
from app.models.user import User
from app.services.scenario_engine import generate_mcq
from app.services.grading_agent import grade_mcq_justification, compute_mcq_xp
from app.constants import MCQ_JUSTIFY_MAX_CHARS
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/mcq", tags=["mcq"])


class GenerateMCQRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"


class SubmitMCQRequest(BaseModel):
    scenario_id: UUID
    chosen_key: str = Field(pattern=r"^[A-D]$")
    justification: str = Field(max_length=MCQ_JUSTIFY_MAX_CHARS)
    streak_count: int = Field(default=0, ge=0)


@router.post("/generate")
async def generate(
    req: GenerateMCQRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mcq_data = await generate_mcq(db, req.category, req.difficulty)

    scenario = Scenario(
        category=mcq_data["category"],
        difficulty=mcq_data["difficulty"],
        content=mcq_data["content"],
        context_chunks=mcq_data.get("context_chunks"),
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)

    # Return question WITHOUT correct_key or explanation (don't leak answers)
    safe_content = {
        "context": mcq_data["content"]["context"],
        "question": mcq_data["content"]["question"],
        "choices": mcq_data["content"]["choices"],
    }

    return {
        "id": str(scenario.id),
        "category": scenario.category,
        "difficulty": scenario.difficulty,
        "content": safe_content,
    }


@router.post("/submit")
async def submit(
    req: SubmitMCQRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario = await db.get(Scenario, req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    content = scenario.content
    correct_key = content["correct_key"]
    is_correct = req.chosen_key == correct_key

    # Find chosen and correct text
    choices_by_key = {c["key"]: c["text"] for c in content["choices"]}
    chosen_text = choices_by_key.get(req.chosen_key, "")
    correct_text = choices_by_key.get(correct_key, "")

    # Grade justification via LLM
    grade_result = await grade_mcq_justification(
        question=content["question"],
        chosen_key=req.chosen_key,
        chosen_text=chosen_text,
        correct_key=correct_key,
        correct_text=correct_text,
        justification=req.justification,
    )

    justification_quality = grade_result.get("quality", "weak")

    # Save response
    response = Response(
        user_id=user.id,
        scenario_id=scenario.id,
        conversation=[
            {"role": "user", "content": req.justification},
            {"role": "system", "content": f"Chose: {req.chosen_key}, Correct: {correct_key}"},
        ],
        is_complete=True,
    )
    db.add(response)
    await db.flush()

    # Save grade
    overall_score = (5.0 if is_correct and justification_quality == "good"
                     else 4.0 if is_correct
                     else 2.0 if justification_quality == "good"
                     else 1.0)
    grade = Grade(
        response_id=response.id,
        dimension_scores={"correct": is_correct, "justification": justification_quality},
        overall_score=overall_score,
        feedback=grade_result.get("note", ""),
        confidence=0.9,
    )
    db.add(grade)

    # Compute XP with streak from frontend
    xp_earned = compute_mcq_xp(is_correct, justification_quality, req.streak_count)

    xp_tx = XPTransaction(
        user_id=user.id,
        amount=xp_earned,
        source="mcq",
        reference_id=response.id,
    )
    db.add(xp_tx)
    user.xp_total += xp_earned

    await db.commit()

    return {
        "is_correct": is_correct,
        "correct_key": correct_key,
        "explanation": content["explanation"],
        "justification_quality": justification_quality,
        "justification_note": grade_result.get("note", ""),
        "xp_earned": xp_earned,
        "xp_total": user.xp_total,
        "level": user.level,
    }
