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
  
  // Build the complete URL for mobile compatibility and deployment
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

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

  // Improved error handling for network issues
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body,
      credentials: 'same-origin',
      // Add timeout and better error handling
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request failed:', { method, url: fullUrl, error });
    
    // Mensaje más claro para el usuario sobre problemas de conexión
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error('La aplicación necesita conexión al servidor. Verifica que el servidor esté ejecutándose.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Sin conexión al servidor. Para usar la aplicación instalada, debe estar desplegada en producción.');
      }
    }
    
    throw error;
  }
}

// Configurar el QueryClient con fetcher por defecto
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.message?.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      queryFn: async ({ queryKey }) => {
        const response = await apiRequest("GET", queryKey[0] as string);
        return response.json();
      },
    },
  },
});
