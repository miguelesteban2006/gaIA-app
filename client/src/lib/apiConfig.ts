// client/src/lib/apiConfig.ts

// === Config por entorno ===
export const API_TIMEOUT_MS =
  Number((import.meta as any)?.env?.VITE_API_TIMEOUT_MS ?? 20000); // 20s por defecto

export const AFTER_LOGIN_ROUTE =
  ((import.meta as any)?.env?.VITE_AFTER_LOGIN_ROUTE as string) || "/";

// === Base URL ===
export function getApiBaseUrl(): string {
  // 1) Variable de entorno (producción/preview)
  const envUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/+$/, "");
  }

  // 2) Detección en navegador (local/preview sin VITE_API_URL)
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const origin = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    return origin.replace(/\/+$/, "");
  }

  // 3) Fallback (build tools / SSR)
  return "http://localhost:5173";
}

// Alias útil (opcional)
export const API_BASE_URL = getApiBaseUrl();

// Construye URL absoluta para endpoints
export const apiUrl = (path: string) =>
  new URL(path.startsWith("/") ? path : `/${path}`, API_BASE_URL).toString();

// Helper fetch con timeout (si lo usas desde fuera)
export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = apiUrl(path);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      signal: controller.signal,
      ...init,
    });
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e = new Error("TIMEOUT");
      (e as any).code = "TIMEOUT";
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
