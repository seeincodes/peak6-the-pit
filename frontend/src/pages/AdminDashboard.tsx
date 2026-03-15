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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-500/20 rounded-full p-6 w-24 h-24 flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-2">Admin access required</p>
          <p className="text-gray-400 text-sm mb-8">
            You don't have permission to access the admin dashboard. Please contact your administrator if you believe this is a mistake.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left mb-8">
            <p className="text-gray-400 text-xs font-semibold mb-2">YOUR ACCOUNT</p>
            <p className="text-white font-medium">{currentUser.id}</p>
            <p className="text-gray-500 text-sm capitalize">Role: {currentUser.role}</p>
          </div>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Go Back Home
          </a>
        </div>
      </div>
    );
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
