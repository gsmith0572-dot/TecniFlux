import { useCallback, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export function UploadZone({ 
  onFileSelect,
  onFileRemove, 
  accept = 'application/pdf', 
  maxSize = 10 * 1024 * 1024,
  disabled = false 
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateAndSelectFile = (file: File) => {
    setError('');
    
    if (file.size > maxSize) {
      setError(`El archivo excede el tamaño máximo de ${maxSize / 1024 / 1024}MB`);
      return;
    }

    if (accept && !file.type.match(accept)) {
      setError(`Tipo de archivo no válido. Se requiere: ${accept}`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  }, [maxSize, accept, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
    if (onFileRemove) {
      onFileRemove();
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="upload-zone"
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleChange}
            accept={accept}
            disabled={disabled}
            data-testid="input-file"
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-2">
            Arrastra un archivo aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground">
            {accept === 'application/pdf' ? 'PDF' : accept} hasta {maxSize / 1024 / 1024}MB
          </p>
        </div>
      ) : (
        <div 
          className="flex items-center justify-between p-4 border rounded-lg"
          data-testid="file-selected"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium" data-testid="text-filename">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={disabled}
            data-testid="button-remove-file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive mt-2" data-testid="text-error">{error}</p>
      )}
    </div>
  );
}
