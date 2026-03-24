"""Skills router — skill tree and mastery endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.mastery_service import get_user_mastery, get_skill_tree

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/tree")
async def get_tree(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return skill nodes for the user's org with org-override precedence."""
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
            "org_id": str(n.org_id) if n.org_id else None,
        }
        for n in nodes
    ]


@router.get("/mastery")
async def get_mastery(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all mastery records for the current user."""
    records = await get_user_mastery(db, user.id)
    return [
        {
            "category": r.category,
            "mastery_level": r.mastery_level,
            "peak_mastery": r.peak_mastery,
            "scenarios_completed": r.scenarios_completed,
            "avg_score": r.avg_score,
            "last_attempt_at": r.last_attempt_at.isoformat() if r.last_attempt_at else None,
        }
        for r in records
    ]


@router.get("/mastery/{category}")
async def get_mastery_for_category(
    category: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return detailed mastery for a single category."""
    records = await get_user_mastery(db, user.id)
    for r in records:
        if r.category == category:
            return {
                "category": r.category,
                "mastery_level": r.mastery_level,
                "peak_mastery": r.peak_mastery,
                "scenarios_completed": r.scenarios_completed,
                "avg_score": r.avg_score,
                "last_attempt_at": r.last_attempt_at.isoformat() if r.last_attempt_at else None,
            }
    raise HTTPException(status_code=404, detail=f"No mastery record found for category '{category}'")
