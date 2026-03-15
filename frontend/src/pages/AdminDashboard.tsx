import { useState } from 'react';
import { AdminLearningProgress } from '../components/AdminLearningProgress';
import { AdminActivity } from '../components/AdminActivity';
import { AdminScenarios } from '../components/AdminScenarios';
import { AdminUsersTable } from '../components/AdminUsersTable';
import {
  useAdminLearningProgress,
  useAdminActivity,
  useAdminContentPerformance,
  useOrgUsersPerformance,
} from '../hooks/useAdminAnalytics';

interface User {
  id: string;
  role: string;
  org_id: string;
}

interface AdminDashboardProps {
  currentUser: User;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'learning' | 'activity' | 'scenarios' | 'users'>('learning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="bg-cm-red/15 rounded-full p-6 w-24 h-24 flex items-center justify-center border border-cm-red/30">
              <svg className="w-12 h-12 text-cm-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-cm-text mb-2">Access Denied</h1>
          <p className="text-cm-muted mb-2">Admin access required</p>
          <p className="text-cm-muted text-sm mb-8">
            You don't have permission to access the admin dashboard. Please contact your administrator if you believe this is a mistake.
          </p>
          <div className="bg-cm-card border border-cm-border rounded-lg p-4 text-left mb-8">
            <p className="text-cm-muted text-xs font-semibold mb-2">YOUR ACCOUNT</p>
            <p className="text-cm-text font-medium">{currentUser.id}</p>
            <p className="text-cm-muted text-sm capitalize">Role: {currentUser.role}</p>
          </div>
          <a
            href="/"
            className="inline-block bg-cm-primary hover:bg-cm-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition"
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
  const usersPerformance = useOrgUsersPerformance(orgId, startDate, endDate);

  const handleSetPeriod = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="cm-page max-w-7xl">
      <div className="mb-6">
        <h1 className="cm-title">Admin Dashboard</h1>
        <p className="text-cm-muted mt-1">Organization analytics and training performance overview.</p>
      </div>

      <div className="cm-surface p-5 mb-6">
        <h2 className="text-cm-text font-semibold mb-4">Date Range</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => handleSetPeriod(7)} className="cm-tab text-sm">
            Last 7 Days
          </button>
          <button onClick={() => handleSetPeriod(30)} className="cm-tab text-sm">
            Last 30 Days
          </button>
          <button onClick={() => handleSetPeriod(90)} className="cm-tab text-sm">
            Last 90 Days
          </button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="cm-input w-full sm:w-auto"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="cm-input w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('learning')}
          className={activeTab === 'learning' ? 'cm-tab-active' : 'cm-tab'}
        >
          Learning Progress
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={activeTab === 'activity' ? 'cm-tab-active' : 'cm-tab'}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={activeTab === 'scenarios' ? 'cm-tab-active' : 'cm-tab'}
        >
          Content Performance
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'cm-tab-active' : 'cm-tab'}
        >
          Users
        </button>
      </div>

      <div className="cm-surface p-5">
        {activeTab === 'learning' && (
          <AdminLearningProgress data={learningProgress.data} loading={learningProgress.loading} />
        )}
        {activeTab === 'activity' && (
          <AdminActivity data={activity.data} loading={activity.loading} />
        )}
        {activeTab === 'scenarios' && (
          <AdminScenarios data={contentPerformance.data} loading={contentPerformance.loading} />
        )}
        {activeTab === 'users' && (
          <AdminUsersTable data={usersPerformance.data} loading={usersPerformance.loading} orgId={orgId} />
        )}
      </div>
    </div>
  );
}
