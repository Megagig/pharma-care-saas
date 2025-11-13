import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, Alert, Button, Typography } from '@mui/material';
import ModernDashboard from '../components/dashboard/ModernDashboard';

// Error fallback component for dashboard-specific errors
const DashboardErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <Box sx={{ p: 3, textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Alert severity="error" sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Dashboard Loading Error
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error.message.includes('useContext') || error.message.includes('dispatcher is null')
          ? 'There was a temporary issue loading the dashboard. This usually resolves automatically.'
          : error.message || 'An unexpected error occurred while loading the dashboard.'}
      </Typography>
      <Button
        variant="contained"
        onClick={resetErrorBoundary}
        size="small"
      >
        Reload Dashboard
      </Button>
    </Alert>
  </Box>
);

const ModernDashboardPage: React.FC = () => {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardErrorFallback}
      onReset={() => {
        // Force a clean reload to reset all contexts
        window.location.reload();
      }}
      onError={(error) => {
        console.error('Dashboard error:', error);
        // Log specific hook errors for debugging
        if (error.message.includes('useContext') || error.message.includes('dispatcher is null')) {
          console.warn('React context/hooks error detected - this is usually temporary');
        }
      }}
    >
      <ModernDashboard />
    </ErrorBoundary>
  );
};

export default ModernDashboardPage;
