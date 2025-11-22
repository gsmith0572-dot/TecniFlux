import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { CircuitBackground } from "@/components/CircuitBackground";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import logoImage from "@assets/tecniflux-logo.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      setLocation("/");
    } catch (error) {
      // Error is already handled by AuthContext toast
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <CircuitBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.06),transparent_50%)]" />
      
      <Card className="w-full max-w-md p-8 relative border-primary/20 shadow-[0_0_30px_rgba(46,139,255,0.1)]">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logoImage} alt="TecniFlux" className="h-24 w-auto" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Bienvenido de Nuevo</h1>
              <p className="text-sm text-muted-foreground">
                Inicia sesión para acceder a diagramas eléctricos automotrices
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading}
              loadingText="Iniciando sesión…"
              data-testid="button-login"
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="relative py-4">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                ¿Nuevo en TecniFlux?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/signup")}
            disabled={isLoading}
            data-testid="button-signup-link"
          >
            Crear una Cuenta
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            ¿Olvidaste tu usuario?{" "}
            <Link href="/forgot-username" className="text-primary hover:underline" data-testid="link-forgot-username">
              Recuperar usuario
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Confiado por más de 1000 técnicos automotrices
          </p>
        </div>
      </Card>
    </div>
  );
}
