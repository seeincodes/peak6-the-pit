"""LangGraph orchestration for the AI chatbot with tool calling."""

import json
import os
import re
from typing import Any, AsyncIterator, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langgraph.graph import END, START, StateGraph

from app.config import settings
from app.prompts.chat_prompts import (
    CHAT_SYSTEM_PROMPT,
    CHAT_RESPONSE_TEMPLATE,
    LESSON_PLAN_TEMPLATE,
)
from app.services.chat_tools import CHAT_TOOLS


class ChatState(TypedDict):
    user_message: str
    conversation_history: str
    rag_context: str
    messages: list[BaseMessage]  # LangChain message list for the agent loop
    charts: list[dict]  # accumulated chart data from tool calls
    generated_text: str
    message_type: str  # "text" or "lesson_plan"


def _configure_langsmith() -> None:
    if not settings.langsmith_enabled:
        return
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    if settings.langsmith_api_key:
        os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    if settings.langsmith_project:
        os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
    if settings.langsmith_endpoint:
        os.environ["LANGCHAIN_ENDPOINT"] = settings.langsmith_endpoint


def _message_content_to_text(content: Any) -> str:
    """Extract text from LangChain message content (string or list of dicts)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return str(content)


_configure_langsmith()

# Response model with tools bound
_response_model = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    temperature=0.7,
    max_tokens=2000,
    api_key=settings.anthropic_api_key,
)

_response_model_with_tools = _response_model.bind_tools(CHAT_TOOLS)

# Higher-quality model for lesson plans (no tools needed)
_lesson_model = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0,
    max_tokens=4000,
    api_key=settings.anthropic_api_key,
)


# ── Node 1: RAG Retrieval ─────────────────────────────────────────
async def rag_retrieval_node(state: ChatState) -> dict:
    """Fetch relevant domain context from the RAG system."""
    from app.database import async_session as session_factory
    from app.services.rag import retrieve_chunks
    from app.services.scenario_engine import build_rag_context

    query = state["user_message"]

    async with session_factory() as db:
        chunks = await retrieve_chunks(db, query, top_k=5)

    if chunks:
        rag_text, _ = build_rag_context(chunks)
    else:
        rag_text = "No specific reference material available."

    # Build the initial message list for the agent
    prompt = CHAT_RESPONSE_TEMPLATE.format(
        rag_context=rag_text,
        conversation_history=state.get("conversation_history", ""),
        user_message=state["user_message"],
    )
    messages: list[BaseMessage] = [
        SystemMessage(content=CHAT_SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ]

    return {"rag_context": rag_text, "messages": messages}


# ── Node 2: Check if lesson plan requested ─────────────────────────
def detect_lesson_request(state: ChatState) -> str:
    """Route to lesson plan generation if the user explicitly asked for one."""
    msg = state["user_message"].lower()
    lesson_triggers = [
        "teach me",
        "create a lesson",
        "lesson plan",
        "give me a lesson",
        "tutorial on",
        "study guide",
        "walk me through",
    ]
    for trigger in lesson_triggers:
        if trigger in msg:
            return "generate_lesson_plan"
    return "agent_call"


# ── Node 3: Agent model call (with tools) ──────────────────────────
async def agent_call_node(state: ChatState) -> dict:
    """Call the model with tools. It may produce text or tool calls."""
    response: AIMessage = await _response_model_with_tools.ainvoke(state["messages"])
    return {"messages": state["messages"] + [response]}


# ── Node 4: Execute tool calls ─────────────────────────────────────
async def tool_executor_node(state: ChatState) -> dict:
    """Execute any tool calls from the last AI message and collect chart data."""
    last_message = state["messages"][-1]
    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return {}

    new_messages = list(state["messages"])
    charts = list(state.get("charts") or [])

    tool_map = {t.name: t for t in CHAT_TOOLS}

    for tc in last_message.tool_calls:
        tool_fn = tool_map.get(tc["name"])
        if tool_fn:
            result = await tool_fn.ainvoke(tc["args"])
            # result is a dict with chart data
            if isinstance(result, dict) and "chart_type" in result:
                charts.append(result)
            new_messages.append(
                ToolMessage(content=json.dumps(result), tool_call_id=tc["id"])
            )
        else:
            new_messages.append(
                ToolMessage(
                    content=json.dumps({"error": f"Unknown tool: {tc['name']}"}),
                    tool_call_id=tc["id"],
                )
            )

    return {"messages": new_messages, "charts": charts}


# ── Router: should continue calling model or done? ─────────────────
def should_continue(state: ChatState) -> str:
    """If the last message has tool calls, execute them; otherwise we're done."""
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tool_executor"
    return END


