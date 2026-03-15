import { useMemo, useState } from 'react';
import type { OrgUsersPerformanceData } from '../types/admin';

interface Props {
  data: OrgUsersPerformanceData | null;
  loading: boolean;
}

export function AdminUsersTable({ data, loading }: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const roles = useMemo(() => {
    const unique = new Set((data?.users || []).map((u) => u.role));
    return ['all', ...Array.from(unique)];
  }, [data?.users]);

  const filteredUsers = useMemo(() => {
    const users = data?.users || [];
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const term = query.trim().toLowerCase();
      const matchesQuery =
        term.length === 0 ||
        u.display_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.cohort || '').toLowerCase().includes(term);
      return matchesRole && matchesQuery;
    });
  }, [data?.users, roleFilter, query]);

  if (loading) return <div className="p-4 text-cm-muted">Loading users...</div>;
  if (!data || data.users.length === 0) return <div className="p-4 text-cm-muted">No users found for this org.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="cm-input flex-1"
          placeholder="Search by name, email, or cohort"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="cm-input sm:w-48"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role === 'all' ? 'All roles' : role}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-cm-card-raised border border-cm-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cm-bg border-b border-cm-border">
            <tr>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">User</th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">Role</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Level</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">XP</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Streak</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Attempts</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Completed</th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">Avg Score</th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.user_id} className="border-b border-cm-border hover:bg-cm-bg/60">
                <td className="px-4 py-2">
                  <div className="text-cm-text font-medium">{u.display_name}</div>
                  <div className="text-cm-muted text-xs">{u.email}</div>
                  {u.cohort && <div className="text-cm-muted text-xs">Cohort: {u.cohort}</div>}
                </td>
                <td className="px-4 py-2 text-cm-muted capitalize">{u.role}</td>
                <td className="px-4 py-2 text-right text-cm-text">{u.level}</td>
                <td className="px-4 py-2 text-right text-cm-text">{u.xp_total}</td>
                <td className="px-4 py-2 text-right text-cm-text">{u.streak_days}d</td>
                <td className="px-4 py-2 text-right text-cm-text">{u.total_attempts}</td>
                <td className="px-4 py-2 text-right text-cm-text">{u.completed_scenarios}</td>
                <td className="px-4 py-2 text-right text-cm-text">
                  {u.avg_score !== null ? `${u.avg_score.toFixed(1)}%` : 'N/A'}
                </td>
                <td className="px-4 py-2 text-cm-muted">
                  {u.last_active_at ? new Date(u.last_active_at).toLocaleString() : 'No activity'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
