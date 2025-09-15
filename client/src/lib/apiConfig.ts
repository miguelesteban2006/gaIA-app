// client/src/lib/apiConfig.ts

// === Timeout y ruta post-login configurables por entorno ===
export const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 20000); // ← 20s

export const AFTER_LOGIN_ROUTE =
  (import.meta.env.VITE_AFTER_LOGIN_ROUTE as string) || "/home"; // ← cámbialo en Pages si quieres

// Base URL de la API
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// Helper con AbortController + timeout
export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, API_BASE_URL || window.location.origin).toString();

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
  } catch (err) {
    // Normaliza el mensaje de timeout
    if ((err as any)?.name === "AbortError") {
      const e = new Error("TIMEOUT");
      (e as any).code = "TIMEOUT";
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
