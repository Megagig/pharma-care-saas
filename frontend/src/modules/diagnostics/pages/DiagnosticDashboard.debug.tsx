import { Button, Input } from '@/components/ui/button';
// Import hooks and components
  useDiagnosticHistory,
  useDiagnosticAnalytics,

let renderCount = 0;
const DiagnosticDashboardDebug: React.FC = () => {
  renderCount++;
  console.log(`DiagnosticDashboard render #${renderCount}`);
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  // Store state
  const { filters, setFilters } = useDiagnosticStore();
  // Log when filters change
  useEffect(() => {
    console.log('Filters changed:', filters);
  }, [filters]);
  // Memoize the history query parameters to prevent infinite loops
  const historyParams = useMemo(() => {
    console.log('Creating new historyParams:', filters);
    return {
      ...filters,
      limit: 10,
    };
  }, [filters]);
  // API queries
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useDiagnosticHistory(historyParams);
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useDiagnosticAnalytics({ 
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'}
  });
  // Handlers
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      console.log('Search input changed:', value);
      setSearchTerm(value);
      // Simple immediate update without debouncing for testing
      console.log('Calling setFilters with search:', value);
      setFilters({ search: value, page: 1 });
    },
    [setFilters]
  );
  const handleSetPending = useCallback(() => {
    console.log('Setting status to pending');
    setFilters({ status: 'pending' });
  }, [setFilters]);
  const handleSetCompleted = useCallback(() => {
    console.log('Setting status to completed');
    setFilters({ status: 'completed' });
  }, [setFilters]);
  if (historyError || analyticsError) {
    return (
      <div maxWidth="xl" className="">
        <div color="error">
          Error loading data: {historyError?.message || analyticsError?.message}
        </div>
      </div>
    );
  }
  return (
    <div maxWidth="xl" className="">
      <div  className="">
        Diagnostic Dashboard (Debug) - Render #{renderCount}
      </div>
      <div className="">
        <Input
          placeholder="Search cases..."
          value={searchTerm}
          onChange={handleSearch}
          size="small"
          className=""
          
        />
        <Button onClick={handleSetPending} className="">
          Pending
        </Button>
        <Button onClick={handleSetCompleted}>Completed</Button>
      </div>
      <div>
        <div >Status:</div>
        <div>Loading: {historyLoading ? 'Yes' : 'No'}</div>
        <div>
          Analytics Loading: {analyticsLoading ? 'Yes' : 'No'}
        </div>
        <div>
          Cases: {historyData?.data?.results?.length || 0}
        </div>
        <div>Current Search: "{filters.search}"</div>
        <div>Current Status: {filters.status || 'All'}</div>
        <div>Search Term State: "{searchTerm}"</div>
      </div>
    </div>
  );
};
export default DiagnosticDashboardDebug;
