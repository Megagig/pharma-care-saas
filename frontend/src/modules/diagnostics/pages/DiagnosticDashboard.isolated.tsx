import { Button, Input, Card, CardContent } from '@/components/ui/button';
// Completely isolated component without any external hooks
const DiagnosticDashboardIsolated: React.FC = () => {
  // Only local state
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('all');
  // Simple handlers
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
    },
    []
  );
  const handleSetPending = useCallback(() => {
    setStatus('pending');
  }, []);
  const handleSetCompleted = useCallback(() => {
    setStatus('completed');
  }, []);
  const handleSetAll = useCallback(() => {
    setStatus('all');
  }, []);
  return (
    <div maxWidth="xl" className="">
      <div  className="">
        Isolated Dashboard Test
      </div>
      <Card className="">
        <CardContent>
          <div className="">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              className=""
            />
            <Button onClick={handleSetPending} className="">
              Pending
            </Button>
            <Button onClick={handleSetCompleted} className="">
              Completed
            </Button>
            <Button onClick={handleSetAll}>All</Button>
          </div>
          <div>
            <div>Search Term: "{searchTerm}"</div>
            <div>Status: {status}</div>
          </div>
        </CardContent>
      </Card>
      <div >
        If you can see this without infinite loop errors, the issue is with the
        hooks or store.
      </div>
    </div>
  );
};
export default DiagnosticDashboardIsolated;
