from datetime import datetime, timezone
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.response import Response
from app.models.grade import Grade
from app.models.xp_transaction import XPTransaction
from app.models.user import User
from app.services.grading_agent import generate_probe, grade_response, compute_xp, compute_xp_breakdown, generate_model_answer
from app.constants import XP_THRESHOLDS, RUBRIC_DIMENSIONS
from app.services.badge_service import check_and_award_badges
from app.services.path_progress import check_and_advance_paths
from app.services.streak import update_streak
from app.services.activity import emit_activity
from app.services.progression import get_level_title, compute_level_from_xp
from app.services.challenges import increment_challenge_progress
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/responses", tags=["responses"])


class SubmitRequest(BaseModel):
    scenario_id: str
    answer_text: str


class ContinueRequest(BaseModel):
    answer_text: str
    hints_used: int = 0


@router.post("")
async def submit_response(
    req: SubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario = await db.get(Scenario, UUID(req.scenario_id))
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    initial_answer = req.answer_text.strip()
    if not initial_answer:
        raise HTTPException(status_code=400, detail="Answer text is required")

    conversation = [{"role": "user", "content": initial_answer}]

    response = Response(
        user_id=user.id,
        scenario_id=scenario.id,
        conversation=conversation,
        is_complete=False,
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)

    probe = await generate_probe(scenario.content, initial_answer, category=scenario.category, difficulty=scenario.difficulty)

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

    final_answer = req.answer_text.strip()
    conversation = list(response.conversation)
    conversation.append({"role": "user", "content": final_answer})

    blank_submission = not final_answer
    if blank_submission:
        grade_data = {
            "dimension_scores": {dimension: 0 for dimension in RUBRIC_DIMENSIONS},
            "overall_score": 0.0,
            "feedback": "No answer submitted. Submit a response to earn XP and receive coaching feedback.",
        }
    else:
        grade_data = await grade_response(scenario.content, conversation, category=scenario.category, difficulty=scenario.difficulty)

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

    is_daily_first = False
    xp_earned = 0
    xp_breakdown = {
        "base": 0,
        "streak_bonus": 0,
        "perfect_bonus": 0,
        "no_hints_bonus": 0,
        "daily_first_bonus": 0,
        "hint_penalty_pct": 0,
        "total": 0,
    }
    new_badges = []
    path_advancements = []

    if not blank_submission:
        # Check if this is the user's first scenario completion today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        existing_today = await db.execute(
            select(func.count()).where(
                XPTransaction.user_id == user.id,
                XPTransaction.source == "scenario",
                XPTransaction.created_at >= today_start,
            )
        )
        is_daily_first = existing_today.scalar() == 0

        xp_breakdown = compute_xp_breakdown(
            grade_data["overall_score"],
            scenario.difficulty,
            user.streak_days,
            hints_used=req.hints_used,
            is_daily_first=is_daily_first,
        )
        xp_earned = xp_breakdown["total"]

        xp_tx = XPTransaction(
            user_id=user.id,
            amount=xp_earned,
            source="scenario",
            reference_id=response.id,
        )
        db.add(xp_tx)
        old_level = user.level
        user.xp_total = max(0, user.xp_total + xp_earned)
        user.level = compute_level_from_xp(user.xp_total)

        streak_result = await update_streak(user, db)

        new_badges = await check_and_award_badges(user.id, db)

        path_advancements = await check_and_advance_paths(
            db, user.id, scenario.category, scenario.difficulty,
            grade_data["overall_score"],
        )

        # Emit activity events
        await emit_activity(db, user.id, "completed_scenario", {
            "category": scenario.category,
            "difficulty": scenario.difficulty,
            "score": grade_data["overall_score"],
        })
        for badge in new_badges:
            await emit_activity(db, user.id, "earned_badge", badge)
        for adv in path_advancements:
            event_type = "path_completed" if adv["path_completed"] else "path_step_completed"
            await emit_activity(db, user.id, event_type, adv)
        if streak_result.get("milestone"):
            await emit_activity(db, user.id, "streak_milestone", {"streak_days": streak_result["milestone"]})
        if user.level > old_level:
            await emit_activity(db, user.id, "level_up", {
                "old_level": old_level,
                "new_level": user.level,
                "level_title": get_level_title(user.level),
            })

        # Update daily challenge progress
        await increment_challenge_progress(user.id, "complete_scenarios", db)

        if grade_data["overall_score"] >= 4.0:
            await increment_challenge_progress(user.id, "score_high", db)

        # try_category: check if this is the user's first scenario in this category today
        prior_in_category = await db.execute(
            select(func.count())
            .select_from(Response)
            .join(Scenario, Response.scenario_id == Scenario.id)
            .where(
                Response.user_id == user.id,
                Response.is_complete == True,  # noqa: E712
                Response.submitted_at >= today_start,
                Scenario.category == scenario.category,
                Response.id != response.id,
            )
        )
        if prior_in_category.scalar() == 0:
            await increment_challenge_progress(user.id, "try_category", db)

        await increment_challenge_progress(user.id, "streak_keep", db)

    await db.commit()

    return {
        "grade": {
            "dimension_scores": grade_data["dimension_scores"],
            "overall_score": grade_data["overall_score"],
            "feedback": grade_data["feedback"],
        },
        "xp_earned": xp_earned,
        "xp_breakdown": xp_breakdown,
        "xp_total": user.xp_total,
        "level": max(1, user.level),
        "level_progress": {
            "current_xp": user.xp_total,
            "level_min_xp": XP_THRESHOLDS[user.level],
            "level_max_xp": XP_THRESHOLDS[min(user.level + 1, len(XP_THRESHOLDS) - 1)],
        },
        "new_badges": new_badges,
        "hints_used": req.hints_used,
        "is_daily_first": is_daily_first,
        "bonuses": {
            "daily_first": is_daily_first,
            "perfect": grade_data["overall_score"] >= 4.5,
            "no_hints": req.hints_used == 0,
        },
        "path_advancements": path_advancements,
    }


@router.post("/{response_id}/model-answer")
async def get_model_answer(
    response_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response = await db.get(Response, response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    if response.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your response")

    scenario = await db.get(Scenario, response.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    model_answer = await generate_model_answer(
        scenario.content,
        category=scenario.category,
        difficulty=scenario.difficulty,
        scenario_id=scenario.id,
    )
    return {"model_answer": model_answer}


@router.get("/history")
async def get_response_history(
    category: Optional[str] = Query(None),
    max_score: Optional[float] = Query(None, le=5.0),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated history of completed responses with grades and scenario info."""
    stmt = (
        select(Response, Grade, Scenario)
        .join(Grade, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == user.id)
        .where(Response.is_complete == True)  # noqa: E712
        .order_by(desc(Response.submitted_at))
    )

    if category:
        stmt = stmt.where(Scenario.category == category)
    if max_score is not None:
        stmt = stmt.where(Grade.overall_score <= max_score)

    stmt = stmt.offset(offset).limit(limit)
    rows = (await db.execute(stmt)).all()

    return [
        {
            "response_id": str(r.id),
            "scenario_id": str(s.id),
            "category": s.category,
            "difficulty": s.difficulty,
            "title": s.content.get("title", ""),
            "question": s.content.get("question", ""),
            "conversation": r.conversation,
            "submitted_at": r.submitted_at.isoformat(),
            "grade": {
                "dimension_scores": g.dimension_scores,
                "overall_score": float(g.overall_score),
                "feedback": g.feedback,
            },
        }
        for r, g, s in rows
    ]
