// client/src/lib/apiConfig.ts

// Tiempo máximo de espera para cualquier request
export const API_CONFIG = {
  timeout: 15000 as const, // 15s
};

/**
 * Resuelve la URL base del backend.
 * - Prioriza la variable de entorno VITE_API_BASE_URL (recomendado).
 * - Si estás en Cloudflare Pages, usa tu API en Render.
 * - En local, apunta a tu backend local (ajusta el puerto si es otro).
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    // Producción (Pages)
    if (host.endsWith(".pages.dev")) {
      return "https://gaia-api-ucss.onrender.com";
    }
    // Desarrollo local
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return "http://localhost:3000";
    }
  }

  // Fallback
  return "https://gaia-api-ucss.onrender.com";
}
