// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "./apiConfig";

export const TOKEN_KEY = "eldercompanion_token";
const DEFAULT_TIMEOUT_MS = 10000; // 10s

export const queryClient = new QueryClient();

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {}
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res;
}

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
      AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    ...init,
  });

  return throwIfResNotOk(res);
}

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
