import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  cin: string | null;
  phone: string | null;
  createdAt: string;
}

interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

function getRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return jwtDecode<{ role: string }>(token).role; } catch { return null; }
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

export default function PatientsPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const isMedecin   = getRole() === 'MEDECIN';

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebounced]   = useState('');
  const [page, setPage]                   = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<SpringPage<Patient>>({
    queryKey: ['patients', debouncedSearch, page],
    queryFn: () =>
      api.get('/api/patients', { params: { search: debouncedSearch || undefined, page, size: 10 } })
         .then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/patients/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); toast.success('Patient deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete patient ${name}?`)) deleteMutation.mutate(id);
  };

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage patient records</p>
        </div>
        {isMedecin && (
          <Link
            to="/patients/new"
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-80"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or CIN…"
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Patient ID</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Age</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Gender</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">CIN</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Loading…</td>
              </tr>
            )}
            {!isLoading && data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No patients found</td>
              </tr>
            )}
            {data?.content.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-xs font-mono text-gray-400">#{p.id}</td>
                <td className="px-5 py-4 font-medium text-gray-900">{p.lastName} {p.firstName}</td>
                <td className="px-5 py-4 text-gray-600">{calcAge(p.dateOfBirth)}</td>
                <td className="px-5 py-4 text-gray-600">{p.gender ?? '—'}</td>
                <td className="px-5 py-4 text-gray-600">{p.cin ?? '—'}</td>
                <td className="px-5 py-4 text-gray-600">{p.phone ?? '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isMedecin && (
                      <>
                        <button
                          onClick={() => navigate(`/patients/${p.id}/edit`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, `${p.lastName} ${p.firstName}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{data.totalElements} patients</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)} disabled={data.first}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm hover:border-gray-400 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-gray-400">{data.number + 1} / {data.totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)} disabled={data.last}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm hover:border-gray-400 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
