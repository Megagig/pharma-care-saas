import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../../lib/api';

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dashboard API Endpoint Test
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This component tests the dashboard API endpoints to verify they're
        working correctly. Make sure you're logged in before testing.
      </Typography>

      <Button
        variant="contained"
        onClick={testAllEndpoints}
        disabled={testing}
        sx={{ mb: 3 }}
      >
        {testing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        Test All Endpoints
      </Button>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {results.map((result) => (
          <Card key={result.endpoint}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {result.endpoint}
                </Typography>
                {result.status === 'loading' && <CircularProgress size={20} />}
              </Box>

              {result.status === 'success' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Success! Received{' '}
                  {result.data?.data ? Object.keys(result.data.data).length : 0}{' '}
                  data fields
                </Alert>
              )}

              {result.status === 'error' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  ❌ Error: {result.error}
                </Alert>
              )}

              {result.data && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Response Structure:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    {JSON.stringify(result.data, null, 2)}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {results.length === 0 && !testing && (
        <Alert severity="info">
          Click "Test All Endpoints" to verify the dashboard API integration is
          working correctly.
        </Alert>
      )}
    </Box>
  );
};

export default ApiTestComponent;
