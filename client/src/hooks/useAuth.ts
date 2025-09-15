import { useEffect, useState } from "react";

type User = {
  id?: string;
  email?: string;
  [k: string]: any;
};

const TOKEN_KEY = "eldercompanion_token";

function hasValidToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  // Si usas JWT: valida estructura; si usas otro formato, cambia esto a "return !!t;"
  return !!t && t.split(".").length === 3;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidToken());
  const [isLoading, setIsLoading] = useState(false); // no bloqueamos el arranque
  const [user] = useState<User | null>(null);        // opcional, sin fetch

  useEffect(() => {
    const onChange = () => setIsAuthenticated(hasValidToken());
    // Reaccionar cuando otro código (Landing, setAuthToken, logout) cambie el token
    window.addEventListener("storage", onChange);
    window.addEventListener("auth-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth-changed", onChange);
    };
  }, []);

  return { isAuthenticated, isLoading, user };
}
