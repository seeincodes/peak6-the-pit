from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.scenario_engine import generate_scenario
from app.services.recommendation import get_recommendations
from app.services.difficulty_engine import get_difficulty_suggestions
from app.services.rag import retrieve_chunks, build_retrieval_query, CATEGORY_QUERIES

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


class GenerateRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"


@router.post("/generate")
async def generate(
    req: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario_data = await generate_scenario(
        db,
        req.category,
        req.difficulty,
        user_id=str(current_user.id),
    )

    scenario = Scenario(
        category=scenario_data["category"],
        difficulty=scenario_data["difficulty"],
        content=scenario_data["content"],
        context_chunks=scenario_data["context_chunks"],
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)

    return {
        "id": str(scenario.id),
        "category": scenario.category,
        "difficulty": scenario.difficulty,
        "content": scenario.content,
    }


@router.get("/recommended")
async def recommended(
    limit: int = Query(3, ge=1, le=5),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return recommended categories based on spaced repetition analysis."""
    unlocked = current_user.unlocked_categories or []
    recs = await get_recommendations(db, current_user.id, unlocked, limit=limit)
    return recs


@router.get("/difficulty-suggestions")
async def difficulty_suggestions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return adaptive difficulty suggestions based on recent performance."""
    unlocked = current_user.unlocked_categories or []
    return await get_difficulty_suggestions(db, current_user.id, unlocked)


@router.get("/categories/{slug}/primer")
async def get_category_primer(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return top RAG chunks for a category as learning primer content."""
    if slug not in CATEGORY_QUERIES:
        raise HTTPException(status_code=404, detail="Category not found")
    query = build_retrieval_query(slug, "beginner")
    chunks = await retrieve_chunks(db, query, top_k=5)
    return {
        "category": slug,
        "chunks": [{"content": c["content"], "source": c["filename"]} for c in chunks],
    }


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: UUID, db: AsyncSession = Depends(get_db)):
    scenario = await db.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {
        "id": str(scenario.id),
        "category": scenario.category,
        "difficulty": scenario.difficulty,
        "content": scenario.content,
    }
