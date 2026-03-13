# CapMan AI — System Explanation

## What the System Is

CapMan AI is a **gamified, AI-driven scenario training platform** for options trading education. It automates what used to be manual and bandwidth-limited: generating practice scenarios, grading trader reasoning, and tracking learner performance. The system serves three audiences — Trading Associates (18-month TA program), bootcamp interns (1-week intensive), and experienced traders (upskilling) — with the TA program as the primary design persona.

**Core value proposition:** Replace educator bandwidth constraints with a scalable, engagement-driven training loop that provides Socratic feedback, XP-based progression, and an MTSS (Multi-Tier System of Supports) dashboard for educators to identify and intervene with learners who need support.

---

## Why We Chose This Stack

### Python Backend (FastAPI)

Python was required by the proposal for **Atlas integration** — CapMan's internal proprietary trading platform. FastAPI was chosen over Django or Flask because:

- **API-first:** No server-rendered templates; the app is a React SPA talking to a REST + WebSocket API.
- **Async-native:** WebSockets for real-time leaderboards and head-to-head matches need async support without extra extensions.
- **Auto-documentation:** OpenAPI/Swagger is built in, which helps with a large API surface.
- **Lightweight:** Django's ORM and admin are unnecessary; SQLAlchemy 2.0 covers async queries, and the educator dashboard is a React app, not Django admin.

Flask was rejected because it lacks built-in async and WebSocket support without stacking extensions.

### React Frontend (Vite + TypeScript + Tailwind)

- **React 18+:** Component-based UI for interactive flows (scenarios, probing, grading, leaderboards).
- **Vite:** Fast HMR, TypeScript-first, modern bundling.
- **TypeScript:** Type safety for complex state (XP, leaderboard, match data).
- **TailwindCSS:** Rapid UI development and consistent design system.
- **Recharts:** Radar charts for skill dimensions, line charts for trajectories.

### PostgreSQL + pgvector (No Separate Vector DB)

The RAG corpus is small — one primary document (Volatility Trading Data Framework, ~200 data points across 20 categories) plus supplementary lexicon docs. A dedicated vector DB (Pinecone, Weaviate, Qdrant) would add:

- Another service to run and secure
- Separate auth and billing
- Extra operational complexity

**pgvector** keeps embeddings in PostgreSQL, so we can join document chunks with scenario metadata in a single query. If the corpus grows 10x+, migration to a dedicated vector store is straightforward because the embedding format is portable.

### Redis (Cache + Pub/Sub)

- **Leaderboard caching:** Avoid repeated aggregation queries.
- **WebSocket pub/sub:** Real-time leaderboard updates and head-to-head match state.
- **Session/state:** Optional support for multi-instance deployment.

### Claude API (Primary LLM) + OpenAI Embeddings

Two Claude model tiers are used, selected per-task based on the quality/cost/latency tradeoff:

**Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — high-volume, structured-output tasks where speed matters:

| Task | File | Max Tokens | Temp | Rationale |
|------|------|-----------|------|-----------|
| Scenario generation (Deep Analysis) | `scenario_graph.py` | 600 | 0.7 | Structured JSON output with tight format constraints; prompt template drives quality more than model size |
| MCQ question generation | `scenario_engine.py` | 512 | 0.8 | Same as above; high variety needed (higher temp) |
| MCQ justification grading (good/weak) | `grading_agent.py` | 256 | 0.0 | Binary quality classification — simple enough for Haiku |
| Chat responses (with tool calling) | `chat_graph.py` | 2000 | 0.7 | Conversational flow with tool use; latency-sensitive for streaming UX |

**Claude Sonnet 4** (`claude-sonnet-4-6`) — tasks requiring deeper analytical reasoning:

| Task | File | Max Tokens | Temp | Rationale |
|------|------|-----------|------|-----------|
| Socratic probe generation | `grading_agent.py` | 512 | 0.3 | Must identify conceptual gaps in trader reasoning to ask targeted follow-ups |
| Full response grading (4-dimension rubric) | `grading_agent.py` | 1024 | 0.0 | Nuanced evaluation across reasoning, terminology, trade logic, risk awareness; accuracy is critical |
| Model answer generation | `grading_agent.py` | 1024 | 0.3 | Must demonstrate expert-level options reasoning as a reference answer |
| Lesson plan generation | `chat_graph.py` | 4000 | 0.0 | Structured multi-step lesson plans require coherent long-form output |

**OpenAI** — embeddings only:

| Task | File | Model | Rationale |
|------|------|-------|-----------|
| RAG document + query embeddings | `rag.py` | `text-embedding-3-small` | Cheap, fast, good quality-to-cost ratio for retrieval over a small corpus |

Embeddings are computed once at ingestion and cached in pgvector. The split keeps costs proportional to task complexity — cheap models for high-volume generation, capable models for evaluation accuracy.

### JWT Authentication

