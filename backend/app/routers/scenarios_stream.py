import json
import logging
import time

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.scenario_bank import ScenarioBank
from app.models.user import User
from app.services.scenario_engine import (
    _get_context,
    parse_scenario_json,
    build_scenario_prompt,
    build_rag_context,
    get_cached_scenario_for_user,
    cache_scenario_from_prompt,
)
from app.services.scenario_graph import stream_scenario_graph
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])
logger = logging.getLogger(__name__)


async def _serve_from_bank(db: AsyncSession, category: str, difficulty: str) -> dict | None:
    """Try to serve a scenario from the pre-generated bank (least-served first)."""
    result = await db.execute(
        select(ScenarioBank)
        .where(ScenarioBank.category == category, ScenarioBank.difficulty == difficulty)
        .order_by(ScenarioBank.times_served, ScenarioBank.created_at)
        .limit(1)
    )
    bank_row = result.scalar_one_or_none()
    if bank_row is None:
        return None

    await db.execute(
        update(ScenarioBank)
        .where(ScenarioBank.id == bank_row.id)
        .values(times_served=ScenarioBank.times_served + 1)
    )
    await db.commit()
    return bank_row.content


async def _save_to_bank(db: AsyncSession, category: str, difficulty: str, content: dict) -> None:
    """Save a freshly generated scenario into the bank for future reuse."""
    db.add(ScenarioBank(category=category, difficulty=difficulty, content=content))
    await db.commit()


class StreamGenerateRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"
    learning_objective: str | None = None


@router.post("/generate-stream")
async def generate_stream(
    req: StreamGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    started = time.perf_counter()
    chunks, market_snapshot = await _get_context(db, req.category, req.difficulty)
    rag_context, trimmed_chunks = build_rag_context(chunks)

    prompt = build_scenario_prompt(
        req.category, req.difficulty, rag_context, market_snapshot,
        learning_objective=req.learning_objective,
    )

    async def event_stream():
        full_text = ""

        # 1) Try pre-generated bank first (0 AI calls)
        bank_content = await _serve_from_bank(db, req.category, req.difficulty)
        if bank_content:
            try:
                scenario = Scenario(
                    category=req.category,
                    difficulty=req.difficulty,
                    content=bank_content,
                    context_chunks=trimmed_chunks,
                )
                db.add(scenario)
                await db.commit()
                await db.refresh(scenario)
                logger.info(
                    "scenario.stream bank_hit category=%s difficulty=%s total_ms=%d",
                    req.category,
                    req.difficulty,
                    int((time.perf_counter() - started) * 1000),
                )
                yield f"data: {json.dumps({'type': 'done', 'id': str(scenario.id), 'content': bank_content})}\n\n"
                return
            except Exception as e:
                logger.warning("Bank scenario save failed, falling through: %s", e)

        # 2) Try in-memory generation cache
        cached = await get_cached_scenario_for_user(prompt, str(user.id))
        if cached:
            try:
                scenario = Scenario(
                    category=req.category,
                    difficulty=req.difficulty,
                    content=cached["content"],
                    context_chunks=cached.get("context_chunks", trimmed_chunks),
                )
                db.add(scenario)
                await db.commit()
                await db.refresh(scenario)
                logger.info(
                    "scenario.stream cache_hit category=%s difficulty=%s total_ms=%d",
                    req.category,
                    req.difficulty,
                    int((time.perf_counter() - started) * 1000),
                )
                yield f"data: {json.dumps({'type': 'done', 'id': str(scenario.id), 'content': cached['content']})}\n\n"
                return
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to save cached scenario: {e}'})}\n\n"
                return
        try:
            chunk_count = 0
            model_started = time.perf_counter()
            async for text in stream_scenario_graph(prompt):
                full_text += text
                chunk_count += 1
                if chunk_count % 20 == 0:
                    yield f"data: {json.dumps({'type': 'progress'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'AI generation failed: {e}'})}\n\n"
            return

        # Parse the complete response, save to caches and bank
        try:
            scenario_data = parse_scenario_json(full_text)
            await cache_scenario_from_prompt(
                prompt,
                {
                    "category": req.category,
                    "difficulty": req.difficulty,
                    "content": scenario_data,
                    "context_chunks": trimmed_chunks,
                },
                user_id=str(user.id),
            )
            # Save to bank for future zero-AI serving
            try:
                await _save_to_bank(db, req.category, req.difficulty, scenario_data)
            except Exception:
                pass
        except (json.JSONDecodeError, ValueError) as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to parse scenario: {e}'})}\n\n"
            return

        try:
            scenario = Scenario(
                category=req.category,
                difficulty=req.difficulty,
                content=scenario_data,
                context_chunks=trimmed_chunks,
            )
            db.add(scenario)
            await db.commit()
            await db.refresh(scenario)
            logger.info(
                "scenario.stream cache_miss category=%s difficulty=%s model_ms=%d total_ms=%d",
                req.category,
                req.difficulty,
                int((time.perf_counter() - model_started) * 1000),
                int((time.perf_counter() - started) * 1000),
            )
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to save scenario: {e}'})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done', 'id': str(scenario.id), 'content': scenario_data})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
