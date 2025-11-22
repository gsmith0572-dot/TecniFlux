import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { CircuitBackground } from "@/components/CircuitBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Zap, Star, Users } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  searches: number | string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  users?: number;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
    interval: "gratis",
    searches: 3,
    icon: <Check className="w-5 h-5" />,
    features: [
      "3 búsquedas por mes",
      "Acceso a diagramas básicos",
      "Búsqueda manual y por VIN",
      "Recursos web con Gemini AI",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 5.99,
    interval: "mes",
    searches: 30,
    icon: <Zap className="w-5 h-5" />,
    features: [
      "30 búsquedas mensuales",
      "Acceso completo a diagramas",
      "Búsqueda avanzada",
      "Recursos web con Gemini AI",
      "Soporte prioritario",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 9.99,
    interval: "mes",
    searches: "Ilimitadas",
    icon: <Star className="w-5 h-5" />,
    popular: true,
    features: [
      "Búsquedas ilimitadas",
      "Acceso completo a diagramas",
      "Búsqueda avanzada",
      "Recursos web con Gemini AI",
      "Soporte prioritario",
      "Historial de búsquedas",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    interval: "mes",
    searches: "Ilimitadas",
    users: 3,
    icon: <Users className="w-5 h-5" />,
    features: [
      "Búsquedas ilimitadas",
      "3 usuarios por cuenta",
      "Ideal para talleres mecánicos",
      "Acceso completo a diagramas",
      "Búsqueda avanzada",
      "Recursos web con Gemini AI",
      "Soporte dedicado 24/7",
      "Gestión de equipo",
    ],
  },
];

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setIsSubscribing(planId);
    try {
      if (planId === "free") {
        // Plan gratuito, simplemente redirigir
        setLocation("/");
      } else {
        // Redirigir a checkout de Stripe
        setLocation(`/checkout?plan=${planId}`);
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      setIsSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <CircuitBackground />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Planes y Precios</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan perfecto para tus necesidades. Todos los planes incluyen acceso a nuestra base de datos de diagramas automotrices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 relative flex flex-col ${
                plan.popular ? "border-secondary shadow-lg shadow-secondary/20" : ""
              }`}
            >
              {plan.popular && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Más Popular
                </Badge>
              )}

              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.users && (
                      <p className="text-xs text-muted-foreground">
                        Hasta {plan.users} usuarios
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  <p className="text-sm font-semibold text-secondary">
                    {typeof plan.searches === "number"
                      ? `${plan.searches} búsquedas`
                      : `${plan.searches} búsquedas`}
                  </p>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-auto"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  isLoading={isSubscribing === plan.id}
                  loadingText={plan.price === 0 ? "Redirigiendo…" : "Procesando pago…"}
                  disabled={isSubscribing !== null}
                  data-testid={`button-select-${plan.id}`}
                >
                  {plan.price === 0 ? "Comenzar Gratis" : "Suscribirse"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">¿Preguntas Frecuentes?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">¿Puedo cambiar de plan?</h3>
              <p className="text-sm text-muted-foreground">
                Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de control.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">¿Cómo funcionan las búsquedas?</h3>
              <p className="text-sm text-muted-foreground">
                Cada búsqueda cuenta cuando consultas un diagrama. Las búsquedas mensuales se reinician el primer día de cada mes.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">¿Qué incluye el plan Pro?</h3>
              <p className="text-sm text-muted-foreground">
                El plan Pro permite agregar hasta 3 usuarios bajo la misma cuenta, perfecto para talleres mecánicos.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">¿Hay período de prueba?</h3>
              <p className="text-sm text-muted-foreground">
                El plan gratuito te permite probar el servicio con 3 búsquedas mensuales sin necesidad de tarjeta de crédito.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
