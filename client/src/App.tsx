import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NetworkStatus } from "@/components/NetworkStatus";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ElderlyUserProfile from "@/pages/ElderlyUserProfile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Pública */}
      <Route path="/" component={Landing} />

      {/* Internas: el panel principal está en /home */}
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
