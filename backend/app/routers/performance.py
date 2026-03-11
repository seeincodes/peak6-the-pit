from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.grade import Grade
from app.models.response import Response
from app.models.scenario import Scenario
from app.models.xp_transaction import XPTransaction
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.get("/category-summary")
async def get_category_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All-time per-category stats: attempts and avg score."""
    stmt = (
        select(
            Scenario.category,
            func.avg(Grade.overall_score).label("avg_score"),
            func.count().label("attempts"),
        )
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == current_user.id)
        .group_by(Scenario.category)
    )
    rows = (await db.execute(stmt)).all()
    return [
        {"category": r.category, "avg_score": round(float(r.avg_score), 1), "attempts": r.attempts}
        for r in rows
    ]


@router.get("/history")
async def get_performance_history(
    days: int = Query(30, ge=7, le=90),
    include_cohort: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)

    # Score trend: daily average scores
    score_trend_stmt = (
        select(
            cast(Grade.graded_at, Date).label("date"),
            func.avg(Grade.overall_score).label("avg_score"),
            func.count().label("count"),
        )
        .join(Response, Grade.response_id == Response.id)
        .where(Response.user_id == current_user.id)
        .where(Grade.graded_at >= cutoff)
        .group_by(cast(Grade.graded_at, Date))
        .order_by(cast(Grade.graded_at, Date))
    )
    score_rows = (await db.execute(score_trend_stmt)).all()
    score_trend = [
        {"date": str(row.date), "avg_score": round(float(row.avg_score), 1), "count": row.count}
        for row in score_rows
    ]

    # Category performance: avg score per category
    cat_stmt = (
        select(
            Scenario.category,
            func.avg(Grade.overall_score).label("avg_score"),
            func.count().label("attempts"),
        )
        .join(Response, Grade.response_id == Response.id)
        .join(Scenario, Response.scenario_id == Scenario.id)
        .where(Response.user_id == current_user.id)
        .where(Grade.graded_at >= cutoff)
        .group_by(Scenario.category)
        .order_by(func.avg(Grade.overall_score).desc())
    )
    cat_rows = (await db.execute(cat_stmt)).all()
    category_performance = [
        {"category": row.category, "avg_score": round(float(row.avg_score), 1), "attempts": row.attempts}
        for row in cat_rows
    ]

    # XP trend: daily XP earned
    xp_stmt = (
        select(
            cast(XPTransaction.created_at, Date).label("date"),
            func.sum(XPTransaction.amount).label("xp"),
        )
        .where(XPTransaction.user_id == current_user.id)
        .where(XPTransaction.created_at >= cutoff)
        .group_by(cast(XPTransaction.created_at, Date))
        .order_by(cast(XPTransaction.created_at, Date))
    )
    xp_rows = (await db.execute(xp_stmt)).all()
    xp_trend = [
        {"date": str(row.date), "xp": int(row.xp)}
        for row in xp_rows
    ]

    # Dimension averages (deep-analysis grades only — they have "reasoning" key)
    dim_stmt = (
        select(Grade.dimension_scores)
        .join(Response, Grade.response_id == Response.id)
        .where(Response.user_id == current_user.id)
        .where(Grade.graded_at >= cutoff)
    )
    dim_rows = (await db.execute(dim_stmt)).scalars().all()

    dimension_sums: dict[str, list[float]] = {}
    for scores in dim_rows:
        if not isinstance(scores, dict) or "reasoning" not in scores:
            continue
        for dim in ("reasoning", "terminology", "trade_logic", "risk_awareness"):
            val = scores.get(dim)
            if val is not None:
                dimension_sums.setdefault(dim, []).append(float(val))

    dimension_averages = {
        dim: round(sum(vals) / len(vals), 1) if vals else 0
        for dim, vals in dimension_sums.items()
    }

    # Totals
    total_attempts = sum(r.count for r in score_rows)
    all_scores = [float(r.avg_score) for r in score_rows]
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
    best_category = category_performance[0]["category"] if category_performance else None
    weakest_category = category_performance[-1]["category"] if category_performance else None

    result = {
        "score_trend": score_trend,
        "category_performance": category_performance,
        "xp_trend": xp_trend,
        "dimension_averages": dimension_averages,
        "totals": {
            "total_attempts": total_attempts,
            "total_xp": current_user.xp_total,
            "avg_score": avg_score,
            "best_category": best_category,
            "weakest_category": weakest_category,
        },
    }

    if include_cohort:
        # Cohort score trend (all users)
        cohort_score_stmt = (
            select(
                cast(Grade.graded_at, Date).label("date"),
                func.avg(Grade.overall_score).label("avg_score"),
                func.count().label("count"),
            )
            .join(Response, Grade.response_id == Response.id)
            .where(Grade.graded_at >= cutoff)
            .group_by(cast(Grade.graded_at, Date))
            .order_by(cast(Grade.graded_at, Date))
        )
        cohort_score_rows = (await db.execute(cohort_score_stmt)).all()

        # Cohort category performance (all users)
        cohort_cat_stmt = (
            select(
                Scenario.category,
                func.avg(Grade.overall_score).label("avg_score"),
                func.count().label("attempts"),
            )
            .join(Response, Grade.response_id == Response.id)
            .join(Scenario, Response.scenario_id == Scenario.id)
            .where(Grade.graded_at >= cutoff)
            .group_by(Scenario.category)
        )
        cohort_cat_rows = (await db.execute(cohort_cat_stmt)).all()

        # Cohort dimension averages (all users)
        cohort_dim_stmt = (
            select(Grade.dimension_scores)
            .join(Response, Grade.response_id == Response.id)
            .where(Grade.graded_at >= cutoff)
        )
        cohort_dim_rows = (await db.execute(cohort_dim_stmt)).scalars().all()

        cohort_dim_sums: dict[str, list[float]] = {}
        for scores in cohort_dim_rows:
            if not isinstance(scores, dict) or "reasoning" not in scores:
                continue
            for dim in ("reasoning", "terminology", "trade_logic", "risk_awareness"):
                val = scores.get(dim)
                if val is not None:
                    cohort_dim_sums.setdefault(dim, []).append(float(val))

        result["cohort"] = {
            "score_trend": [
                {"date": str(r.date), "avg_score": round(float(r.avg_score), 1), "count": r.count}
                for r in cohort_score_rows
            ],
            "category_performance": [
                {"category": r.category, "avg_score": round(float(r.avg_score), 1), "attempts": r.attempts}
                for r in cohort_cat_rows
            ],
            "dimension_averages": {
                dim: round(sum(vals) / len(vals), 1) if vals else 0
                for dim, vals in cohort_dim_sums.items()
            },
        }

    return result
