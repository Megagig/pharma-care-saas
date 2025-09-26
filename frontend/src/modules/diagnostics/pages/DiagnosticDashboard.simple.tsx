import { Button, Input } from '@/components/ui/button';
// Import hooks and components
const DiagnosticDashboardSimple: React.FC = () => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  // Store state - ONLY get what we need
  const filters = useDiagnosticStore((state) => state.filters);
  const setFilters = useDiagnosticStore((state) => state.setFilters);
  // Simple handlers without any complex logic
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      // Direct call without debouncing for testing
      setFilters({ search: value });
    },
    [setFilters]
  );
  const handleSetPending = useCallback(() => {
    setFilters({ status: 'pending' });
  }, [setFilters]);
  return (
    <div maxWidth="xl" className="">
      <h1 className="text-3xl font-bold mb-8">
        Simple Dashboard Test
      </h1>
      <div className="">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          className="mr-2 h-8 w-64"
        />
        <Button onClick={handleSetPending}>Set Pending</Button>
      </div>
      <div>
        <p>Current Search: "{filters.search}"</p>
        <p>Current Status: {filters.status || 'All'}</p>
        <p>Search Term State: "{searchTerm}"</p>
      </div>
    </div>
  );
};
export default DiagnosticDashboardSimple;
