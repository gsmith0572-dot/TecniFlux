import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";

export interface DiagramData {
  id: string;
  fileName: string;
  make: string | null;
  model: string | null;
  year: string | null;
  system: string | null;
  fileUrl: string;
  fileId: string;
  directUrl: string | null;
}

interface DiagramCardProps {
  diagram: DiagramData;
  onView: (diagram: DiagramData) => void;
}

export default function DiagramCard({ diagram, onView }: DiagramCardProps) {

  return (
    <Card className="p-4 hover-elevate transition-all" data-testid={`card-diagram-${diagram.id}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm truncate" data-testid={`text-filename-${diagram.id}`}>
              {diagram.fileName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono" data-testid={`text-make-${diagram.id}`}>
                {diagram.make || "Desconocido"}
              </span>
              <span>•</span>
              <span data-testid={`text-model-${diagram.id}`}>
                {diagram.model || "Desconocido"}
              </span>
              <span>•</span>
              <span data-testid={`text-year-${diagram.id}`}>
                {diagram.year || "Desconocido"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-system-${diagram.id}`}>
              {diagram.system || "Desconocido"}
            </Badge>
            
            <Button
              size="sm"
              onClick={() => onView(diagram)}
              data-testid={`button-view-${diagram.id}`}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              Ver PDF
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
