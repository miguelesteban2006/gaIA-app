import { useQuery } from "@tanstack/react-query";
import { getAuthToken, clearAuthData, isTokenValid } from "@/lib/authUtils";

export function useAuth() {
  const token = getAuthToken();
  
  // Verificar si el token es válido antes de hacer la consulta
  const isValidToken = token ? isTokenValid(token) : false;
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: isValidToken, // Solo hacer la consulta si el token es válido
  });

  // Si hay error en la autenticación o token inválido, limpiar datos
  if ((error || !isValidToken) && token) {
    console.log('Token inválido o error de autenticación, limpiando localStorage');
    clearAuthData();
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: clearAuthData,
    };
  }

  const logout = () => {
    clearAuthData();
  };

  return {
    user,
    isLoading: isValidToken ? isLoading : false,
    isAuthenticated: !!user && isValidToken && !error,
    logout,
  };
}
