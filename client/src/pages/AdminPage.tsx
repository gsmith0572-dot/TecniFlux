import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import AdminDataTable, { DiagramMetadata } from "@/components/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [data, setData] = useState<DiagramMetadata[]>([
    {
      id: "1",
      fileName: "2023_Ford_F150_Electrical.pdf",
      make: "Ford",
      model: "F-150",
      year: "2023",
      system: "Electrical",
    },
    {
      id: "2",
      fileName: "2022_Toyota_Camry_Engine.pdf",
      make: "Toyota",
      model: "Camry",
      year: "2022",
      system: "Engine",
    },
    {
      id: "3",
      fileName: "2021_Honda_Accord_HVAC.pdf",
      make: "Honda",
      model: "Accord",
      year: "2021",
      system: "HVAC",
    },
    {
      id: "4",
      fileName: "2023_Chevrolet_Silverado_Transmission.pdf",
      make: "Chevrolet",
      model: "Silverado",
      year: "2023",
      system: "Transmission",
    },
  ]);

  const handleRefresh = () => {
    console.log("Refreshing data from Google Sheets...");
    setIsRefreshing(true);
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Datos Actualizados",
        description: "Sincronizado exitosamente con Google Sheets",
      });
    }, 1500);
  };

  const handleUpdate = (id: string, updates: Partial<DiagramMetadata>) => {
    console.log("Updating diagram metadata:", id, updates);
    setData(data.map(item => item.id === id ? { ...item, ...updates } : item));
    
    toast({
      title: "Metadatos Actualizados",
      description: "Cambios guardados exitosamente",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground">
                Gestiona metadatos de diagramas y sincroniza con Google Sheets
              </p>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar desde Sheets
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Diagramas</p>
                  <p className="text-2xl font-bold" data-testid="text-total-diagrams">{data.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fuente de Datos</p>
                  <Badge variant="default" className="mt-1">Google Sheets</Badge>
                </div>
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Database className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Última Sincronización</p>
                  <p className="text-sm font-medium">Ahora mismo</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Metadatos de Diagramas</h2>
            <AdminDataTable data={data} onUpdate={handleUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
}
