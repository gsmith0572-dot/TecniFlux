import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { debugLog } from '@/utils/debugLog';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'tecnico';
  subscriptionPlan?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      setUser(userData);

      debugLog("AUTH", `User logged in: ${userData.email || userData.username}`, {
        userId: userData.id,
        role: userData.role,
      });

      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${userData.username}`,
      });
    } catch (error) {
      debugLog("ERROR", `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        username,
      });
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Error al iniciar sesión",
        variant: "destructive",
      });
      throw error;
    }
  }

  async function register(username: string, email: string, password: string) {
    try {
      const response = await apiRequest('POST', '/api/auth/register', { username, email, password });
      const userData = await response.json();
      setUser(userData);

      toast({
        title: "¡Cuenta creada!",
        description: `Bienvenido a TecniFlux, ${userData.username}`,
      });
    } catch (error) {
      toast({
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Error al crear cuenta",
        variant: "destructive",
      });
      throw error;
    }
  }

  async function logout() {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      queryClient.clear(); // Clear all cached data

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });

      // Redirect to login page after successful logout
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  }

  async function refreshUser() {
    await checkAuth();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
