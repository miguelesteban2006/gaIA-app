// Componente indicador de estado de red para PWA móvil
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Server } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline, isServerReachable, isFullyConnected } = useNetworkStatus();

  if (isFullyConnected) {
    return null; // No mostrar nada cuando todo funciona
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert 
        variant={!isOnline ? "destructive" : "default"}
        className="mx-auto max-w-md shadow-lg"
      >
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="h-4 w-4" />
          ) : !isServerReachable ? (
            <Server className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          <AlertDescription className="text-sm">
            {!isOnline 
              ? "Sin conexión a internet. Mostrando datos guardados."
              : !isServerReachable 
              ? "Servidor no disponible. Funcionalidad limitada."
              : "Conectando..."
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}