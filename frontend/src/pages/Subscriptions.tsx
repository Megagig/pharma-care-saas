import React from 'react';
import { Box } from '@mui/material';
import SubscriptionManagement from '../components/subscription/SubscriptionManagement';
import ErrorBoundary from '../components/ErrorBoundary';

const Subscriptions: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ErrorBoundary>
        <SubscriptionManagement />
      </ErrorBoundary>
    </Box>
  );
};

export default Subscriptions;
