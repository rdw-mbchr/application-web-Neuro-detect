import { useQuery } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import {
  Activity, Users, FileText, Stethoscope,
  Upload, ArrowRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../api/axiosInstance';

interface AdminStats {
  totalPatients:    number;
  totalAnalyses:    number;
  totalDoctors:     number;
  totalReports:     number;
  analysesByMonth:  { month: string; count: number }[];
  diagnosesByClass: Record<string, number>;
}

function getRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return jwtDecode<{ role: string }>(token).role; } catch { return null; }
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(+y, +mo - 1).toLocaleDateString('fr-FR', { month: 'short' });
}

const DIAG_COLORS: Record<string, string> = {
  CONTROL:       '#22c55e',
  SCHIZOPHRENIA: '#ef4444',
  BIPOLAR:       '#f97316',
  ADHD:          '#3b82f6',
};

function KpiCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number | string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ── MEDECIN simple dashboard ── */
function MedecinDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">AI-powered neurological disease detection</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/upload"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">Upload MRI</p>
          <p className="text-sm text-gray-500 mt-1">Analyze a new brain scan</p>
          <div className="flex items-center gap-1 mt-4 text-xs font-medium text-blue-600">
            Get started <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          to="/patients"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">Patients</p>
          <p className="text-sm text-gray-500 mt-1">Manage patient records</p>
          <div className="flex items-center gap-1 mt-4 text-xs font-medium text-green-600">
            View all <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <p className="font-semibold text-gray-900">Reports</p>
          <p className="text-sm text-gray-500 mt-1">Generated PDF reports</p>
          <div className="flex items-center gap-1 mt-4 text-xs font-medium text-purple-600">
            View all <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ── ADMIN full dashboard ── */
export default function DashboardPage() {
  const isAdmin = getRole() === 'ADMIN';

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats').then(r => r.data),
    enabled: isAdmin,
  });

  if (!isAdmin) return <MedecinDashboard />;

  const lineData = (stats?.analysesByMonth ?? []).map(d => ({
    label: formatMonth(d.month),
    count: d.count,
  }));

  const barData = Object.entries(stats?.diagnosesByClass ?? {}).map(([name, value]) => ({
    name, value, fill: DIAG_COLORS[name] ?? '#6b7280',
  }));

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">AI-powered neurological disease detection</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-32 animate-pulse" />
          ))
        ) : (
          <>
            <KpiCard label="Total Analyses"    value={stats?.totalAnalyses ?? 0}  icon={Activity}     color="bg-blue-50 text-blue-600" />
            <KpiCard label="Active Patients"   value={stats?.totalPatients ?? 0}  icon={Users}        color="bg-green-50 text-green-600" />
            <KpiCard label="Reports Generated" value={stats?.totalReports ?? 0}   icon={FileText}     color="bg-purple-50 text-purple-600" />
            <KpiCard label="Medical Staff"     value={stats?.totalDoctors ?? 0}   icon={Stethoscope}  color="bg-orange-50 text-orange-600" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Line chart — analyses trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Monthly Analyses</h2>
          <p className="text-xs text-gray-400 mb-5">Scans processed per month</p>
          {lineData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
                  formatter={(v: number) => [v, 'Analyses']}
                  cursor={{ stroke: '#e2e8f0' }}
                />
                <Line
                  type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5}
                  dot={{ fill: '#2563EB', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — detection distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Detection Distribution</h2>
          <p className="text-xs text-gray-400 mb-5">Diagnoses by classification</p>
          {barData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
