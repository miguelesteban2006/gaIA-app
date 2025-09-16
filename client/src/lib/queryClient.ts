// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { getApiBaseUrl, API_CONFIG } from "./apiConfig";

export const TOKEN_KEY = "eldercompanion_token";

export const queryClient = new QueryClient();

export function getAuthToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Wrapper para fetch con:
 * - base URL del backend
 * - cabecera Authorization si hay token
 * - timeout configurable (API_CONFIG.timeout)
 * - errores con mensaje útil
 */
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  const base = getApiBaseUrl();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...init,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // intentar extraer mensaje JSON del backend
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.clone().json();
      if (data?.error) msg = data.error;
    } catch {
      // ignorar si no es JSON
    }
    const err = new Error(msg);
    (err as any).status = res.status;
    throw err;
  }

  return res;
}
