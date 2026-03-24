"""Mentorship pairing, goals, and mentor XP service."""
import uuid
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
from app.models.mentorship import Mentorship, MentorshipGoal
from app.models.user import User
from app.models.skill_node import UserSkillMastery
from app.models.xp_transaction import XPTransaction
from app.services.notification_service import create_notification
from app.services.progression import compute_level_from_xp
from app.services.activity import emit_activity


async def request_mentorship(
    db: AsyncSession,
    org_id: uuid.UUID,
    mentor_id: uuid.UUID,
    mentee_id: uuid.UUID,
) -> Mentorship:
    """Create a pending mentorship request. Raises ValueError if an active one exists."""
    existing = await db.execute(
        select(Mentorship).where(
            and_(
                Mentorship.mentor_id == mentor_id,
                Mentorship.mentee_id == mentee_id,
                Mentorship.status == "active",
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("An active mentorship already exists for this mentor-mentee pair")

    mentorship = Mentorship(
        org_id=org_id,
        mentor_id=mentor_id,
        mentee_id=mentee_id,
        status="pending",
    )
    db.add(mentorship)
    await db.flush()

    # Notify the mentor
    await create_notification(
        db=db,
        user_id=mentor_id,
        type="mentorship_request",
        title="New Mentorship Request",
        body="Someone has requested you as their mentor.",
        payload={"mentorship_id": str(mentorship.id), "mentee_id": str(mentee_id)},
    )

    return mentorship


async def accept_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> Mentorship:
    """Accept a pending mentorship. Raises ValueError if not pending."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None:
        raise ValueError("Mentorship not found")
    if mentorship.status != "pending":
        raise ValueError(f"Cannot accept mentorship in status '{mentorship.status}'")

    mentorship.status = "active"
    mentorship.started_at = utc_now_naive()
    await db.flush()
    await emit_activity(db, mentorship.mentee_id, "mentorship_started", {"mentor_id": str(mentorship.mentor_id), "mentorship_id": str(mentorship.id)})
    return mentorship


async def decline_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> None:
    """Decline a pending mentorship request."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None:
        return
    if mentorship.status == "pending":
        mentorship.status = "declined"
        await db.flush()


async def cancel_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> None:
    """Cancel an active mentorship."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None:
        return
    if mentorship.status == "active":
        mentorship.status = "cancelled"
        mentorship.completed_at = utc_now_naive()
        await db.flush()


async def complete_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> None:
    """Mark an active mentorship as completed."""
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None:
        return
    if mentorship.status == "active":
        mentorship.status = "completed"
        mentorship.completed_at = utc_now_naive()
        await db.flush()


async def create_goal(
    db: AsyncSession,
    mentorship_id: uuid.UUID,
    category: str,
    target_mastery: float,
) -> MentorshipGoal:
    """Create a mastery goal for a mentorship."""
    goal = MentorshipGoal(
        mentorship_id=mentorship_id,
        category=category,
        target_mastery=target_mastery,
        current_mastery=0.0,
    )
    db.add(goal)
    await db.flush()
    return goal


async def get_available_mentors(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[dict]:
    """Return users with level >= 5 and at least 3 mastered categories (mastery_level >= 70)."""
    # Subquery: count of mastered categories per user
    mastered_subq = (
        select(
            UserSkillMastery.user_id,
            func.count(UserSkillMastery.id).label("mastered_count"),
        )
        .where(UserSkillMastery.mastery_level >= 70)
        .group_by(UserSkillMastery.user_id)
    ).subquery()

    result = await db.execute(
        select(User, mastered_subq.c.mastered_count)
        .join(mastered_subq, mastered_subq.c.user_id == User.id)
        .where(
            and_(
                User.org_id == org_id,
                User.level >= 5,
                mastered_subq.c.mastered_count >= 3,
            )
        )
        .order_by(User.level.desc())
    )
    rows = result.all()
    return [
        {
            "user_id": str(user.id),
            "display_name": user.display_name,
            "level": user.level,
            "avatar_id": user.avatar_id,
            "mastered_categories": mastered_count,
        }
        for user, mastered_count in rows
    ]


async def award_mentor_xp(
    db: AsyncSession,
    mentor_id: uuid.UUID,
    amount: int,
    reference_id: Optional[uuid.UUID] = None,
) -> None:
    """Award XP to a mentor and update their xp_total and level."""
    mentor = await db.get(User, mentor_id)
    if mentor is None:
        return

    txn = XPTransaction(
        user_id=mentor_id,
        amount=amount,
        source="mentorship",
        reference_id=reference_id,
    )
    db.add(txn)

    mentor.xp_total += amount
    mentor.level = compute_level_from_xp(mentor.xp_total)
    await db.flush()
