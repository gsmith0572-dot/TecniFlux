import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { CircuitBackground, LightningAccent } from "@/components/CircuitBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode, Database, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background relative">
      <CircuitBackground />
      <div className="relative z-10">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            <div className="text-center space-y-6">
              <div className="inline-block relative">
                <div className="absolute -top-4 -right-8">
                  <LightningAccent className="w-12 h-12 text-secondary opacity-50" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  TecniFlux
                </h1>
                <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full mt-2 shadow-[0_0_10px_rgba(24,224,255,0.5)]" />
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Plataforma profesional de búsqueda de diagramas eléctricos y decodificación VIN para técnicos automotrices
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setLocation("/signup")}
                  className="shadow-[0_0_15px_rgba(46,139,255,0.3)]"
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/login")}
                >
                  Iniciar Sesión
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Búsqueda Avanzada</h3>
                <p className="text-sm text-muted-foreground">
                  Busca diagramas eléctricos por marca, modelo, año y sistema
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <ScanBarcode className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Decodificación VIN</h3>
                <p className="text-sm text-muted-foreground">
                  Decodifica códigos VIN y encuentra diagramas relacionados automáticamente
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">30,000+ Diagramas</h3>
                <p className="text-sm text-muted-foreground">
                  Accede a una base de datos extensa de diagramas eléctricos automotrices
                </p>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-br from-card via-card to-accent/10 border-primary/20 shadow-[0_0_20px_rgba(46,139,255,0.1)]">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">¿Listo para comenzar?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Únete a miles de técnicos automotrices que ya confían en TecniFlux para encontrar los diagramas que necesitan
                </p>
                <Button
                  size="lg"
                  onClick={() => setLocation("/signup")}
                  className="shadow-[0_0_15px_rgba(46,139,255,0.3)]"
                >
                  Crear Cuenta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

