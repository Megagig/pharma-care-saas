import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, Alert, Button, Typography } from '@mui/material';
import { RefreshCw } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Alert severity="error" sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Failed to load component
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error.message || 'An unexpected error occurred while loading this page.'}
      </Typography>
      <Button
        variant="contained"
        startIcon={<RefreshCw size={16} />}
        onClick={resetErrorBoundary}
        size="small"
      >
        Try Again
      </Button>
    </Alert>
  </Box>
);

// Default loading fallback
const DefaultLoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      p: 3,
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          border: '3px solid',
          borderColor: 'primary.main',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          mx: 'auto',
          mb: 2,
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />
      <Typography variant="body2" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  </Box>
);

// Higher-order component for lazy loading with error boundaries
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) => {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary
      FallbackComponent={errorFallback || DefaultErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={React.createElement(fallback || DefaultLoadingFallback)}>
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return LazyComponent;
};

// Wrapper component for manual use
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = DefaultLoadingFallback,
  errorFallback = DefaultErrorFallback,
}) => (
  <ErrorBoundary
    FallbackComponent={errorFallback}
    onReset={() => window.location.reload()}
  >
    <Suspense fallback={React.createElement(fallback)}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Preload utility function
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Start loading the component but don't wait for it
  importFn().catch((error) => {
    console.warn('Failed to preload component:', error);
  });
};

// Route-based preloading hook
export const useRoutePreloading = () => {
  React.useEffect(() => {
    // Preload critical routes after initial render
    const timer = setTimeout(() => {
      // Preload dashboard and patients as they are most commonly accessed
      preloadComponent(() => import('../pages/ModernDashboardPage'));
      preloadComponent(() => import('../pages/Patients'));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Preload secondary routes after a delay
    const timer = setTimeout(() => {
      preloadComponent(() => import('../pages/ClinicalNotes'));
      preloadComponent(() => import('../pages/Medications'));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
};