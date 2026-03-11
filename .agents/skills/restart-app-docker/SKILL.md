---
name: restart-app-docker
description: Restart frontend and backend Docker Compose services for local development, then verify health, backend tests, evals, and migrations when code changes include backend updates.
---

# Restart App Docker

## Goal

Restart frontend + backend services in local Docker Compose and verify both are healthy.

## Steps

1. Restart services from `capman-ai/`:
   - `docker compose restart backend frontend`

2. Check service status:
   - `docker compose ps backend frontend`
   - Expect both services `Up` with ports:
     - backend `:8000`
     - frontend `:5173`

3. Validate startup logs:
   - `docker compose logs backend --tail 30`
   - `docker compose logs frontend --tail 30`

4. If either service is down:
   - `docker compose up -d backend frontend`
   - Re-check status and logs.

## Backend Verification After Code Changes

When backend code changed, always run:

1. Python tests:
   - `cd backend && uv run pytest tests/ -q`

2. Golden/evals:
   - `cd backend && uv run python evals/run_golden_checks.py`

3. Migration checks:
   - If schema/migrations changed, apply:
     - `cd backend && uv run alembic upgrade heads`
     - `docker compose exec backend alembic upgrade heads`

## Completion Criteria

- Backend and frontend services are `Up`.
- Backend logs show successful startup.
- If backend code changed: tests and evals pass.
- If migration exists: DB upgraded to latest heads.
