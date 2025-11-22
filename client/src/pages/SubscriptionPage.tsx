import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Users, Zap, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Subscription {
  plan: string;
  status: string;
  searchesUsed: number;
  searchesLimit: number;
  resetDate: string;
  teamMembers?: number;
}

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();

  // Mock data - en producción esto vendría de la API
  const subscription: Subscription = {
    plan: "free",
    status: "active",
    searchesUsed: 1,
    searchesLimit: 3,
    resetDate: "2025-12-01",
    teamMembers: 1,
  };

  const planNames: Record<string, string> = {
    free: "Gratuito",
    premium: "Premium",
    plus: "Plus",
    pro: "Pro",
  };

  const planPrices: Record<string, string> = {
    free: "$0/mes",
    premium: "$5.99/mes",
    plus: "$9.99/mes",
    pro: "$19.99/mes",
  };

  const searchPercentage = (subscription.searchesUsed / subscription.searchesLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mi Suscripción</h1>
            <p className="text-muted-foreground">
              Administra tu plan y uso de búsquedas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Plan Actual</h3>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {planNames[subscription.plan]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {planPrices[subscription.plan]}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/pricing")}
                data-testid="button-change-plan"
              >
                Cambiar Plan
              </Button>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Uso de Búsquedas</h3>
                <Badge variant="secondary">
                  {subscription.searchesUsed}/{subscription.searchesLimit === -1 ? "∞" : subscription.searchesLimit}
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={searchPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {subscription.searchesLimit === -1
                    ? "Búsquedas ilimitadas"
                    : `${subscription.searchesLimit - subscription.searchesUsed} búsquedas restantes`}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Se reinicia el {subscription.resetDate}</span>
              </div>
            </Card>
          </div>

          {subscription.plan === "pro" && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Equipo</h3>
                <Badge variant="secondary">
                  {subscription.teamMembers}/3 usuarios
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Gestión de Equipo</p>
                  <p className="text-sm text-muted-foreground">
                    Invita hasta 3 usuarios a tu cuenta
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                data-testid="button-manage-team"
              >
                Administrar Equipo
              </Button>
            </Card>
          )}

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Beneficios de tu Plan</h3>
            
            <ul className="space-y-3">
              {subscription.plan === "free" && (
                <>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>3 búsquedas mensuales</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Acceso a diagramas básicos</span>
                  </li>
                </>
              )}

              {subscription.plan === "premium" && (
                <>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>30 búsquedas mensuales</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Acceso completo a diagramas</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Soporte prioritario</span>
                  </li>
                </>
              )}

              {(subscription.plan === "plus" || subscription.plan === "pro") && (
                <>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Búsquedas ilimitadas</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Acceso completo a diagramas</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-secondary mt-0.5" />
                    <span>Soporte dedicado 24/7</span>
                  </li>
                  {subscription.plan === "pro" && (
                    <li className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-secondary mt-0.5" />
                      <span>Hasta 3 usuarios por cuenta</span>
                    </li>
                  )}
                </>
              )}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
