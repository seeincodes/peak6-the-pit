from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.response import Response
from app.models.grade import Grade
from app.models.xp_transaction import XPTransaction
from app.models.user import User
from app.services.grading_agent import generate_probe, grade_response, compute_xp
from app.services.badge_service import check_and_award_badges
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/responses", tags=["responses"])


class SubmitRequest(BaseModel):
    scenario_id: str
    answer_text: str


class ContinueRequest(BaseModel):
    answer_text: str


@router.post("")
async def submit_response(
    req: SubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario = await db.get(Scenario, UUID(req.scenario_id))
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    conversation = [{"role": "user", "content": req.answer_text}]

    response = Response(
        user_id=user.id,
        scenario_id=scenario.id,
        conversation=conversation,
        is_complete=False,
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)

    probe = await generate_probe(scenario.content, req.answer_text)

    conversation.append({"role": "assistant", "content": probe["probe_question"]})
    response.conversation = conversation
    await db.commit()

    return {
        "response_id": str(response.id),
        "probe_question": probe["probe_question"],
    }


@router.post("/{response_id}/continue")
async def continue_response(
    response_id: UUID,
    req: ContinueRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response = await db.get(Response, response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    scenario = await db.get(Scenario, response.scenario_id)

    conversation = list(response.conversation)
    conversation.append({"role": "user", "content": req.answer_text})

    grade_data = await grade_response(scenario.content, conversation)

    response.conversation = conversation
    response.is_complete = True

    grade = Grade(
        response_id=response.id,
        dimension_scores=grade_data["dimension_scores"],
        overall_score=grade_data["overall_score"],
        feedback=grade_data["feedback"],
        confidence=grade_data.get("confidence"),
    )
    db.add(grade)

    xp_earned = compute_xp(grade_data["overall_score"], scenario.difficulty, user.streak_days)

    xp_tx = XPTransaction(
        user_id=user.id,
        amount=xp_earned,
        source="scenario",
        reference_id=response.id,
    )
    db.add(xp_tx)
    user.xp_total += xp_earned

    new_badges = await check_and_award_badges(user.id, db)

    await db.commit()

    return {
        "grade": {
            "dimension_scores": grade_data["dimension_scores"],
            "overall_score": grade_data["overall_score"],
            "feedback": grade_data["feedback"],
        },
        "xp_earned": xp_earned,
        "xp_total": user.xp_total,
        "level": user.level,
        "new_badges": new_badges,
    }
