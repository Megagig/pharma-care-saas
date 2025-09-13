import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Import hooks and components
import {
  useDiagnosticHistory,
  useDiagnosticAnalytics,
} from '../hooks/useDiagnostics';
import { useDiagnosticStore } from '../store/diagnosticStore';

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
    dateTo: '2024-12-31',
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography color="error">
          Error loading data: {historyError?.message || analyticsError?.message}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Diagnostic Dashboard (Debug) - Render #{renderCount}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          placeholder="Search cases..."
          value={searchTerm}
          onChange={handleSearch}
          size="small"
          sx={{ mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button onClick={handleSetPending} sx={{ mr: 1 }}>
          Pending
        </Button>
        <Button onClick={handleSetCompleted}>Completed</Button>
      </Box>

      <Box>
        <Typography variant="h6">Status:</Typography>
        <Typography>Loading: {historyLoading ? 'Yes' : 'No'}</Typography>
        <Typography>
          Analytics Loading: {analyticsLoading ? 'Yes' : 'No'}
        </Typography>
        <Typography>
          Cases: {historyData?.data?.results?.length || 0}
        </Typography>
        <Typography>Current Search: "{filters.search}"</Typography>
        <Typography>Current Status: {filters.status || 'All'}</Typography>
        <Typography>Search Term State: "{searchTerm}"</Typography>
      </Box>
    </Container>
  );
};

export default DiagnosticDashboardDebug;
