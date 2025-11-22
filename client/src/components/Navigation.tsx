import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Settings, CreditCard, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // If no user is logged in, show login/signup buttons
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" data-testid="link-home" className="hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2">
              <Logo />
            </Link>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="default"
                onClick={() => setLocation("/signup")}
                data-testid="button-signup"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const userName = user.username;
  const userRole = user.role;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home" className="hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2">
            <Logo />
          </Link>

          <div className="flex items-center gap-4">
            <Badge
              variant={userRole === "admin" ? "default" : "secondary"}
              data-testid="badge-role"
              className="hidden sm:flex"
            >
              {userRole === "admin" ? "Administrador" : "Técnico"}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole === "admin" ? "Administrador" : "Técnico"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === "admin" && (
                  <>
                    <DropdownMenuItem asChild data-testid="button-admin-panel">
                      <Link href="/admin" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Panel de Admin</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild data-testid="button-profile">
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild data-testid="button-settings">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild data-testid="button-subscription">
                  <Link href="/subscription" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Mi Suscripción</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive" 
                  data-testid="button-logout"
                  onClick={() => {
                    logout();
                    // The logout function will redirect to /login
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
