import { useMemo, useState } from 'react';
import type { OrgUsersPerformanceData } from '../types/admin';
import api from '../api/client';

interface Props {
  data: OrgUsersPerformanceData | null;
  loading: boolean;
  orgId: string;
}

type SortKey =
  | 'display_name'
  | 'role'
  | 'level'
  | 'xp_total'
  | 'streak_days'
  | 'total_attempts'
  | 'completed_scenarios'
  | 'avg_score'
  | 'last_active_at';

export function AdminUsersTable({ data, loading, orgId }: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('display_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ta');
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

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

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'display_name' || sortKey === 'role') {
        return a[sortKey].localeCompare(b[sortKey]) * direction;
      }

      if (sortKey === 'last_active_at') {
        const aTime = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
        const bTime = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
        return (aTime - bTime) * direction;
      }

      const aVal = a[sortKey] ?? -1;
      const bVal = b[sortKey] ?? -1;
      return (Number(aVal) - Number(bVal)) * direction;
    });
    return sorted;
  }, [filteredUsers, sortKey, sortDir]);

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    setSortDir(nextKey === 'display_name' || nextKey === 'role' ? 'asc' : 'desc');
  };

  const downloadCsv = () => {
    const headers = [
      'display_name',
      'email',
      'role',
      'cohort',
      'level',
      'xp_total',
      'streak_days',
      'total_attempts',
      'completed_scenarios',
      'avg_score',
      'last_active_at',
    ];
    const escape = (value: string | number | null) => {
      const text = value === null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = sortedUsers.map((u) =>
      [
        u.display_name,
        u.email,
        u.role,
        u.cohort,
        u.level,
        u.xp_total,
        u.streak_days,
        u.total_attempts,
        u.completed_scenarios,
        u.avg_score,
        u.last_active_at,
      ]
        .map((v) => escape(v as string | number | null))
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `org-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createInvite = async () => {
    setInviteError(null);
    setInviteResult(null);
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await api.post(`/admin/org/${orgId}/invites`, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setInviteResult(res.data.signup_url);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err?.response?.data?.detail || 'Failed to create invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) return <div className="p-4 text-cm-muted">Loading users...</div>;
  if (!data || data.users.length === 0) return <div className="p-4 text-cm-muted">No users found for this org.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-cm-card-raised border border-cm-border rounded-lg p-4 space-y-3">
        <div className="text-cm-text font-semibold">Invite User</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="cm-input flex-1"
            placeholder="user@company.com"
          />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="cm-input sm:w-44">
            <option value="ta">ta</option>
            <option value="intern">intern</option>
            <option value="experienced">experienced</option>
            <option value="educator">educator</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={createInvite} disabled={inviteLoading} className="cm-tab-active disabled:opacity-50">
            {inviteLoading ? 'Creating...' : 'Create Invite'}
          </button>
        </div>
        {inviteResult && (
          <div className="text-sm text-cm-muted">
            Invite link: <a className="text-cm-primary hover:underline" href={inviteResult}>{inviteResult}</a>
          </div>
        )}
        {inviteError && <div className="text-sm text-cm-red">{inviteError}</div>}
      </div>

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
        <button onClick={downloadCsv} className="cm-tab sm:w-auto">
          Export CSV
        </button>
      </div>

      <div className="bg-cm-card-raised border border-cm-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cm-bg border-b border-cm-border">
            <tr>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">
                <button onClick={() => toggleSort('display_name')} className="hover:text-cm-text transition-colors">
                  User{sortIndicator('display_name')}
                </button>
              </th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">
                <button onClick={() => toggleSort('role')} className="hover:text-cm-text transition-colors">
                  Role{sortIndicator('role')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('level')} className="hover:text-cm-text transition-colors">
                  Level{sortIndicator('level')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('xp_total')} className="hover:text-cm-text transition-colors">
                  XP{sortIndicator('xp_total')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('streak_days')} className="hover:text-cm-text transition-colors">
                  Streak{sortIndicator('streak_days')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('total_attempts')} className="hover:text-cm-text transition-colors">
                  Attempts{sortIndicator('total_attempts')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('completed_scenarios')} className="hover:text-cm-text transition-colors">
                  Completed{sortIndicator('completed_scenarios')}
                </button>
              </th>
              <th className="px-4 py-2 text-right text-cm-muted font-semibold">
                <button onClick={() => toggleSort('avg_score')} className="hover:text-cm-text transition-colors">
                  Avg Score{sortIndicator('avg_score')}
                </button>
              </th>
              <th className="px-4 py-2 text-left text-cm-muted font-semibold">
                <button onClick={() => toggleSort('last_active_at')} className="hover:text-cm-text transition-colors">
                  Last Active{sortIndicator('last_active_at')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
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
