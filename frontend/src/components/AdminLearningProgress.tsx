import type { LearningProgressData } from '../types/admin';

interface Props {
  data: LearningProgressData | null;
  loading: boolean;
}

export function AdminLearningProgress({ data, loading }: Props) {
  if (loading) return <div className="p-4 text-cm-muted">Loading...</div>;
  if (!data) return <div className="p-4 text-cm-muted">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <div className="text-sm text-cm-muted">Total Scenarios Completed</div>
          <div className="text-3xl font-bold text-cm-text">{data.total_scenarios_completed}</div>
        </div>
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <div className="text-sm text-cm-muted">Average Score</div>
          <div className="text-3xl font-bold text-cm-text">{data.avg_score?.toFixed(1) ?? 'N/A'}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <h3 className="font-semibold text-cm-text mb-4">Level Distribution</h3>
          <ul className="space-y-2">
            {Object.entries(data.level_distribution).map(([level, count]) => (
              <li key={level} className="flex justify-between text-cm-muted">
                <span>Level {level}</span>
                <span className="font-semibold text-cm-text">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <h3 className="font-semibold text-cm-text mb-4">Completion by Role</h3>
          <ul className="space-y-2">
            {Object.entries(data.completion_by_role).map(([role, count]) => (
              <li key={role} className="flex justify-between text-cm-muted">
                <span className="capitalize">{role}</span>
                <span className="font-semibold text-cm-text">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
