import { useEffect, useState } from "react";
import { hasValidAuth } from "@/lib/authUtils";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidAuth());
  const [isLoading] = useState(false); // no bloqueamos el arranque

  useEffect(() => {
    const onChange = () => setIsAuthenticated(hasValidAuth());
    window.addEventListener("storage", onChange);
    window.addEventListener("auth-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth-changed", onChange);
    };
  }, []);

  return { isAuthenticated, isLoading };
}
