import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Keyboard, ScanBarcode, Camera, Search } from "lucide-react";

interface VINInputProps {
  onSubmit: (vin: string) => void;
  onScanBarcode: () => void;
  onScanPhoto: () => void;
}

export default function VINInput({ onSubmit, onScanBarcode, onScanPhoto }: VINInputProps) {
  const [vin, setVin] = useState("");
  const [error, setError] = useState("");

  const validateVIN = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    setVin(cleaned);
    
    if (cleaned.length > 0 && cleaned.length !== 17) {
      setError("error");
    } else {
      setError("");
    }
    
    return cleaned.length === 17;
  };

  const handleSubmit = () => {
    if (validateVIN(vin)) {
      console.log("Submitting VIN:", vin);
      onSubmit(vin);
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual" data-testid="tab-manual">
            <Keyboard className="mr-2 h-4 w-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="barcode" data-testid="tab-barcode">
            <ScanBarcode className="mr-2 h-4 w-4" />
            Escanear
          </TabsTrigger>
          <TabsTrigger value="photo" data-testid="tab-photo">
            <Camera className="mr-2 h-4 w-4" />
            Foto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="vin">Número de Identificación Vehicular</Label>
            <Input
              id="vin"
              placeholder="Ingresa VIN de 17 caracteres"
              value={vin}
              onChange={(e) => validateVIN(e.target.value)}
              maxLength={17}
              className="font-mono text-base tracking-wider uppercase"
              data-testid="input-vin"
            />
            <div className="flex items-center justify-between text-xs">
              {error ? (
                <span className="text-destructive">El VIN debe tener exactamente 17 caracteres</span>
              ) : (
                <span className="text-muted-foreground">
                  {vin.length}/17 caracteres
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={vin.length !== 17}
            className="w-full"
            data-testid="button-decode"
          >
            <Search className="mr-2 h-4 w-4" />
            Decodificar VIN
          </Button>
        </TabsContent>

        <TabsContent value="barcode" className="mt-6">
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ScanBarcode className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Escanear Código de Barras VIN</h3>
              <p className="text-sm text-muted-foreground">
                Soporta formatos PDF417 y Code 39
              </p>
            </div>
            <Button onClick={onScanBarcode} size="lg" data-testid="button-scan-barcode">
              Abrir Cámara
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="photo" className="mt-6">
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-secondary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Capturar Etiqueta VIN</h3>
              <p className="text-sm text-muted-foreground">
                Toma una foto y extrae el VIN usando OCR
              </p>
            </div>
            <Button onClick={onScanPhoto} size="lg" variant="outline" data-testid="button-scan-photo">
              Abrir Cámara
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
