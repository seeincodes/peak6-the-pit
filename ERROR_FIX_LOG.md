# The Pit — Error & Fix Log

## Template

```
### [CATEGORY-NNN] Short Description
- **Date:** YYYY-MM-DD
- **Error:** What happened (exact error message or behavior)
- **Context:** What you were doing when it occurred
- **Root Cause:** Why it happened
- **Fix:** What resolved it (include file paths and code if relevant)
- **Prevention:** How to avoid this in the future
```

### Category Prefixes
| Prefix | Area |
|---|---|
| `RAG` | RAG pipeline, embeddings, vector search, document ingestion |
| `LLM` | Claude/OpenAI API calls, prompt engineering, grading output |
| `DB` | PostgreSQL, pgvector, SQLAlchemy, Alembic migrations |
| `AUTH` | JWT, authentication, role-based access |
| `WS` | WebSocket connections, real-time features |
| `API` | FastAPI endpoints, request/response handling |
| `UI` | React frontend, TailwindCSS, Recharts |
| `GAME` | XP system, leaderboard, matchmaking |
| `MTSS` | MTSS classification, God View dashboard |
| `ATLAS` | Atlas integration hooks |
| `DOCKER` | Docker, Docker Compose, container configuration |
| `DEPLOY` | AWS deployment, CI/CD, environment config |

---

## Log

*No errors logged yet.*

---

## Common Issues to Watch For

### RAG / Embeddings
- pgvector index type matters: use `ivfflat` for fast approximate search; rebuild index after bulk inserts
- Chunk overlap too small → context splits mid-sentence → incoherent retrieval
- OpenAI embedding API has a max token limit per request — batch large documents
- Embedding dimension mismatch between model output and pgvector column definition

### LLM / Grading
- Claude API timeout on complex probing chains (>15 seconds) — set explicit timeout, don't use default
- Temperature=0 does not guarantee deterministic output — pin model version for consistency
- Structured output parsing failures when Claude returns markdown instead of JSON — use explicit format instructions + fallback parser
- Token limit exceeded when RAG context + conversation history + rubric exceeds model context window — implement context truncation strategy

### PostgreSQL / SQLAlchemy
- Async SQLAlchemy requires `create_async_engine` and `AsyncSession` — mixing sync/async causes "greenlet" errors
- Alembic autogenerate misses pgvector column type changes — manually verify migration files
- UUID primary keys: ensure `gen_random_uuid()` is available (requires `pgcrypto` or PG 13+)
- Connection pool exhaustion under concurrent scenario generation — configure pool size for expected load

### FastAPI / WebSocket
- WebSocket connections not cleaned up on client disconnect — implement `on_disconnect` handler
- CORS misconfiguration blocks frontend requests — ensure `CORS_ORIGINS` includes frontend URL with port
- Large JSON responses for leaderboard queries — implement pagination early

### React Frontend
- WebSocket reconnection after network interruption — implement exponential backoff reconnect
- Stale leaderboard data after XP award — invalidate react-query cache on XP mutation
- Recharts radar chart breaks with missing dimension data — provide defaults for all dimensions

### Docker / Deployment
- PostgreSQL container data loss on `docker-compose down` — use named volumes, not anonymous
- pgvector extension not installed in default PostgreSQL image — use `pgvector/pgvector:pg16` image
- Redis connection refused in Docker — use service name (`redis`) not `localhost` in connection string
