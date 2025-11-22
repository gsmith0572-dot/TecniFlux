import QuickActionCard from '../QuickActionCard';
import { Search, ScanBarcode, Camera, FileText } from 'lucide-react';

export default function QuickActionCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-4xl">
      <QuickActionCard
        icon={Search}
        title="Manual Search"
        description="Search diagrams by make, model, year, and system"
        onClick={() => console.log('Manual search clicked')}
        testId="card-manual-search"
      />
      <QuickActionCard
        icon={ScanBarcode}
        title="VIN Search"
        description="Enter or scan VIN to find matching diagrams"
        onClick={() => console.log('VIN search clicked')}
        testId="card-vin-search"
      />
      <QuickActionCard
        icon={Camera}
        title="Scan VIN Label"
        description="Use camera to scan VIN barcode"
        onClick={() => console.log('Scan clicked')}
        testId="card-scan"
      />
      <QuickActionCard
        icon={FileText}
        title="Recent Diagrams"
        description="View your recently accessed diagrams"
        onClick={() => console.log('Recent clicked')}
        testId="card-recent"
      />
    </div>
  );
}
