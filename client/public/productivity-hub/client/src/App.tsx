import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useDayChange } from "@/hooks/use-day-change";
import Welcome from "@/pages/welcome";
import VerifyEmail from "@/pages/verify-email";
import Dashboard from "@/pages/dashboard";
import Today from "@/pages/today";
import SuggestionsPage from "@/pages/suggestions";
import Analytics from "@/pages/analytics";
import Goals from "@/pages/goals";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import QuickAddDialog from "@/components/quick-add-dialog";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useDayChange();
  
  console.log('🔐 Auth Debug:', { isAuthenticated, isLoading, user, token: !!localStorage.getItem('auth_token') });

  return (
    <>
      <Switch>
        <Route path="/verify-email" component={VerifyEmail} />
        
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Welcome} />
        ) : (
          <>
            <Route path="/" component={Today} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/suggestions" component={SuggestionsPage} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/goals" component={Goals} />
            <Route path="/admin" component={Admin} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <QuickAddDialog />}
    </>
  );
}

function App() {
  useEffect(() => {
    const onError = () => {
      try {
        const current = Number(sessionStorage.getItem("sessionCrashCount") || "0");
        sessionStorage.setItem("sessionCrashCount", String(current + 1));
      } catch {
        // no-op
      }
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="productivity-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
