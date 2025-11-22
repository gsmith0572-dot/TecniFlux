import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Calendar, Tag } from 'lucide-react';
import type { Diagram } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface DiagramDetailDialogProps {
  diagram: Diagram;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DiagramDetailDialog({
  diagram,
  open,
  onOpenChange,
}: DiagramDetailDialogProps) {
  const { toast } = useToast();

  const handleOpenPDF = () => {
    if (!diagram.id) {
      toast({
        title: 'Error',
        description: 'No hay ID de diagrama disponible',
        variant: 'destructive',
      });
      return;
    }
    // Use secure viewer route (never expose directUrl or fileUrl to frontend)
    window.open(`/api/diagrams/${diagram.id}/view`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-diagram-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {diagram.fileName}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del diagrama
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            <Badge
              variant={diagram.status === 'complete' ? 'default' : 'secondary'}
              data-testid="badge-diagram-status"
            >
              {diagram.status === 'complete' ? 'Completo' : 'Parcial'}
            </Badge>
          </div>

          {/* Vehicle Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Marca</p>
              <p className="text-base" data-testid="text-make">
                {diagram.make || 'Desconocido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modelo</p>
              <p className="text-base" data-testid="text-model">
                {diagram.model || 'Desconocido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Año</p>
              <p className="text-base" data-testid="text-year">
                {diagram.year || 'Desconocido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sistema</p>
              <p className="text-base" data-testid="text-system">
                {diagram.system || 'Desconocido'}
              </p>
            </div>
          </div>

          {/* File Information */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID del Archivo</p>
              <p className="text-base font-mono text-xs" data-testid="text-file-id">
                {diagram.fileId}
              </p>
            </div>
          </div>

          {/* Tags */}
          {diagram.tags && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Etiquetas
              </p>
              <div className="flex flex-wrap gap-2">
                {diagram.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {diagram.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {diagram.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Creado
              </p>
              <p className="text-sm">
                {diagram.createdAt
                  ? new Date(diagram.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Desconocido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Actualizado
              </p>
              <p className="text-sm">
                {diagram.updatedAt
                  ? new Date(diagram.updatedAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Desconocido'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleOpenPDF}
              className="w-full"
              data-testid="button-open-pdf"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
