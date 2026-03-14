# The Pit

Gamified scenario training & MTSS agent for options trading.

## Quick Start (Local)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Deploy to Railway

1. Install the [Railway CLI](https://docs.railway.com/guides/cli) and log in:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. Create a new project and add services:
   ```bash
   railway init
   ```

3. Add **PostgreSQL** and **Redis** add-ons from the Railway dashboard.

4. Create two services pointing to this repo:
   - **Backend** — root directory: `backend/`
   - **Frontend** — root directory: `frontend/`

5. Set environment variables on the **Backend** service:
   ```
   ANTHROPIC_API_KEY=sk-...
   OPENAI_API_KEY=sk-...
   JWT_SECRET_KEY=<generate-a-strong-secret>
   FRONTEND_URL=https://<frontend-service>.up.railway.app
   CORS_ORIGINS=https://<frontend-service>.up.railway.app
   APP_ENV=production
   ```
   > `DATABASE_URL`, `REDIS_URL`, and `PORT` are auto-injected by Railway add-ons.

6. Set environment variables on the **Frontend** service:
   ```
   VITE_API_URL=https://<backend-service>.up.railway.app
   ```

7. Deploy:
   ```bash
   railway up
   ```

8. Seed the database (first deploy only):
   ```bash
   railway run -s backend python -m app.seed
   ```

## Test Accounts

Seed the database with `python -m app.seed` from the backend directory. By default, development test users are created; set `SEED_PROD=true` for demo/admin accounts.

### Development (default)

| Email | Password | Role | Display Name |
|-------|----------|------|--------------|
| trader@thepit.dev | trader123 | TA | Test Trader |
| alex@thepit.dev | alex123 | TA | Alex Chen |
| maria@thepit.dev | maria123 | TA | Maria Santos |
| james@thepit.dev | james123 | Intern | James Kim |
| priya@thepit.dev | priya123 | TA | Priya Patel (most advanced) |

### Production (`SEED_PROD=true`)

| Email | Password | Role | Display Name |
|-------|----------|------|--------------|
| demo@thepit.dev | demo2026 | TA | Demo Trader |
| admin@thepit.dev | admin2026 | Admin | Admin User |
| advanced@thepit.dev | advanced2026 | TA | Advanced Demo |

## Testing

### Backend (pytest)

```bash
cd backend && uv run pytest tests/ -v
```

Tests: auth, constants, grading agent, leaderboard, MCQ generation/grading/pool, progression, RAG, scenario engine.

### Golden set checks

```bash
cd backend && uv run python evals/run_golden_checks.py
```

Golden sets live under `backend/evals/golden/` and cover scenario prompt construction plus JSON output parsing invariants.

### Frontend (Vitest)

```bash
cd frontend && npm test -- --run
```

(Use `--reporter=verbose` for detailed output.)

Tests: AuthContext, MCQCard, MCQFeedback, QuickFirePage, TrainingPage (prefetch).
