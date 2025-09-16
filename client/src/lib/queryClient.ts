import { QueryClient } from "@tanstack/react-query";
import { getApiBaseUrl, API_CONFIG } from "./apiConfig";

export const TOKEN_KEY = "eldercompanion_token";

export const queryClient = new QueryClient();

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  options?: RequestInit
): Promise<Response> {
  const base = getApiBaseUrl();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), API_CONFIG.timeout ?? 10000);

  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: ctrl.signal,
      ...options,
    });
    return res; // ⬅️ devolvemos siempre la Response; no lanzamos aquí
  } finally {
    clearTimeout(t);
  }
}
