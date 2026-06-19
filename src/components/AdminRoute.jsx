import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './ui/Spinner';

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Navigate to="/" replace />;
  if (!['admin', 'staff'].includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
