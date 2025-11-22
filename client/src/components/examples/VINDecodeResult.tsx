import VINDecodeResult from '../VINDecodeResult';

export default function VINDecodeResultExample() {
  const mockVINInfo = {
    vin: "1FTFW1E84MKE12345",
    make: "Ford",
    model: "F-150",
    year: "2021",
    bodyClass: "Pickup Truck",
    engineType: "3.5L V6 EcoBoost",
  };

  return (
    <div className="max-w-2xl p-4">
      <VINDecodeResult vinInfo={mockVINInfo} />
    </div>
  );
}
