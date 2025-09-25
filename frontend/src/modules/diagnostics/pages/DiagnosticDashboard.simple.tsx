import React, { useState, useCallback } from 'react';
import { Box, Container } from '@mui/material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Import hooks and components
import { useDiagnosticStore } from '../store/diagnosticStore';

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <h1 className="text-3xl font-bold mb-8">
        Simple Dashboard Test
      </h1>

      <Box sx={{ mb: 4 }}>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          className="mr-2 h-8 w-64"
        />
        <Button onClick={handleSetPending}>Set Pending</Button>
      </Box>

      <Box>
        <p>Current Search: "{filters.search}"</p>
        <p>Current Status: {filters.status || 'All'}</p>
        <p>Search Term State: "{searchTerm}"</p>
      </Box>
    </Container>
  );
};

export default DiagnosticDashboardSimple;
