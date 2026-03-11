"""LangGraph orchestration for scenario generation."""
import os
from typing import Any, AsyncIterator, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.config import settings
from app.prompts.scenario_generation import SYSTEM_PROMPT


class ScenarioState(TypedDict):
    prompt: str
    generated_text: str


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
_model = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    temperature=0.7,
    max_tokens=600,
    api_key=settings.anthropic_api_key,
)


async def _generate_scenario_node(state: ScenarioState) -> dict:
    response = await _model.ainvoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=state["prompt"]),
        ]
    )
    return {"generated_text": _message_content_to_text(response.content)}


_graph_builder = StateGraph(ScenarioState)
_graph_builder.add_node("generate_scenario", _generate_scenario_node)
_graph_builder.add_edge(START, "generate_scenario")
_graph_builder.add_edge("generate_scenario", END)
_scenario_graph = _graph_builder.compile()


async def run_scenario_graph(prompt: str) -> str:
    result = await _scenario_graph.ainvoke({"prompt": prompt})
    return result["generated_text"]


async def stream_scenario_graph(prompt: str) -> AsyncIterator[str]:
    state = {"prompt": prompt}
    async for event in _scenario_graph.astream_events(state, version="v2"):
        if event.get("event") != "on_chat_model_stream":
            continue
        chunk = event.get("data", {}).get("chunk")
        if not isinstance(chunk, AIMessageChunk):
            continue
        text = _message_content_to_text(chunk.content)
        if text:
            yield text
