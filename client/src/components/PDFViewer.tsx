import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DiagramData } from "./DiagramCard";
import { useRecordDiagramView } from "@/hooks/useUserHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { debugLog } from "@/utils/debugLog";

interface PDFViewerProps {
  diagram: DiagramData;
  onClose: () => void;
}

export default function PDFViewer({ diagram, onClose }: PDFViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const recordView = useRecordDiagramView();
  const hasRecorded = useRef<string | null>(null);

  useEffect(() => {
    if (diagram.id && hasRecorded.current !== diagram.id && user) {
      hasRecorded.current = diagram.id;
      recordView.mutate(diagram.id, {
        onError: (error) => {
          toast({
            title: "Error al registrar visualización",
            description: error instanceof Error ? error.message : "Error desconocido",
            variant: "destructive",
          });
        },
      });
    }
  }, [diagram.id, user, recordView, toast]);

  // NEVER use directUrl - always proxy through our secure backend
  const proxyUrl = `/api/diagrams/${diagram.id}/view`;

  useEffect(() => {
    debugLog("PDF", `Opening viewer for diagram ${diagram.id}`, {
      diagramId: diagram.id,
      fileName: diagram.fileName,
      make: diagram.make,
      model: diagram.model,
      year: diagram.year,
    });
  }, [diagram.id, diagram.fileName, diagram.make, diagram.model, diagram.year]);

  useEffect(() => {
    debugLog("PDF", `Requesting PDF for diagram: ${diagram.id}`, {
      diagramId: diagram.id,
      proxyUrl,
    });
  }, [diagram.id, proxyUrl]);

  useEffect(() => {
    // Listen for postMessage from PDF viewer iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PDF_LOADED" && event.data?.diagramId === diagram.id) {
        debugLog("PDF", `PDF loaded successfully for diagram: ${diagram.id}`, {
          diagramId: diagram.id,
          timestamp: event.data.timestamp,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [diagram.id]);

  const openInNativeViewer = () => {
    // Opens PDF in new tab using our secure proxy
    debugLog("PDF", `Opening PDF in native viewer for diagram: ${diagram.id}`);
    window.open(proxyUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate" data-testid="text-viewer-title">
              {diagram.fileName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-mono">
                {diagram.make} {diagram.model} {diagram.year}
              </span>
              <Badge variant="secondary" className="text-xs">
                {diagram.system}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNativeViewer}
              data-testid="button-open-native"
              title="Abrir en visor nativo del dispositivo (mejor para archivos grandes)"
            >
              Abrir PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-viewer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/20">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 border-b">
              <p className="text-xs text-muted-foreground">
                Si el PDF no carga, usa el botón "Abrir PDF" arriba
              </p>
            </div>
            <iframe
              src={proxyUrl}
              className="flex-1 w-full border-0"
              title={diagram.fileName}
              data-testid="iframe-pdf-viewer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
