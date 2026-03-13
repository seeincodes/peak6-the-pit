"""Chat API router -- sessions and message streaming."""

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session as session_factory, utc_now_naive
from app.middleware.auth import get_current_user
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.services.chat_graph import stream_chat_graph

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 20


class CreateSessionRequest(BaseModel):
    title: str | None = None


class SendMessageRequest(BaseModel):
    content: str


def _format_conversation_history(messages: list[ChatMessage]) -> str:
    """Format message history for the LangGraph prompt context."""
    if not messages:
        return ""
    parts = []
    for msg in messages[-MAX_HISTORY_MESSAGES:]:
        role_label = "User" if msg.role == "user" else "Assistant"
        parts.append(f"**{role_label}:** {msg.content[:500]}")
    return "\n\n".join(parts)


@router.post("/sessions")
async def create_session(
    req: CreateSessionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = ChatSession(
        user_id=user.id,
        title=req.title or "New Chat",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {
        "id": str(session.id),
        "title": session.title,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
    }


@router.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()

    counts: dict[uuid.UUID, int] = {}
    if sessions:
        count_result = await db.execute(
            select(
                ChatMessage.session_id,
                func.count(ChatMessage.id).label("count"),
            )
            .where(ChatMessage.session_id.in_([s.id for s in sessions]))
            .group_by(ChatMessage.session_id)
        )
        counts = {row.session_id: row.count for row in count_result}

    return [
        {
            "id": str(s.id),
            "title": s.title,
            "message_count": counts.get(s.id, 0),
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "id": str(session.id),
        "title": session.title,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "message_type": m.message_type,
                "metadata": m.metadata_,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: uuid.UUID,
    req: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save the user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=req.content,
        message_type="text",
    )
    db.add(user_msg)

    # Auto-title from first message
    if session.title == "New Chat":
        session.title = req.content[:80].strip() or "New Chat"

    session.updated_at = utc_now_naive()
    await db.commit()

    # Load conversation history
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    history_messages = result.scalars().all()
    conversation_history = _format_conversation_history(history_messages)

    # Capture values for the async generator
    sid = session_id

    async def event_stream():
        full_text = ""
        charts: list[dict] = []
        message_type = "text"
        try:
            async for event in stream_chat_graph(
                user_message=req.content,
                conversation_history=conversation_history,
            ):
                ev_type = event.get("type")

                if ev_type == "token":
                    full_text += event["content"]
                    yield f"data: {json.dumps({'type': 'token', 'content': event['content']})}\n\n"

                elif ev_type == "chart":
                    charts.append(event["chart"])
                    yield f"data: {json.dumps({'type': 'chart', 'chart': event['chart']})}\n\n"

                elif ev_type == "done":
                    message_type = event.get("message_type", "text")

        except Exception as e:
            logger.exception("Chat stream error")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        # Save assistant message
        try:
            async with session_factory() as write_db:
                assistant_msg = ChatMessage(
                    session_id=sid,
                    role="assistant",
                    content=full_text,
                    message_type=message_type,
                    metadata_={
                        "charts": charts,
                    },
                )
                write_db.add(assistant_msg)

                chat_session = await write_db.get(ChatSession, sid)
                if chat_session:
                    chat_session.updated_at = utc_now_naive()

                await write_db.commit()
        except Exception:
            logger.exception("Failed to save assistant message")

        yield f"data: {json.dumps({'type': 'done', 'message_type': message_type, 'charts_count': len(charts)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
