"""Events router — Market Events CRUD, join, leaderboard."""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.market_event import MarketEvent
from app.models.user import User
from app.services.event_service import (
    create_event,
    join_event,
    get_event_leaderboard,
    get_events_for_org,
    finalize_event,
)
from app.services.activity import emit_activity

router = APIRouter(prefix="/api/events", tags=["events"])


# ── Request schemas ────────────────────────────────────────────────────────────

class CreateEventRequest(BaseModel):
    title: str
    description: str
    theme: str
    start_at: datetime
    end_at: datetime
    scenario_pool: dict
    scoring_config: dict
    max_scenarios_per_user: Optional[int] = None


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    scenario_pool: Optional[dict] = None
    scoring_config: Optional[dict] = None
    max_scenarios_per_user: Optional[int] = None


class JoinEventRequest(BaseModel):
    team_identifier: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("")
async def list_events(
    status_filter: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List market events for the current user's org."""
    events = await get_events_for_org(db, user.org_id, status=status_filter)
    return [_event_dict(e) for e in events]


@router.get("/{event_id}")
async def get_event(
    event_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get event detail (org-scoped)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_dict(event)


@router.post("")
async def create_event_endpoint(
    body: CreateEventRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new market event (admin only)."""
    event = await create_event(
        db=db,
        org_id=admin.org_id,
        created_by=admin.id,
        title=body.title,
        description=body.description,
        theme=body.theme,
        start_at=body.start_at,
        end_at=body.end_at,
        scenario_pool=body.scenario_pool,
        scoring_config=body.scoring_config,
        max_scenarios_per_user=body.max_scenarios_per_user,
    )
    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.put("/{event_id}")
async def update_event(
    event_id: uuid.UUID,
    body: UpdateEventRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a draft event (admin only)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != admin.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be updated")

    if body.title is not None:
        event.title = body.title
    if body.description is not None:
        event.description = body.description
    if body.theme is not None:
        event.theme = body.theme
    if body.start_at is not None:
        event.start_at = body.start_at
    if body.end_at is not None:
        event.end_at = body.end_at
    if body.scenario_pool is not None:
        event.scenario_pool = body.scenario_pool
    if body.scoring_config is not None:
        event.scoring_config = body.scoring_config
    if body.max_scenarios_per_user is not None:
        event.max_scenarios_per_user = body.max_scenarios_per_user

    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a draft event (admin only)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != admin.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be deleted")

    await db.delete(event)
    await db.commit()
    return {"ok": True}


@router.post("/{event_id}/activate")
async def activate_event(
    event_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate a draft event (admin only)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != admin.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be activated")

    event.status = "active"
    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.post("/{event_id}/finalize")
async def finalize_event_endpoint(
    event_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Finalize an active event (admin only)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != admin.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "active":
        raise HTTPException(status_code=400, detail="Only active events can be finalized")

    await finalize_event(db, event_id)
    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.post("/{event_id}/join")
async def join_event_endpoint(
    event_id: uuid.UUID,
    body: JoinEventRequest = JoinEventRequest(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a market event. team_identifier defaults to user.cohort if not provided."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "active":
        raise HTTPException(status_code=400, detail="Event is not active")

    team_identifier = body.team_identifier or user.cohort

    try:
        participation = await join_event(
            db=db,
            event_id=event_id,
            user_id=user.id,
            team_identifier=team_identifier,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    await emit_activity(db, user.id, "event_joined", {"event_id": str(event_id), "title": event.title})
    await db.commit()
    await db.refresh(participation)
    return {
        "participation_id": str(participation.id),
        "event_id": str(participation.event_id),
        "user_id": str(participation.user_id),
        "team_identifier": participation.team_identifier,
        "joined_at": participation.joined_at.isoformat(),
    }


@router.get("/{event_id}/leaderboard")
async def event_leaderboard(
    event_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the leaderboard for an event (org-scoped)."""
    event = await db.get(MarketEvent, event_id)
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")

    leaderboard = await get_event_leaderboard(db, event_id)
    return leaderboard


# ── Helpers ────────────────────────────────────────────────────────────────────

def _event_dict(event: MarketEvent) -> dict:
    return {
        "id": str(event.id),
        "org_id": str(event.org_id),
        "title": event.title,
        "description": event.description,
        "theme": event.theme,
        "start_at": event.start_at.isoformat(),
        "end_at": event.end_at.isoformat(),
        "scenario_pool": event.scenario_pool,
        "scoring_config": event.scoring_config,
        "max_scenarios_per_user": event.max_scenarios_per_user,
        "status": event.status,
        "created_by": str(event.created_by),
        "created_at": event.created_at.isoformat(),
    }
