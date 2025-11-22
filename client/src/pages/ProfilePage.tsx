import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { CircuitBackground } from "@/components/CircuitBackground";
import { useUserHistory } from "@/hooks/useUserHistory";
import { FileText, Clock, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: historyData, isLoading: isLoadingHistory } = useUserHistory(3);

  if (!user) return null;

  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleViewPDF = (diagramId: string) => {
    // Use secure viewer route (never expose directUrl or fileUrl to frontend)
    window.open(`/api/diagrams/${diagramId}/view`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <CircuitBackground />
      <Navigation />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administra tu información personal
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.username}</CardTitle>
                  <CardDescription className="capitalize">
                    {user.role === "admin" ? "Administrador" : "Técnico"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  data-testid="input-username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  data-testid="input-email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  value={user.role === "admin" ? "Administrador" : "Técnico"}
                  disabled
                  className="capitalize"
                  data-testid="input-role"
                />
              </div>

              <div className="pt-4">
                <Button variant="outline" disabled data-testid="button-edit-profile">
                  Editar Perfil
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  La edición de perfil estará disponible próximamente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Gestiona tu contraseña y seguridad de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled data-testid="button-change-password">
                Cambiar Contraseña
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Próximamente podrás cambiar tu contraseña desde aquí
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Diagramas
              </CardTitle>
              <CardDescription>
                Últimos 3 diagramas consultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !historyData?.history || historyData.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No has consultado ningún diagrama aún</p>
                  <p className="text-sm mt-1">
                    Los últimos 3 diagramas que veas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="history-list">
                  {historyData.history.map((entry) => {
                    const diagram = entry.diagram;
                    if (!diagram) return null;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover-elevate transition-all"
                        data-testid={`history-item-${entry.id}`}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate mb-1" data-testid={`history-filename-${entry.id}`}>
                            {diagram.fileName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                            <span className="font-mono">
                              {diagram.make || "Desconocido"}
                            </span>
                            <span>•</span>
                            <span>{diagram.model || "Desconocido"}</span>
                            <span>•</span>
                            <span>{diagram.year || "Desconocido"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {diagram.system || "Desconocido"}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.viewedAt).toLocaleDateString('es-MX', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => diagram.id && handleViewPDF(diagram.id)}
                                disabled={!diagram.id}
                                data-testid={`button-reopen-${entry.id}`}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Abrir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
