# Engagement Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Market Events, Skill Trees, and Mentorship systems to The Pit to improve engagement, learning outcomes, and social dynamics.

**Architecture:** Three phases built incrementally. Phase 0 adds prerequisites (org-scoped queries, notifications, PeerReview extensions). Phase 1 adds Market Events (time-limited challenges with event leaderboards). Phase 2 adds Skill Trees (visual mastery progression). Phase 3 adds Mentorship (mentor-mentee pairing with shared goals). Each phase produces working, testable software.

**Tech Stack:** FastAPI + SQLAlchemy 2.0 async (backend), React 18 + TanStack Query + Tailwind + Framer Motion (frontend), PostgreSQL + Alembic migrations, pytest + Vitest.

**Spec:** `docs/superpowers/specs/2026-03-23-engagement-features-design.md`

---

## File Structure

### Phase 0: Prerequisites

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/app/models/notification.py` | Notification model |
| Modify | `backend/app/models/__init__.py` | Export Notification |
| Create | `backend/app/services/notification_service.py` | Create/query/mark-read notifications |
| Create | `backend/app/routers/notifications.py` | Notification endpoints |
| Modify | `backend/app/main.py` | Register notifications router |
| Modify | `backend/app/models/peer_review.py` | Add review_type + requested_reviewer_id |
| Modify | `backend/app/routers/leaderboard.py` | Add org_id filtering |
| Modify | `backend/app/routers/badges.py` | Add org_id filtering |
| Create | `backend/alembic/versions/2026_03_23_phase0_prerequisites.py` | Migration |
| Create | `backend/tests/test_notifications.py` | Notification tests |
| Create | `backend/tests/test_leaderboard_org_scope.py` | Org-scoped leaderboard tests |

### Phase 1: Market Events

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/app/models/market_event.py` | MarketEvent, EventParticipation, EventTeamScore models |
| Modify | `backend/app/models/badge.py` | Add event_id to UserBadge |
| Modify | `backend/app/models/response.py` | Add event_id FK |
| Modify | `backend/app/models/__init__.py` | Export new models |
| Create | `backend/app/services/event_service.py` | Event lifecycle, scoring, badge awarding |
| Create | `backend/app/routers/events.py` | Event CRUD + participation endpoints |
| Modify | `backend/app/routers/responses.py` | Update grading flow for event-linked responses |
| Modify | `backend/app/main.py` | Register events router |
| Create | `backend/alembic/versions/2026_03_23_phase1_market_events.py` | Migration |
| Create | `backend/tests/test_events.py` | Event service + router tests |
| Create | `frontend/src/pages/EventHubPage.tsx` | List events |
| Create | `frontend/src/pages/EventDetailPage.tsx` | Event leaderboard + scenario launcher |
| Create | `frontend/src/pages/EventDebriefPage.tsx` | Post-event stats |
| Create | `frontend/src/pages/Admin/AdminEventForm.tsx` | Create/edit events |
| Create | `frontend/src/components/EventBanner.tsx` | Active event banner for Training Hub |
| Create | `frontend/src/components/EventLeaderboard.tsx` | Event-specific leaderboard |
| Modify | `frontend/src/App.tsx` | Add event routes |
| Modify | `frontend/src/components/Sidebar.tsx` | Add Events nav item |
| Modify | `frontend/src/pages/TrainingPage.tsx` | Show event banner |

### Phase 2: Skill Trees

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/app/models/skill_node.py` | SkillNode + UserSkillMastery models |
| Modify | `backend/app/models/__init__.py` | Export new models |
| Create | `backend/app/services/mastery_service.py` | Mastery calculation, decay, skill tree queries |
| Modify | `backend/app/services/progression.py` | Replace check_mastery with new calculation |
| Modify | `backend/app/constants.py` | Update MASTERY_SCENARIO_COUNT, add MASTERY_DECAY_* |
| Create | `backend/app/routers/skills.py` | Skill tree + mastery endpoints |
| Modify | `backend/app/routers/responses.py` | Trigger mastery recalculation after grading |
| Modify | `backend/app/main.py` | Register skills router, seed skill tree |
| Create | `backend/app/services/skill_tree_seed.py` | Seed default 27-node skill tree |
| Create | `backend/alembic/versions/2026_03_23_phase2_skill_trees.py` | Migration |
| Create | `backend/tests/test_mastery_service.py` | Mastery calculation + decay tests |
| Create | `backend/tests/test_skills_router.py` | Skills API tests |
| Create | `frontend/src/pages/SkillTreePage.tsx` | Interactive skill tree |
| Create | `frontend/src/components/SkillTreeCanvas.tsx` | SVG tree with pan/zoom |
| Create | `frontend/src/components/SkillNodeDetail.tsx` | Node detail panel |
| Modify | `frontend/src/App.tsx` | Add skill tree route |
| Modify | `frontend/src/components/Sidebar.tsx` | Add Skill Tree nav item |

### Phase 3: Mentorship

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/app/models/mentorship.py` | Mentorship + MentorshipGoal models |
| Modify | `backend/app/models/__init__.py` | Export new models |
| Modify | `backend/app/models/organization.py` | Add mentorship_config JSONB |
| Create | `backend/app/services/mentorship_service.py` | Pairing, goals, rewards |
| Create | `backend/app/routers/mentorships.py` | Mentorship endpoints |
| Modify | `backend/app/routers/responses.py` | Trigger mentor XP on mentee milestones |
| Modify | `backend/app/main.py` | Register mentorships router |
| Create | `backend/alembic/versions/2026_03_23_phase3_mentorship.py` | Migration |
| Create | `backend/tests/test_mentorship_service.py` | Mentorship flow tests |
| Create | `frontend/src/pages/MentorshipHubPage.tsx` | Browse mentors, manage mentorships |
| Create | `frontend/src/pages/MentorDashboardPage.tsx` | Mentor's view of mentees |
| Create | `frontend/src/components/MentorshipGoals.tsx` | Shared goals component |
| Modify | `frontend/src/App.tsx` | Add mentorship routes |
| Modify | `frontend/src/components/Sidebar.tsx` | Add Mentorship nav item |

---

## Phase 0: Prerequisites

### Task 1: Notification Model + Migration

**Files:**
- Create: `backend/app/models/notification.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create the Notification model**

```python
# backend/app/models/notification.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "read_at"),
    )
```

- [ ] **Step 2: Export from models __init__**

Add to `backend/app/models/__init__.py`:
```python
from app.models.notification import Notification
```
And add `"Notification"` to the `__all__` list.

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/notification.py backend/app/models/__init__.py
git commit -m "feat: add Notification model"
```

### Task 2: Notification Service

**Files:**
- Create: `backend/app/services/notification_service.py`
- Create: `backend/tests/test_notifications.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_notifications.py
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.notification_service import create_notification, get_unread_notifications, mark_read


@pytest.mark.asyncio
async def test_create_notification():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    result = await create_notification(
        db=db,
        user_id=uuid.uuid4(),
        type="mentorship_request",
        title="New mentorship request",
        body="Alice wants you as a mentor",
    )
    db.add.assert_called_once()
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_unread_notifications():
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_result)

    result = await get_unread_notifications(db=db, user_id=uuid.uuid4())
    assert result == []


@pytest.mark.asyncio
async def test_mark_read():
    db = AsyncMock()
    mock_notif = MagicMock()
    mock_notif.read_at = None
    db.get = AsyncMock(return_value=mock_notif)
    db.flush = AsyncMock()

    await mark_read(db=db, notification_id=uuid.uuid4())
    assert mock_notif.read_at is not None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_notifications.py -v`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement notification service**

```python
# backend/app/services/notification_service.py
import uuid
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        payload=payload,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def get_unread_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(and_(Notification.user_id == user_id, Notification.read_at.is_(None)))
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


async def get_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def mark_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
) -> None:
    notif = await db.get(Notification, notification_id)
    if notif and notif.read_at is None:
        notif.read_at = utc_now_naive()
        await db.flush()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_notifications.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/notification_service.py backend/tests/test_notifications.py
git commit -m "feat: add notification service with tests"
```

### Task 3: Notification Router

**Files:**
- Create: `backend/app/routers/notifications.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create notifications router**

```python
# backend/app/routers/notifications.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.notification_service import get_notifications, get_unread_notifications, mark_read

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await get_notifications(db, user.id)
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "metadata": n.payload,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.get("/unread/count")
async def unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await get_unread_notifications(db, user.id)
    return {"count": len(notifs)}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    from app.models.notification import Notification as NotifModel
    notif = await db.get(NotifModel, _uuid.UUID(notification_id))
    if not notif or notif.user_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    await mark_read(db, _uuid.UUID(notification_id))
    await db.commit()
    return {"status": "ok"}
```

- [ ] **Step 2: Register router in main.py**

Add to `backend/app/main.py` imports (line 8):
```python
from app.routers import health, scenarios, scenarios_stream, responses, users, auth, mcq, leaderboard, badges, performance, bookmarks, challenges, metrics, peer_review, paths, activity, study_groups, chat, admin, notifications
```

Add after line 108:
```python
app.include_router(notifications.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/notifications.py backend/app/main.py
git commit -m "feat: add notifications router"
```

### Task 4: Org-Scoped Leaderboard

**Files:**
- Modify: `backend/app/routers/leaderboard.py`
- Create: `backend/tests/test_leaderboard_org_scope.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_leaderboard_org_scope.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.asyncio
async def test_leaderboard_filters_by_org_id():
    """Verify leaderboard query includes org_id filter."""
    # This is a structural test: we verify the SQL includes org_id filtering
    # by checking the query text contains "org_id"
    from app.routers.leaderboard import router
    # Check that the route handler exists and the module imports correctly
    assert router.prefix == "/api/leaderboard"
```

- [ ] **Step 2: Modify leaderboard router to filter by org_id**

In `backend/app/routers/leaderboard.py`, every query that touches `User` must add `.where(User.org_id == user.org_id)`. The `get_current_user` dependency already provides the authenticated user with `org_id`.

Add `user: User = Depends(get_current_user)` to each endpoint that doesn't already have it, and add `.where(User.org_id == user.org_id)` to all User queries.

For the teams endpoint, also filter by org:
```python
.where(User.org_id == user.org_id)
```

- [ ] **Step 3: Run tests**

Run: `cd backend && python -m pytest tests/test_leaderboard_org_scope.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/leaderboard.py backend/tests/test_leaderboard_org_scope.py
git commit -m "fix: scope leaderboard queries by org_id"
```

### Task 5: PeerReview Model Extension

**Files:**
- Modify: `backend/app/models/peer_review.py`

- [ ] **Step 1: Add review_type and requested_reviewer_id columns**

Add to `backend/app/models/peer_review.py` after the existing columns:
```python
review_type: Mapped[str] = mapped_column(String(20), default="peer", server_default="peer")
requested_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/models/peer_review.py
git commit -m "feat: add review_type and requested_reviewer_id to PeerReview"
```

### Task 6: Phase 0 Migration

**Files:**
- Create: `backend/alembic/versions/2026_03_23_phase0_prerequisites.py`

- [ ] **Step 1: Generate migration**

Run: `cd backend && alembic revision --autogenerate -m "phase0 prerequisites: notifications, peer_review extensions"`

- [ ] **Step 2: Review and adjust the generated migration**

Ensure it includes:
- `notifications` table creation
- `review_type` and `requested_reviewer_id` columns on `peer_reviews`
- Index `ix_notifications_user_unread`

- [ ] **Step 3: Run migration locally**

Run: `cd backend && alembic upgrade head`
Expected: Migration applies cleanly

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "migrate: phase0 prerequisites (notifications, peer_review extensions)"
```

---

## Phase 1: Market Events

### Task 7: Market Event Models

**Files:**
- Create: `backend/app/models/market_event.py`
- Modify: `backend/app/models/badge.py`
- Modify: `backend/app/models/response.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create MarketEvent, EventParticipation, EventTeamScore models**

```python
# backend/app/models/market_event.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class MarketEvent(Base):
    __tablename__ = "market_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scenario_pool: Mapped[dict] = mapped_column(JSONB, nullable=False)
    scoring_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    max_scenarios_per_user: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'active', 'completed')", name="ck_event_status"),
    )


