import { useState } from 'react';
import CameraScanner from '../CameraScanner';
import { Button } from '@/components/ui/button';

export default function CameraScannerExample() {
  const [showScanner, setShowScanner] = useState(false);
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');

  if (showScanner) {
    return (
      <CameraScanner
        mode={mode}
        onClose={() => setShowScanner(false)}
        onDetected={(vin) => {
          console.log('Detected:', vin);
          setShowScanner(false);
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Button onClick={() => { setMode('barcode'); setShowScanner(true); }}>
        Open Barcode Scanner
      </Button>
      <Button onClick={() => { setMode('ocr'); setShowScanner(true); }}>
        Open OCR Scanner
      </Button>
    </div>
  );
}
