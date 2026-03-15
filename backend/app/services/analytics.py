from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.response import Response
from app.models.grade import Grade
from app.models.scenario import Scenario
from app.models.activity_event import ActivityEvent
from app.schemas.admin import (
    LearningProgressResponse,
    ActivityResponse,
    ActivityDataPoint,
    ContentPerformanceResponse,
    ScenarioPerformance,
)


async def get_learning_progress(
    db: AsyncSession,
    org_id: UUID,
    start_date: datetime,
    end_date: datetime,
) -> LearningProgressResponse:
    """Get learning progress analytics for an organization."""

    # Get all org users
    org_users_result = await db.execute(
        select(User.id).where(User.org_id == org_id)
    )
    org_user_ids = [row[0] for row in org_users_result]

    if not org_user_ids:
        return LearningProgressResponse(
            total_scenarios_completed=0,
            avg_score=None,
            level_distribution={},
            completion_by_role={},
            completion_by_cohort={},
        )

    # Total scenarios completed
    total_completed = await db.execute(
        select(func.count()).where(
            Response.user_id.in_(org_user_ids),
            Response.is_complete == True,
            Response.submitted_at.between(start_date, end_date),
        )
    )
    total_scenarios = total_completed.scalar() or 0

    # Average score
    avg_score_result = await db.execute(
        select(func.avg(Grade.overall_score))
        .join(Response, Grade.response_id == Response.id)
        .where(
            Response.user_id.in_(org_user_ids),
            Response.submitted_at.between(start_date, end_date),
        )
    )
    avg_score = avg_score_result.scalar()

    # Level distribution
    level_dist_result = await db.execute(
        select(User.level, func.count()).where(
            User.org_id == org_id
        ).group_by(User.level)
    )
    level_distribution = {str(level): count for level, count in level_dist_result}

    # Completion by role
    role_result = await db.execute(
        select(User.role, func.count()).where(
            User.id.in_(org_user_ids)
        ).group_by(User.role)
    )
    completion_by_role = {role: count for role, count in role_result}

    # Completion by cohort
    cohort_result = await db.execute(
        select(User.cohort, func.count()).where(
            User.id.in_(org_user_ids),
            User.cohort.isnot(None)
        ).group_by(User.cohort)
    )
    completion_by_cohort = {cohort: count for cohort, count in cohort_result}

    return LearningProgressResponse(
        total_scenarios_completed=total_scenarios,
        avg_score=round(float(avg_score), 2) if avg_score else None,
        level_distribution=level_distribution,
        completion_by_role=completion_by_role,
        completion_by_cohort=completion_by_cohort,
    )


async def get_activity_metrics(
    db: AsyncSession,
    org_id: UUID,
    start_date: datetime,
    end_date: datetime,
) -> ActivityResponse:
    """Get activity metrics for an organization."""

    # Get org users
    org_users_result = await db.execute(
        select(User.id).where(User.org_id == org_id)
    )
    org_user_ids = [row[0] for row in org_users_result]

    if not org_user_ids:
        return ActivityResponse(
            completions_over_time=[],
            active_users=0,
            peak_hours=[],
            total_completions=0,
        )

    # Completions over time (daily)
    completions_result = await db.execute(
        select(
            func.date(Response.submitted_at).label("date"),
            func.count().label("count")
        ).where(
            Response.user_id.in_(org_user_ids),
            Response.is_complete == True,
            Response.submitted_at.between(start_date, end_date),
        ).group_by(func.date(Response.submitted_at))
        .order_by(func.date(Response.submitted_at))
    )
    completions_over_time = [
        ActivityDataPoint(date=str(row[0]), count=row[1])
        for row in completions_result
    ]

    # Active users (distinct users with activity)
    active_users_result = await db.execute(
        select(func.count(func.distinct(Response.user_id))).where(
            Response.user_id.in_(org_user_ids),
            Response.submitted_at.between(start_date, end_date),
        )
    )
    active_users = active_users_result.scalar() or 0

    # Peak hours
    peak_hours_result = await db.execute(
        select(
            func.extract("hour", Response.submitted_at).label("hour"),
            func.count().label("count")
        ).where(
            Response.user_id.in_(org_user_ids),
            Response.submitted_at.between(start_date, end_date),
        ).group_by(func.extract("hour", Response.submitted_at))
        .order_by(func.count().desc())
        .limit(3)
    )
    peak_hours = [int(row[0]) for row in peak_hours_result]

    # Total completions
    total_completions = await db.execute(
        select(func.count()).where(
            Response.user_id.in_(org_user_ids),
            Response.is_complete == True,
            Response.submitted_at.between(start_date, end_date),
        )
    )
    total_count = total_completions.scalar() or 0

    return ActivityResponse(
        completions_over_time=completions_over_time,
        active_users=active_users,
        peak_hours=peak_hours,
        total_completions=total_count,
    )


async def get_content_performance(
    db: AsyncSession,
    org_id: UUID,
    start_date: datetime,
    end_date: datetime,
    difficulty: str | None = None,
    category: str | None = None,
) -> ContentPerformanceResponse:
    """Get scenario performance analytics for an organization."""

    # Get org users
    org_users_result = await db.execute(
        select(User.id).where(User.org_id == org_id)
    )
    org_user_ids = [row[0] for row in org_users_result]

    if not org_user_ids:
        return ContentPerformanceResponse(scenarios=[])

    # Query scenarios with performance data
    query = (
        select(
            Scenario.id,
            Scenario.content,
            Scenario.category,
            Scenario.difficulty,
            func.count(Response.id).label("total_attempts"),
            func.count(func.case((Response.is_complete == True, 1))).label("completions"),
            func.avg(Grade.overall_score).label("avg_score"),
        )
        .outerjoin(Response, Scenario.id == Response.scenario_id)
        .outerjoin(Grade, Response.id == Grade.response_id)
        .where(
            Response.user_id.in_(org_user_ids),
            Response.submitted_at.between(start_date, end_date),
        )
    )

    if difficulty:
        query = query.where(Scenario.difficulty == difficulty)
    if category:
        query = query.where(Scenario.category == category)

    query = query.group_by(
        Scenario.id, Scenario.title, Scenario.category, Scenario.difficulty
    ).order_by(Scenario.category, Scenario.difficulty)

    results = await db.execute(query)
    scenarios = []

    for row in results:
        scenario_id, content, category, difficulty, total_attempts, completions, avg_score = row
        # Extract title from content JSON
        title = content.get("title", "Untitled Scenario") if isinstance(content, dict) else "Untitled Scenario"
        completion_rate = completions / total_attempts if total_attempts > 0 else 0

        scenarios.append(ScenarioPerformance(
            scenario_id=str(scenario_id),
            title=title,
            category=category,
            difficulty=difficulty,
            completion_rate=round(completion_rate, 2),
            avg_score=round(float(avg_score), 2) if avg_score else None,
            total_attempts=total_attempts,
        ))

    return ContentPerformanceResponse(scenarios=scenarios)
