import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = localStorage.getItem('eldercompanion_token');
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!token, // Solo hacer la consulta si hay token
  });

  const logout = () => {
    localStorage.removeItem('eldercompanion_token');
    window.location.reload();
  };

  return {
    user,
    isLoading: token ? isLoading : false, // Si no hay token, no está cargando
    isAuthenticated: !!user && !!token,
    logout,
  };
}
