import { Button, Input } from '@/components/ui/button';
// Import hooks and components
  useDiagnosticHistory,
  useDiagnosticAnalytics,

const DiagnosticDashboardMinimal: React.FC = () => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  // Store state
  const { filters, setFilters } = useDiagnosticStore();
  // Memoize the history query parameters to prevent infinite loops
  const historyParams = useMemo(
    () => ({ 
      ...filters,
      limit: 10}
    }),
    [filters]
  );
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
      setSearchTerm(value);
      // Simple immediate update without debouncing for testing
      setFilters({ search: value, page: 1 });
    },
    [setFilters]
  );
  const handleSetPending = useCallback(() => {
    setFilters({ status: 'pending' });
  }, [setFilters]);
  const handleSetCompleted = useCallback(() => {
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
        Diagnostic Dashboard (Minimal)
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
        <div>Current Search: {filters.search}</div>
        <div>Current Status: {filters.status || 'All'}</div>
      </div>
    </div>
  );
};
export default DiagnosticDashboardMinimal;
