import { QueryClient } from "@tanstack/react-query";
import { getApiBaseUrl, API_CONFIG } from "./apiConfig";

export const TOKEN_KEY = "eldercompanion_token";

/**
 * React Query client (default config).
 */
export const queryClient = new QueryClient();

/**
 * Devuelve el header Authorization si hay token guardado.
 */
export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Lanza error si la respuesta no es OK. Intenta incluir cuerpo textual para depurar.
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      // ignore
    }
    const message = `${res.status}: ${text || res.statusText}`;
    throw new Error(message);
  }
  return res;
}

/**
 * Wrapper de fetch con:
 * - baseUrl desde apiConfig
 * - credentials: 'include' (cookies de sesión)
 * - Authorization: Bearer <token> si existe
 * - Content-Type: application/json
 * - timeout configurable (API_CONFIG.timeout)
 */
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  init?: RequestInit
) {
  const base = getApiBaseUrl();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(base + url, {
    method,
    headers,
    credentials: "include",
    body: body != null ? JSON.stringify(body) : undefined,
    signal:
      (init?.signal as AbortSignal | undefined) ??
      (API_CONFIG.timeout ? AbortSignal.timeout(API_CONFIG.timeout) : undefined),
    ...init,
  });

  return throwIfResNotOk(res);
}

/**
 * Igual que apiRequest pero te devuelve el JSON ya parseado.
 * Si la respuesta es 204/empty, devuelve {}.
 */
export async function apiJson<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await apiRequest(method, url, body, init);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}
