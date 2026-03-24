import type { ActivityData } from '../types/admin';

interface Props {
  data: ActivityData | null;
  loading: boolean;
}

export function AdminActivity({ data, loading }: Props) {
  if (loading) return <div className="p-4 text-cm-muted">Loading...</div>;
  if (!data) return <div className="p-4 text-cm-muted">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <div className="text-sm text-cm-muted">Total Completions</div>
          <div className="text-3xl font-bold text-cm-text">{data.total_completions}</div>
        </div>
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <div className="text-sm text-cm-muted">Active Users</div>
          <div className="text-3xl font-bold text-cm-text">{data.active_users}</div>
        </div>
        <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
          <div className="text-sm text-cm-muted">Peak Hours</div>
          <div className="text-3xl font-bold text-cm-text">{data.peak_hours.join(', ')} UTC</div>
        </div>
      </div>

      <div className="bg-cm-card-raised border border-cm-border p-4 rounded-lg">
        <h3 className="font-semibold text-cm-text mb-4">Completions Over Time</h3>
        <div className="space-y-2">
          {data.completions_over_time.slice(-7).map((point) => (
            <div key={point.date} className="flex justify-between text-cm-muted">
              <span>{point.date}</span>
              <span className="font-semibold text-cm-text">{point.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
