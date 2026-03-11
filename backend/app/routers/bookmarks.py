from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.bookmark import Bookmark
from app.models.scenario import Scenario
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


class BookmarkRequest(BaseModel):
    scenario_id: str
    tag: str = "reference"


@router.post("")
async def add_bookmark(
    req: BookmarkRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario = await db.get(Scenario, UUID(req.scenario_id))
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Upsert: update tag if already bookmarked
    existing = (
        await db.execute(
            select(Bookmark).where(
                Bookmark.user_id == user.id,
                Bookmark.scenario_id == scenario.id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.tag = req.tag
    else:
        db.add(Bookmark(user_id=user.id, scenario_id=scenario.id, tag=req.tag))

    await db.commit()
    return {"status": "bookmarked", "scenario_id": req.scenario_id, "tag": req.tag}


@router.delete("/{scenario_id}")
async def remove_bookmark(
    scenario_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        delete(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.scenario_id == scenario_id,
        )
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"status": "removed"}


@router.get("")
async def list_bookmarks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Bookmark, Scenario)
        .join(Scenario, Bookmark.scenario_id == Scenario.id)
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        {
            "scenario_id": str(s.id),
            "category": s.category,
            "difficulty": s.difficulty,
            "title": s.content.get("title", ""),
            "tag": b.tag,
            "created_at": b.created_at.isoformat(),
        }
        for b, s in rows
    ]
