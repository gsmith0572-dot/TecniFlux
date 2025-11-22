import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export interface VINInfo {
  vin: string;
  make: string;
  model: string;
  year: string;
  bodyClass?: string;
  engineType?: string;
}

interface VINDecodeResultProps {
  vinInfo: VINInfo;
}

export default function VINDecodeResult({ vinInfo }: VINDecodeResultProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">VIN Decodificado Exitosamente</h3>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Número VIN</p>
          <p className="font-mono text-lg font-semibold tracking-wider" data-testid="text-decoded-vin">
            {vinInfo.vin}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Marca</p>
            <p className="font-medium" data-testid="text-decoded-make">{vinInfo.make}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Modelo</p>
            <p className="font-medium" data-testid="text-decoded-model">{vinInfo.model}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Año</p>
            <p className="font-medium" data-testid="text-decoded-year">{vinInfo.year}</p>
          </div>
          {vinInfo.bodyClass && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tipo de Carrocería</p>
              <p className="font-medium" data-testid="text-decoded-bodyclass">{vinInfo.bodyClass}</p>
            </div>
          )}
          {vinInfo.engineType && (
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Tipo de Motor</p>
              <p className="font-medium" data-testid="text-decoded-engine">{vinInfo.engineType}</p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Badge className="text-xs">
            Verificado NHTSA
          </Badge>
        </div>
      </div>
    </Card>
  );
}
