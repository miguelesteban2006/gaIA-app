// client/src/pages/Landing.tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiConfig';

const DASHBOARD_ROUTE = '/home'; // cámbialo si tu “pantalla principal” es otra

export default function Landing() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'LOGIN_FAILED');
      }
      return data as { ok: boolean; user?: any };
    },
    onSuccess: (data) => {
      // Hidrata la cache de /api/me para que ProtectedRoute no vuelva a pedirlo
      qc.setQueryData(['me'], { ok: true, user: data.user });
      // Redirección al área privada
      navigate(DASHBOARD_ROUTE, { replace: true });
    }
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    loginMutation.mutate({ email, password });
  };

  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Bienvenido a GaIA</h1>
      <p style={{ marginBottom: 24 }}>
        Inicia sesión para acceder a la aplicación.
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          Contraseña
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          style={{
            width: '100%',
            padding: '10px 12px',
            cursor: 'pointer'
          }}
        >
          {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      {loginMutation.isError && (
        <p style={{ color: 'red', marginTop: 12 }}>
          {(loginMutation.error as Error).message}
        </p>
      )}
    </main>
  );
}
