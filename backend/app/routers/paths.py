"""Learning path endpoints — browse, enroll, and track progress."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.learning_path import LearningPath, UserPathProgress
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/paths", tags=["paths"])


@router.get("")
async def list_paths(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active learning paths with user's progress."""
    paths = (await db.execute(
        select(LearningPath)
        .where(LearningPath.is_active == True)  # noqa: E712
        .order_by(LearningPath.display_order)
    )).scalars().all()

    progress_rows = (await db.execute(
        select(UserPathProgress).where(UserPathProgress.user_id == user.id)
    )).scalars().all()
    progress_map = {p.path_id: p for p in progress_rows}

    result = []
    for path in paths:
        prog = progress_map.get(path.id)
        total_steps = len(path.steps)
        result.append({
            "id": str(path.id),
            "slug": path.slug,
            "name": path.name,
            "description": path.description,
            "icon": path.icon,
            "difficulty_level": path.difficulty_level,
            "estimated_minutes": path.estimated_minutes,
            "total_steps": total_steps,
            "current_step": prog.current_step if prog else None,
            "completed_at": prog.completed_at.isoformat() if prog and prog.completed_at else None,
            "progress_pct": round((prog.current_step / total_steps) * 100) if prog and total_steps > 0 else 0,
        })
    return result


@router.get("/{path_id}")
async def get_path_detail(
    path_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get path detail with steps annotated by user's progress status."""
    path = await db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found")

    prog = (await db.execute(
        select(UserPathProgress).where(
            UserPathProgress.user_id == user.id,
            UserPathProgress.path_id == path.id,
        )
    )).scalar_one_or_none()

    current_step = prog.current_step if prog else None
    steps_with_status = []
    for step in path.steps:
        sn = step["step_number"]
        if current_step is None:
            status = "locked"
        elif sn <= current_step:
            status = "completed"
        elif sn == current_step + 1:
            status = "current"
        else:
            status = "locked"
        # Learning paths now run in concept-first MCQ mode for every step.
        steps_with_status.append({**step, "status": status, "step_type": "mcq"})

    return {
        "id": str(path.id),
        "slug": path.slug,
        "name": path.name,
        "description": path.description,
        "icon": path.icon,
        "difficulty_level": path.difficulty_level,
        "estimated_minutes": path.estimated_minutes,
        "steps": steps_with_status,
        "current_step": current_step,
        "completed_at": prog.completed_at.isoformat() if prog and prog.completed_at else None,
        "is_enrolled": prog is not None,
    }


@router.post("/{path_id}/enroll")
async def enroll_in_path(
    path_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enroll user in a learning path. Idempotent."""
    path = await db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found")

    existing = (await db.execute(
        select(UserPathProgress).where(
            UserPathProgress.user_id == user.id,
            UserPathProgress.path_id == path.id,
        )
    )).scalar_one_or_none()

    if existing:
        return {"status": "already_enrolled", "current_step": existing.current_step}

    prog = UserPathProgress(user_id=user.id, path_id=path.id, current_step=0)
    db.add(prog)
    await db.commit()
    return {"status": "enrolled", "current_step": 0}


@router.post("/{path_id}/start-step")
async def start_step(
    path_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the category+difficulty for the current step so frontend can generate a scenario."""
    path = await db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found")

    prog = (await db.execute(
        select(UserPathProgress).where(
            UserPathProgress.user_id == user.id,
            UserPathProgress.path_id == path.id,
        )
    )).scalar_one_or_none()

    if not prog:
        raise HTTPException(status_code=400, detail="Not enrolled in this path")
    if prog.completed_at:
        raise HTTPException(status_code=400, detail="Path already completed")

    next_step_num = prog.current_step + 1
    step = next((s for s in path.steps if s["step_number"] == next_step_num), None)
    if not step:
        raise HTTPException(status_code=400, detail="No more steps")

    return {
        "category": step["category"],
        "difficulty": step["difficulty"],
        "step_number": step["step_number"],
        "step_title": step["title"],
        "step_description": step.get("description", ""),
        # Always launch MCQ mode for path steps.
        "step_type": "mcq",
        "required_score": step["required_score"],
        "path_id": str(path.id),
        "path_name": path.name,
    }
