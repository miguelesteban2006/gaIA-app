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
    
    // Si estamos en un deployment de Replit (.replit.app)
    if (hostname.includes('.replit.app') || hostname.includes('.repl.co')) {
      return `${protocol}//${hostname}`;
    }
    
    // Si estamos en localhost (desarrollo) - usar puerto fijo 5000 para API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
    
    // Para otros casos, usar la URL actual
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  
  // Fallback para servidor
  return process.env.API_BASE_URL || 'http://localhost:5000';
}

export function getFullApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Verificar si estamos en modo offline
export function isOfflineMode(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// Configuración para requests con timeout
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
