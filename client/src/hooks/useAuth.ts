import { useEffect, useState } from "react";
import { TOKEN_KEY } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id?: string;
  email?: string;
  [k: string]: any;
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1) Considera autenticado si hay token (sin bloquear por 404)
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token.split(".").length === 3) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    // 2) Intenta cargar datos del usuario si existe algún endpoint — pero NO bloquea
    //    ni cambia isAuthenticated a false si falla.
    (async () => {
      try {
        // si tu backend expone alguno de estos, úsalo; si da 404, lo ignoramos.
        const candidates = [
          "/api/auth/user",
          "/api/auth/me",
          "/api/me",
          "/api/users/me",
          "/api/auth/profile",
        ];
        for (const url of candidates) {
          try {
            const res = await apiRequest("GET", url);
            if (res.ok) {
              const data = await res.json();
              // adapta a tu forma: user, data.user, etc.
              setUser((data?.user ?? data) || null);
              break;
            }
          } catch {
            /* ignorar y seguir probando */
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { isAuthenticated, isLoading, user };
}
