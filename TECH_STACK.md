# CapMan AI — Technology Stack

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                            │
│   Vite · TypeScript · TailwindCSS · Recharts · WebSocket Client  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼───────────────────────────────────────────┐
│                      PYTHON BACKEND (FastAPI)                     │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  Scenario    │  │  Grading &   │  │  Gamification &         │  │
│  │  Engine      │  │  Probing     │  │  MTSS Engine            │  │
│  │  + RAG       │  │  Agent       │  │  + Leaderboard          │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬────────────┘  │
│         │                │                        │               │
│  ┌──────▼────────────────▼────────────────────────▼────────────┐  │
│  │              LLM API (Claude / OpenAI)                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│         │                                                         │
│  ┌──────▼──────────────────────────────────────────────────────┐  │
│  │   Atlas Hooks (optional Python interface)                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                      DATA LAYER                                   │
│   PostgreSQL (+ pgvector) · Redis (cache + pub/sub)               │
└──────────────────────────────────────────────────────────────────┘
```

## Stack Decisions

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend Framework** | React | 18+ | Required interactive UI; modern component-based architecture |
| **Frontend Build** | Vite | 5+ | Fast HMR, TypeScript-first, modern bundling |
| **Frontend Language** | TypeScript | 5+ | Type safety for complex state (XP, leaderboard, match data) |
| **Frontend Styling** | TailwindCSS | 3+ | Rapid UI development, consistent design system |
| **Frontend Charts** | Recharts | 2+ | Radar charts for skill dimensions, line charts for trajectories |
| **Backend Framework** | FastAPI | 0.110+ | Python-required (Atlas); async-native, auto-docs, WebSocket support |
| **Backend Language** | Python | 3.11+ | Required by proposal for Atlas integration |
| **Database** | PostgreSQL | 16+ | pgvector extension for RAG embeddings; mature ecosystem |
| **Vector Store** | pgvector | 0.7+ | Embedded in PostgreSQL — no separate vector DB needed |
| **Cache / Pub-Sub** | Redis | 7+ | Leaderboard caching, WebSocket pub/sub for real-time features |
| **ORM** | SQLAlchemy | 2.0+ | Async support, migration-friendly, mature ecosystem |
| **Migrations** | Alembic | 1.13+ | SQLAlchemy-native, version-controlled schema changes |
| **LLM API** | Claude API (Anthropic) | Latest | Strong reasoning for grading; large context for scenario generation |
| **Embedding Model** | OpenAI text-embedding-3-small | Latest | Cost-effective, high-quality embeddings for RAG |
| **Auth** | JWT (PyJWT) | 2+ | Stateless auth, role-based claims |
| **WebSocket** | FastAPI WebSocket | Built-in | Real-time leaderboard + head-to-head match updates |
| **Containerization** | Docker + Docker Compose | 24+ | Local dev parity, deployment consistency |
| **Cloud** | AWS (ECS + RDS + ElastiCache) | — | Scalable container and managed DB deployment |
| **Testing** | pytest + Vitest | Latest | Backend + frontend test runners |

## Key Dependencies

### Backend (Python)
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
redis[hiredis]
anthropic
openai
pgvector
pyjwt
python-multipart
pydantic
httpx
pytest
pytest-asyncio
```

### Frontend (TypeScript)
```
react
react-dom
react-router-dom
@tanstack/react-query
recharts
tailwindcss
axios
socket.io-client
vitest
@testing-library/react
```

## Environment Variables

```bash
# Database
DATABASE_URL=
REDIS_URL=

# LLM APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Auth
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Atlas (optional — progressive enrichment)
ATLAS_API_URL=
ATLAS_API_KEY=
ATLAS_ENABLED=false

# Application
APP_ENV=development
APP_PORT=8000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ta', 'intern', 'experienced', 'educator', 'admin')),
    ta_phase INTEGER CHECK (ta_phase BETWEEN 1 AND 4),
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scenarios
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    content JSONB NOT NULL,
    context_chunks TEXT[],
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    scenario_id UUID REFERENCES scenarios(id),
    conversation JSONB NOT NULL,  -- array of {role, content} turns
    is_complete BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Grades
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id) UNIQUE,
    dimension_scores JSONB NOT NULL,  -- {reasoning: 4, terminology: 5, ...}
    overall_score NUMERIC(3,1) NOT NULL,
    feedback TEXT NOT NULL,
    confidence NUMERIC(3,2),
    graded_by VARCHAR(20) DEFAULT 'ai',  -- 'ai' or 'human' or 'peer'
    graded_at TIMESTAMP DEFAULT NOW()
);

-- XP Ledger
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,  -- 'scenario', 'peer_review', 'streak', 'match_win'
    reference_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches (head-to-head)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_1_id UUID REFERENCES users(id),
    player_2_id UUID REFERENCES users(id),
    scenario_id UUID REFERENCES scenarios(id),
    player_1_score NUMERIC(3,1),
    player_2_score NUMERIC(3,1),
    winner_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Peer Reviews
CREATE TABLE peer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES users(id),
    response_id UUID REFERENCES responses(id),
    dimension_scores JSONB NOT NULL,
    feedback TEXT,
    quality_score NUMERIC(3,2),  -- how well review aligns with AI grade
    created_at TIMESTAMP DEFAULT NOW()
);

-- RAG Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_xp ON users(xp_total DESC);
CREATE INDEX idx_scenarios_category ON scenarios(category);
CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_grades_response ON grades(response_id);
CREATE INDEX idx_xp_user ON xp_transactions(user_id);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
```

## Cost Estimates

| Scale Tier | Users | Monthly Cost (AWS) | Notes |
|---|---|---|---|
| **Dev / Demo** | 1–5 | ~$50 | Local Docker or single EC2 t3.medium + RDS free tier |
| **Pilot** | 10–25 | ~$200 | ECS Fargate (0.5 vCPU) + RDS t3.medium + ElastiCache t3.micro |
| **Production** | 50–100 | ~$500 | ECS Fargate (1 vCPU) + RDS t3.large + ElastiCache t3.small |
| **LLM API** | Per use | ~$100–300/mo | Claude API (~$0.01–0.05 per scenario+grading cycle at volume) |
