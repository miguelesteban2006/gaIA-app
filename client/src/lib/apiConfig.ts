// Configuration for API endpoints - handles development and production URLs

export function getApiBaseUrl(): string {
  // En producción, usar la URL de deployment de Replit
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Si estamos en un deployment de Replit (.replit.app)
    if (hostname.includes('.replit.app') || hostname.includes('.repl.co')) {
      return `${protocol}//${hostname}`;
    }
    
    // Si estamos en localhost (desarrollo)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port || '5000'}`;
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