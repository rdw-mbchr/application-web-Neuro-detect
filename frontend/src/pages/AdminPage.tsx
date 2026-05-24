import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface AdminUser {
  id: number; email: string; fullName: string;
  role: string; isActive: boolean; phone: string | null; createdAt: string;
}
interface SpringPage<T> {
  content: T[]; totalPages: number; totalElements: number; number: number; first: boolean; last: boolean;
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<SpringPage<AdminUser>>({
    queryKey: ['admin-users', page],
    queryFn: () => api.get('/api/admin/users', { params: { page, size: 10 } }).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/users/${id}/toggle`).then(r => r.data),
    onSuccess: (u: AdminUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${u.fullName} ${u.isActive ? 'activated' : 'deactivated'}`);
    },
    onError: () => toast.error('Update failed'),
  });

  return (
    <div className="p-8">

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage doctor accounts and access</p>
        </div>
        <Link
          to="/admin/create-doctor"
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-80"
        >
          <UserPlus className="w-4 h-4" /> New Doctor
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && data?.content.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No users</td></tr>
            )}
            {data?.content.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-900">{u.fullName}</td>
                <td className="px-5 py-4 text-gray-600">{u.email}</td>
                <td className="px-5 py-4">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors ${
                      u.isActive
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{data.totalElements} users</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={data.first}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm hover:border-gray-400 disabled:opacity-40">
              Previous
            </button>
            <span className="text-gray-400">{data.number + 1} / {data.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={data.last}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm hover:border-gray-400 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
