import { useEffect, useState } from "react";
import { apiRequest, TOKEN_KEY } from "@/lib/queryClient";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        // Intenta primero /api/auth/me; si no existe, prueba /api/auth/user
        let res = await apiRequest("GET", "/api/auth/me");
        if (res.status === 404) {
          res = await apiRequest("GET", "/api/auth/user");
        }
        if (!res.ok) {
          setIsAuthenticated(false);
          setUser(null);
        } else {
          const json = await res.json().catch(() => null);
          setIsAuthenticated(true);
          setUser(json?.user ?? json ?? null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { isLoading, isAuthenticated, user };
}
