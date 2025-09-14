// Configuration for API endpoints - handles development and production URLs

export function getApiBaseUrl(): string {
  // 1) Variable de entorno (recomendado en producción)
  const viteApiUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (viteApiUrl && typeof viteApiUrl === 'string') {
    return viteApiUrl.replace(/\/+$/, '');
  }

  // 2) Detección automática (local / preview)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const origin = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return origin.replace(/\/+$/, '');
  }

  // 3) Fallback para SSR/build tools
  return 'http://localhost:5173';
}

export const API_CONFIG = {
  timeout: 10000, // 10 segundos
  retries: 2,
  retryDelay: 1000 // 1 segundo
};

// Base calculada una vez
const BASE = getApiBaseUrl();

// Construye URL absoluta para la API
export const apiUrl = (path: string) =>
  new URL(path.startsWith('/') ? path : `/${path}`, BASE || window.location.origin).toString();
