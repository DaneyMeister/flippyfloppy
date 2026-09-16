import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InventoryProvider } from '../context/InventoryContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <InventoryProvider>
      <Outlet />
    </InventoryProvider>
  );
}
