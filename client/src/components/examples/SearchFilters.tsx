import SearchFilters from '../SearchFilters';

export default function SearchFiltersExample() {
  return (
    <div className="max-w-md p-4">
      <SearchFilters
        onSearch={(filters) => console.log('Search:', filters)}
        onReset={() => console.log('Reset')}
      />
    </div>
  );
}
