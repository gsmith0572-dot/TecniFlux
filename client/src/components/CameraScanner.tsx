import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";

interface CameraScannerProps {
  mode: "barcode" | "ocr";
  onClose: () => void;
  onDetected: (value: string) => void;
}

export default function CameraScanner({ mode, onClose, onDetected }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    console.log(`Starting ${mode} scan...`);
    
    setTimeout(() => {
      const mockVIN = "1FTFW1E84MKE12345";
      console.log("Detected VIN:", mockVIN);
      onDetected(mockVIN);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {mode === "barcode" ? "Escanear Código de Barras VIN" : "Capturar Etiqueta VIN"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-scanner">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl aspect-video relative overflow-hidden bg-black/50">
            <div className="absolute inset-0 flex items-center justify-center">
              {!isScanning ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mode === "barcode" 
                      ? "Posiciona el código de barras dentro del marco" 
                      : "Posiciona la etiqueta VIN claramente en la vista"}
                  </p>
                  <Button onClick={handleStartScan} data-testid="button-start-scan">
                    Iniciar Escaneo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-64 h-48 border-2 border-primary rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-secondary animate-pulse shadow-lg shadow-secondary/50" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-center text-primary font-medium animate-pulse">
                    Escaneando...
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            {mode === "barcode" 
              ? "Soporta formatos de código de barras PDF417 y Code 39" 
              : "Usa tecnología OCR para extraer el VIN de la foto"}
          </p>
        </div>
      </div>
    </div>
  );
}
