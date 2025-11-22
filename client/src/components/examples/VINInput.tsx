import VINInput from '../VINInput';

export default function VINInputExample() {
  return (
    <div className="max-w-2xl p-4">
      <VINInput
        onSubmit={(vin) => console.log('VIN submitted:', vin)}
        onScanBarcode={() => console.log('Scan barcode clicked')}
        onScanPhoto={() => console.log('Scan photo clicked')}
      />
    </div>
  );
}
