// Stripe Checkout - Redirects to Stripe-hosted checkout page
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get plan from URL params
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan') || 'premium';

  useEffect(() => {
    let isMounted = true;
    
    // Create checkout session
    const createSession = async () => {
      try {
        const res = await fetch("/api/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        });

        if (!res.ok) {
          throw new Error("Error al crear suscripción");
        }

        const data = await res.json();
        
        if (!isMounted) return;

        if (data.url) {
          setCheckoutUrl(data.url);
          setLoading(false);
        } else {
          throw new Error("No se recibió URL de checkout");
        }
      } catch (error) {
        console.error("Error:", error);
        if (!isMounted) return;
        
        toast({
          title: "Error",
          description: "No se pudo iniciar el proceso de pago. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        setLoading(false);
        setTimeout(() => setLocation("/pricing"), 2000);
      }
    };

    createSession();

    return () => {
      isMounted = false;
    };
  }, [planId, toast, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="p-8 space-y-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Preparando pago...</h2>
              <p className="text-sm text-muted-foreground">
                Creando sesión de pago segura
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Proceso de Pago</h2>
            <p className="text-muted-foreground">
              Redirigiendo a Stripe para completar tu suscripción
            </p>
          </div>

          {checkoutUrl && (
            <>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Link de pago seguro de Stripe:</p>
                  <div className="bg-background p-3 rounded border break-all text-xs font-mono">
                    {checkoutUrl}
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutUrl);
                      toast({
                        title: "¡Copiado!",
                        description: "El link ha sido copiado al portapapeles",
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid="button-copy-url"
                  >
                    Copiar Link
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      window.open(checkoutUrl, '_blank');
                    }}
                    className="w-full"
                    size="lg"
                    data-testid="button-open-stripe-new-tab"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Abrir en Nueva Pestaña
                  </Button>
                  
                  <Button
                    onClick={() => {
                      window.location.href = checkoutUrl;
                    }}
                    variant="outline"
                    className="w-full"
                    size="lg"
                    data-testid="button-open-stripe"
                  >
                    Abrir en Esta Pestaña
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>🔒 Pago procesado de forma segura por Stripe</p>
                  <p>Después de completar el pago, serás redirigido de vuelta a TecniFlux</p>
                </div>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => setLocation("/pricing")}
            className="w-full"
            data-testid="button-cancel-redirect"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Precios
          </Button>
        </Card>
      </div>
    </div>
  );
}
