import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X } from "lucide-react";

export interface DiagramMetadata {
  id: string;
  fileName: string;
  make: string;
  model: string;
  year: string;
  system: string;
}

interface AdminDataTableProps {
  data: DiagramMetadata[];
  onUpdate: (id: string, updates: Partial<DiagramMetadata>) => void;
}

export default function AdminDataTable({ data, onUpdate }: AdminDataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<DiagramMetadata>>({});

  const handleEdit = (item: DiagramMetadata) => {
    setEditingId(item.id);
    setEditValues(item);
  };

  const handleSave = () => {
    if (editingId) {
      console.log("Saving updates:", editValues);
      onUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del Archivo</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Sistema</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const isEditing = editingId === item.id;
            
            return (
              <TableRow key={item.id} data-testid={`row-diagram-${item.id}`}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input
                      value={editValues.fileName || ""}
                      onChange={(e) => setEditValues({ ...editValues, fileName: e.target.value })}
                      className="h-8 text-xs"
                      data-testid={`input-edit-filename-${item.id}`}
                    />
                  ) : (
                    <span className="text-xs">{item.fileName}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editValues.make || ""}
                      onChange={(e) => setEditValues({ ...editValues, make: e.target.value })}
                      className="h-8 text-xs"
                      data-testid={`input-edit-make-${item.id}`}
                    />
                  ) : (
                    item.make
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editValues.model || ""}
                      onChange={(e) => setEditValues({ ...editValues, model: e.target.value })}
                      className="h-8 text-xs"
                      data-testid={`input-edit-model-${item.id}`}
                    />
                  ) : (
                    item.model
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editValues.year || ""}
                      onChange={(e) => setEditValues({ ...editValues, year: e.target.value })}
                      className="h-8 text-xs"
                      data-testid={`input-edit-year-${item.id}`}
                    />
                  ) : (
                    item.year
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editValues.system || ""}
                      onChange={(e) => setEditValues({ ...editValues, system: e.target.value })}
                      className="h-8 text-xs"
                      data-testid={`input-edit-system-${item.id}`}
                    />
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {item.system}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={handleSave}
                        data-testid={`button-save-${item.id}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={handleCancel}
                        data-testid={`button-cancel-${item.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
