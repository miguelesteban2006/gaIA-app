// Configuration for API endpoints - handles development and production URLs

export function getApiBaseUrl(): string {
  // Prioridad 1: Variable de entorno VITE_API_URL (para separación frontend/backend)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    return viteApiUrl;
  }
  
  // Prioridad 2: Detección automática basada en el contexto
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
...
export const API_CONFIG = {
  timeout: 10000, // 10 segundos
  retries: 2,
  retryDelay: 1000 // 1 segundo
};

// client/src/lib/apiConfig.ts
const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const apiUrl = (path: string) =>
  new URL(path.startsWith('/') ? path : `/${path}`, base || window.location.origin).toString();

// Ejemplo de uso:
// fetch(apiUrl('/api/register'), { method: 'POST', headers: {...}, body: ... })
