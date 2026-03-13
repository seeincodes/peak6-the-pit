"""Scenario generation service using Claude + RAG context."""
import asyncio
import hashlib
import json
import logging
import re
import time
from collections import deque

from anthropic import AsyncAnthropic

from app.config import settings
from app.prompts.scenario_generation import (
    SYSTEM_PROMPT,
    SCENARIO_TEMPLATE,
    LEARNING_OBJECTIVE_SECTION,
)
from app.prompts.mcq_generation import (
    MCQ_SYSTEM_PROMPT,
    MCQ_TEMPLATE,
    MCQ_LEARNING_OBJECTIVE_SECTION,
)
from app.prompts.prompt_builder import get_category_display, get_genre_guidance
from app.services.rag import build_retrieval_query, retrieve_chunks
from app.services.market_data import get_market_snapshot
from app.services.scenario_graph import run_scenario_graph

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
logger = logging.getLogger(__name__)

# Categories where the model's built-in knowledge is sufficient.
# These skip the RAG embedding lookup + pgvector query (~0.5-1s saved).
SKIP_RAG_CATEGORIES = {
    "greeks",
    "macro",
    "technical_analysis",
    "risk_management",
    "position_sizing",
    "fundamentals",
    "commodities",
    "crypto",
    "fixed_income",
    "sentiment",
    "portfolio_mgmt",
}

_generation_cache: dict[str, tuple[float, dict]] = {}
_cache_lock = asyncio.Lock()
_user_seen_signatures: dict[str, set[str]] = {}
_latency_window = 500
_perf_stats = {
    "scenario": {"requests_total": 0, "cache_hits": 0, "total_ms": deque(maxlen=_latency_window), "model_ms": deque(maxlen=_latency_window)},
    "mcq": {"requests_total": 0, "cache_hits": 0, "total_ms": deque(maxlen=_latency_window), "model_ms": deque(maxlen=_latency_window)},
}


def _needs_rag(category: str) -> bool:
    return category not in SKIP_RAG_CATEGORIES


def _cache_key(kind: str, prompt: str) -> str:
    prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    return f"{kind}:{prompt_hash}"


