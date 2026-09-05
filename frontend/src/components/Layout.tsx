import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Users, FileText,
  LogOut, Brain, Settings, UserPlus, User,
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

function getRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return jwtDecode<{ role: string }>(token).role; } catch { return null; }
}

function nav(active: boolean) {
  return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 text-blue-600'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
  }`;
}

export default function Layout() {
  const role     = getRole();
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">NeuroScan AI</p>
              <p className="text-xs text-gray-400 leading-tight">MRI Analysis</p>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLink to="/dashboard" end className={({ isActive }) => nav(isActive)}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </NavLink>

          {role === 'MEDECIN' && (
            <NavLink to="/upload" className={({ isActive }) => nav(isActive)}>
              <Upload className="w-4 h-4 shrink-0" />
              Upload MRI
            </NavLink>
          )}

          <NavLink to="/patients" className={({ isActive }) => nav(isActive)}>
            <Users className="w-4 h-4 shrink-0" />
            Patients
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => nav(isActive)}>
            <FileText className="w-4 h-4 shrink-0" />
            Reports
          </NavLink>

          {role === 'ADMIN' && (
            <>
              <div className="px-3 pt-5 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Admin
                </p>
              </div>
              <NavLink to="/admin" end className={({ isActive }) => nav(isActive)}>
                <Settings className="w-4 h-4 shrink-0" />
                User Management
              </NavLink>
              <NavLink to="/admin/create-doctor" className={({ isActive }) => nav(isActive)}>
                <UserPlus className="w-4 h-4 shrink-0" />
                Create Doctor
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          <NavLink to="/profile" className={({ isActive }) => nav(isActive)}>
            <User className="w-4 h-4 shrink-0" />
            My Profile
          </NavLink>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>

      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}
