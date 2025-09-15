import { useQuery } from "@tanstack/react-query";
import { getAuthToken, clearAuthData, isTokenValid } from "@/lib/authUtils";

export function useAuth() {
  const token = getAuthToken();
  const isValidToken = token ? isTokenValid(token) : false;

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: isValidToken, // solo consulta si el token tiene pinta válida
  });

  // Si el backend dice 401 o hay token inválido, limpia sesión
  if (token && (!isValidToken || (error && (error as any)?.message?.includes?.("401")))) {
    clearAuthData();
    return { user: null, isLoading: false, isAuthenticated: false, logout: clearAuthData };
  }

  const logout = () => clearAuthData();

  return {
    user,
    isLoading: isValidToken ? isLoading : false,
    isAuthenticated: !!user && isValidToken && !error,
    logout,
  };
}
