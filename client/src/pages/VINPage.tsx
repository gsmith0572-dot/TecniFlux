import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import VINInput from "@/components/VINInput";
import VINDecodeResult, { VINInfo } from "@/components/VINDecodeResult";
import DiagramCard, { DiagramData } from "@/components/DiagramCard";
import PDFViewer from "@/components/PDFViewer";
import CameraScanner from "@/components/CameraScanner";
import GeminiSearchResults from "@/components/GeminiSearchResults";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GeminiSearchResult {
  summary: string;
  resources: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
  }>;
  searchQueries: string[];
}

export default function VINPage() {
  const [, setLocation] = useLocation();
  const [vinInfo, setVinInfo] = useState<VINInfo | null>(null);
  const [matchingDiagrams, setMatchingDiagrams] = useState<DiagramData[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramData | null>(null);
  const [scannerMode, setScannerMode] = useState<"barcode" | "ocr" | null>(null);
  const [geminiResults, setGeminiResults] = useState<GeminiSearchResult | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

  const handleVINSubmit = async (vin: string) => {
    console.log("Decoding VIN:", vin);
    
    const mockVINInfo: VINInfo = {
      vin: vin,
      make: "Ford",
      model: "F-150",
      year: "2023",
      bodyClass: "Pickup Truck",
      engineType: "3.5L V6 EcoBoost",
    };
    
    const mockDiagrams: DiagramData[] = [
      {
        id: "1",
        fileName: "2023_Ford_F150_Electrical_System.pdf",
        make: "Ford",
        model: "F-150",
        year: "2023",
        system: "Electrical",
        fileUrl: "https://drive.google.com/file/d/example1/view",
      },
      {
        id: "2",
        fileName: "2023_Ford_F150_Engine_Diagram.pdf",
        make: "Ford",
        model: "F-150",
        year: "2023",
        system: "Engine",
        fileUrl: "https://drive.google.com/file/d/example2/view",
      },
    ];
    
    setVinInfo(mockVINInfo);
    setMatchingDiagrams(mockDiagrams);

    // Buscar información adicional del VIN con Gemini
    setIsLoadingGemini(true);
    setGeminiResults(null);

    try {
      const response = await fetch("/api/search/vin", {
        method: "POST",
        body: JSON.stringify({ vin }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error en la búsqueda VIN");
      }

      const data = await response.json() as GeminiSearchResult;
      setGeminiResults(data);
      console.log("Gemini VIN search results:", response);
    } catch (error) {
      console.error("Error en búsqueda VIN con Gemini:", error);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const handleScanDetected = (vin: string) => {
    setScannerMode(null);
    handleVINSubmit(vin);
  };

  if (selectedDiagram) {
    return <PDFViewer diagram={selectedDiagram} onClose={() => setSelectedDiagram(null)} />;
  }

  if (scannerMode) {
    return (
      <CameraScanner
        mode={scannerMode}
        onClose={() => setScannerMode(null)}
        onDetected={handleScanDetected}
      />
    );
  }

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

        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Búsqueda y Decodificación VIN</h1>
            <p className="text-muted-foreground">
              Ingresa, escanea o fotografía un VIN para decodificar información del vehículo y encontrar diagramas
            </p>
          </div>

          <VINInput
            onSubmit={handleVINSubmit}
            onScanBarcode={() => setScannerMode("barcode")}
            onScanPhoto={() => setScannerMode("ocr")}
          />

          {vinInfo && (
            <div className="space-y-6">
              <VINDecodeResult vinInfo={vinInfo} />
              
              {matchingDiagrams.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Diagramas Coincidentes</h2>
                    <p className="text-sm text-muted-foreground" data-testid="text-matching-count">
                      {matchingDiagrams.length} diagrama{matchingDiagrams.length !== 1 ? "s" : ""} encontrado{matchingDiagrams.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {matchingDiagrams.map((diagram) => (
                      <DiagramCard
                        key={diagram.id}
                        diagram={diagram}
                        onView={setSelectedDiagram}
                      />
                    ))}
                  </div>
                </div>
              )}

              {matchingDiagrams.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No se encontraron diagramas para este vehículo. Intenta buscar manualmente.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setLocation("/search")}
                    data-testid="button-manual-search"
                  >
                    Ir a Búsqueda Manual
                  </Button>
                </Card>
              )}

              {isLoadingGemini && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Buscando información adicional del VIN en internet...
                  </span>
                </div>
              )}

              {geminiResults && !isLoadingGemini && (
                <GeminiSearchResults results={geminiResults} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
