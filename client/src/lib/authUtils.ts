export const TOKEN_KEY = "eldercompanion_token";

/**
 * Guarda el token JWT en localStorage.
 */
export function setAuthToken(token?: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Devuelve el token o null.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Borra cualquier dato de autenticación.
 */
export function clearAuthData() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Indica si hay token almacenado (chequeo rápido en cliente).
 * La validación real la hace el backend cuando se llama a /api/auth/user.
 */
export function isLoggedIn(): boolean {
  return !!getAuthToken();
}

/**
 * Cierra sesión en cliente y recarga la app.
 */
export function logout(redirectTo: string = "/") {
  clearAuthData();
  window.location.replace(redirectTo);
}
