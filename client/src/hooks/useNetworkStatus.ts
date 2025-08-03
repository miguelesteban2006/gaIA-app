// Hook para monitorear estado de red en PWA móvil
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verificar conectividad con servidor
      checkServerConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
    };

    const checkServerConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          cache: 'no-cache'
        });
        setIsServerReachable(response.ok);
      } catch {
        setIsServerReachable(false);
      }
    };

    // Verificar conexión inicial
    if (isOnline) {
      checkServerConnection();
    }

    // Verificación periódica cuando está online
    const interval = isOnline ? setInterval(checkServerConnection, 30000) : null;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [isOnline]);

  return {
    isOnline,
    isServerReachable,
    isFullyConnected: isOnline && isServerReachable
  };
}