from app.services.scenario_engine import get_perf_metrics_snapshot, record_perf_metric


def test_perf_metrics_snapshot_includes_core_fields():
    record_perf_metric("scenario", cache_hit=False, total_ms=100, model_ms=80)
    record_perf_metric("scenario", cache_hit=True, total_ms=20, model_ms=0)
    snapshot = get_perf_metrics_snapshot()

    scenario = snapshot["scenario"]
    assert "requests_total" in scenario
    assert "cache_hit_rate" in scenario
    assert "latency_ms_p50" in scenario
    assert "latency_ms_p95" in scenario
    assert scenario["requests_total"] >= 2
    assert 0 <= scenario["cache_hit_rate"] <= 1
