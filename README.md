# The Pit

Gamified scenario training & MTSS agent for options trading.

## Production

- **URL**: https://thepit.up.railway.app/

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
   railway run -s backend bash -c "SEED_PROD=true python -m app.seed"
   ```

## Staging Environment

Staging mirrors production but uses a separate Railway project and database so you can test changes before going live.

### Local staging (Docker Compose)

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build
```

This uses a separate Postgres volume (`pgdata_staging`) so staging data stays isolated from local dev.

### Deploy staging to Railway

Follow the same "Deploy to Railway" steps above but with these differences:

1. Create a **separate** Railway project (e.g. "the-pit-staging").
2. Set `APP_ENV=staging` on the Backend service.
3. Pass `BUILD_ENV=staging` and `VITE_API_URL=https://<staging-backend>.up.railway.app/api` as build args on the Frontend service.
4. Point the Railway project at the `staging-environment` branch (or whichever branch you use for staging).

The staging backend runs without `--reload` (like production) but keeps seed data enabled by default so you always have test accounts available.

## Test Accounts

Seed the database with `python -m app.seed` from the backend directory. By default, development test users are created; set `SEED_PROD=true` for demo/admin accounts. Add `SEED_CLEAN=true` to move non-seed users out of demo orgs for a clean demo slate.

For multi-tenant logins, account resolution follows org context. On hosted UI:
- `thepit.up.railway.app` resolves to org slug `thepit`
- `acme.yourapp.com` resolves to org slug `acme` (or pass `org_slug` to `/api/auth/login`)
- If you use a single shared URL (no custom subdomains), choose the org in the login page selector (`thepit` or `acme`).

### Development (default)

| Org    | Email              | Password  | Role      | Display Name                |
| ------ | ------------------ | --------- | --------- | --------------------------- |
| thepit | trader@thepit.dev  | trader123 | analyst   | Test Trader                 |
| thepit | alex@thepit.dev    | alex123   | analyst   | Alex Chen                   |
| thepit | maria@thepit.dev   | maria123  | analyst   | Maria Santos                |
| thepit | james@thepit.dev   | james123  | intern    | James Kim                   |
| thepit | priya@thepit.dev   | priya123  | analyst   | Priya Patel (most advanced) |
| thepit | admin@peak6.com    | peak62026 | org_admin | Peak6 Super Admin           |
| acme   | admin@acme.dev     | acme2026  | org_admin | Acme Admin                  |
| acme   | analyst1@acme.dev  | acme2026  | analyst   | Acme Analyst One            |
| acme   | associate@acme.dev | acme2026  | associate | Acme Associate              |
| acme   | trainer@acme.dev   | acme2026  | trainer   | Acme Trainer                |
| acme   | intern@acme.dev    | acme2026  | intern    | Acme Intern                 |

### Production (`SEED_PROD=true`)

| Org    | Email               | Password     | Role      | Display Name        |
| ------ | ------------------- | ------------ | --------- | ------------------- |
| thepit | demo@thepit.dev     | demo2026     | analyst   | Demo Trader         |
| thepit | advanced@thepit.dev | advanced2026 | analyst   | Advanced Demo       |
| thepit | trader2@thepit.dev  | demo2026     | analyst   | The Pit Trader Two  |
| thepit | associate@thepit.dev| demo2026     | associate | The Pit Associate   |
| thepit | intern@thepit.dev   | demo2026     | intern    | The Pit Intern      |
| thepit | admin@peak6.com     | peak62026    | org_admin | Peak6 Super Admin   |
| acme   | admin@acme.dev      | acme2026     | org_admin | Acme Admin          |
| acme   | analyst1@acme.dev   | acme2026     | analyst   | Acme Analyst One    |
| acme   | associate@acme.dev  | acme2026     | associate | Acme Associate      |
| acme   | trainer@acme.dev    | acme2026     | trainer   | Acme Trainer        |

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
