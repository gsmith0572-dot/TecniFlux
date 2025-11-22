import { type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RequireAuth({ children, requireAdmin = false }: RequireAuthProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-auth">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
