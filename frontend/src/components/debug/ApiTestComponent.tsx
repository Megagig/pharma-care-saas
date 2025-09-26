import { Button, Card, CardContent, Spinner, Alert } from '@/components/ui/button';

interface ApiTestResult {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}
export const ApiTestComponent: React.FC = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const endpoints = [
    { name: 'Patients', url: '/patients', params: { limit: 5 } },
    { name: 'Clinical Notes', url: '/notes', params: { limit: 5 } },
    { name: 'Medications', url: '/medications', params: { limit: 5 } },
    { name: 'MTR Sessions', url: '/mtr', params: { limit: 5 } },
  ];
  const testEndpoint = async (endpoint: {
    name: string;
    url: string;
    params: any;
  }) => {
    const result: ApiTestResult = {
      endpoint: endpoint.name,
      status: 'loading',
    };
    setResults((prev) => [
      ...prev.filter((r) => r.endpoint !== endpoint.name),
      result,
    ]);
    try {
      console.log(`Testing ${endpoint.name} endpoint: ${endpoint.url}`);
      const response = await api.get(endpoint.url, { params: endpoint.params });
      console.log(`${endpoint.name} response:`, response.data);
      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === endpoint.name
            ? { ...r, status: 'success', data: response.data }
            : r
        )
      );
    } catch (error: any) {
      console.error(`${endpoint.name} error:`, error);
      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === endpoint.name
            ? {
                ...r,
                status: 'error',
                error:
                  error.response?.data?.message ||
                  error.message ||
                  'Unknown error',
              }
            : r
        )
      );
    }
  };
  const testAllEndpoints = async () => {
    setTesting(true);
    setResults([]);
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setTesting(false);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };
  return (
    <div className="">
      <div  gutterBottom>
        Dashboard API Endpoint Test
      </div>
      <div  color="text.secondary" className="">
        This component tests the dashboard API endpoints to verify they're
        working correctly. Make sure you're logged in before testing.
      </div>
      <Button
        
        onClick={testAllEndpoints}
        disabled={testing}
        className=""
      >
        {testing ? <Spinner size={20} className="" /> : null}
        Test All Endpoints
      </Button>
      <div className="">
        {results.map((result) => (
          <Card key={result.endpoint}>
            <CardContent>
              <div className="">
                <div  className="">
                  {result.endpoint}
                </div>
                {result.status === 'loading' && <Spinner size={20} />}
              </div>
              {result.status === 'success' && (
                <Alert severity="success" className="">
                  ✅ Success! Received{' '}
                  {result.data?.data ? Object.keys(result.data.data).length : 0}{' '}
                  data fields
                </Alert>
              )}
              {result.status === 'error' && (
                <Alert severity="error" className="">
                  ❌ Error: {result.error}
                </Alert>
              )}
              {result.data && (
                <div>
                  <div  gutterBottom>
                    Response Structure:
                  </div>
                  <div
                    component="pre"
                    className=""
                  >
                    {JSON.stringify(result.data, null, 2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {results.length === 0 && !testing && (
        <Alert severity="info">
          Click "Test All Endpoints" to verify the dashboard API integration is
          working correctly.
        </Alert>
      )}
    </div>
  );
};
export default ApiTestComponent;
