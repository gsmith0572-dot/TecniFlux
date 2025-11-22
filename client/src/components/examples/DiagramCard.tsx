import DiagramCard from '../DiagramCard';

export default function DiagramCardExample() {
  const mockDiagrams = [
    {
      id: "1",
      fileName: "2023_Ford_F150_Electrical_System.pdf",
      make: "Ford",
      model: "F-150",
      year: "2023",
      system: "Electrical",
      fileUrl: "https://example.com/diagram1.pdf",
    },
    {
      id: "2",
      fileName: "2022_Toyota_Camry_Engine_Diagram.pdf",
      make: "Toyota",
      model: "Camry",
      year: "2022",
      system: "Engine",
      fileUrl: "https://example.com/diagram2.pdf",
    },
  ];

  return (
    <div className="space-y-4 p-4 max-w-2xl">
      {mockDiagrams.map((diagram) => (
        <DiagramCard
          key={diagram.id}
          diagram={diagram}
          onView={(d) => console.log('View diagram:', d)}
        />
      ))}
    </div>
  );
}
