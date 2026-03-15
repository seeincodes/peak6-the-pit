from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.schemas.admin import (
    LearningProgressResponse,
    ActivityResponse,
    ContentPerformanceResponse,
)
from app.services.analytics import (
    get_learning_progress,
    get_activity_metrics,
    get_content_performance,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/org/{org_id}/learning", response_model=LearningProgressResponse)
async def get_org_learning_progress(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Get learning progress analytics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates with defaults
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_learning_progress(db, org_id, start, end)


@router.get("/org/{org_id}/activity", response_model=ActivityResponse)
async def get_org_activity(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
    granularity: str = "daily",
):
    """Get activity metrics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_activity_metrics(db, org_id, start, end)


@router.get("/org/{org_id}/scenarios", response_model=ContentPerformanceResponse)
async def get_org_content_performance(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
    difficulty: str | None = None,
    category: str | None = None,
):
    """Get content performance analytics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_content_performance(
        db, org_id, start, end, difficulty=difficulty, category=category
    )
