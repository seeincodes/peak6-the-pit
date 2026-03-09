# CapMan AI — Architecture Memo

## Project Summary

CapMan AI is a gamified AI training platform that generates options trading scenarios, grades trader reasoning via Socratic probing, and provides educators with MTSS-tier intervention dashboards. It replaces bandwidth-constrained manual training with an automated, engagement-driven system that scales across Trading Associates, bootcamp interns, and experienced traders.

## Key Architecture Decisions

### 1. pgvector in PostgreSQL instead of a separate vector database (Pinecone, Weaviate, Qdrant)

The RAG corpus is small — one primary document (Volatility Trading Data Framework, ~200 data points across 20 categories) plus supplementary lexicon docs. A dedicated vector database adds operational complexity (separate service, separate auth, separate billing) for a dataset that fits comfortably in a PostgreSQL extension. pgvector keeps embeddings co-located with relational data, enabling single-query joins between document chunks and scenario metadata. If the corpus grows 10x+, migration to a dedicated vector store is straightforward since the embedding format is portable.

### 2. FastAPI over Django or Flask

The proposal mandates Python for Atlas integration. FastAPI was chosen over Django because the application is API-first (no server-rendered templates), needs native async for WebSocket support (head-to-head matches, real-time leaderboards), and benefits from automatic OpenAPI documentation for the multi-endpoint API surface. Django's ORM and admin panel are unnecessary overhead since SQLAlchemy 2.0 provides equivalent async query capabilities, and the educator dashboard is a React SPA, not a Django admin view. Flask was rejected because it lacks built-in async and WebSocket support without extension stacking.

### 3. Claude API as primary LLM over GPT-4 or open-source models

Grading trader reasoning requires strong analytical capability, particularly for evaluating multi-step options logic and distinguishing surface-level from deep understanding. Claude's extended context window accommodates the full RAG context + multi-turn conversation history without truncation. The Anthropic API's structured output and system prompt capabilities map cleanly to the rubric-based grading system. OpenAI GPT-4 is a viable alternative and could be swapped via an abstraction layer, but Claude's reasoning performance on financial logic benchmarks edges it out for the grading use case. Open-source models (Llama, Mistral) were rejected for MVP due to hosting cost and latency constraints at the required quality tier.

### 4. Separate embedding model (OpenAI text-embedding-3-small) from grading LLM

Embeddings and grading have fundamentally different cost profiles. Embeddings are computed once at ingestion time and queried via cosine similarity — they need to be cheap and fast. The grading LLM is invoked per-scenario with full context and must reason at high quality. Using Claude for embeddings would be wasteful; using a cheap embedding model for grading would be inadequate. OpenAI's text-embedding-3-small provides excellent quality-to-cost ratio for the RAG retrieval layer while Claude handles the reasoning-intensive grading.

### 5. Atlas as progressive enrichment, not a hard dependency

The presearch identified "Atlas docs too sparse to integrate" as a high-severity, high-likelihood risk. The architecture defines an abstract Python interface (`AtlasProvider`) that the scenario engine calls. The default implementation returns no-op enrichment data — scenarios work without Atlas. If/when Atlas documentation and access materialize, a concrete implementation plugs in without changing the scenario engine, grading agent, or any frontend code. This was chosen over "wait for Atlas docs" (blocks all progress) and "build Atlas mock" (risks building the wrong interface).

### 6. Append-only XP ledger over mutable balance field

XP is a core engagement metric that feeds leaderboards, levels, and MTSS analysis. A mutable `xp_total` field is easy to corrupt (double-award, race conditions in concurrent scenarios) and impossible to audit. The append-only `xp_transactions` table records every XP event with source and reference, enabling full audit trails, retroactive recalculation if award formulas change, and time-windowed leaderboards (e.g., "this week's top performers") via date-range queries. The `users.xp_total` field is a denormalized cache, periodically reconciled from the ledger.

### 7. JWT authentication over session-based auth

The application is a React SPA communicating with a stateless API. JWT tokens with role claims (`ta`, `intern`, `experienced`, `educator`, `admin`) enable the backend to remain stateless — no server-side session store required. Role-based access control is enforced per-endpoint via FastAPI dependency injection. Session-based auth was rejected because it requires sticky sessions or a shared session store (Redis) for multi-instance deployment, adding complexity without benefit for this API-first architecture.

## Processing Strategy

1. **Document Ingestion:** PDF → section-aware chunking (~500 tokens, overlapping) → OpenAI embeddings → pgvector storage with metadata tags (category, subcategory)
2. **Scenario Generation:** User requests scenario → engine selects category (random or targeted for weak dimensions) → RAG retrieves relevant chunks → Claude generates scenario with CapMan lexicon constraints → scenario stored with embedding for deduplication
3. **Response Grading:** User submits response → grading agent receives (scenario + RAG context + response + rubric) → generates Socratic probe → user responds → final grade with dimension scores + feedback → XP awarded
4. **MTSS Classification:** Nightly batch job aggregates per-user dimension scores over rolling 14-day window → applies tier thresholds (Tier 1: avg ≥ 3.5, Tier 2: 2.5–3.4, Tier 3: < 2.5) → updates dashboard classifications → flags tier changes for educator notification

## Known Failure Modes

| Failure | Impact | Mitigation |
|---|---|---|
| LLM API rate limit or outage | Scenarios and grading halt | Implement retry with exponential backoff; queue requests; show "AI is busy" with estimated wait |
| RAG retrieval returns irrelevant chunks | Scenarios contain incorrect context | Validate retrieval relevance score; reject below threshold; fall back to category-specific static prompts |
| Grading inconsistency (same response, different scores) | Erodes trust in AI grading | Pin model version + temperature=0; log all grading calls; periodic human-AI correlation checks |
| WebSocket disconnection during head-to-head | Match state lost | Persist match state in Redis; reconnect logic with state recovery; 60-second timeout before forfeit |
| XP ledger / leaderboard drift | Incorrect rankings | Nightly reconciliation job; alert on discrepancy > 1% |
| Atlas API unavailable or schema changes | Enriched scenarios degrade | Progressive enrichment pattern — scenarios work without Atlas; log Atlas failures; alert but don't block |
