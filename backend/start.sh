#!/bin/bash
set -e

echo "Running migrations..."
alembic upgrade heads

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
  # staging and production both run without --reload
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
fi
