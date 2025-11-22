import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { CircuitBackground } from "@/components/CircuitBackground";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/tecniflux-logo.png";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData.username, formData.email, formData.password);
      setLocation("/");
    } catch (error) {
      // Error is already handled by AuthContext toast
      console.error("Signup failed:", error);
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
              <h1 className="text-2xl font-bold">Crear Cuenta</h1>
              <p className="text-sm text-muted-foreground">
                Únete a TecniFlux para acceder a diagramas eléctricos profesionales
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isLoading}
                minLength={3}
                maxLength={50}
                data-testid="input-username"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 3 caracteres, máximo 50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={6}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading}
              loadingText="Creando cuenta…"
              data-testid="button-signup"
            >
              Crear Cuenta
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/login")}
              disabled={isLoading}
              data-testid="button-login-link"
            >
              ¿Ya tienes una cuenta? Inicia sesión
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </Card>
    </div>
  );
}
