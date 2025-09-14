// client/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './lib/apiConfig';

// Páginas
import Landing from './pages/Landing';
import Home from './pages/Home';
import ElderlyUserProfile from './pages/ElderlyUserProfile';
import NotFound from './pages/not-found';

// Ruta protegida usando /api/me
function ProtectedRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiFetch('/api/me');
      if (!res.ok) throw new Error('NO_SESSION');
      return res.json();
    },
    retry: false
  });

  if (isLoading) return <div style={{ padding: 24 }}>Cargando…</div>;
  if (!data?.ok) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/" element={<Landing />} />

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/elderly" element={<ElderlyUserProfile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