def _content_signature(content: dict) -> str:
    canonical = json.dumps(content, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def _mark_user_seen(user_id: str | None, signature: str) -> None:
    if not user_id:
        return
    async with _cache_lock:
        seen = _user_seen_signatures.setdefault(user_id, set())
        seen.add(signature)


async def _cache_get(key: str, user_id: str | None = None) -> dict | None:
    if not settings.generation_cache_enabled:
        return None
    now = time.time()
    async with _cache_lock:
        hit = _generation_cache.get(key)
        if not hit:
            return None
        expires_at, payload = hit
        if expires_at <= now:
            _generation_cache.pop(key, None)
            return None
        signature = payload.get("signature")
        if signature and user_id:
            seen = _user_seen_signatures.setdefault(user_id, set())
            if signature in seen:
                return None
            seen.add(signature)
        return payload


async def _cache_set(key: str, payload: dict) -> None:
    if not settings.generation_cache_enabled:
        return
    expires_at = time.time() + max(settings.generation_cache_ttl_seconds, 1)
    async with _cache_lock:
        _generation_cache[key] = (expires_at, payload)


def _trim_text(text: str, max_chars: int) -> str:
    if max_chars <= 0 or len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip()


def _percentile(values: list[int], pct: int) -> int:
    if not values:
        return 0
    sorted_vals = sorted(values)
    idx = max(0, min(len(sorted_vals) - 1, int(round((pct / 100) * (len(sorted_vals) - 1)))))
    return sorted_vals[idx]


def record_perf_metric(kind: str, cache_hit: bool, total_ms: int, model_ms: int = 0) -> None:
    stats = _perf_stats.get(kind)
    if not stats:
        return
    stats["requests_total"] += 1
    if cache_hit:
        stats["cache_hits"] += 1
    stats["total_ms"].append(max(0, int(total_ms)))
    stats["model_ms"].append(max(0, int(model_ms)))


def get_perf_metrics_snapshot() -> dict:
    snapshot: dict[str, dict] = {}
    for kind, stats in _perf_stats.items():
        requests_total = int(stats["requests_total"])
        cache_hits = int(stats["cache_hits"])
        total_vals = list(stats["total_ms"])
        model_vals = list(stats["model_ms"])
        snapshot[kind] = {
            "requests_total": requests_total,
            "cache_hits": cache_hits,
            "cache_hit_rate": (cache_hits / requests_total) if requests_total else 0.0,
            "latency_ms_p50": _percentile(total_vals, 50),
            "latency_ms_p95": _percentile(total_vals, 95),
            "model_latency_ms_p50": _percentile(model_vals, 50),
            "model_latency_ms_p95": _percentile(model_vals, 95),
        }
    return snapshot


def build_rag_context(chunks: list[dict]) -> tuple[str, list[str]]:
    """Trim chunk payload to cap LLM latency while preserving salient context."""
    max_chunks = max(settings.rag_max_chunks, 0)
    max_chunk_chars = max(settings.rag_max_chunk_chars, 0)
    max_total_chars = max(settings.rag_max_total_chars, 0)

    selected = chunks[:max_chunks] if max_chunks else []
    trimmed_chunks: list[str] = []
    total_chars = 0
    for chunk in selected:
        text = _trim_text(chunk.get("content", ""), max_chunk_chars)
        if not text:
            continue
        if max_total_chars and total_chars + len(text) > max_total_chars:
            remaining = max_total_chars - total_chars
            if remaining <= 0:
                break
            text = _trim_text(text, remaining)
        trimmed_chunks.append(text)
        total_chars += len(text)
        if max_total_chars and total_chars >= max_total_chars:
            break
    return "\n\n---\n\n".join(trimmed_chunks), trimmed_chunks


def parse_scenario_json(raw: str) -> dict:
    """Parse LLM output into scenario dict, handling markdown fences."""
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*$", "", cleaned)
    return json.loads(cleaned.strip())


def build_scenario_prompt(
    category: str,
    difficulty: str,
    rag_context: str,
    market_snapshot: str,
    learning_objective: str | None = None,
) -> str:
    """Build the user prompt for scenario generation."""
    category_display = get_category_display(category)
    genre_guidance = get_genre_guidance(category, "scenario")
    objective_section = ""
    concept_explainer_field = ""
    if learning_objective:
        objective_section = LEARNING_OBJECTIVE_SECTION.format(learning_objective=learning_objective)
        concept_explainer_field = '\n  "concept_explainer": "A 2-4 sentence mini-lesson explaining the key concept being tested. Define terms, explain why it matters, and give a mental model the trader can use. Write as a helpful instructor, not a textbook.",'
    return SCENARIO_TEMPLATE.format(
        difficulty=difficulty,
        category_display=category_display,
        genre_guidance=genre_guidance,
        rag_context=rag_context
        if rag_context
        else "No specific context available. Use general options trading knowledge.",
        market_snapshot=market_snapshot,
        learning_objective_section=objective_section,
        concept_explainer_field=concept_explainer_field,
    )


async def _get_context(db, category: str, difficulty: str) -> tuple[list[dict], str]:
    """Return (chunks, market_snapshot). Skips RAG for common categories."""
    market_task = get_market_snapshot()

    if _needs_rag(category):
        query = build_retrieval_query(category, difficulty)
        chunks, market_snapshot = await asyncio.gather(
            retrieve_chunks(db, query, top_k=3), market_task
        )
    else:
        chunks = []
        market_snapshot = await market_task

    return chunks, market_snapshot


async def generate_scenario(
    db,
    category: str,
    difficulty: str = "beginner",
    user_id: str | None = None,
) -> dict:
    """Generate a single scenario using optional RAG context + Claude."""
    started = time.perf_counter()
    chunks, market_snapshot = await _get_context(db, category, difficulty)
    rag_context, trimmed_chunks = build_rag_context(chunks)
    prompt = build_scenario_prompt(category, difficulty, rag_context, market_snapshot)
    cache_key = _cache_key("scenario", prompt)

    cache_started = time.perf_counter()
    cached = await _cache_get(cache_key, user_id=user_id)
    if cached:
        total_ms = int((time.perf_counter() - started) * 1000)
        record_perf_metric("scenario", cache_hit=True, total_ms=total_ms, model_ms=0)
        logger.info(
            "scenario.generate cache_hit category=%s difficulty=%s elapsed_ms=%d",
            category,
            difficulty,
            total_ms,
        )
        return cached

    model_started = time.perf_counter()

    raw_text = await run_scenario_graph(prompt)
    scenario_data = parse_scenario_json(raw_text)
    signature = _content_signature(scenario_data)
    await _mark_user_seen(user_id, signature)
    result = {
        "category": category,
        "difficulty": difficulty,
        "content": scenario_data,
        "context_chunks": trimmed_chunks,
        "signature": signature,
    }
    await _cache_set(cache_key, result)
    model_ms = int((time.perf_counter() - model_started) * 1000)
    total_ms = int((time.perf_counter() - started) * 1000)
    record_perf_metric("scenario", cache_hit=False, total_ms=total_ms, model_ms=model_ms)
    logger.info(
        "scenario.generate cache_miss category=%s difficulty=%s cache_lookup_ms=%d model_ms=%d total_ms=%d",
        category,
        difficulty,
        int((model_started - cache_started) * 1000),
        model_ms,
        total_ms,
    )
    return result


async def get_cached_scenario_from_prompt(prompt: str) -> dict | None:
    return await _cache_get(_cache_key("scenario", prompt))


async def get_cached_scenario_for_user(prompt: str, user_id: str | None) -> dict | None:
    return await _cache_get(_cache_key("scenario", prompt), user_id=user_id)


async def cache_scenario_from_prompt(prompt: str, payload: dict, user_id: str | None = None) -> None:
    content = payload.get("content", {})
    signature = _content_signature(content) if content else ""
    if signature:
        payload["signature"] = signature
        await _mark_user_seen(user_id, signature)
    await _cache_set(_cache_key("scenario", prompt), payload)


async def generate_mcq(
    db,
    category: str,
    difficulty: str = "beginner",
    user_id: str | None = None,
    learning_objective: str | None = None,
) -> dict:
    """Generate a single MCQ using optional RAG context + Claude."""
    started = time.perf_counter()
    chunks, market_snapshot = await _get_context(db, category, difficulty)
    rag_context, trimmed_chunks = build_rag_context(chunks)

    category_display = get_category_display(category)
    genre_guidance = get_genre_guidance(category, "mcq")
    objective_section = ""
    if learning_objective:
        objective_section = MCQ_LEARNING_OBJECTIVE_SECTION.format(learning_objective=learning_objective)

    prompt = MCQ_TEMPLATE.format(
        difficulty=difficulty,
        category_display=category_display,
        genre_guidance=genre_guidance,
        learning_objective_section=objective_section,
        rag_context=rag_context if rag_context else "No specific context available. Use general options trading knowledge.",
        market_snapshot=market_snapshot,
    )
    # Intentionally bypass prompt cache for MCQs to reduce repeated-question risk.
    cache_started = time.perf_counter()
    model_started = time.perf_counter()

    message = await anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=MCQ_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
    )

    raw_text = message.content[0].text
    mcq_data = parse_scenario_json(raw_text)
    signature = _content_signature(mcq_data)
    await _mark_user_seen(user_id, signature)
    result = {
        "category": category,
        "difficulty": difficulty,
        "content": mcq_data,
        "context_chunks": trimmed_chunks,
        "signature": signature,
    }
    model_ms = int((time.perf_counter() - model_started) * 1000)
    total_ms = int((time.perf_counter() - started) * 1000)
    record_perf_metric("mcq", cache_hit=False, total_ms=total_ms, model_ms=model_ms)
    logger.info(
        "mcq.generate cache_miss category=%s difficulty=%s cache_lookup_ms=%d model_ms=%d total_ms=%d",
        category,
        difficulty,
        int((model_started - cache_started) * 1000),
        model_ms,
        total_ms,
    )
    return result