# ── Node 5: Generate lesson plan ──────────────────────────────────
async def generate_lesson_plan_node(state: ChatState) -> dict:
    """Generate a structured lesson plan (deterministic, temp=0)."""
    prompt = LESSON_PLAN_TEMPLATE.format(
        rag_context=state.get("rag_context", ""),
        conversation_history=state.get("conversation_history", ""),
        user_message=state["user_message"],
    )
    response = await _lesson_model.ainvoke([
        SystemMessage(content=CHAT_SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ])
    text = _message_content_to_text(response.content)

    try:
        cleaned = re.sub(r"```json\s*", "", text)
        cleaned = re.sub(r"```\s*$", "", cleaned)
        lesson_data = json.loads(cleaned.strip())
    except (json.JSONDecodeError, KeyError):
        lesson_data = text

    final_text = json.dumps(lesson_data) if isinstance(lesson_data, dict) else text
    messages = list(state.get("messages") or [])
    messages.append(AIMessage(content=final_text))

    return {
        "generated_text": final_text,
        "message_type": "lesson_plan",
        "messages": messages,
    }


# ── Graph Assembly ───────────────────────────────────────────────
_graph_builder = StateGraph(ChatState)

_graph_builder.add_node("rag_retrieval", rag_retrieval_node)
_graph_builder.add_node("agent_call", agent_call_node)
_graph_builder.add_node("tool_executor", tool_executor_node)
_graph_builder.add_node("generate_lesson_plan", generate_lesson_plan_node)

_graph_builder.add_edge(START, "rag_retrieval")
_graph_builder.add_conditional_edges(
    "rag_retrieval",
    detect_lesson_request,
    {
        "agent_call": "agent_call",
        "generate_lesson_plan": "generate_lesson_plan",
    },
)
_graph_builder.add_conditional_edges(
    "agent_call",
    should_continue,
    {
        "tool_executor": "tool_executor",
        END: END,
    },
)
# After executing tools, call agent again so it can use the results
_graph_builder.add_edge("tool_executor", "agent_call")
_graph_builder.add_edge("generate_lesson_plan", END)

chat_graph = _graph_builder.compile()


# ── Public streaming API ──────────────────────────────────────────
async def stream_chat_graph(
    user_message: str,
    conversation_history: str = "",
) -> AsyncIterator[dict]:
    """Stream the chat graph response.

    Yields dicts:
      {"type": "token", "content": "..."} – text token
      {"type": "chart", "chart": {...}}   – chart data
      {"type": "done", "message_type": "...", "charts_count": N}
    """
    state: ChatState = {
        "user_message": user_message,
        "conversation_history": conversation_history,
        "rag_context": "",
        "messages": [],
        "charts": [],
        "generated_text": "",
        "message_type": "text",
    }

    full_text = ""
    charts: list[dict] = []
    message_type = "text"

    async for event in chat_graph.astream_events(state, version="v2"):
        kind = event.get("event")

        # Stream tokens from the generation model
        if kind == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk")
            if not isinstance(chunk, AIMessageChunk):
                continue
            # Skip chunks that are tool calls (no text content)
            if chunk.tool_call_chunks:
                continue
            text = _message_content_to_text(chunk.content)
            if text:
                full_text += text
                yield {"type": "token", "content": text}

        # Capture tool results for chart data
        elif kind == "on_chain_end":
            node_name = event.get("name", "")
            if node_name == "tool_executor":
                output = event.get("data", {}).get("output", {})
                node_charts = output.get("charts", [])
                if node_charts:
                    charts = node_charts

            # Capture lesson plan output
            if node_name == "generate_lesson_plan":
                output = event.get("data", {}).get("output", {})
                if output.get("message_type") == "lesson_plan":
                    message_type = "lesson_plan"

    # Emit chart events
    for chart in charts:
        yield {"type": "chart", "chart": chart}

    yield {
        "type": "done",
        "message_type": message_type,
        "charts_count": len(charts),
    }
