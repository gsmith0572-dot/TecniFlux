import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import QuickActionCard from "@/components/QuickActionCard";
import { CircuitBackground, LightningAccent } from "@/components/CircuitBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode, Camera, FileText, Database, CreditCard } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background relative">
      <CircuitBackground />
      <div className="relative z-10">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-block relative">
              <div className="absolute -top-4 -right-8">
                <LightningAccent className="w-12 h-12 text-secondary opacity-50" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                TecniFlux
              </h1>
              <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full mt-2 shadow-[0_0_10px_rgba(24,224,255,0.5)]" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plataforma profesional de búsqueda de diagramas eléctricos y decodificación VIN para técnicos automotrices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActionCard
              icon={Search}
              title="Búsqueda Manual"
              description="Busca diagramas por marca, modelo, año y filtros de sistema"
              onClick={() => setLocation("/search")}
              testId="card-manual-search"
            />
            <QuickActionCard
              icon={ScanBarcode}
              title="Búsqueda por VIN"
              description="Ingresa VIN manualmente o escanea para encontrar diagramas"
              onClick={() => setLocation("/vin")}
              testId="card-vin-search"
            />
            <QuickActionCard
              icon={Camera}
              title="Escanear Código VIN"
              description="Usa la cámara para escanear código de barras VIN (PDF417, Code 39)"
              onClick={() => setLocation("/scan-vin")}
              testId="card-scan-barcode"
            />
            <QuickActionCard
              icon={FileText}
              title="Diagramas Recientes"
              description="Acceso rápido a tus diagramas vistos recientemente"
              onClick={() => console.log("Recent diagrams")}
              testId="card-recent"
            />
          </div>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-secondary/30 shadow-[0_0_20px_rgba(24,224,255,0.1)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl font-bold">¿Necesitas más búsquedas?</h3>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu plan para obtener búsquedas ilimitadas y acceso completo
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setLocation("/pricing")}
                data-testid="button-view-plans"
                className="flex-shrink-0 shadow-[0_0_15px_rgba(46,139,255,0.3)]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Ver Planes
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-card via-card to-accent/10 border-primary/20 shadow-[0_0_20px_rgba(46,139,255,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">30,000+</p>
                <p className="text-sm text-muted-foreground">Diagramas Eléctricos</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <Search className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-3xl font-bold text-secondary">Instantáneos</p>
                <p className="text-sm text-muted-foreground">Resultados de Búsqueda</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <ScanBarcode className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">Decodifica VIN</p>
                <p className="text-sm text-muted-foreground">Verificado NHTSA</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
      </div>
    </div>
  );
}
