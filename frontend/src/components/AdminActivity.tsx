import type { ActivityData } from '../types/admin';

interface Props {
  data: ActivityData | null;
  loading: boolean;
}

export function AdminActivity({ data, loading }: Props) {
  if (loading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Completions</div>
          <div className="text-3xl font-bold">{data.total_completions}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-3xl font-bold">{data.active_users}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Peak Hours</div>
          <div className="text-3xl font-bold">{data.peak_hours.join(', ')} UTC</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Completions Over Time</h3>
        <div className="space-y-2">
          {data.completions_over_time.slice(-7).map((point) => (
            <div key={point.date} className="flex justify-between">
              <span>{point.date}</span>
              <span className="font-semibold">{point.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
