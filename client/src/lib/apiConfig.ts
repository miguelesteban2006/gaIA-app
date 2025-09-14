// client/src/lib/apiConfig.ts

// 1) BASE de la API: primero VITE_API_URL (Pages), si no, mismo origen
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '') || window.location.origin;

// 2) Construye URLs absolutas hacia la API
export const apiUrl = (path: string) =>
  new URL(path.startsWith('/') ? path : `/${path}`, API_BASE_URL).toString();

// 3) Helper para fetch con cookies (sesión) y Content-Type automático
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  // Si envías body como JSON (string) añade Content-Type si no existe
  if (!headers.has('Content-Type') && typeof (init as any).body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(apiUrl(path), {
    credentials: 'include', // imprescindible para la cookie 'token'
    ...init,
    headers
  });
}
