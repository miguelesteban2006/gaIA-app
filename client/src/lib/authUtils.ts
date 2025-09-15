export const TOKEN_KEY = "eldercompanion_token";
export const AUTH_FLAG_KEY = "eldercompanion_auth";

/** Guarda token si llega y marca sesión como activa (útil si usas cookie). */
export function setAuthToken(token?: string | null) {
  if (token && token.length > 0) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  // Marca sesión aunque el backend use cookie (sin token)
  localStorage.setItem(AUTH_FLAG_KEY, "1");
  // Notifica al Router que cambió el estado de auth
  window.dispatchEvent(new Event("auth-changed"));
}

/** Limpia todo lo de auth y notifica. */
export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_FLAG_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

/** ¿Hay sesión válida? (token o flag de sesión) */
export function hasValidAuth(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const flag = localStorage.getItem(AUTH_FLAG_KEY) === "1";
  return !!token || flag;
}
