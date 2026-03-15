import { useState } from 'react';
import { AdminLearningProgress } from '../components/AdminLearningProgress';
import { AdminActivity } from '../components/AdminActivity';
import { AdminScenarios } from '../components/AdminScenarios';
import { useAdminLearningProgress, useAdminActivity, useAdminContentPerformance } from '../hooks/useAdminAnalytics';

interface User {
  id: string;
  role: string;
  org_id: string;
}

interface AdminDashboardProps {
  currentUser: User;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'learning' | 'activity' | 'scenarios'>('learning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (currentUser.role !== 'admin') {
    return <div className="p-6 text-center text-red-600">Admin access required</div>;
  }

  const orgId = currentUser.org_id;

  const learningProgress = useAdminLearningProgress(orgId, startDate, endDate);
  const activity = useAdminActivity(orgId, startDate, endDate);
  const contentPerformance = useAdminContentPerformance(orgId, startDate, endDate);

  const handleSetPeriod = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="font-semibold mb-4">Date Range</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => handleSetPeriod(7)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
              Last 7 Days
            </button>
            <button onClick={() => handleSetPeriod(30)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
              Last 30 Days
            </button>
            <button onClick={() => handleSetPeriod(90)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
              Last 90 Days
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 rounded font-semibold text-sm ${
              activeTab === 'learning' ? 'bg-blue-600 text-white' : 'bg-white text-black'
            }`}
          >
            Learning Progress
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded font-semibold text-sm ${
              activeTab === 'activity' ? 'bg-blue-600 text-white' : 'bg-white text-black'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-4 py-2 rounded font-semibold text-sm ${
              activeTab === 'scenarios' ? 'bg-blue-600 text-white' : 'bg-white text-black'
            }`}
          >
            Content Performance
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'learning' && (
            <AdminLearningProgress data={learningProgress.data} loading={learningProgress.loading} />
          )}
          {activeTab === 'activity' && (
            <AdminActivity data={activity.data} loading={activity.loading} />
          )}
          {activeTab === 'scenarios' && (
            <AdminScenarios data={contentPerformance.data} loading={contentPerformance.loading} />
          )}
        </div>
      </div>
    </div>
  );
}
