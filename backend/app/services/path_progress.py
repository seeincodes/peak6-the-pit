"""Auto-advance learning path progress after scenario grading."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learning_path import LearningPath, UserPathProgress


async def check_and_advance_paths(
    db: AsyncSession,
    user_id,
    category: str,
    difficulty: str,
    overall_score: float,
    step_type: str = "scenario",
) -> list[dict]:
    """Check all in-progress paths for the user and advance if this grading
    satisfies the current step's requirements.

    step_type should be "scenario" or "mcq" to match the right step kind.

    Returns a list of path advancement events (for frontend notification).
    Does NOT commit — caller manages the transaction.
    """
    stmt = (
        select(UserPathProgress, LearningPath)
        .join(LearningPath, UserPathProgress.path_id == LearningPath.id)
        .where(
            UserPathProgress.user_id == user_id,
            UserPathProgress.completed_at.is_(None),
        )
    )
    rows = (await db.execute(stmt)).all()

    advancements = []

    for progress, path in rows:
        next_step_num = progress.current_step + 1
        step = next((s for s in path.steps if s["step_number"] == next_step_num), None)
        if not step:
            continue

        # Match category, difficulty, and step type
        if step["category"] != category or step["difficulty"] != difficulty:
            continue
        if step.get("step_type", "scenario") != step_type:
            continue

        required_score = step.get("required_score", 3.5)
        if overall_score < required_score:
            continue

        progress.current_step = next_step_num
        total_steps = len(path.steps)

        event = {
            "path_id": str(path.id),
            "path_name": path.name,
            "step_completed": next_step_num,
            "step_title": step["title"],
            "total_steps": total_steps,
            "path_completed": next_step_num >= total_steps,
        }

        if next_step_num >= total_steps:
            progress.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        advancements.append(event)

    return advancements
