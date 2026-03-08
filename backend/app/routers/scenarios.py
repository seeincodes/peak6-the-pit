from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.services.scenario_engine import generate_scenario

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


class GenerateRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"


@router.post("/generate")
async def generate(req: GenerateRequest, db: AsyncSession = Depends(get_db)):
    scenario_data = await generate_scenario(db, req.category, req.difficulty)

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
