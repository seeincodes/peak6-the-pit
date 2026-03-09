# CapMan AI — Project Context Skill

## Context

CapMan AI is a gamified AI-driven scenario training platform for options trading training, automating scenario generation, Socratic grading, and MTSS-tier educator dashboards.

## Codebase

- **Target:** Web application (Python backend + React frontend)
- **Structure:** Monorepo with `backend/` (FastAPI) and `frontend/` (React/Vite)
- **Size:** Greenfield project, estimated ~15K–25K lines at completion

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic
- **Frontend:** React 18+, TypeScript, Vite, TailwindCSS, Recharts
- **Database:** PostgreSQL 16+ with pgvector extension
- **Cache:** Redis 7+
- **LLM (Grading):** Claude API (Anthropic)
- **LLM (Embeddings):** OpenAI text-embedding-3-small
- **Auth:** JWT (PyJWT)
- **Containers:** Docker + Docker Compose
- **Cloud:** AWS (ECS + RDS + ElastiCache)
- **Testing:** pytest (backend), Vitest (frontend)

## Key Files

| File | Purpose |
|---|---|
| `PRD.md` | Product requirements, success criteria, scope boundaries |
| `TASK_LIST.md` | Phased task breakdown with checklists (Phase 0–3) |
| `TECH_STACK.md` | Stack decisions, DB schema, architecture diagram, cost estimates |
| `USER_FLOW.md` | User journey diagrams, API endpoints, example queries |
| `MEMO.md` | Architecture decisions with rationale, processing strategy, failure modes |
| `ERROR_FIX_LOG.md` | Error tracking template and common issues by technology area |
| `PRESEARCH.md` | Pre-research findings, risk register, open questions |
| `.env` | Environment variable template (empty values) |
| `.cursor/rules/tech-stack-lock.mdc` | Locked technology decisions — do not change without approval |
| `.cursor/rules/env-files-read-only.mdc` | Environment file protection rules |
| `.cursor/rules/error-resolution-log.mdc` | When and how to log errors |

## Processing Strategy

1. **Ingest** proprietary docs (Volatility Framework, CapMan Lexicon) → chunk → embed → pgvector
2. **Generate** scenarios via RAG-augmented Claude prompts, categorized by volatility data type
3. **Grade** responses with Socratic probing agent, scoring across rubric dimensions (reasoning, terminology, trade logic, risk awareness)
4. **Track** XP, levels, streaks, and leaderboards for gamification engagement
5. **Classify** learners into MTSS tiers (1/2/3) by skill dimension for educator intervention dashboard

## Known Patterns

- **Atlas integration** is progressive enrichment — always optional, never a hard dependency
- **Primary persona** is Trading Associates; interns and experienced traders are config variants
- **XP** uses append-only ledger pattern, not mutable balance
- **Grading** requires human-educator correlation benchmarking (50+ examples) before trust
- **Scenarios** are modular plug-in types — new categories don't require engine changes
