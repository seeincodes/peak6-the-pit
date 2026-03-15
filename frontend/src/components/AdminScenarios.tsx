import { useState } from 'react';
import type { ContentPerformanceData } from '../types/admin';

interface Props {
  data: ContentPerformanceData | null;
  loading: boolean;
}

export function AdminScenarios({ data, loading }: Props) {
  const [sortBy, setSortBy] = useState<'completion_rate' | 'avg_score'>('completion_rate');

  if (loading) return <div className="p-4">Loading...</div>;
  if (!data || data.scenarios.length === 0) return <div className="p-4">No scenarios available</div>;

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
          className={`px-4 py-2 rounded font-semibold text-sm ${
            sortBy === 'completion_rate' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Completion Rate
        </button>
        <button
          onClick={() => setSortBy('avg_score')}
          className={`px-4 py-2 rounded font-semibold text-sm ${
            sortBy === 'avg_score' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Avg Score
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left">Scenario</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Difficulty</th>
              <th className="px-4 py-2 text-right">Completion %</th>
              <th className="px-4 py-2 text-right">Avg Score</th>
              <th className="px-4 py-2 text-right">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((scenario) => (
              <tr key={scenario.scenario_id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{scenario.title}</td>
                <td className="px-4 py-2">{scenario.category}</td>
                <td className="px-4 py-2 capitalize">{scenario.difficulty}</td>
                <td className="px-4 py-2 text-right">{(scenario.completion_rate * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right">{scenario.avg_score?.toFixed(1) ?? 'N/A'}%</td>
                <td className="px-4 py-2 text-right">{scenario.total_attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
