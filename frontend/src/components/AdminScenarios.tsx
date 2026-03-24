import { useState } from 'react';
import type { ContentPerformanceData } from '../types/admin';

interface Props {
  data: ContentPerformanceData | null;
  loading: boolean;
}

export function AdminScenarios({ data, loading }: Props) {
  const [sortBy, setSortBy] = useState<'completion_rate' | 'avg_score'>('completion_rate');

  if (loading) return <div className="p-4 text-cm-muted">Loading...</div>;
  if (!data || data.scenarios.length === 0) return <div className="p-4 text-cm-muted">No scenarios available</div>;

  const sorted = [...data.scenarios].sort((a, b) => {
    if (sortBy === 'completion_rate') {
      return b.completion_rate - a.completion_rate;
    }
    return (b.avg_score ?? 0) - (a.avg_score ?? 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy('completion_rate')}
          className={sortBy === 'completion_rate' ? 'cm-tab-active text-sm' : 'cm-tab text-sm'}
        >
          Completion Rate
        </button>
        <button
          onClick={() => setSortBy('avg_score')}
          className={sortBy === 'avg_score' ? 'cm-tab-active text-sm' : 'cm-tab text-sm'}
        >
          Avg Score
        </button>
      </div>

      <div className="bg-cm-card-raised border border-cm-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cm-bg border-b border-cm-border">
            <tr>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">Scenario</th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">Category</th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">Difficulty</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Completion %</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Avg Score</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((scenario) => (
              <tr key={scenario.scenario_id} className="border-b border-cm-border hover:bg-cm-bg/60">
                <td className="px-4 py-2 text-cm-text">{scenario.title}</td>
                <td className="px-4 py-2 text-cm-muted">{scenario.category}</td>
                <td className="px-4 py-2 text-cm-muted capitalize">{scenario.difficulty}</td>
                <td className="px-4 py-2 text-right text-cm-text">{(scenario.completion_rate * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-cm-text">{scenario.avg_score?.toFixed(1) ?? 'N/A'}%</td>
                <td className="px-4 py-2 text-right text-cm-text">{scenario.total_attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
