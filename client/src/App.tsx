import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { NetworkStatus } from "@/components/NetworkStatus";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ElderlyUserProfile from "@/pages/ElderlyUserProfile";

function Router() {
  // Si tu hook usa navegación, déjalo igual; no hace falta react-router-dom aquí
  const { isAuthenticated, isLoading } = useAuth();

  // Puedes usar isLoading / isAuthenticated para gates si quieres
  return (
    <Switch>
      {/* Pública */}
      <Route path="/" component={Landing} />

      {/* Privadas (si quieres protegerlas, mete un guard aquí o dentro del componente) */}
      <Route path="/home" component={Home} />
      <Route path="/elderly" component={ElderlyUserProfile} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
          <NetworkStatus />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
