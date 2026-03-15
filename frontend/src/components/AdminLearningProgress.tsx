import type { LearningProgressData } from '../types/admin';

interface Props {
  data: LearningProgressData | null;
  loading: boolean;
}

export function AdminLearningProgress({ data, loading }: Props) {
  if (loading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Scenarios Completed</div>
          <div className="text-3xl font-bold">{data.total_scenarios_completed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Average Score</div>
          <div className="text-3xl font-bold">{data.avg_score?.toFixed(1) ?? 'N/A'}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Level Distribution</h3>
          <ul className="space-y-2">
            {Object.entries(data.level_distribution).map(([level, count]) => (
              <li key={level} className="flex justify-between">
                <span>Level {level}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Completion by Role</h3>
          <ul className="space-y-2">
            {Object.entries(data.completion_by_role).map(([role, count]) => (
              <li key={role} className="flex justify-between">
                <span className="capitalize">{role}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
