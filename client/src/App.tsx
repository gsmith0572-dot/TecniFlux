import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import DebugPanel from "@/components/DebugPanel";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import SearchPage from "@/pages/SearchPage";
import VINPage from "@/pages/VINPage";
import AdminRoutes from "@/pages/admin/AdminRoutes";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ForgotUsernamePage from "@/pages/ForgotUsernamePage";
import PricingPage from "@/pages/PricingPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";

// Component to handle root route based on authentication
function RootRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardPage /> : <LandingPage />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/forgot-username" component={ForgotUsernamePage} />
      <Route path="/" component={RootRoute} />
      <Route path="/pricing" component={PricingPage} />
      
      {/* Protected routes - require authentication */}
      <Route path="/search">
        <RequireAuth>
          <SearchPage />
        </RequireAuth>
      </Route>
      <Route path="/vin">
        <RequireAuth>
          <VINPage />
        </RequireAuth>
      </Route>
      <Route path="/scan-vin">
        <RequireAuth>
          <VINPage />
        </RequireAuth>
      </Route>
      <Route path="/checkout">
        <RequireAuth>
          <CheckoutPage />
        </RequireAuth>
      </Route>
      <Route path="/subscription">
        <RequireAuth>
          <SubscriptionPage />
        </RequireAuth>
      </Route>
      <Route path="/subscription-success">
        <RequireAuth>
          <SubscriptionSuccessPage />
        </RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <SettingsPage />
        </RequireAuth>
      </Route>
      
      {/* Admin routes - require authentication and admin role */}
      <Route path="/admin">
        <RequireAuth requireAdmin>
          <AdminRoutes />
        </RequireAuth>
      </Route>
      <Route path="/admin/:rest*">
        <RequireAuth requireAdmin>
          <AdminRoutes />
        </RequireAuth>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <DebugPanel />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
