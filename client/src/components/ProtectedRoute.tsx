import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiConfig';

export function ProtectedRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const r = await apiFetch('/api/me');
      if (!r.ok) throw new Error('NO_SESSION');
      return r.json();
    },
    retry: false
  });

  if (isLoading) return <div>Cargando…</div>;
  if (!data?.ok) return <Navigate to="/" replace />; // si no hay sesión, vuelve a Landing
  return <Outlet />;
}
