import json
import re

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from anthropic import AsyncAnthropic

from app.config import settings
from app.database import get_db
from app.models.scenario import Scenario
from app.models.user import User
from app.prompts.scenario_generation import SYSTEM_PROMPT, SCENARIO_TEMPLATE, CATEGORY_DISPLAY
from app.services.rag import build_retrieval_query, retrieve_chunks
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)


class StreamGenerateRequest(BaseModel):
    category: str = "iv_analysis"
    difficulty: str = "beginner"


@router.post("/generate-stream")
async def generate_stream(
    req: StreamGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = build_retrieval_query(req.category, req.difficulty)
    chunks = await retrieve_chunks(db, query, top_k=5)
    rag_context = "\n\n---\n\n".join(c["content"] for c in chunks)

    category_display = CATEGORY_DISPLAY.get(req.category, req.category.replace("_", " ").title())

    prompt = SCENARIO_TEMPLATE.format(
        difficulty=req.difficulty,
        category_display=category_display,
        rag_context=rag_context if rag_context else "No specific context available. Use general options trading knowledge.",
    )

    async def event_stream():
        full_text = ""
        async with anthropic_client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield f"data: {json.dumps({'type': 'chunk', 'text': text})}\n\n"

        # Parse the complete response and save to DB
        cleaned = re.sub(r"```json\s*", "", full_text)
        cleaned = re.sub(r"```\s*$", "", cleaned)
        scenario_data = json.loads(cleaned.strip())

        scenario = Scenario(
            category=req.category,
            difficulty=req.difficulty,
            content=scenario_data,
            context_chunks=[c["content"] for c in chunks],
        )
        db.add(scenario)
        await db.commit()
        await db.refresh(scenario)

        yield f"data: {json.dumps({'type': 'done', 'id': str(scenario.id), 'content': scenario_data})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