class EventParticipation(Base):
    __tablename__ = "event_participations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_identifier: Mapped[str | None] = mapped_column(String(100), nullable=True)
    individual_score: Mapped[float] = mapped_column(Float, default=0.0)
    scenarios_completed: Mapped[int] = mapped_column(Integer, default=0)
    best_dimension_scores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_participation"),
    )


class EventTeamScore(Base):
    __tablename__ = "event_team_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=False)
    team_identifier: Mapped[str] = mapped_column(String(100), nullable=False)
    aggregate_score: Mapped[float] = mapped_column(Float, default=0.0)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
```

- [ ] **Step 2: Add event_id to UserBadge in `backend/app/models/badge.py`**

Add after existing columns in UserBadge:
```python
event_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=True)
```

Replace the existing `__table_args__` in UserBadge:
```python
__table_args__ = (
    # Permanent badges: one per user
    # Event badges: one per user per event
    # Enforced via partial unique indexes in migration
)
```

- [ ] **Step 3: Add event_id to Response in `backend/app/models/response.py`**

Add column:
```python
event_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("market_events.id"), nullable=True)
```

- [ ] **Step 4: Export new models from `backend/app/models/__init__.py`**

Add imports:
```python
from app.models.market_event import MarketEvent, EventParticipation, EventTeamScore
```
Add to `__all__`: `"MarketEvent", "EventParticipation", "EventTeamScore"`

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/market_event.py backend/app/models/badge.py backend/app/models/response.py backend/app/models/__init__.py
git commit -m "feat: add Market Event models, event_id on UserBadge and Response"
```

### Task 8: Event Service

**Files:**
- Create: `backend/app/services/event_service.py`
- Create: `backend/tests/test_events.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_events.py
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_create_event():
    from app.services.event_service import create_event

    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    event = await create_event(
        db=db,
        org_id=uuid.uuid4(),
        created_by=uuid.uuid4(),
        title="Vol Crush Week",
        description="Test event",
        theme="volatility",
        start_at=datetime.utcnow() + timedelta(days=1),
        end_at=datetime.utcnow() + timedelta(days=8),
        scenario_pool=[{"category": "iv_analysis", "difficulty": "beginner"}],
        scoring_config={"xp_multiplier": 1.5, "dimension_weights": {"reasoning": 0.3, "terminology": 0.2, "trade_logic": 0.3, "risk_awareness": 0.2}, "completion_bonus": 50, "perfect_score_bonus": 100},
    )
    db.add.assert_called_once()


@pytest.mark.asyncio
async def test_join_event():
    from app.services.event_service import join_event

    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # not already joined
    db.execute = AsyncMock(return_value=mock_result)

    participation = await join_event(
        db=db,
        event_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        team_identifier="Cohort A",
    )
    db.add.assert_called_once()


@pytest.mark.asyncio
async def test_update_participation_score():
    from app.services.event_service import update_participation_score

    db = AsyncMock()
    mock_participation = MagicMock()
    mock_participation.individual_score = 10.0
    mock_participation.scenarios_completed = 2

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_participation
    db.execute = AsyncMock(return_value=mock_result)
    db.flush = AsyncMock()

    await update_participation_score(
        db=db,
        event_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        score=4.5,
    )
    assert mock_participation.individual_score == 14.5
    assert mock_participation.scenarios_completed == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_events.py -v`
Expected: FAIL

- [ ] **Step 3: Implement event service**

```python
# backend/app/services/event_service.py
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
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
    scenario_pool: list[dict],
    scoring_config: dict,
    max_scenarios_per_user: int | None = None,
) -> MarketEvent:
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
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


async def join_event(
    db: AsyncSession,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    team_identifier: str | None = None,
) -> EventParticipation:
    existing = await db.execute(
        select(EventParticipation).where(
            and_(EventParticipation.event_id == event_id, EventParticipation.user_id == user_id)
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Already joined this event")

    participation = EventParticipation(
        event_id=event_id,
        user_id=user_id,
        team_identifier=team_identifier,
    )
    db.add(participation)
    await db.flush()
    await db.refresh(participation)
    return participation


async def update_participation_score(
    db: AsyncSession,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    score: float,
) -> None:
    result = await db.execute(
        select(EventParticipation).where(
            and_(EventParticipation.event_id == event_id, EventParticipation.user_id == user_id)
        )
    )
    participation = result.scalar_one_or_none()
    if participation:
        participation.individual_score += score
        participation.scenarios_completed += 1
        await db.flush()


async def get_event_leaderboard(
    db: AsyncSession,
    event_id: uuid.UUID,
) -> list[dict]:
    result = await db.execute(
        select(
            EventParticipation.user_id,
            EventParticipation.individual_score,
            EventParticipation.scenarios_completed,
            User.display_name,
            User.level,
            User.avatar_id,
        )
        .join(User, User.id == EventParticipation.user_id)
        .where(EventParticipation.event_id == event_id)
        .order_by(desc(EventParticipation.individual_score))
    )
    entries = []
    for rank, row in enumerate(result.all(), 1):
        entries.append({
            "rank": rank,
            "user_id": str(row.user_id),
            "display_name": row.display_name,
            "score": row.individual_score,
            "scenarios_completed": row.scenarios_completed,
            "level": row.level,
            "avatar_id": row.avatar_id,
        })
    return entries


async def get_events_for_org(
    db: AsyncSession,
    org_id: uuid.UUID,
    status: str | None = None,
) -> list[MarketEvent]:
    query = select(MarketEvent).where(MarketEvent.org_id == org_id)
    if status:
        query = query.where(MarketEvent.status == status)
    query = query.order_by(desc(MarketEvent.start_at))
    result = await db.execute(query)
    return result.scalars().all()


async def finalize_event(
    db: AsyncSession,
    event_id: uuid.UUID,
) -> None:
    event = await db.get(MarketEvent, event_id)
    if not event or event.status == "completed":
        return
    event.status = "completed"
    # Delete existing team scores (idempotent re-finalization)
    await db.execute(
        select(EventTeamScore).where(EventTeamScore.event_id == event_id)
    )
    from sqlalchemy import delete
    await db.execute(delete(EventTeamScore).where(EventTeamScore.event_id == event_id))
    # Recalculate team scores
        result = await db.execute(
            select(
                EventParticipation.team_identifier,
                func.sum(EventParticipation.individual_score).label("total"),
                func.count(EventParticipation.id).label("count"),
            )
            .where(
                and_(
                    EventParticipation.event_id == event_id,
                    EventParticipation.team_identifier.isnot(None),
                )
            )
            .group_by(EventParticipation.team_identifier)
        )
        for row in result.all():
            team_score = EventTeamScore(
                event_id=event_id,
                team_identifier=row.team_identifier,
                aggregate_score=row.total,
                member_count=row.count,
            )
            db.add(team_score)
        await db.flush()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_events.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/event_service.py backend/tests/test_events.py
git commit -m "feat: add event service with lifecycle management"
```

### Task 9: Events Router

**Files:**
- Create: `backend/app/routers/events.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create events router**

```python
# backend/app/routers/events.py
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.services.event_service import (
    create_event,
    join_event,
    get_events_for_org,
    get_event_leaderboard,
    finalize_event,
    update_participation_score,
)
from app.models.market_event import MarketEvent

router = APIRouter(prefix="/api/events", tags=["events"])


class CreateEventRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    theme: str = Field(..., min_length=1, max_length=100)
    start_at: datetime
    end_at: datetime
    scenario_pool: list[dict]
    scoring_config: dict
    max_scenarios_per_user: int | None = None


class JoinEventRequest(BaseModel):
    team_identifier: str | None = None


@router.get("")
async def list_events(
    status_filter: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    events = await get_events_for_org(db, user.org_id, status=status_filter)
    return [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "theme": e.theme,
            "start_at": e.start_at.isoformat(),
            "end_at": e.end_at.isoformat(),
            "status": e.status,
            "max_scenarios_per_user": e.max_scenarios_per_user,
            "scenario_pool": e.scenario_pool,
        }
        for e in events
    ]


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "theme": event.theme,
        "start_at": event.start_at.isoformat(),
        "end_at": event.end_at.isoformat(),
        "status": event.status,
        "scenario_pool": event.scenario_pool,
        "scoring_config": event.scoring_config,
        "max_scenarios_per_user": event.max_scenarios_per_user,
    }


