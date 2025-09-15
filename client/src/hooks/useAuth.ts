import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

const TOKEN_KEY = "eldercompanion_token";

export function useAuth() {
  // 1) Arranca en true si ya hay token en localStorage para que el router
  //    pinte Home inmediatamente tras el reload.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 2) Valida con el backend (con credenciales y Authorization si hay token)
        const res = await apiRequest("GET", "/api/auth/user");
        if (!cancelled) setIsAuthenticated(res.ok);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { isAuthenticated, isLoading };
}
