import AdminDataTable from '../AdminDataTable';

export default function AdminDataTableExample() {
  const mockData = [
    {
      id: "1",
      fileName: "2023_Ford_F150_Electrical.pdf",
      make: "Ford",
      model: "F-150",
      year: "2023",
      system: "Electrical",
    },
    {
      id: "2",
      fileName: "2022_Toyota_Camry_Engine.pdf",
      make: "Toyota",
      model: "Camry",
      year: "2022",
      system: "Engine",
    },
    {
      id: "3",
      fileName: "2021_Honda_Accord_HVAC.pdf",
      make: "Honda",
      model: "Accord",
      year: "2021",
      system: "HVAC",
    },
  ];

  return (
    <div className="p-4">
      <AdminDataTable
        data={mockData}
        onUpdate={(id, updates) => console.log('Update:', id, updates)}
      />
    </div>
  );
}
