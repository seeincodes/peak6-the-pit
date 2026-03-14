"""Peer review endpoints — queue and submission."""
import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.response import Response
from app.models.grade import Grade
from app.models.scenario import Scenario
from app.models.peer_review import PeerReview
from app.models.xp_transaction import XPTransaction
from app.middleware.auth import get_current_user
from app.services.streak import update_streak
from app.constants import (
    PEER_REVIEW_BASE_XP,
    PEER_REVIEW_QUALITY_BONUS,
    PEER_REVIEW_QUALITY_THRESHOLD,
    PEER_REVIEW_MAX_PER_RESPONSE,
)
from app.services.progression import compute_level_from_xp, get_level_title
from app.services.activity import emit_activity

router = APIRouter(prefix="/api/peer-review", tags=["peer-review"])


@router.get("/queue")
async def get_review_queue(
    limit: int = Query(10, ge=1, le=20),
    category: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return completed, AI-graded responses from other users not yet reviewed by current user."""
    already_reviewed = (
        select(PeerReview.response_id)
        .where(PeerReview.reviewer_id == current_user.id)
        .scalar_subquery()
    )

    filters = [
        Response.is_complete == True,  # noqa: E712
        Response.user_id != current_user.id,
        Response.id.notin_(already_reviewed),
    ]
    if category:
        filters.append(Scenario.category == category)

    # Count existing reviews per response
    review_count = (
        select(
            PeerReview.response_id,
            func.count(PeerReview.id).label("review_count"),
        )
        .group_by(PeerReview.response_id)
        .subquery()
    )

    stmt = (
        select(Response, Grade, Scenario, User)
        .join(Grade, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .join(User, Response.user_id == User.id)
        .outerjoin(review_count, review_count.c.response_id == Response.id)
        .where(and_(
            *filters,
            func.coalesce(review_count.c.review_count, 0) < PEER_REVIEW_MAX_PER_RESPONSE,
        ))
        .order_by(
            func.coalesce(review_count.c.review_count, 0).asc(),  # least-reviewed first
            Response.submitted_at.desc(),  # then newest
        )
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()

    def _normalize_conversation(conv) -> list[dict]:
        """Ensure conversation is always a flat list of {role, content} dicts."""
        if isinstance(conv, list):
            return conv
        if isinstance(conv, dict) and "turns" in conv:
            return conv["turns"]
        return []

    return {
        "queue": [
            {
                "response_id": str(r.id),
                "scenario_title": s.content.get("title", ""),
                "scenario_question": s.content.get("question", ""),
                "scenario_category": s.category,
                "scenario_difficulty": s.difficulty,
                "conversation": _normalize_conversation(r.conversation),
                "submitted_at": r.submitted_at.isoformat(),
                "author_display_name": u.display_name,
            }
            for r, g, s, u in rows
        ]
    }


@router.get("/queue/categories")
async def get_queue_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return categories with reviewable response counts."""
    already_reviewed = (
        select(PeerReview.response_id)
        .where(PeerReview.reviewer_id == current_user.id)
        .scalar_subquery()
    )

    # Reuse review_count subquery to exclude fully-reviewed responses
    review_count = (
        select(
            PeerReview.response_id,
            func.count(PeerReview.id).label("review_count"),
        )
        .group_by(PeerReview.response_id)
        .subquery()
    )

    stmt = (
        select(Scenario.category, func.count(Response.id).label("count"))
        .join(Scenario, Response.scenario_id == Scenario.id)
        .join(Grade, Grade.response_id == Response.id)
        .outerjoin(review_count, review_count.c.response_id == Response.id)
        .where(
            and_(
                Response.is_complete == True,  # noqa: E712
                Response.user_id != current_user.id,
                Response.id.notin_(already_reviewed),
                func.coalesce(review_count.c.review_count, 0) < PEER_REVIEW_MAX_PER_RESPONSE,
            )
        )
        .group_by(Scenario.category)
        .order_by(func.count(Response.id).desc())
    )
    rows = (await db.execute(stmt)).all()

    return [{"category": r.category, "count": r.count} for r in rows]


class PeerReviewRequest(BaseModel):
    response_id: str
    dimension_scores: dict = Field(
        ..., description="Scores for reasoning, terminology, overall (1-5 each)"
    )
    feedback: str = Field(..., min_length=10, max_length=500)


def _compute_quality_score(peer_scores: dict, ai_scores: dict) -> float:
    """Compute quality as cosine similarity between peer and AI scores (0-1)."""
    peer_vec = [
        peer_scores.get("reasoning", 3),
        peer_scores.get("terminology", 3),
        peer_scores.get("overall", 3),
    ]
    ai_vec = [
        ai_scores.get("reasoning", 3),
        ai_scores.get("terminology", 3),
        (ai_scores.get("trade_logic", 3) + ai_scores.get("risk_awareness", 3)) / 2.0,
    ]

    dot = sum(a * b for a, b in zip(peer_vec, ai_vec))
    mag_p = math.sqrt(sum(x**2 for x in peer_vec))
    mag_a = math.sqrt(sum(x**2 for x in ai_vec))

    if mag_p == 0 or mag_a == 0:
        return 0.0

    return max(0.0, min(1.0, dot / (mag_p * mag_a)))


@router.post("")
async def submit_peer_review(
    req: PeerReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a peer review for a response."""
    response_id = UUID(req.response_id)

    response = await db.get(Response, response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    if not response.is_complete:
        raise HTTPException(status_code=400, detail="Response not yet complete")
    if response.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot review your own response")

    existing = await db.execute(
        select(PeerReview).where(
            and_(
                PeerReview.reviewer_id == current_user.id,
                PeerReview.response_id == response_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already reviewed this response")

    required_dims = {"reasoning", "terminology", "overall"}
    if set(req.dimension_scores.keys()) != required_dims:
        raise HTTPException(status_code=400, detail=f"Must provide scores for: {required_dims}")
    for dim, score in req.dimension_scores.items():
        if not isinstance(score, (int, float)) or score < 1 or score > 5:
            raise HTTPException(status_code=400, detail=f"Score for {dim} must be 1-5")

    ai_grade_result = await db.execute(
        select(Grade).where(Grade.response_id == response_id)
    )
    ai_grade = ai_grade_result.scalar_one_or_none()

    quality_score = None
    if ai_grade:
        quality_score = _compute_quality_score(req.dimension_scores, ai_grade.dimension_scores)

    peer_review = PeerReview(
        reviewer_id=current_user.id,
        response_id=response_id,
        dimension_scores=req.dimension_scores,
        feedback=req.feedback,
        quality_score=quality_score,
    )
    db.add(peer_review)

    xp_amount = PEER_REVIEW_BASE_XP
    quality_bonus = False
    if quality_score is not None and quality_score >= PEER_REVIEW_QUALITY_THRESHOLD:
        xp_amount += PEER_REVIEW_QUALITY_BONUS
        quality_bonus = True

    xp_tx = XPTransaction(
        user_id=current_user.id,
        amount=xp_amount,
        source="peer_review",
        reference_id=peer_review.id,
    )
    db.add(xp_tx)
    old_level = current_user.level
    current_user.xp_total = max(0, current_user.xp_total + xp_amount)
    current_user.level = compute_level_from_xp(current_user.xp_total)

    await update_streak(current_user, db)

    if current_user.level > old_level:
        await emit_activity(db, current_user.id, "level_up", {
            "old_level": old_level,
            "new_level": current_user.level,
            "level_title": get_level_title(current_user.level),
        })

    await db.commit()

    return {
        "peer_review_id": str(peer_review.id),
        "quality_score": round(quality_score, 2) if quality_score is not None else None,
        "xp_earned": xp_amount,
        "quality_bonus": quality_bonus,
        "xp_total": current_user.xp_total,
    }


@router.get("/my-reviews")
async def get_my_reviews(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get reviews submitted by the current user."""
    stmt = (
        select(PeerReview, Scenario)
        .join(Response, PeerReview.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(PeerReview.reviewer_id == current_user.id)
        .order_by(PeerReview.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "review_id": str(pr.id),
            "scenario_title": s.content.get("title", ""),
            "dimension_scores": pr.dimension_scores,
            "feedback": pr.feedback,
            "quality_score": round(float(pr.quality_score), 2) if pr.quality_score else None,
            "created_at": pr.created_at.isoformat(),
        }
        for pr, s in rows
    ]


@router.get("/received")
async def get_received_reviews(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get peer reviews that others have left on the current user's responses."""
    stmt = (
        select(PeerReview, Scenario, User)
        .join(Response, PeerReview.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .join(User, PeerReview.reviewer_id == User.id)
        .where(Response.user_id == current_user.id)
        .order_by(PeerReview.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "review_id": str(pr.id),
            "reviewer_name": u.display_name,
            "scenario_title": s.content.get("title", ""),
            "scenario_question": s.content.get("question", ""),
            "scenario_category": s.category,
            "scenario_difficulty": s.difficulty,
            "dimension_scores": pr.dimension_scores,
            "feedback": pr.feedback,
            "quality_score": round(float(pr.quality_score), 2) if pr.quality_score else None,
            "created_at": pr.created_at.isoformat(),
        }
        for pr, s, u in rows
    ]
