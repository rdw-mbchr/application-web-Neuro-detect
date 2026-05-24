import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import Layout           from './components/Layout';
import PrivateRoute     from './components/PrivateRoute';
import AdminRoute       from './components/AdminRoute';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import UploadPage       from './pages/UploadPage';
import PatientsPage     from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientFormPage  from './pages/PatientFormPage';
import ReportsPage      from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminPage        from './pages/AdminPage';
import CreateDoctorPage from './pages/CreateDoctorPage';
import ProfilePage      from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 14 } }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated — all wrapped in sidebar Layout */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/upload"              element={<UploadPage />} />
          <Route path="/profile"             element={<ProfilePage />} />
          <Route path="/patients"            element={<PatientsPage />} />
          <Route path="/patients/new"        element={<PatientFormPage />} />
          <Route path="/patients/:id"        element={<PatientDetailPage />} />
          <Route path="/patients/:id/edit"   element={<PatientFormPage />} />
          <Route path="/reports"             element={<ReportsPage />} />
          <Route path="/reports/:id"         element={<ReportDetailPage />} />
          <Route path="/admin"               element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/create-doctor" element={<AdminRoute><CreateDoctorPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
