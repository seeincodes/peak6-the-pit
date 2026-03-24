"""Mentorships router — pairing, goals, and mentor/mentee workflows."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.mentorship import Mentorship, MentorshipGoal
from app.models.user import User
from app.services.mentorship_service import (
    request_mentorship,
    accept_mentorship,
    decline_mentorship,
    cancel_mentorship,
    complete_mentorship,
    create_goal,
    get_available_mentors,
)
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/mentorships", tags=["mentorships"])


# ── Request schemas ─────────────────────────────────────────────────────────────

class RequestMentorshipBody(BaseModel):
    mentor_id: str


class CreateGoalBody(BaseModel):
    category: str
    target_mastery: float


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _mentorship_dict(m: Mentorship) -> dict:
    return {
        "id": str(m.id),
        "org_id": str(m.org_id),
        "mentor_id": str(m.mentor_id),
        "mentee_id": str(m.mentee_id),
        "status": m.status,
        "started_at": m.started_at.isoformat() if m.started_at else None,
        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
        "notes": m.notes,
    }


def _goal_dict(g: MentorshipGoal) -> dict:
    return {
        "id": str(g.id),
        "mentorship_id": str(g.mentorship_id),
        "category": g.category,
        "target_mastery": g.target_mastery,
        "current_mastery": g.current_mastery,
        "created_at": g.created_at.isoformat() if g.created_at else None,
        "achieved_at": g.achieved_at.isoformat() if g.achieved_at else None,
    }


# ── Endpoints (static paths FIRST, then parameterized) ──────────────────────────

# 1. GET /api/mentorships/mentors/available — MUST be before {mentorship_id} routes
@router.get("/mentors/available")
async def list_available_mentors(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List users eligible to be mentors in the current org."""
    return await get_available_mentors(db, user.org_id)


# 2. GET /api/mentorships — list user's mentorships
@router.get("")
async def list_mentorships(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List mentorships where the current user is mentor or mentee."""
    result = await db.execute(
        select(Mentorship).where(
            or_(
                Mentorship.mentor_id == user.id,
                Mentorship.mentee_id == user.id,
            )
        ).order_by(Mentorship.started_at.desc())
    )
    return [_mentorship_dict(m) for m in result.scalars().all()]


# 3. POST /api/mentorships/request — mentee requests a mentor
@router.post("/request")
async def request_mentorship_endpoint(
    body: RequestMentorshipBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a mentorship request (caller is the mentee)."""
    try:
        mentor_id = uuid.UUID(body.mentor_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid mentor_id")

    try:
        mentorship = await request_mentorship(
            db=db,
            org_id=user.org_id,
            mentor_id=mentor_id,
            mentee_id=user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    await db.commit()
    await db.refresh(mentorship)
    return _mentorship_dict(mentorship)


# 4. PUT /api/mentorships/{mentorship_id}/accept
@router.put("/{mentorship_id}/accept")
async def accept_mentorship_endpoint(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mentor accepts a pending mentorship request."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can accept")

    try:
        mentorship = await accept_mentorship(db, mentorship_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.commit()
    await db.refresh(mentorship)
    return _mentorship_dict(mentorship)


# 5. PUT /api/mentorships/{mentorship_id}/decline
@router.put("/{mentorship_id}/decline")
async def decline_mentorship_endpoint(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mentor declines a pending mentorship request."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can decline")

    await decline_mentorship(db, mentorship_id)
    await db.commit()
    return {"ok": True}


# 6. PUT /api/mentorships/{mentorship_id}/cancel
@router.put("/{mentorship_id}/cancel")
async def cancel_mentorship_endpoint(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an active mentorship (mentor or mentee)."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id and mentorship.mentee_id != user.id:
        raise HTTPException(status_code=403, detail="Not a participant of this mentorship")

    await cancel_mentorship(db, mentorship_id)
    await db.commit()
    return {"ok": True}


# 7. PUT /api/mentorships/{mentorship_id}/complete
@router.put("/{mentorship_id}/complete")
async def complete_mentorship_endpoint(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete an active mentorship (mentor or mentee)."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id and mentorship.mentee_id != user.id:
        raise HTTPException(status_code=403, detail="Not a participant of this mentorship")

    await complete_mentorship(db, mentorship_id)
    await db.commit()
    return {"ok": True}


# 8. GET /api/mentorships/{mentorship_id}/goals
@router.get("/{mentorship_id}/goals")
async def list_goals(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List goals for a mentorship."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id and mentorship.mentee_id != user.id:
        raise HTTPException(status_code=403, detail="Not a participant of this mentorship")

    result = await db.execute(
        select(MentorshipGoal)
        .where(MentorshipGoal.mentorship_id == mentorship_id)
        .order_by(MentorshipGoal.created_at)
    )
    return [_goal_dict(g) for g in result.scalars().all()]


# 9. POST /api/mentorships/{mentorship_id}/goals
@router.post("/{mentorship_id}/goals")
async def create_goal_endpoint(
    mentorship_id: uuid.UUID,
    body: CreateGoalBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a mastery goal for a mentorship."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id and mentorship.mentee_id != user.id:
        raise HTTPException(status_code=403, detail="Not a participant of this mentorship")

    goal = await create_goal(
        db=db,
        mentorship_id=mentorship_id,
        category=body.category,
        target_mastery=body.target_mastery,
    )
    await db.commit()
    await db.refresh(goal)
    return _goal_dict(goal)


# 10. POST /api/mentorships/{mentorship_id}/nudge
@router.post("/{mentorship_id}/nudge")
async def nudge_mentee(
    mentorship_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mentor sends a nudge notification to their mentee."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    if mentorship.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can send a nudge")

    await create_notification(
        db=db,
        user_id=mentorship.mentee_id,
        type="mentorship_nudge",
        title="Your mentor sent you a nudge",
        body="Your mentor is checking in — time to practice!",
        payload={"mentorship_id": str(mentorship_id), "mentor_id": str(user.id)},
    )
    await db.commit()
    return {"ok": True}