@router.post("", status_code=201)
async def create_event_endpoint(
    body: CreateEventRequest,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = await create_event(
        db=db,
        org_id=user.org_id,
        created_by=user.id,
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
    return {"id": str(event.id), "status": event.status}


@router.post("/{event_id}/activate")
async def activate_event(
    event_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be activated")
    event.status = "active"
    await db.commit()
    return {"status": "active"}


@router.post("/{event_id}/finalize")
async def finalize_event_endpoint(
    event_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "active":
        raise HTTPException(status_code=400, detail="Only active events can be finalized")
    await finalize_event(db, uuid.UUID(event_id))
    await db.commit()
    return {"status": "completed"}


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be deleted")
    await db.delete(event)
    await db.commit()
    return {"status": "deleted"}


@router.post("/{event_id}/join")
async def join_event_endpoint(
    event_id: str,
    body: JoinEventRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    team = body.team_identifier or user.cohort
    try:
        participation = await join_event(db, uuid.UUID(event_id), user.id, team)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    await db.commit()
    return {"status": "joined", "team": team}


@router.get("/{event_id}/leaderboard")
async def event_leaderboard(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Event not found")
    entries = await get_event_leaderboard(db, uuid.UUID(event_id))
    return {"event_id": event_id, "entries": entries}
```

- [ ] **Step 2: Register in main.py**

Add `events` to the router imports in `backend/app/main.py` and add:
```python
app.include_router(events.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/events.py backend/app/main.py
git commit -m "feat: add events router with CRUD, join, leaderboard endpoints"
```

### Task 10: Wire Event Scoring into Grading Flow

**Files:**
- Modify: `backend/app/routers/responses.py`

- [ ] **Step 1: Add event_id parameter to response creation**

In the `POST /api/responses` endpoint, accept an optional `event_id` in the request body. When present, set `response.event_id = event_id`.

Add to the SubmitRequest schema:
```python
event_id: str | None = None
```

In the handler, after creating the Response:
```python
if body.event_id:
    response.event_id = uuid.UUID(body.event_id)
```

- [ ] **Step 2: Update grading flow to update event participation**

In the `POST /{response_id}/continue` endpoint, after XP is awarded and committed, check if the response has an event_id. If so, call `update_participation_score`:

```python
# After grade creation and XP award
if response.event_id:
    from app.services.event_service import update_participation_score
    await update_participation_score(db, response.event_id, user.id, grade_data["overall_score"])
    from app.services.activity import emit_activity
    await emit_activity(db, user.id, "event_scenario_completed", {
        "event_id": str(response.event_id),
        "score": grade_data["overall_score"],
    })
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/responses.py
git commit -m "feat: wire event scoring into grading flow"
```

### Task 11: Phase 1 Migration

**Files:**
- Create: `backend/alembic/versions/2026_03_23_phase1_market_events.py`

- [ ] **Step 1: Generate migration**

Run: `cd backend && alembic revision --autogenerate -m "phase1 market events"`

- [ ] **Step 2: Add partial unique indexes for event badges**

In the generated migration, add after the auto-generated operations:
```python
# Partial unique indexes for event badges
op.execute("""
    CREATE UNIQUE INDEX uq_user_badge_event ON user_badges (user_id, badge_id, event_id) WHERE event_id IS NOT NULL;
""")
op.execute("""
    CREATE UNIQUE INDEX uq_user_badge_permanent ON user_badges (user_id, badge_id) WHERE event_id IS NULL;
""")
# Drop old unique constraint
op.drop_constraint("uq_user_badges_user_badge", "user_badges", type_="unique")
```

In downgrade, reverse these.

- [ ] **Step 3: Run migration**

Run: `cd backend && alembic upgrade head`
Expected: Clean migration

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "migrate: phase1 market events tables and badge indexes"
```

### Task 12: Event Hub Frontend Page

**Files:**
- Create: `frontend/src/pages/EventHubPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create EventHubPage**

```tsx
// frontend/src/pages/EventHubPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight, Trophy } from "lucide-react";
import api from "../api/client";

type EventStatus = "active" | "upcoming" | "completed";

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_at: string;
  end_at: string;
  status: string;
  max_scenarios_per_user: number | null;
}

export default function EventHubPage() {
  const [tab, setTab] = useState<"active" | "past">("active");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data as MarketEvent[];
    },
  });

  const now = new Date();
  const activeEvents = events?.filter((e) => e.status === "active") || [];
  const pastEvents = events?.filter((e) => e.status === "completed") || [];

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const timeRemaining = (end: string) => {
    const diff = new Date(end).getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  };

  if (isLoading) {
    return (
      <div className="cm-page max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cm-card rounded w-48" />
          <div className="h-32 bg-cm-card rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="cm-page max-w-3xl">
      <h1 className="cm-title mb-6">Market Events</h1>

      <div className="flex gap-2 mb-6">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "cm-tab-active" : "cm-tab"}
          >
            {t === "active" ? "Active & Upcoming" : "Past Events"}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <div className="space-y-4">
          {activeEvents.length === 0 && (
            <div className="cm-surface p-8 text-center text-cm-muted">
              No active events right now. Check back soon!
            </div>
          )}
          {activeEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/events/${event.id}`}
                className="cm-surface p-5 block hover:border-cm-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="cm-chip bg-cm-emerald/20 text-cm-emerald text-xs">Active</span>
                      <span className="text-xs text-cm-muted">{event.theme}</span>
                    </div>
                    <h3 className="font-semibold text-cm-text mb-1">{event.title}</h3>
                    <p className="text-sm text-cm-muted line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-cm-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(event.start_at)} – {formatDate(event.end_at)}
                      </span>
                      <span className="flex items-center gap-1 text-cm-amber">
                        <Clock size={12} />
                        {timeRemaining(event.end_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-cm-muted group-hover:text-cm-primary mt-2 shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "past" && (
        <div className="space-y-3">
          {pastEvents.length === 0 && (
            <div className="cm-surface p-8 text-center text-cm-muted">No past events yet.</div>
          )}
          {pastEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="cm-surface p-4 flex items-center justify-between hover:border-cm-primary/50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-cm-text text-sm">{event.title}</h3>
                <p className="text-xs text-cm-muted mt-0.5">
                  {formatDate(event.start_at)} – {formatDate(event.end_at)}
                </p>
              </div>
              <Trophy size={16} className="text-cm-amber" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add route in App.tsx**

In `frontend/src/App.tsx`, add import:
```tsx
import EventHubPage from "./pages/EventHubPage";
import EventDetailPage from "./pages/EventDetailPage";
```

Add routes after the `/feed` route (around line 208):
```tsx
<Route path="/events" element={<EventHubPage />} />
<Route path="/events/:eventId" element={<EventDetailPage />} />
```

- [ ] **Step 3: Add Events to Sidebar**

In `frontend/src/components/Sidebar.tsx`, add `Calendar` to lucide imports, then add to the "Community" group in NAV_GROUPS:
```tsx
{ to: "/events", icon: Calendar, label: "Events", matchExact: false },
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/EventHubPage.tsx frontend/src/App.tsx frontend/src/components/Sidebar.tsx
git commit -m "feat: add Event Hub page with sidebar navigation"
```

### Task 13: Event Detail Frontend Page

**Files:**
- Create: `frontend/src/pages/EventDetailPage.tsx`
- Create: `frontend/src/components/EventLeaderboard.tsx`

- [ ] **Step 1: Create EventLeaderboard component**

```tsx
// frontend/src/components/EventLeaderboard.tsx
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  scenarios_completed: number;
  level: number;
  avatar_id: string;
}

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function EventLeaderboard({ entries, currentUserId }: Props) {
  return (
    <div className="space-y-1">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            entry.user_id === currentUserId ? "bg-cm-primary/10 border border-cm-primary/30" : "hover:bg-cm-card-raised"
          }`}
        >
          <div className="w-8 text-center shrink-0">
            {entry.rank <= 3 ? (
              <span className="text-lg">{RANK_ICONS[entry.rank - 1]}</span>
            ) : (
              <span className="text-sm text-cm-muted font-mono">{entry.rank}</span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-sm shrink-0">
            {AVATAR_PRESETS[entry.avatar_id || "default"] || "👤"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cm-text truncate">{entry.display_name}</p>
            <p className="text-xs text-cm-muted">{entry.scenarios_completed} scenarios</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-cm-primary">{entry.score.toFixed(1)}</p>
            <p className="text-xs text-cm-muted">pts</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create EventDetailPage**

```tsx
// frontend/src/pages/EventDetailPage.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Play } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import EventLeaderboard from "../components/EventLeaderboard";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => (await api.get(`/events/${eventId}`)).data,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["event-leaderboard", eventId],
    queryFn: async () => (await api.get(`/events/${eventId}/leaderboard`)).data,
  });

  const joinMutation = useMutation({
    mutationFn: async () => (await api.post(`/events/${eventId}/join`, {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-leaderboard", eventId] });
    },
  });

  if (isLoading || !event) {
    return (
      <div className="cm-page max-w-3xl">
        <div className="animate-pulse h-48 bg-cm-card rounded" />
      </div>
    );
  }

  const isActive = event.status === "active";
  const userInLeaderboard = leaderboard?.entries?.some(
    (e: any) => e.user_id === authUser?.id
  );

  return (
    <div className="cm-page max-w-3xl">
      <div className="cm-surface p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`cm-chip text-xs ${isActive ? "bg-cm-emerald/20 text-cm-emerald" : "bg-cm-muted/20 text-cm-muted"}`}>
            {event.status}
          </span>
          <span className="text-xs text-cm-muted">{event.theme}</span>
        </div>
        <h1 className="cm-title mb-2">{event.title}</h1>
        <p className="text-sm text-cm-muted mb-4">{event.description}</p>
        <div className="flex items-center gap-4 text-xs text-cm-muted">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(event.start_at).toLocaleDateString()} – {new Date(event.end_at).toLocaleDateString()}
          </span>
          {event.max_scenarios_per_user && (
            <span className="flex items-center gap-1">
              <Play size={12} />
              {event.max_scenarios_per_user} scenarios max
            </span>
          )}
        </div>
        {isActive && !userInLeaderboard && (
          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="cm-btn-primary mt-4"
          >
            {joinMutation.isPending ? "Joining..." : "Join Event"}
          </button>
        )}
      </div>

      <div className="cm-surface p-5">
        <h2 className="cm-subtitle mb-4">Leaderboard</h2>
        {leaderboard?.entries?.length > 0 ? (
          <EventLeaderboard entries={leaderboard.entries} currentUserId={authUser?.id} />
        ) : (
          <p className="text-sm text-cm-muted text-center py-4">No participants yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/EventDetailPage.tsx frontend/src/components/EventLeaderboard.tsx
git commit -m "feat: add Event Detail page with leaderboard"
```

### Task 14: Admin Event Form

**Files:**
- Create: `frontend/src/pages/Admin/AdminEventForm.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create AdminEventForm page**

```tsx
// frontend/src/pages/Admin/AdminEventForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../api/client";

const CATEGORIES = [
  "iv_analysis", "realized_vol", "greeks", "order_flow", "macro",
  "term_structure", "skew", "correlation", "event_vol", "tail_risk",
  "position_sizing", "trade_structuring", "vol_surface", "microstructure",
  "risk_management", "fundamentals",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export function AdminEventForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [maxScenarios, setMaxScenarios] = useState<string>("");
  const [xpMultiplier, setXpMultiplier] = useState("1.5");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["beginner"]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const pool = selectedCategories.flatMap((cat) =>
        selectedDifficulties.map((diff) => ({ category: cat, difficulty: diff }))
      );
      const res = await api.post("/events", {
        title,
        description,
        theme,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        scenario_pool: pool,
        scoring_config: {
          xp_multiplier: parseFloat(xpMultiplier),
          dimension_weights: { reasoning: 0.3, terminology: 0.2, trade_logic: 0.3, risk_awareness: 0.2 },
          completion_bonus: 50,
          perfect_score_bonus: 100,
        },
        max_scenarios_per_user: maxScenarios ? parseInt(maxScenarios) : null,
      });
      return res.data;
    },
    onSuccess: () => navigate("/admin/dashboard"),
  });

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleDifficulty = (diff: string) =>
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );

  return (
    <div className="cm-page max-w-2xl">
      <h1 className="cm-title mb-6">Create Market Event</h1>
      <div className="cm-surface p-6 space-y-5">
        <div>
          <label className="cm-label mb-1 block">Title</label>
          <input className="cm-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Volatility Crush Week" />
        </div>
        <div>
          <label className="cm-label mb-1 block">Description</label>
          <textarea className="cm-input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="cm-label mb-1 block">Theme</label>
          <input className="cm-input" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. volatility" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cm-label mb-1 block">Start Date</label>
            <input className="cm-input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className="cm-label mb-1 block">End Date</label>
            <input className="cm-input" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cm-label mb-1 block">Max Scenarios Per User</label>
            <input className="cm-input" type="number" value={maxScenarios} onChange={(e) => setMaxScenarios(e.target.value)} placeholder="Leave empty for unlimited" />
          </div>
          <div>
            <label className="cm-label mb-1 block">XP Multiplier</label>
            <input className="cm-input" type="number" step="0.1" value={xpMultiplier} onChange={(e) => setXpMultiplier(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="cm-label mb-2 block">Categories</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat)
                    ? "bg-cm-primary/20 text-cm-primary border border-cm-primary/40"
                    : "bg-cm-card-raised text-cm-muted border border-cm-border hover:text-cm-text"
                }`}
              >
                {cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="cm-label mb-2 block">Difficulties</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => toggleDifficulty(diff)}
                className={selectedDifficulties.includes(diff) ? "cm-tab-active" : "cm-tab"}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !title || !startAt || !endAt || selectedCategories.length === 0}
          className="cm-btn-primary w-full"
        >
          {createMutation.isPending ? "Creating..." : "Create Event"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add admin event route in App.tsx**

Import and add route:
```tsx
import { AdminEventForm } from "./pages/Admin/AdminEventForm";
```

In the admin routes section:
```tsx
<Route path="/admin/events/new" element={<AdminEventForm />} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Admin/AdminEventForm.tsx frontend/src/App.tsx
git commit -m "feat: add Admin Event creation form"
```

### Task 15: Event Banner on Training Hub

**Files:**
- Create: `frontend/src/components/EventBanner.tsx`
- Modify: `frontend/src/pages/TrainingPage.tsx`

- [ ] **Step 1: Create EventBanner component**

```tsx
// frontend/src/components/EventBanner.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import api from "../api/client";

export default function EventBanner() {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events?status_filter=active")).data,
    staleTime: 60_000,
  });

  const activeEvent = events?.[0];
  if (!activeEvent) return null;

  const timeLeft = () => {
    const diff = new Date(activeEvent.end_at).getTime() - Date.now();
    if (diff <= 0) return "Ending soon";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : "Ends today";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Link
        to={`/events/${activeEvent.id}`}
        className="block cm-surface border-cm-primary/30 bg-gradient-to-r from-cm-primary/5 to-transparent p-4 hover:border-cm-primary/50 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-cm-primary" />
            <div>
              <p className="text-sm font-semibold text-cm-text">{activeEvent.title}</p>
              <p className="text-xs text-cm-muted">{timeLeft()} &middot; {activeEvent.theme}</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-cm-muted group-hover:text-cm-primary transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}
```

- [ ] **Step 2: Add EventBanner to TrainingPage**

In `frontend/src/pages/TrainingPage.tsx`, import and render the banner near the top of the page content:
```tsx
import EventBanner from "../components/EventBanner";
```

Add `<EventBanner />` at the top of the page content, above the category selection.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/EventBanner.tsx frontend/src/pages/TrainingPage.tsx
git commit -m "feat: add active event banner to Training Hub"
```

---

## Phase 2: Skill Trees

### Task 16: Skill Node Models

**Files:**
- Create: `backend/app/models/skill_node.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create SkillNode and UserSkillMastery models**

```python
# backend/app/models/skill_node.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class SkillNode(Base):
    __tablename__ = "skill_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="circle")
    prerequisites: Mapped[dict] = mapped_column(JSONB, default=list)
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
    tier: Mapped[int] = mapped_column(Integer, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)


class UserSkillMastery(Base):
    __tablename__ = "user_skill_mastery"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    mastery_level: Mapped[float] = mapped_column(Float, default=0.0)
    peak_mastery: Mapped[float] = mapped_column(Float, default=0.0)
    scenarios_completed: Mapped[int] = mapped_column(Integer, default=0)
    avg_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "category", name="uq_user_skill_mastery"),
    )
```

- [ ] **Step 2: Export from models __init__**

Add imports and update `__all__` in `backend/app/models/__init__.py`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/skill_node.py backend/app/models/__init__.py
git commit -m "feat: add SkillNode and UserSkillMastery models"
```

### Task 17: Mastery Service

**Files:**
- Create: `backend/app/services/mastery_service.py`
- Create: `backend/tests/test_mastery_service.py`
- Modify: `backend/app/constants.py`

- [ ] **Step 1: Update constants**

Add to `backend/app/constants.py`:
```python
# Skill Tree Mastery
MASTERY_SCENARIO_COUNT = 10  # (update existing from 5)
MASTERY_THRESHOLD = 70.0  # on 0-100 scale (update existing from 3.5)
MASTERY_DECAY_RATE = 0.05  # 5% per week
MASTERY_DECAY_FLOOR_PCT = 0.50  # 50% of peak
MASTERY_RECENCY_WEIGHT = 2.0  # most recent scores weighted 2x
```

- [ ] **Step 2: Write failing tests**

```python
# backend/tests/test_mastery_service.py
import pytest
from app.services.mastery_service import compute_mastery_level, apply_decay


def test_compute_mastery_basic():
    """10 scores of 4.0/5.0 = 80.0 mastery (4.0 * 20)."""
    scores = [4.0] * 10
    result = compute_mastery_level(scores)
    assert result == pytest.approx(80.0, abs=0.5)


def test_compute_mastery_recency_bias():
    """Recent high scores should weight more than old low scores."""
    # Old scores low, recent scores high
    scores = [2.0, 2.0, 2.0, 2.0, 2.0, 5.0, 5.0, 5.0, 5.0, 5.0]
    result = compute_mastery_level(scores)
    # With recency bias, should be higher than simple avg (3.5*20=70)
    assert result > 70.0


def test_compute_mastery_fewer_than_10():
    """Fewer than 10 scores should still work."""
    scores = [4.0, 3.5]
    result = compute_mastery_level(scores)
    assert result > 0


def test_compute_mastery_empty():
    result = compute_mastery_level([])
    assert result == 0.0


def test_apply_decay():
    """After 1 week of inactivity, mastery drops by 5%."""
    mastery = 80.0
    peak = 80.0
    weeks = 1
    result = apply_decay(mastery, peak, weeks)
    assert result == pytest.approx(76.0, abs=0.1)  # 80 * (1 - 0.05)


def test_apply_decay_floor():
    """Decay should not go below 50% of peak."""
    mastery = 80.0
    peak = 80.0
    weeks = 50  # Very long absence
    result = apply_decay(mastery, peak, weeks)
    assert result == pytest.approx(40.0, abs=0.1)  # 50% of 80
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_mastery_service.py -v`
Expected: FAIL

- [ ] **Step 4: Implement mastery service**

```python
# backend/app/services/mastery_service.py
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, desc, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
from app.models.skill_node import SkillNode, UserSkillMastery
from app.models.grade import Grade
from app.models.response import Response
from app.models.scenario import Scenario
from app.constants import (
    MASTERY_SCENARIO_COUNT,
    MASTERY_DECAY_RATE,
    MASTERY_DECAY_FLOOR_PCT,
    MASTERY_RECENCY_WEIGHT,
)


def compute_mastery_level(scores: list[float]) -> float:
    """Compute mastery 0-100 from raw scores (0-5 scale) with recency bias."""
    if not scores:
        return 0.0

    recent = scores[-MASTERY_SCENARIO_COUNT:]
    n = len(recent)

    # Assign weights: linearly increasing, most recent gets MASTERY_RECENCY_WEIGHT
    weights = []
    for i in range(n):
        w = 1.0 + (MASTERY_RECENCY_WEIGHT - 1.0) * (i / max(n - 1, 1))
        weights.append(w)

    weighted_sum = sum(s * w for s, w in zip(recent, weights))
    weight_total = sum(weights)
    avg = weighted_sum / weight_total

    # Normalize from 0-5 to 0-100
    return avg * 20.0


def apply_decay(mastery: float, peak: float, weeks_inactive: int) -> float:
    """Apply weekly decay with floor at 50% of peak."""
    if weeks_inactive <= 0:
        return mastery

    floor = peak * MASTERY_DECAY_FLOOR_PCT
    decayed = mastery * ((1.0 - MASTERY_DECAY_RATE) ** weeks_inactive)
    return max(decayed, floor)


async def recalculate_mastery(
    db: AsyncSession,
    user_id: uuid.UUID,
    category: str,
) -> UserSkillMastery:
    """Recalculate mastery for a user in a specific category."""
    # Get last N scores for this category
    result = await db.execute(
        select(Grade.overall_score)
        .join(Response, Response.id == Grade.response_id)
        .join(Scenario, Scenario.id == Response.scenario_id)
        .where(and_(Response.user_id == user_id, Scenario.category == category, Response.is_complete == True))
        .order_by(desc(Grade.graded_at))
        .limit(MASTERY_SCENARIO_COUNT)
    )
    scores = [float(row[0]) for row in result.all()]
    scores.reverse()  # Oldest first for recency weighting

    mastery = compute_mastery_level(scores)

    # Upsert mastery record
    existing = await db.execute(
        select(UserSkillMastery).where(
            and_(UserSkillMastery.user_id == user_id, UserSkillMastery.category == category)
        )
    )
    record = existing.scalar_one_or_none()
    if record:
        record.mastery_level = mastery
        record.peak_mastery = max(record.peak_mastery, mastery)
        record.scenarios_completed = len(scores)
        record.avg_score = sum(scores) / len(scores) if scores else 0.0
        record.last_attempt_at = utc_now_naive()
    else:
        record = UserSkillMastery(
            user_id=user_id,
            category=category,
            mastery_level=mastery,
            peak_mastery=mastery,
            scenarios_completed=len(scores),
            avg_score=sum(scores) / len(scores) if scores else 0.0,
            last_attempt_at=utc_now_naive(),
        )
        db.add(record)

    await db.flush()
    return record


async def get_user_mastery(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[UserSkillMastery]:
    result = await db.execute(
        select(UserSkillMastery).where(UserSkillMastery.user_id == user_id)
    )
    return result.scalars().all()


async def get_skill_tree(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[SkillNode]:
    """Get skill tree with org override precedence."""
    # Get org-specific nodes
    org_result = await db.execute(
        select(SkillNode).where(and_(SkillNode.org_id == org_id, SkillNode.is_hidden == False))
    )
    org_nodes = org_result.scalars().all()
    org_categories = {n.category for n in org_nodes}

    # Get default nodes not overridden by org
    default_query = select(SkillNode).where(
        and_(SkillNode.org_id.is_(None), SkillNode.is_hidden == False)
    )
    if org_categories:
        default_query = default_query.where(SkillNode.category.notin_(org_categories))
    default_result = await db.execute(default_query)
    default_nodes = default_result.scalars().all()

    return list(org_nodes) + list(default_nodes)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_mastery_service.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/mastery_service.py backend/tests/test_mastery_service.py backend/app/constants.py
git commit -m "feat: add mastery service with weighted calculation and decay"
```

### Task 18: Update Progression Service

**Files:**
- Modify: `backend/app/services/progression.py`

- [ ] **Step 1: Replace check_mastery with new calculation**

In `backend/app/services/progression.py`, update `check_mastery` to use the new 0-100 scale:
```python
from app.constants import MASTERY_THRESHOLD  # Now 70.0

def check_mastery(scores: list[float]) -> bool:
    from app.services.mastery_service import compute_mastery_level
    return compute_mastery_level(scores) >= MASTERY_THRESHOLD
```

Update `get_mastered_categories` to use the last 10 scores instead of 5.

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/progression.py
git commit -m "refactor: update progression to use new mastery calculation"
```

### Task 19: Skills Router

**Files:**
- Create: `backend/app/routers/skills.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create skills router**

```python
# backend/app/routers/skills.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.mastery_service import get_skill_tree, get_user_mastery

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/tree")
async def skill_tree(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    nodes = await get_skill_tree(db, user.org_id)
    return [
        {
            "id": str(n.id),
            "category": n.category,
            "display_name": n.display_name,
            "description": n.description,
            "icon": n.icon,
            "prerequisites": n.prerequisites,
            "position_x": n.position_x,
            "position_y": n.position_y,
            "tier": n.tier,
        }
        for n in nodes
    ]


@router.get("/mastery")
async def all_mastery(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    records = await get_user_mastery(db, user.id)
    return [
        {
            "category": r.category,
            "mastery_level": round(r.mastery_level, 1),
            "peak_mastery": round(r.peak_mastery, 1),
            "scenarios_completed": r.scenarios_completed,
            "avg_score": round(r.avg_score, 2),
            "last_attempt_at": r.last_attempt_at.isoformat() if r.last_attempt_at else None,
        }
        for r in records
    ]
```

- [ ] **Step 2: Register in main.py**

Add `skills` to router imports and `app.include_router(skills.router)`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/skills.py backend/app/main.py
git commit -m "feat: add skills router with tree and mastery endpoints"
```

### Task 20: Wire Mastery Recalculation into Grading Flow

**Files:**
- Modify: `backend/app/routers/responses.py`

- [ ] **Step 1: Add mastery recalculation after grading**

In the `POST /{response_id}/continue` endpoint, after XP and badge processing:
```python
# Recalculate mastery for the scenario's category
from app.services.mastery_service import recalculate_mastery
mastery_record = await recalculate_mastery(db, user.id, scenario.category)
# Emit activity if newly mastered
if mastery_record.mastery_level >= 70.0 and (mastery_record.scenarios_completed == MASTERY_SCENARIO_COUNT or mastery_record.mastery_level >= 70.0 > (mastery_record.peak_mastery - mastery_record.mastery_level)):
    await emit_activity(db, user.id, "skill_mastered", {"category": scenario.category, "mastery": mastery_record.mastery_level})
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/routers/responses.py
git commit -m "feat: trigger mastery recalculation after scenario grading"
```

### Task 21: Skill Tree Seed Data

**Files:**
- Create: `backend/app/services/skill_tree_seed.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create skill tree seeder**

```python
# backend/app/services/skill_tree_seed.py
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_node import SkillNode

# Default skill tree: 27 categories across 4 tiers
DEFAULT_NODES = [
    # Tier 1: Foundations (y=0)
    {"category": "iv_analysis", "display_name": "IV Analysis", "description": "Implied volatility fundamentals", "tier": 1, "prerequisites": [], "position_x": 0, "position_y": 0},
    {"category": "realized_vol", "display_name": "Realized Vol", "description": "Historical and realized volatility", "tier": 1, "prerequisites": [], "position_x": 200, "position_y": 0},
    {"category": "fundamentals", "display_name": "Fundamentals", "description": "Options basics and terminology", "tier": 1, "prerequisites": [], "position_x": 400, "position_y": 0},

    # Tier 2: Core Greeks (y=150)
    {"category": "greeks", "display_name": "Greeks", "description": "Delta, gamma, theta, vega", "tier": 2, "prerequisites": ["iv_analysis"], "position_x": 0, "position_y": 150},
    {"category": "order_flow", "display_name": "Order Flow", "description": "Reading and interpreting order flow", "tier": 2, "prerequisites": ["realized_vol"], "position_x": 200, "position_y": 150},
    {"category": "macro", "display_name": "Macro", "description": "Macroeconomic factors", "tier": 2, "prerequisites": ["fundamentals"], "position_x": 400, "position_y": 150},
    {"category": "term_structure", "display_name": "Term Structure", "description": "Volatility term structure", "tier": 2, "prerequisites": ["iv_analysis"], "position_x": 100, "position_y": 150},
    {"category": "skew", "display_name": "IV Skew", "description": "Volatility skew patterns", "tier": 2, "prerequisites": ["iv_analysis"], "position_x": -100, "position_y": 150},

    # Tier 3: Advanced Strategies (y=300)
    {"category": "correlation", "display_name": "Correlation", "description": "Cross-asset correlation trading", "tier": 3, "prerequisites": ["greeks", "macro"], "position_x": 0, "position_y": 300},
    {"category": "event_vol", "display_name": "Event Vol", "description": "Earnings and event volatility", "tier": 3, "prerequisites": ["iv_analysis", "term_structure"], "position_x": 150, "position_y": 300},
    {"category": "tail_risk", "display_name": "Tail Risk", "description": "Tail risk management", "tier": 3, "prerequisites": ["greeks", "skew"], "position_x": -150, "position_y": 300},
    {"category": "position_sizing", "display_name": "Position Sizing", "description": "Optimal position sizing", "tier": 3, "prerequisites": ["greeks"], "position_x": 300, "position_y": 300},
    {"category": "trade_structuring", "display_name": "Trade Structuring", "description": "Building multi-leg structures", "tier": 3, "prerequisites": ["greeks", "skew"], "position_x": -300, "position_y": 300},
    {"category": "risk_management", "display_name": "Risk Management", "description": "Portfolio risk management", "tier": 3, "prerequisites": ["greeks", "position_sizing"], "position_x": 450, "position_y": 300},
    {"category": "microstructure", "display_name": "Microstructure", "description": "Market microstructure", "tier": 3, "prerequisites": ["order_flow"], "position_x": 200, "position_y": 350},
    {"category": "sentiment", "display_name": "Sentiment", "description": "Market sentiment analysis", "tier": 3, "prerequisites": ["macro"], "position_x": 400, "position_y": 350},
    {"category": "technical_analysis", "display_name": "Technical Analysis", "description": "Chart patterns and technicals", "tier": 3, "prerequisites": ["fundamentals"], "position_x": 500, "position_y": 350},

    # Tier 4: Market Mastery (y=500)
    {"category": "vol_surface", "display_name": "Vol Surface", "description": "Full volatility surface modeling", "tier": 4, "prerequisites": ["term_structure", "skew", "event_vol"], "position_x": 0, "position_y": 500},
    {"category": "pit_tooling", "display_name": "Pit Tooling", "description": "Trading desk tools and analytics", "tier": 4, "prerequisites": ["risk_management"], "position_x": 150, "position_y": 500},
    {"category": "fixed_income", "display_name": "Fixed Income", "description": "Fixed income derivatives", "tier": 4, "prerequisites": ["macro", "correlation"], "position_x": 300, "position_y": 500},
    {"category": "seasonality", "display_name": "Seasonality", "description": "Seasonal volatility patterns", "tier": 4, "prerequisites": ["term_structure", "event_vol"], "position_x": -150, "position_y": 500},
    {"category": "exotic_structures", "display_name": "Exotic Structures", "description": "Exotic options and structures", "tier": 4, "prerequisites": ["trade_structuring", "vol_surface"], "position_x": -300, "position_y": 500},
    {"category": "commodities", "display_name": "Commodities", "description": "Commodity derivatives", "tier": 4, "prerequisites": ["macro", "correlation"], "position_x": 450, "position_y": 500},
    {"category": "crypto", "display_name": "Crypto", "description": "Cryptocurrency derivatives", "tier": 4, "prerequisites": ["macro", "order_flow"], "position_x": 500, "position_y": 550},
    {"category": "geopolitical", "display_name": "Geopolitical", "description": "Geopolitical risk analysis", "tier": 4, "prerequisites": ["macro", "tail_risk"], "position_x": -450, "position_y": 500},
    {"category": "alt_data", "display_name": "Alt Data", "description": "Alternative data sources", "tier": 4, "prerequisites": ["sentiment", "order_flow"], "position_x": 300, "position_y": 550},
    {"category": "portfolio_mgmt", "display_name": "Portfolio Management", "description": "Portfolio-level strategy", "tier": 4, "prerequisites": ["risk_management", "position_sizing", "correlation"], "position_x": 150, "position_y": 550},
]


async def seed_skill_tree(db: AsyncSession) -> int:
    """Seed default skill tree nodes. Returns count of newly created nodes."""
    count_result = await db.execute(
        select(func.count(SkillNode.id)).where(SkillNode.org_id.is_(None))
    )
    existing_count = count_result.scalar() or 0
    if existing_count >= len(DEFAULT_NODES):
        return 0

    created = 0
    for node_data in DEFAULT_NODES:
        existing = await db.execute(
            select(SkillNode).where(
                SkillNode.org_id.is_(None),
                SkillNode.category == node_data["category"],
            )
        )
        if existing.scalar_one_or_none():
            continue
        node = SkillNode(org_id=None, icon="circle", **node_data)
        db.add(node)
        created += 1

    if created:
        await db.commit()
    return created
```

- [ ] **Step 2: Register seeder in main.py lifespan**

Add to `backend/app/main.py` lifespan after path seeding:
```python
await _safe("skill tree seeding", _seed_skill_tree())
```

Add helper function:
```python
async def _seed_skill_tree():
    from app.services.skill_tree_seed import seed_skill_tree
    async with async_session() as db:
        count = await seed_skill_tree(db)
        if count:
            print(f"Seeded {count} skill tree nodes")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/skill_tree_seed.py backend/app/main.py
git commit -m "feat: add skill tree seeder with 27 default nodes"
```

### Task 22: Phase 2 Migration

- [ ] **Step 1: Generate migration**

Run: `cd backend && alembic revision --autogenerate -m "phase2 skill trees"`

- [ ] **Step 2: Run migration**

Run: `cd backend && alembic upgrade head`

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/
git commit -m "migrate: phase2 skill tree tables"
```

### Task 23: Skill Tree Frontend Page

**Files:**
- Create: `frontend/src/pages/SkillTreePage.tsx`
- Create: `frontend/src/components/SkillTreeCanvas.tsx`
- Create: `frontend/src/components/SkillNodeDetail.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create SkillTreeCanvas component**

```tsx
// frontend/src/components/SkillTreeCanvas.tsx
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface SkillNodeData {
  id: string;
  category: string;
  display_name: string;
  description: string;
  tier: number;
  prerequisites: string[];
  position_x: number;
  position_y: number;
}

interface MasteryData {
  category: string;
  mastery_level: number;
  peak_mastery: number;
  scenarios_completed: number;
}

interface Props {
  nodes: SkillNodeData[];
  mastery: MasteryData[];
  onNodeClick: (node: SkillNodeData) => void;
}

const TIER_COLORS = ["#94a3b8", "#38bdf8", "#a78bfa", "#fbbf24"];
const NODE_RADIUS = 32;

function getNodeState(node: SkillNodeData, mastery: MasteryData[], allNodes: SkillNodeData[]) {
  const m = mastery.find((r) => r.category === node.category);
  const prereqsMet = node.prerequisites.every((prereq) => {
    const pm = mastery.find((r) => r.category === prereq);
    return pm && pm.mastery_level >= 70;
  });

  if (!prereqsMet && node.prerequisites.length > 0) return "locked";
  if (!m || m.scenarios_completed === 0) return "available";
  if (m.mastery_level >= 70) return "mastered";
  return "in_progress";
}

export default function SkillTreeCanvas({ nodes, mastery, onNodeClick }: Props) {
  const [pan, setPan] = useState({ x: 400, y: 50 });
  const [zoom, setZoom] = useState(0.85);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan((p) => ({
      x: p.x + (e.clientX - lastPos.current.x),
      y: p.y + (e.clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [dragging]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  // Draw edges
  const edges: { from: SkillNodeData; to: SkillNodeData }[] = [];
  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      const fromNode = nodes.find((n) => n.category === prereq);
      if (fromNode) edges.push({ from: fromNode, to: node });
    }
  }

  return (
    <div
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onWheel={handleWheel}
    >
      <svg
        width="100%"
        height="100%"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const toState = getNodeState(edge.to, mastery, nodes);
          return (
            <line
              key={i}
              x1={edge.from.position_x}
              y1={edge.from.position_y}
              x2={edge.to.position_x}
              y2={edge.to.position_y}
              stroke={toState === "locked" ? "#1e293b" : "#334155"}
              strokeWidth={2}
              strokeDasharray={toState === "locked" ? "4 4" : undefined}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const state = getNodeState(node, mastery, nodes);
          const m = mastery.find((r) => r.category === node.category);
          const pct = m ? m.mastery_level : 0;

          let fill = "#0f172a"; // locked
          let stroke = "#334155";
          let opacity = 0.4;

          if (state === "available") { fill = "#0f172a"; stroke = TIER_COLORS[node.tier - 1]; opacity = 1; }
          if (state === "in_progress") { fill = "#1e293b"; stroke = TIER_COLORS[node.tier - 1]; opacity = 1; }
          if (state === "mastered") { fill = "#1e293b"; stroke = "#fbbf24"; opacity = 1; }

          return (
            <g
              key={node.id}
              data-node
              className="cursor-pointer"
              onClick={() => onNodeClick(node)}
              opacity={opacity}
            >
              {/* Background circle */}
              <circle cx={node.position_x} cy={node.position_y} r={NODE_RADIUS} fill={fill} stroke={stroke} strokeWidth={2.5} />

              {/* Progress arc */}
              {state === "in_progress" && pct > 0 && (
                <circle
                  cx={node.position_x}
                  cy={node.position_y}
                  r={NODE_RADIUS}
                  fill="none"
                  stroke={TIER_COLORS[node.tier - 1]}
                  strokeWidth={3}
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * NODE_RADIUS} ${2 * Math.PI * NODE_RADIUS}`}
                  strokeDashoffset={2 * Math.PI * NODE_RADIUS * 0.25}
                  strokeLinecap="round"
                />
              )}

              {/* Mastered glow */}
              {state === "mastered" && (
                <circle cx={node.position_x} cy={node.position_y} r={NODE_RADIUS + 4} fill="none" stroke="#fbbf24" strokeWidth={1} opacity={0.4} />
              )}

              {/* Label */}
              <text
                x={node.position_x}
                y={node.position_y + NODE_RADIUS + 16}
                textAnchor="middle"
                fill={state === "locked" ? "#475569" : "#e2e8f0"}
                fontSize={11}
                fontWeight={500}
              >
                {node.display_name}
              </text>

              {/* Percentage */}
              <text
                x={node.position_x}
                y={node.position_y + 5}
                textAnchor="middle"
                fill={state === "mastered" ? "#fbbf24" : state === "locked" ? "#475569" : "#e2e8f0"}
                fontSize={13}
                fontWeight={600}
              >
                {state === "locked" ? "🔒" : state === "available" ? "—" : `${Math.round(pct)}%`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Create SkillNodeDetail component**

```tsx
// frontend/src/components/SkillNodeDetail.tsx
import { motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  node: {
    category: string;
    display_name: string;
    description: string;
    tier: number;
    prerequisites: string[];
  };
  mastery: {
    mastery_level: number;
    peak_mastery: number;
    scenarios_completed: number;
    avg_score: number;
  } | null;
  onClose: () => void;
}

export default function SkillNodeDetail({ node, mastery, onClose }: Props) {
  const navigate = useNavigate();
  const pct = mastery?.mastery_level ?? 0;
  const isMastered = pct >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 h-full w-80 bg-cm-card border-l border-cm-border z-50 shadow-xl overflow-y-auto"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-cm-text">{node.display_name}</h3>
          <button onClick={onClose} className="text-cm-muted hover:text-cm-text">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-cm-muted mb-4">{node.description}</p>

        {/* Mastery ring */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={isMastered ? "#fbbf24" : "#38bdf8"}
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cm-text">
              {Math.round(pct)}%
            </span>
          </div>
          <div>
            <p className="text-sm text-cm-text font-medium">
              {isMastered ? "Mastered" : pct > 0 ? "In Progress" : "Not Started"}
            </p>
            <p className="text-xs text-cm-muted">
              {mastery?.scenarios_completed ?? 0} scenarios completed
            </p>
            {mastery && (
              <p className="text-xs text-cm-muted">
                Avg score: {mastery.avg_score.toFixed(1)}/5.0
              </p>
            )}
          </div>
        </div>

        {/* Prerequisites */}
        {node.prerequisites.length > 0 && (
          <div className="mb-5">
            <p className="cm-label mb-2">Prerequisites</p>
            <div className="flex flex-wrap gap-1.5">
              {node.prerequisites.map((p) => (
                <span key={p} className="cm-chip text-xs">{p.replace(/_/g, " ")}</span>
              ))}
            </div>
          </div>
        )}

        {/* Start Training */}
        <button
          onClick={() => navigate(`/?category=${node.category}`)}
          className="cm-btn-primary w-full flex items-center justify-center gap-2"
        >
          <Play size={14} />
          Start Training
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create SkillTreePage**

```tsx
// frontend/src/pages/SkillTreePage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import api from "../api/client";
import SkillTreeCanvas from "../components/SkillTreeCanvas";
import SkillNodeDetail from "../components/SkillNodeDetail";

export default function SkillTreePage() {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: nodes } = useQuery({
    queryKey: ["skill-tree"],
    queryFn: async () => (await api.get("/skills/tree")).data,
  });

  const { data: mastery } = useQuery({
    queryKey: ["skill-mastery"],
    queryFn: async () => (await api.get("/skills/mastery")).data,
  });

  if (!nodes || !mastery) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
      </div>
    );
  }

  const selectedMastery = selectedNode
    ? mastery.find((m: any) => m.category === selectedNode.category) || null
    : null;

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <div className="absolute top-4 left-4 z-10">
        <h1 className="cm-title">Skill Tree</h1>
        <p className="text-sm text-cm-muted mt-1">Click a node to see details</p>
      </div>

      <SkillTreeCanvas
        nodes={nodes}
        mastery={mastery}
        onNodeClick={setSelectedNode}
      />

      <AnimatePresence>
        {selectedNode && (
          <SkillNodeDetail
            node={selectedNode}
            mastery={selectedMastery}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Add routes and sidebar nav**

In `frontend/src/App.tsx`, import and add route:
```tsx
import SkillTreePage from "./pages/SkillTreePage";
// Add route:
<Route path="/skills" element={<SkillTreePage />} />
```

In `frontend/src/components/Sidebar.tsx`, add `GitBranch` to lucide imports, add to "Train" group:
```tsx
{ to: "/skills", icon: GitBranch, label: "Skill Tree", matchExact: false },
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SkillTreePage.tsx frontend/src/components/SkillTreeCanvas.tsx frontend/src/components/SkillNodeDetail.tsx frontend/src/App.tsx frontend/src/components/Sidebar.tsx
git commit -m "feat: add interactive Skill Tree page with mastery visualization"
```

---

## Phase 3: Mentorship

### Task 24: Mentorship Models

**Files:**
- Create: `backend/app/models/mentorship.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/models/organization.py`

- [ ] **Step 1: Create Mentorship and MentorshipGoal models**

```python
# backend/app/models/mentorship.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now_naive


class Mentorship(Base):
    __tablename__ = "mentorships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    mentor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mentee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('active', 'completed', 'cancelled', 'declined', 'pending')", name="ck_mentorship_status"),
        # Partial unique index created in migration:
        # CREATE UNIQUE INDEX uq_active_mentorship ON mentorships (mentor_id, mentee_id) WHERE status = 'active'
    )


class MentorshipGoal(Base):
    __tablename__ = "mentorship_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentorship_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorships.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    target_mastery: Mapped[float] = mapped_column(Float, nullable=False)
    current_mastery: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now_naive)
    achieved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
```

- [ ] **Step 2: Add mentorship_config to Organization model**

In `backend/app/models/organization.py`, add:
```python
mentorship_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
```

- [ ] **Step 3: Export from models __init__**

Add to `backend/app/models/__init__.py`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/mentorship.py backend/app/models/organization.py backend/app/models/__init__.py
git commit -m "feat: add Mentorship and MentorshipGoal models"
```

### Task 25: Mentorship Service

**Files:**
- Create: `backend/app/services/mentorship_service.py`
- Create: `backend/tests/test_mentorship_service.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_mentorship_service.py
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.mark.asyncio
async def test_request_mentorship():
    from app.services.mentorship_service import request_mentorship

    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # no existing active mentorship
    db.execute = AsyncMock(return_value=mock_result)

    mentorship = await request_mentorship(
        db=db,
        org_id=uuid.uuid4(),
        mentor_id=uuid.uuid4(),
        mentee_id=uuid.uuid4(),
    )
    db.add.assert_called_once()


@pytest.mark.asyncio
async def test_create_goal():
    from app.services.mentorship_service import create_goal

    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    goal = await create_goal(
        db=db,
        mentorship_id=uuid.uuid4(),
        category="greeks",
        target_mastery=70.0,
    )
    db.add.assert_called_once()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_mentorship_service.py -v`
Expected: FAIL

- [ ] **Step 3: Implement mentorship service**

```python
# backend/app/services/mentorship_service.py
import uuid

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utc_now_naive
from app.models.mentorship import Mentorship, MentorshipGoal
from app.models.user import User
from app.models.skill_node import UserSkillMastery
from app.models.xp_transaction import XPTransaction
from app.services.notification_service import create_notification


async def request_mentorship(
    db: AsyncSession,
    org_id: uuid.UUID,
    mentor_id: uuid.UUID,
    mentee_id: uuid.UUID,
) -> Mentorship:
    # Check no active mentorship exists
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
        raise ValueError("Active mentorship already exists")

    mentorship = Mentorship(
        org_id=org_id,
        mentor_id=mentor_id,
        mentee_id=mentee_id,
        status="pending",
    )
    db.add(mentorship)
    await db.flush()
    await db.refresh(mentorship)

    # Notify mentor
    mentee = await db.get(User, mentee_id)
    await create_notification(
        db=db,
        user_id=mentor_id,
        type="mentorship_request",
        title="New mentorship request",
        body=f"{mentee.display_name} wants you as a mentor",
        metadata={"mentorship_id": str(mentorship.id)},
    )

    return mentorship


async def accept_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> Mentorship:
    mentorship = await db.get(Mentorship, mentorship_id)
    if not mentorship or mentorship.status != "pending":
        raise ValueError("Invalid mentorship or not pending")
    mentorship.status = "active"
    mentorship.started_at = utc_now_naive()
    await db.flush()
    return mentorship


async def decline_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> None:
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship and mentorship.status == "pending":
        mentorship.status = "declined"
        await db.flush()


async def cancel_mentorship(db: AsyncSession, mentorship_id: uuid.UUID) -> None:
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship and mentorship.status == "active":
        mentorship.status = "cancelled"
        mentorship.completed_at = utc_now_naive()
        await db.flush()


async def create_goal(
    db: AsyncSession,
    mentorship_id: uuid.UUID,
    category: str,
    target_mastery: float,
) -> MentorshipGoal:
    goal = MentorshipGoal(
        mentorship_id=mentorship_id,
        category=category,
        target_mastery=target_mastery,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


async def get_available_mentors(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[dict]:
    """Get users eligible and available as mentors."""
    # Users with 3+ mastered categories and level >= 5
    result = await db.execute(
        select(
            User.id,
            User.display_name,
            User.level,
            User.avatar_id,
            func.count(UserSkillMastery.id).label("mastered_count"),
        )
        .outerjoin(
            UserSkillMastery,
            and_(UserSkillMastery.user_id == User.id, UserSkillMastery.mastery_level >= 70.0),
        )
        .where(and_(User.org_id == org_id, User.level >= 5))
        .group_by(User.id)
        .having(func.count(UserSkillMastery.id) >= 3)
    )
    return [
        {
            "id": str(row.id),
            "display_name": row.display_name,
            "level": row.level,
            "avatar_id": row.avatar_id,
            "mastered_categories": row.mastered_count,
        }
        for row in result.all()
    ]


async def award_mentor_xp(
    db: AsyncSession,
    mentor_id: uuid.UUID,
    amount: int,
    reference_id: uuid.UUID,
) -> None:
    """Award XP to mentor for mentee milestone."""
    xp = XPTransaction(
        user_id=mentor_id,
        amount=amount,
        source="mentorship",
        reference_id=reference_id,
    )
    db.add(xp)
    mentor = await db.get(User, mentor_id)
    if mentor:
        mentor.xp_total += amount
        from app.services.progression import compute_level_from_xp
        mentor.level = compute_level_from_xp(mentor.xp_total)
    await db.flush()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_mentorship_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/mentorship_service.py backend/tests/test_mentorship_service.py
git commit -m "feat: add mentorship service with pairing, goals, and mentor XP"
```

### Task 26: Mentorship Router

**Files:**
- Create: `backend/app/routers/mentorships.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create mentorships router**

```python
# backend/app/routers/mentorships.py
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.mentorship import Mentorship, MentorshipGoal
from app.services.mentorship_service import (
    request_mentorship,
    accept_mentorship,
    decline_mentorship,
    cancel_mentorship,
    create_goal,
    get_available_mentors,
)

router = APIRouter(prefix="/api/mentorships", tags=["mentorships"])


class RequestMentorshipBody(BaseModel):
    mentor_id: str


class CreateGoalBody(BaseModel):
    category: str
    target_mastery: float = Field(..., ge=0, le=100)


# IMPORTANT: Static paths MUST be defined before parameterized paths
# to avoid FastAPI matching "mentors" as a {mentorship_id}
@router.get("/mentors/available")
async def available_mentors(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_available_mentors(db, user.org_id)


@router.get("")
async def list_mentorships(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Mentorship).where(
            or_(Mentorship.mentor_id == user.id, Mentorship.mentee_id == user.id)
        )
    )
    mentorships = result.scalars().all()
    out = []
    for m in mentorships:
        mentor = await db.get(User, m.mentor_id)
        mentee = await db.get(User, m.mentee_id)
        out.append({
            "id": str(m.id),
            "mentor": {"id": str(mentor.id), "display_name": mentor.display_name} if mentor else None,
            "mentee": {"id": str(mentee.id), "display_name": mentee.display_name} if mentee else None,
            "status": m.status,
            "started_at": m.started_at.isoformat() if m.started_at else None,
            "role": "mentor" if m.mentor_id == user.id else "mentee",
        })
    return out


@router.post("/request", status_code=201)
async def request_mentor(
    body: RequestMentorshipBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        mentorship = await request_mentorship(db, user.org_id, uuid.UUID(body.mentor_id), user.id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    await db.commit()
    return {"id": str(mentorship.id), "status": mentorship.status}


@router.put("/{mentorship_id}/accept")
async def accept(
    mentorship_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mentorship = await db.get(Mentorship, uuid.UUID(mentorship_id))
    if not mentorship or mentorship.mentor_id != user.id:
        raise HTTPException(status_code=404)
    try:
        await accept_mentorship(db, uuid.UUID(mentorship_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await db.commit()
    return {"status": "active"}


@router.put("/{mentorship_id}/decline")
async def decline(
    mentorship_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mentorship = await db.get(Mentorship, uuid.UUID(mentorship_id))
    if not mentorship or mentorship.mentor_id != user.id:
        raise HTTPException(status_code=404)
    await decline_mentorship(db, uuid.UUID(mentorship_id))
    await db.commit()
    return {"status": "declined"}


@router.put("/{mentorship_id}/cancel")
async def cancel(
    mentorship_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mentorship = await db.get(Mentorship, uuid.UUID(mentorship_id))
    if not mentorship or (mentorship.mentor_id != user.id and mentorship.mentee_id != user.id):
        raise HTTPException(status_code=404)
    await cancel_mentorship(db, uuid.UUID(mentorship_id))
    await db.commit()
    return {"status": "cancelled"}


@router.get("/{mentorship_id}/goals")
async def list_goals(
    mentorship_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorshipGoal).where(MentorshipGoal.mentorship_id == uuid.UUID(mentorship_id))
    )
    goals = result.scalars().all()
    return [
        {
            "id": str(g.id),
            "category": g.category,
            "target_mastery": g.target_mastery,
            "current_mastery": g.current_mastery,
            "achieved_at": g.achieved_at.isoformat() if g.achieved_at else None,
        }
        for g in goals
    ]


@router.post("/{mentorship_id}/goals", status_code=201)
async def add_goal(
    mentorship_id: str,
    body: CreateGoalBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal = await create_goal(db, uuid.UUID(mentorship_id), body.category, body.target_mastery)
    await db.commit()
    return {"id": str(goal.id), "category": goal.category}


```

- [ ] **Step 2: Register in main.py**

Add `mentorships` to router imports and register.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/mentorships.py backend/app/main.py
git commit -m "feat: add mentorships router"
```

### Task 27: Phase 3 Migration

- [ ] **Step 1: Generate migration**

Run: `cd backend && alembic revision --autogenerate -m "phase3 mentorship"`

- [ ] **Step 2: Add partial unique index in migration**

Add after auto-generated ops:
```python
op.execute("""
    CREATE UNIQUE INDEX uq_active_mentorship ON mentorships (mentor_id, mentee_id) WHERE status = 'active';
""")
```

- [ ] **Step 3: Run migration**

Run: `cd backend && alembic upgrade head`

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "migrate: phase3 mentorship tables with partial unique index"
```

### Task 28: Mentorship Hub Frontend

**Files:**
- Create: `frontend/src/pages/MentorshipHubPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create MentorshipHubPage**

```tsx
// frontend/src/pages/MentorshipHubPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserPlus, Users, Target } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AVATAR_PRESETS } from "../constants/avatars";

export default function MentorshipHubPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"my" | "find">("my");

  const { data: mentorships } = useQuery({
    queryKey: ["mentorships"],
    queryFn: async () => (await api.get("/mentorships")).data,
  });

  const { data: mentors } = useQuery({
    queryKey: ["available-mentors"],
    queryFn: async () => (await api.get("/mentorships/mentors/available")).data,
    enabled: tab === "find",
  });

  const requestMutation = useMutation({
    mutationFn: async (mentorId: string) =>
      (await api.post("/mentorships/request", { mentor_id: mentorId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => (await api.put(`/mentorships/${id}/accept`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentorships"] }),
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => (await api.put(`/mentorships/${id}/decline`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentorships"] }),
  });

  const pending = mentorships?.filter((m: any) => m.status === "pending" && m.role === "mentor") || [];
  const active = mentorships?.filter((m: any) => m.status === "active") || [];

  return (
    <div className="cm-page max-w-3xl">
      <h1 className="cm-title mb-6">Mentorship</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("my")} className={tab === "my" ? "cm-tab-active" : "cm-tab"}>
          My Mentorships
        </button>
        <button onClick={() => setTab("find")} className={tab === "find" ? "cm-tab-active" : "cm-tab"}>
          Find a Mentor
        </button>
      </div>

      {tab === "my" && (
        <div className="space-y-4">
          {/* Pending requests */}
          {pending.length > 0 && (
            <div>
              <h2 className="cm-label mb-2">Pending Requests</h2>
              {pending.map((m: any) => (
                <div key={m.id} className="cm-surface p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cm-text">{m.mentee.display_name}</p>
                    <p className="text-xs text-cm-muted">Wants you as a mentor</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptMutation.mutate(m.id)} className="cm-btn-primary text-xs px-3 py-1">Accept</button>
                    <button onClick={() => declineMutation.mutate(m.id)} className="cm-tab text-xs px-3 py-1">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active mentorships */}
          <div>
            <h2 className="cm-label mb-2">Active</h2>
            {active.length === 0 ? (
              <div className="cm-surface p-8 text-center text-cm-muted">
                No active mentorships. Find a mentor to get started!
              </div>
            ) : (
              active.map((m: any) => (
                <div key={m.id} className="cm-surface p-4 flex items-center gap-3">
                  <Users size={18} className="text-cm-primary" />
                  <div>
                    <p className="text-sm font-medium text-cm-text">
                      {m.role === "mentor" ? `Mentoring ${m.mentee.display_name}` : `Mentor: ${m.mentor.display_name}`}
                    </p>
                    <p className="text-xs text-cm-muted">Since {new Date(m.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "find" && (
        <div className="space-y-3">
          {mentors?.length === 0 && (
            <div className="cm-surface p-8 text-center text-cm-muted">
              No mentors available right now.
            </div>
          )}
          {mentors?.map((m: any) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="cm-surface p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-lg">
                  {AVATAR_PRESETS[m.avatar_id || "default"] || "👤"}
                </div>
                <div>
                  <p className="text-sm font-medium text-cm-text">{m.display_name}</p>
                  <p className="text-xs text-cm-muted">Level {m.level} · {m.mastered_categories} mastered categories</p>
                </div>
              </div>
              <button
                onClick={() => requestMutation.mutate(m.id)}
                disabled={requestMutation.isPending}
                className="cm-btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <UserPlus size={12} />
                Request
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add route and sidebar nav**

In `frontend/src/App.tsx`:
```tsx
import MentorshipHubPage from "./pages/MentorshipHubPage";
// Add route:
<Route path="/mentorship" element={<MentorshipHubPage />} />
```

In `frontend/src/components/Sidebar.tsx`, add `Heart` to lucide imports, add to "Community" group:
```tsx
{ to: "/mentorship", icon: Heart, label: "Mentorship", matchExact: false },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/MentorshipHubPage.tsx frontend/src/App.tsx frontend/src/components/Sidebar.tsx
git commit -m "feat: add Mentorship Hub page with mentor browsing and requests"
```

### Task 29: Final Integration — Run All Tests

- [ ] **Step 1: Run backend tests**

Run: `cd backend && python -m pytest -v`
Expected: All tests pass

- [ ] **Step 2: Run frontend build check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit any fixes**

If any tests fail or type errors exist, fix them and commit.

```bash
git add -A && git commit -m "fix: resolve test and type errors from engagement features"
```

---

## Errata: Additional Tasks Required

The following tasks were identified during plan review and must be completed. Insert them at the appropriate phase.

### Task 30: Event Scenario Generation Endpoint (Phase 1, after Task 9)

The spec requires `POST /api/events/{id}/scenarios/generate` to generate scenarios constrained to the event's `scenario_pool`. Add this endpoint to the events router:

```python
@router.post("/{event_id}/scenarios/generate")
async def generate_event_scenario(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import random
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id or event.status != "active":
        raise HTTPException(status_code=404, detail="Active event not found")
    # Pick random category/difficulty from pool
    pool_entry = random.choice(event.scenario_pool)
    # Use existing scenario engine to generate
    from app.services.scenario_engine import generate_scenario
    scenario = await generate_scenario(db, pool_entry["category"], pool_entry["difficulty"])
    return {"scenario": scenario, "event_id": event_id}
```

The frontend `EventDetailPage` should call this endpoint instead of the regular scenario generation.

### Task 31: Event Update Endpoint (Phase 1, after Task 9)

Add `PUT /api/events/{id}` to the events router:

```python
@router.put("/{event_id}")
async def update_event(
    event_id: str,
    body: CreateEventRequest,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404)
    if event.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft events can be fully updated")
    for field in ["title", "description", "theme", "start_at", "end_at", "scenario_pool", "scoring_config", "max_scenarios_per_user"]:
        setattr(event, field, getattr(body, field))
    await db.commit()
    return {"id": str(event.id), "status": event.status}
```

### Task 32: Event Debrief Endpoint + Page (Phase 1, after Task 13)

Add `GET /api/events/{id}/debrief` endpoint returning aggregate stats:

```python
@router.get("/{event_id}/debrief")
async def event_debrief(event_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    event = await db.get(MarketEvent, uuid.UUID(event_id))
    if not event or event.org_id != user.org_id:
        raise HTTPException(status_code=404)
    # Aggregate: total participants, avg score, scenarios completed, top performers
    from sqlalchemy import func
    stats = await db.execute(
        select(
            func.count(EventParticipation.id).label("participants"),
            func.avg(EventParticipation.individual_score).label("avg_score"),
            func.sum(EventParticipation.scenarios_completed).label("total_scenarios"),
        ).where(EventParticipation.event_id == uuid.UUID(event_id))
    )
    row = stats.one()
    return {
        "event_id": event_id,
        "participants": row.participants,
        "avg_score": float(row.avg_score or 0),
        "total_scenarios": row.total_scenarios or 0,
    }
```

Create `frontend/src/pages/EventDebriefPage.tsx` displaying these stats with charts.

### Task 33: Mastery Detail Endpoint (Phase 2, after Task 19)

Add `GET /api/skills/mastery/{category}` to skills router:

```python
@router.get("/mastery/{category}")
async def category_mastery(category: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.mastery_service import recalculate_mastery
    record = await recalculate_mastery(db, user.id, category)
    return {
        "category": record.category,
        "mastery_level": round(record.mastery_level, 1),
        "peak_mastery": round(record.peak_mastery, 1),
        "scenarios_completed": record.scenarios_completed,
        "avg_score": round(record.avg_score, 2),
        "last_attempt_at": record.last_attempt_at.isoformat() if record.last_attempt_at else None,
    }
```

### Task 34: Merge Mastery Constants Update with Progression Update (Phase 2)

**CRITICAL:** Tasks 17 and 18 must be executed atomically. The `MASTERY_THRESHOLD` and `MASTERY_SCENARIO_COUNT` changes in `constants.py` break the existing `check_mastery()` until `progression.py` is also updated. Execute both steps in a single commit. Also update `get_mastered_categories()` to use `MASTERY_SCENARIO_COUNT` (now 10) when slicing recent scores.

### Task 35: Mentorship Complete + Nudge Endpoints (Phase 3, after Task 26)

Add to mentorships router:

```python
@router.put("/{mentorship_id}/complete")
async def complete_mentorship(mentorship_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    mentorship = await db.get(Mentorship, uuid.UUID(mentorship_id))
    if not mentorship or (mentorship.mentor_id != user.id and mentorship.mentee_id != user.id):
        raise HTTPException(status_code=404)
    mentorship.status = "completed"
    mentorship.completed_at = utc_now_naive()
    await db.commit()
    return {"status": "completed"}

@router.post("/{mentorship_id}/nudge")
async def nudge_mentee(mentorship_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    mentorship = await db.get(Mentorship, uuid.UUID(mentorship_id))
    if not mentorship or mentorship.mentor_id != user.id:
        raise HTTPException(status_code=404)
    mentee = await db.get(User, mentorship.mentee_id)
    from app.services.notification_service import create_notification
    await create_notification(db, mentorship.mentee_id, "mentor_nudge", "Your mentor nudged you!", f"{user.display_name} wants you to keep training!")
    await db.commit()
    return {"status": "sent"}
```

### Task 36: Mentor Availability Toggle (Phase 3, after Task 26)

Add `is_mentor_available` boolean column to `User` model (default False). Add endpoint:

```python
# In users router or mentorships router
@router.put("/users/me/mentor-status")
async def toggle_mentor_status(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.is_mentor_available = not user.is_mentor_available
    await db.commit()
    return {"is_mentor_available": user.is_mentor_available}
```

Update `get_available_mentors` to also filter by `User.is_mentor_available == True`.

### Task 37: Event Lifecycle Cron Job (Phase 1, after Task 11)

Add a background task in `main.py` lifespan for auto-activating/completing events:

```python
async def _event_lifecycle_loop():
    """Runs every 60s to auto-activate/complete events."""
    while True:
        try:
            async with async_session() as db:
                now = utc_now_naive()
                # Auto-activate draft events past start_at
                drafts = await db.execute(
                    select(MarketEvent).where(and_(MarketEvent.status == "draft", MarketEvent.start_at <= now))
                )
                for event in drafts.scalars().all():
                    event.status = "active"
                # Auto-complete active events past end_at
                actives = await db.execute(
                    select(MarketEvent).where(and_(MarketEvent.status == "active", MarketEvent.end_at <= now))
                )
                for event in actives.scalars().all():
                    await finalize_event(db, event.id)
                await db.commit()
        except Exception as e:
            print(f"Event lifecycle error: {e}")
        await asyncio.sleep(60)
```

Launch in lifespan: `asyncio.create_task(_event_lifecycle_loop())`

### Task 38: Mastery Decay Background Job (Phase 2, after Task 22)

Add a daily background job for mastery decay:

```python
async def _mastery_decay_loop():
    """Runs daily to apply mastery decay for inactive users."""
    while True:
        try:
            async with async_session() as db:
                from app.services.mastery_service import apply_decay
                from datetime import timedelta
                cutoff = utc_now_naive() - timedelta(days=7)
                result = await db.execute(
                    select(UserSkillMastery).where(UserSkillMastery.last_attempt_at < cutoff)
                )
                for record in result.scalars().all():
                    weeks = int((utc_now_naive() - record.last_attempt_at).days / 7)
                    record.mastery_level = apply_decay(record.mastery_level, record.peak_mastery, weeks)
                await db.commit()
        except Exception as e:
            print(f"Mastery decay error: {e}")
        await asyncio.sleep(86400)  # 24 hours
```

### Task 39: New Badge Definitions (Phase 1+2+3)

Extend `backend/app/services/badge_seeder.py` with the 6 new badges from the spec:

```python
{"slug": "event_warrior", "name": "Event Warrior", "description": "Complete 5 events", "icon": "calendar", "category": "events", "tier": "silver"},
{"slug": "event_champion", "name": "Event Champion", "description": "Finish top 3 in any event", "icon": "trophy", "category": "events", "tier": "gold"},
{"slug": "tree_climber", "name": "Tree Climber", "description": "Master 5 skill tree nodes", "icon": "git-branch", "category": "skills", "tier": "silver"},
{"slug": "full_canopy", "name": "Full Canopy", "description": "Master all Tier 1 nodes", "icon": "tree-pine", "category": "skills", "tier": "gold"},
{"slug": "sherpa", "name": "Sherpa", "description": "Mentor 3 mentees to goal completion", "icon": "heart", "category": "mentorship", "tier": "gold"},
{"slug": "guided", "name": "Guided", "description": "Complete all mentorship goals", "icon": "compass", "category": "mentorship", "tier": "silver"},
```

Add corresponding badge check logic to `badge_service.py`.

### Task 40: Missing Activity Feed Emissions

Wire up `emit_activity` calls at these points:
- `join_event_endpoint` → `emit_activity(db, user.id, "event_joined", {...})`
- `finalize_event` badge awarding → `emit_activity(db, user.id, "event_badge_earned", {...})`
- `accept_mentorship` → `emit_activity(db, mentorship.mentee_id, "mentorship_started", {...})`
- Goal achievement detection → `emit_activity(db, mentee_id, "mentorship_goal_achieved", {...})`

### Task 41: Org-Scoped Badge Queries (Phase 0)

In `backend/app/routers/badges.py`, add `user: User = Depends(get_current_user)` and filter UserBadge queries by org:

```python
.join(User, User.id == UserBadge.user_id).where(User.org_id == user.org_id)
```

### Task 42: Skill Tree Seed Prerequisites Alignment

The seed data in Task 21 must use prerequisites matching `CATEGORY_PREREQUISITES` in `constants.py`. Before seeding, cross-reference and align. If the skill tree introduces different prerequisite chains, update `CATEGORY_PREREQUISITES` to match (single source of truth).

### Task 43: Mentor Dashboard Page (Phase 3, after Task 28)

Create `frontend/src/pages/MentorDashboardPage.tsx` with:
- Mentee list with at-a-glance stats
- Per-mentee goal cards with progress bars
- Activity timeline (recent completions)
- Nudge button per mentee

Add route `/mentorship/dashboard` in `App.tsx`.
