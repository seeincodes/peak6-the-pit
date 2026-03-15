export interface LearningProgressData {
  total_scenarios_completed: number;
  avg_score: number | null;
  level_distribution: Record<number, number>;
  completion_by_role: Record<string, number>;
  completion_by_cohort: Record<string, number>;
}

export interface ActivityDataPoint {
  date: string;
  count: number;
}

export interface ActivityData {
  completions_over_time: ActivityDataPoint[];
  active_users: number;
  peak_hours: number[];
  total_completions: number;
}

export interface ScenarioPerformance {
  scenario_id: string;
  title: string;
  category: string;
  difficulty: string;
  completion_rate: number;
  avg_score: number | null;
  total_attempts: number;
}

export interface ContentPerformanceData {
  scenarios: ScenarioPerformance[];
}
