---
name: restart-backend-docker
description: Restart the backend Docker Compose service for local development, then verify container health and startup logs. Use when the user asks to restart backend, reload backend env vars, or recover local backend service.
---

# Restart Backend Docker

## Goal

Restart the backend service in local Docker Compose and confirm it is healthy before reporting success.

## Steps

1. Run restart from the project root:
   - `docker compose restart backend`

2. Verify the backend container is up:
   - `docker compose ps backend`
   - Expect `Up` status and port mapping on `:8000`.

3. Check recent backend logs:
   - `docker compose logs backend --tail 30`
   - Confirm startup reached `Application startup complete.`

4. If backend is not running:
   - Run `docker compose up -d backend`
   - Re-check status and logs.

## Verification After Code Changes

When backend code was changed, always run:

1. Python tests:
   - `cd backend && uv run pytest tests/ -q`

2. Golden/evals:
   - `cd backend && uv run python evals/run_golden_checks.py`

3. Migration safety:
   - If a new migration exists or schema changed, apply updates:
     - `cd backend && uv run alembic upgrade heads`
   - In Docker local dev, also ensure running container DB is up to date:
     - `docker compose exec backend alembic upgrade heads`

## Completion Criteria

- Backend container status is `Up`.
- Logs show successful application startup.
- If code changed: tests and evals pass.
- If migration exists: DB is upgraded to latest heads.
- If requested, include one quick endpoint check:
  - `curl -s http://localhost:8000/api/health`

## Notes

- Always run commands in `capman-ai/` where `docker-compose.yml` lives.
- If startup fails due to migrations or env issues, surface the exact log error and stop.
