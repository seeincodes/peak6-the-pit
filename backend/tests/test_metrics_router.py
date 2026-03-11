import pytest
from fastapi import HTTPException

from app.config import settings
from app.routers.metrics import perf_metrics


@pytest.mark.asyncio
async def test_perf_metrics_development_allowed():
    original_env = settings.app_env
    try:
        settings.app_env = "development"
        result = await perf_metrics()
        assert "scenario" in result
        assert "mcq" in result
    finally:
        settings.app_env = original_env


@pytest.mark.asyncio
async def test_perf_metrics_non_dev_forbidden():
    original_env = settings.app_env
    try:
        settings.app_env = "production"
        with pytest.raises(HTTPException) as exc:
            await perf_metrics()
        assert exc.value.status_code == 404
    finally:
        settings.app_env = original_env
