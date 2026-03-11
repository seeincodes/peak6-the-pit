#!/bin/bash
set -e

echo "Running migrations..."
alembic upgrade head

PORT=${PORT:-8000}

echo "Starting server on port $PORT..."
if [ "$APP_ENV" = "development" ]; then
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
else
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
fi
