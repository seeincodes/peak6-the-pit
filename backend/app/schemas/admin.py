from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LearningProgressResponse(BaseModel):
    total_scenarios_completed: int
    avg_score: Optional[float]
    level_distribution: dict[int, int]
    completion_by_role: dict[str, int]
    completion_by_cohort: dict[str, int]


class ActivityDataPoint(BaseModel):
    date: str
    count: int


class ActivityResponse(BaseModel):
    completions_over_time: list[ActivityDataPoint]
    active_users: int
    peak_hours: list[int]
    total_completions: int


class ScenarioPerformance(BaseModel):
    scenario_id: str
    title: str
    category: str
    difficulty: str
    completion_rate: float
    avg_score: Optional[float]
    total_attempts: int


class ContentPerformanceResponse(BaseModel):
    scenarios: list[ScenarioPerformance]