The app is a React SPA with a stateless API. JWT tokens with role claims (`ta`, `intern`, `experienced`, `educator`, `admin`) keep the backend stateless — no server-side session store. Role-based access is enforced per-endpoint via FastAPI dependency injection. Session-based auth would require sticky sessions or a shared store (e.g., Redis) for multi-instance deployment, adding complexity without benefit.

### Docker + Railway

- **Docker Compose:** Local dev parity with production; PostgreSQL, Redis, backend, and frontend run together.
- **Railway:** Simple PaaS with managed Postgres and Redis add-ons; `DATABASE_URL`, `REDIS_URL`, and `PORT` are auto-injected.

---

## Why It's Built This Way

### Three-Layer Architecture

The system is organized into three logical layers:

1. **Scenario Engine (Layer 1):** RAG over the Volatility Framework, CapMan lexicon, and optional Atlas hooks. Generates contextually accurate scenarios across 15+ volatility categories.
2. **Grading & Probing Agent (Layer 2):** LLM-based evaluation of reasoning quality, Socratic follow-ups, and rubric-based scoring.
3. **Gamification & MTSS (Layer 3):** XP, leaderboards, head-to-head matches, peer review, and the educator "God View" dashboard.

This separation keeps scenario generation, grading logic, and gamification/MTSS independent, so each layer can evolve without tightly coupling to the others.

### Atlas as Progressive Enrichment, Not a Hard Dependency

Pre-research flagged "Atlas docs too sparse to integrate" as a high-severity, high-likelihood risk. The design uses an abstract Python interface (`AtlasProvider`) that the scenario engine calls. The default implementation returns no-op enrichment — scenarios work without Atlas. When Atlas documentation and access are available, a concrete implementation plugs in without changing the scenario engine, grading agent, or frontend. This avoids blocking on Atlas and building the wrong interface.

### Append-Only XP Ledger

XP drives leaderboards, levels, and MTSS analysis. A mutable `xp_total` field is easy to corrupt (double-award, race conditions) and hard to audit. The append-only `xp_transactions` table records every XP event with source and reference, enabling:

- Full audit trails
- Retroactive recalculation if award formulas change
- Time-windowed leaderboards (e.g., "this week's top performers") via date-range queries

`users.xp_total` is a denormalized cache, periodically reconciled from the ledger.

### RAG-First Scenario Generation

Scenarios are not static. The RAG pipeline ingests the Volatility Framework and CapMan lexicon, chunks by category/section (~500 tokens with overlap), embeds with OpenAI, and stores in pgvector. When a user requests a scenario, the engine:

1. Selects category (random or targeted for weak dimensions)
2. Retrieves relevant chunks via similarity search
3. Passes chunks + rubric constraints to Claude
4. Generates a scenario with correct terminology and options logic

This keeps scenarios grounded in CapMan's proprietary framework and lexicon.

### Socratic Probing Before Final Grade

Grading evaluates **reasoning quality**, not just final answers. The flow is:

1. User submits initial response
2. Grading agent generates a Socratic probe ("Why that strike?", "What does the IV skew tell you?")
3. User elaborates
4. Final grade with dimension scores (reasoning, terminology, trade logic, risk awareness) and actionable feedback

This surfaces shallow vs. deep understanding and aligns with how educators evaluate traders.

### Modular Scenario Types

Scenario categories (IV Analysis, Greeks, Order Flow, Macro, Term Structure, etc.) are implemented as plug-ins. New categories can be added without rebuilding the engine, supporting future expansion to 15+ volatility data categories.

### MTSS Tier Classification

A batch job aggregates per-user dimension scores over a rolling 14-day window and applies tier thresholds:

- **Tier 1 (On Track):** avg ≥ 3.5
- **Tier 2 (Targeted Support):** 2.5–3.4
- **Tier 3 (Intensive):** &lt; 2.5

The educator dashboard shows learners grouped by tier and skill dimension, so interventions can target specific weak areas (e.g., Macro, Order Flow) instead of a single aggregate score.

### Graceful Degradation

The system is designed to degrade gracefully when dependencies fail:

- **LLM outage:** Retry with backoff; show "AI is busy" with estimated wait.
- **RAG retrieval weak:** Validate relevance score; fall back to category-specific static prompts.
- **Atlas unavailable:** Scenarios work without enrichment; log failures and alert, but do not block.
- **WebSocket disconnect during head-to-head:** Persist match state in Redis; reconnect with state recovery; timeout before forfeit.

---

## Summary

CapMan AI is built as an API-first, Python-backed, React-fronted platform that uses RAG for scenario generation, Claude for grading, and pgvector + Redis for data and real-time features. The stack and architecture were chosen to:

1. **Align with partner constraints** (Python for Atlas, existing React/Docker/Postgres stack)
2. **Minimize operational complexity** (pgvector instead of a separate vector DB, JWT instead of sessions)
3. **Handle uncertainty** (Atlas as progressive enrichment, append-only XP ledger)
4. **Scale training** (automated scenario generation and grading, MTSS dashboard for educators)
5. **Maintain quality** (Socratic probing, rubric-based grading, educator correlation benchmarking)
