import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.scenario import Scenario
from app.models.user import User
from app.services.scenario_engine import _get_context, parse_scenario_json, build_scenario_prompt
from app.services.scenario_graph import stream_scenario_graph
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


class StreamGenerateRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"


@router.post("/generate-stream")
async def generate_stream(
    req: StreamGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chunks, market_snapshot = await _get_context(db, req.category, req.difficulty)
    rag_context = "\n\n---\n\n".join(c["content"] for c in chunks)

    prompt = build_scenario_prompt(req.category, req.difficulty, rag_context, market_snapshot)

    async def event_stream():
        full_text = ""
        try:
            chunk_count = 0
            async for text in stream_scenario_graph(prompt):
                full_text += text
                chunk_count += 1
                if chunk_count % 20 == 0:
                    yield f"data: {json.dumps({'type': 'progress'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'AI generation failed: {e}'})}\n\n"
            return

        # Parse the complete response and save to DB
        try:
            scenario_data = parse_scenario_json(full_text)
        except (json.JSONDecodeError, ValueError) as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to parse scenario: {e}'})}\n\n"
            return

        try:
            scenario = Scenario(
                category=req.category,
                difficulty=req.difficulty,
                content=scenario_data,
                context_chunks=[c["content"] for c in chunks],
            )
            db.add(scenario)
            await db.commit()
            await db.refresh(scenario)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to save scenario: {e}'})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done', 'id': str(scenario.id), 'content': scenario_data})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
