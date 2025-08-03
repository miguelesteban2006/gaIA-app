import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar conectividad al servidor
    const checkServerConnection = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
          setShowOfflineAlert(true);
        }
      } catch {
        setShowOfflineAlert(true);
      }
    };

    if (isOnline) {
      checkServerConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        {!isOnline ? 'Sin conexión a internet' : 'Sin conexión al servidor'}
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 mb-3">
        {!isOnline 
          ? 'Verifica tu conexión a internet para usar todas las funciones de GaIA.'
          : 'Para usar la aplicación instalada de forma independiente, debe estar desplegada en producción.'
        }
      </AlertDescription>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200"
        >
          <Wifi className="h-3 w-3 mr-1" />
          Reintentar
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowOfflineAlert(false)}
          className="text-orange-600 hover:text-orange-800 dark:text-orange-400"
        >
          Cerrar
        </Button>
      </div>
    </Alert>
  );
}