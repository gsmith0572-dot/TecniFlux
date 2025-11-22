import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CircuitBackground } from "@/components/CircuitBackground";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <CircuitBackground />
      <Navigation />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Personaliza tu experiencia en TecniFlux
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Modo Oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Actualmente en modo oscuro por defecto
                  </p>
                </div>
                <Switch id="theme" disabled checked data-testid="switch-theme" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo recibes notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones importantes por correo
                  </p>
                </div>
                <Switch id="email-notifications" disabled data-testid="switch-email" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="search-notifications">Alertas de Búsqueda</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones cuando se agreguen nuevos diagramas
                  </p>
                </div>
                <Switch id="search-notifications" disabled data-testid="switch-search" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Búsqueda</CardTitle>
              <CardDescription>
                Configura cómo funcionan las búsquedas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-search">Búsqueda Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Buscar automáticamente al escribir
                  </p>
                </div>
                <Switch id="auto-search" disabled data-testid="switch-auto-search" />
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            Las opciones de configuración estarán disponibles próximamente
          </p>
        </div>
      </div>
    </div>
  );
}
