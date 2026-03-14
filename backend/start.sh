#!/bin/bash
set -eo pipefail

echo "=== Backend startup $(date) ==="
echo "PYTHONPATH=$PYTHONPATH"
echo "APP_ENV=${APP_ENV:-not set}"
echo "DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo 'set' || echo 'NOT SET')"

echo "Running migrations..."
alembic upgrade heads 2>&1 || { echo "ERROR: migrations failed with exit code $?"; exit 1; }

if [ "${SEED_ON_STARTUP:-true}" = "true" ]; then
  echo "Running seed (idempotent)..."
  python -m app.seed
fi

if [ "${INGEST_ON_STARTUP:-true}" = "true" ]; then
  echo "Running document ingestion (idempotent)..."
  python -m app.ingest_docs
fi

PORT=${PORT:-8000}

echo "Starting server on port $PORT..."
if [ "$APP_ENV" = "development" ]; then
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
else
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
fi
