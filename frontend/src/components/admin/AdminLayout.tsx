import { Navigate, Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { getAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

export default function AdminLayout() {
  const token = getAuthToken();
  let isAdmin = false;

  if (token) {
    const payload = parseJwt(token);
    if (payload && (payload.role === 'admin' || payload.role === 'master_admin' || payload.isAdmin)) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
