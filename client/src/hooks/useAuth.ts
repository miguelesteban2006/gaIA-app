import { useEffect, useState } from "react";

type User = {
  id?: string;
  email?: string;
  [k: string]: any;
};

const TOKEN_KEY = "eldercompanion_token";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  // mantenemos la API del hook por si en el futuro quieres rellenar user
  const [user] = useState<User | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const ok = !!token && token.split(".").length === 3;
      setIsAuthenticated(ok);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isAuthenticated, isLoading, user };
}
