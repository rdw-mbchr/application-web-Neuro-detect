import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const { role } = jwtDecode<{ role: string }>(token);
    if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
