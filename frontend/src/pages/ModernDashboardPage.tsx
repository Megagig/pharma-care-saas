import { useEffect } from 'react';
import ModernLayout from '../components/modern/ModernLayout';
import ModernDashboard from '../components/modern/ModernDashboard';
import ModernThemeProvider from '../components/modern/ModernThemeProvider';
import { Box, useTheme } from '@mui/material';
import {
  initializeAnalyticsData,
  startRealtimeUpdates,
  useAnalyticsStore,
} from '../stores/analyticsStore';
import { DashboardSkeleton } from '../components/modern/animations/SkeletonComponents';

// Import theme styles
import '../styles/dashboardTheme.css';

const ModernDashboardPage = () => {
  const theme = useTheme();
  const loading = useAnalyticsStore((state) => state.loading);

  // Initialize analytics data when the dashboard is loaded
  useEffect(() => {
    initializeAnalyticsData(theme);
  }, [theme]);

  // Start real-time updates when the dashboard is loaded
  useEffect(() => {
    // Only start real-time updates when data is loaded
    if (!loading) {
      const stopRealtimeUpdates = startRealtimeUpdates();
      // Cleanup when component unmounts
      return () => stopRealtimeUpdates();
    }
  }, [loading]);

  return (
    <ModernThemeProvider>
      <ModernLayout>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <DashboardSkeleton />
          </Box>
        ) : (
          <ModernDashboard />
        )}
      </ModernLayout>
    </ModernThemeProvider>
  );
};

export default ModernDashboardPage;
