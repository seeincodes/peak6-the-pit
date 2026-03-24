"""Market Event lifecycle service."""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market_event import MarketEvent, EventParticipation, EventTeamScore
from app.models.user import User


async def create_event(
    db: AsyncSession,
    org_id: uuid.UUID,
    created_by: uuid.UUID,
    title: str,
    description: str,
    theme: str,
    start_at: datetime,
    end_at: datetime,
    scenario_pool: dict,
    scoring_config: dict,
    max_scenarios_per_user: Optional[int] = None,
) -> MarketEvent:
    """Create a new market event in draft status."""
    event = MarketEvent(
        org_id=org_id,
        created_by=created_by,
        title=title,
        description=description,
        theme=theme,
        start_at=start_at,
        end_at=end_at,
        scenario_pool=scenario_pool,
        scoring_config=scoring_config,
        max_scenarios_per_user=max_scenarios_per_user,
        status="draft",
    )
    db.add(event)
    await db.flush()
    return event


async def join_event(
    db: AsyncSession,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    team_identifier: Optional[str] = None,
) -> EventParticipation:
    """Join a market event. Raises ValueError if already joined."""
    existing = await db.execute(
        select(EventParticipation).where(
            EventParticipation.event_id == event_id,
            EventParticipation.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("User has already joined this event")

    participation = EventParticipation(
        event_id=event_id,
        user_id=user_id,
        team_identifier=team_identifier,
        individual_score=0.0,
        scenarios_completed=0,
    )
    db.add(participation)
    await db.flush()
    return participation


async def update_participation_score(
    db: AsyncSession,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    score: float,
) -> None:
    """Increment participation score and scenario count."""
    result = await db.execute(
        select(EventParticipation).where(
            EventParticipation.event_id == event_id,
            EventParticipation.user_id == user_id,
        )
    )
    participation = result.scalar_one_or_none()
    if participation is None:
        return
    participation.individual_score += score
    participation.scenarios_completed += 1
    await db.flush()


async def get_event_leaderboard(
    db: AsyncSession,
    event_id: uuid.UUID,
) -> list[dict]:
    """Return ranked participants for an event."""
    result = await db.execute(
        select(EventParticipation, User)
        .join(User, User.id == EventParticipation.user_id)
        .where(EventParticipation.event_id == event_id)
        .order_by(EventParticipation.individual_score.desc())
    )
    rows = result.all()
    leaderboard = []
    for rank, (participation, user) in enumerate(rows, start=1):
        leaderboard.append({
            "rank": rank,
            "user_id": str(user.id),
            "display_name": user.display_name,
            "level": user.level,
            "avatar_id": user.avatar_id,
            "individual_score": participation.individual_score,
            "scenarios_completed": participation.scenarios_completed,
            "team_identifier": participation.team_identifier,
        })
    return leaderboard


async def get_events_for_org(
    db: AsyncSession,
    org_id: uuid.UUID,
    status: Optional[str] = None,
) -> list[MarketEvent]:
    """List events for an org, optionally filtered by status."""
    stmt = select(MarketEvent).where(MarketEvent.org_id == org_id)
    if status is not None:
        stmt = stmt.where(MarketEvent.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def finalize_event(
    db: AsyncSession,
    event_id: uuid.UUID,
) -> None:
    """Set event status to completed and recalculate team scores."""
    event = await db.get(MarketEvent, event_id)
    if event is None:
        raise ValueError("Event not found")

    event.status = "completed"

    # Delete existing team scores for idempotency
    await db.execute(
        delete(EventTeamScore).where(EventTeamScore.event_id == event_id)
    )

    # Recalculate team scores by grouping participations
    result = await db.execute(
        select(EventParticipation).where(EventParticipation.event_id == event_id)
    )
    participations = result.scalars().all()

    teams: dict[str, list[EventParticipation]] = {}
    for p in participations:
        if p.team_identifier:
            teams.setdefault(p.team_identifier, []).append(p)

    for team_identifier, members in teams.items():
        aggregate_score = sum(m.individual_score for m in members)
        team_score = EventTeamScore(
            event_id=event_id,
            team_identifier=team_identifier,
            aggregate_score=aggregate_score,
            member_count=len(members),
        )
        db.add(team_score)

    await db.flush()
