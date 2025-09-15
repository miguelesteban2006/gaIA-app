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
import { Bot } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando GaIA...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* IMPORTANTE: esta ruta va antes para no quedar eclipsada por "/" */}
      <Route path="/elderly-users/:id" component={ElderlyUserProfile} />

      {/* En "/" decidimos qué mostrar según auth en tiempo real */}
      <Route path="/">
        {isAuthenticated ? <Home /> : <Landing />}
      </Route>

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
