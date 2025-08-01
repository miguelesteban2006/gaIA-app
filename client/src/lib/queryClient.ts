// client/src/lib/queryClient.ts

import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem("eldercompanion_token");
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: string | FormData | undefined;
  if (data) {
    if (data instanceof FormData) {
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  await throwIfResNotOk(res);
  return res;
}

// Configurar el QueryClient con fetcher por defecto
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await apiRequest("GET", queryKey[0] as string);
        return response.json();
      },
    },
  },
});
