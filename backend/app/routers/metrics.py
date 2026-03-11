from fastapi import APIRouter, HTTPException

from app.config import settings
from app.services.scenario_engine import get_perf_metrics_snapshot

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/perf")
async def perf_metrics():
    if settings.app_env != "development":
        raise HTTPException(status_code=404, detail="Not found")
    return get_perf_metrics_snapshot()
