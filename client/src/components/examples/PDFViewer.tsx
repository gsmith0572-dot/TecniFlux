import { useState } from 'react';
import PDFViewer from '../PDFViewer';
import { Button } from '@/components/ui/button';

export default function PDFViewerExample() {
  const [showViewer, setShowViewer] = useState(false);

  const mockDiagram = {
    id: "1",
    fileName: "2023_Ford_F150_Electrical_System.pdf",
    make: "Ford",
    model: "F-150",
    year: "2023",
    system: "Electrical",
    fileUrl: "https://drive.google.com/file/d/example123/view",
  };

  if (showViewer) {
    return <PDFViewer diagram={mockDiagram} onClose={() => setShowViewer(false)} />;
  }

  return (
    <div className="p-4">
      <Button onClick={() => setShowViewer(true)}>Open PDF Viewer</Button>
    </div>
  );
}
