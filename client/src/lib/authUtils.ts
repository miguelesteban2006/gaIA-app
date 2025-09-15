// client/src/lib/authUtils.ts

export const AUTH_TOKEN_KEY = "eldercompanion_token";

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthData() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  // En logout puedes recargar si quieres limpiar estado global
  window.location.reload();
}

export function isTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);

    if (payload && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    }
    // Si no hay exp, asumimos válido (depende de tu backend)
    return true;
  } catch {
    return false;
  }
}

export function isUnauthorizedError(error: any): boolean {
  if (error?.status === 401 || error?.response?.status === 401) return true;
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("unauthorized") || msg.includes("401");
}
