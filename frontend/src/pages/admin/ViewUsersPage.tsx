// src/pages/admin/ViewUsersPage.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdminUser {
  _id: string;
  username: string;
  email: string | null;
  role: 'user' | 'admin' | 'guest';
  createdAt: string;
}

const ViewUsersPage: React.FC = () => {
  const { token } = useAuth();

  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [sort, setSort] = React.useState<'asc' | 'desc'>('asc'); // order of registration: oldest first

  const fetchUsers = async () => {
    try {
      setIsFiltering(true);
      setError(null);
  const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (role) params.append('role', role);
  if (sort) params.append('sort', sort);
      const qs = params.toString();

      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed (${res.status})`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch users');
    } finally {
      setIsFiltering(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        const qs = params.toString();
        const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (isMounted) setUsers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load users');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [token]);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">View Users</h2>
      <div className="bg-white border rounded-lg p-4 space-y-4">
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">{error}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Search by username or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 text-gray-700"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Guest</option>
          </select>
          <select
            className="border rounded-md px-3 py-2 text-gray-700"
            value={sort}
            onChange={e => setSort((e.target.value as 'asc' | 'desc'))}
            title="Sort by registration date"
          >
            <option value="asc">Oldest first</option>
            <option value="desc">Newest first</option>
          </select>
          <button
            onClick={fetchUsers}
            disabled={isFiltering}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isFiltering ? 'Applying…' : 'Apply'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500">
                <th className="py-2">Username</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!loading && users.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No users found.</td>
                </tr>
              )}
              {users.map((x) => (
                <tr key={x._id} className="text-gray-700">
                  <td className="py-3 flex items-center gap-2"><span className="inline-flex w-6 h-6 rounded-full bg-gray-100"/> {x.username}</td>
                  <td className="py-3">{x.email || '—'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${x.role==='admin'?'bg-purple-50 text-purple-700': x.role==='guest'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}>{x.role}</span>
                  </td>
                  <td className="py-3">{formatDate(x.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewUsersPage;


