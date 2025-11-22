import Navigation from '../Navigation';

export default function NavigationExample() {
  return (
    <div className="space-y-4">
      <Navigation userRole="technician" userName="John Doe" />
      <div className="p-4">
        <Navigation userRole="admin" userName="Sarah Smith" />
      </div>
    </div>
  );
}
