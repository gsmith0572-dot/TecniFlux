import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Home } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      // No session ID, redirect to home
      setTimeout(() => setLocation('/'), 2000);
      return;
    }

    // Verify the session was successful
    fetch(`/api/verify-checkout?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error verifying session:', error);
        setLoading(false);
      });
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 space-y-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando tu suscripción...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card className="p-8 space-y-6 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">¡Suscripción Exitosa!</h1>
            <p className="text-muted-foreground">
              Tu pago ha sido procesado correctamente y tu suscripción está ahora activa.
            </p>
          </div>

          {session && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium capitalize">{session.plan || 'Premium'}</span>
              </div>
              {session.customer_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{session.customer_email}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ya puedes comenzar a usar todas las funcionalidades de tu plan.
            </p>
            
            <Button
              onClick={() => setLocation('/')}
              className="w-full"
              data-testid="button-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
