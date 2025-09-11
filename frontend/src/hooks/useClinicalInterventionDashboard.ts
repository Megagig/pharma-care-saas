import { useState, useEffect, useCallback, useRef } from 'react';
import { subDays, subMonths } from 'date-fns';
import { useAuth } from './useAuth';
import { useClinicalInterventionStore } from '../stores/clinicalInterventionStore';

type DateRange = 'week' | 'month' | 'quarter' | 'year';

export const useClinicalInterventionDashboard = (dateRange: DateRange) => {
   const { user, loading: authLoading } = useAuth();
   const store = useClinicalInterventionStore();

   const [refreshing, setRefreshing] = useState(false);
   const lastFetchRef = useRef<string>('');
   const mountedRef = useRef(true);

   // Helper function to get date range
   const getDateRange = useCallback((range: DateRange) => {
      const now = new Date();
      let fromDate: Date;

      switch (range) {
         case 'week':
            fromDate = subDays(now, 7);
            break;
         case 'month':
            fromDate = subMonths(now, 1);
            break;
         case 'quarter':
            fromDate = subMonths(now, 3);
            break;
         case 'year':
            fromDate = subMonths(now, 12);
            break;
         default:
            fromDate = subMonths(now, 1);
      }

      return { from: fromDate, to: now };
   }, []);

   // Load data when user is authenticated and date range changes
   useEffect(() => {
      if (!user || authLoading || !mountedRef.current) {
         return;
      }

      const { from, to } = getDateRange(dateRange);
      const fetchKey = `${dateRange}-${user.id}-${from.getTime()}-${to.getTime()}`;

      // Prevent duplicate fetches
      if (fetchKey === lastFetchRef.current) {
         return;
      }

      lastFetchRef.current = fetchKey;
      store.fetchDashboardMetrics({ from, to });
   }, [user?.id, authLoading, dateRange, getDateRange]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         mountedRef.current = false;
      };
   }, []);

   // Refresh function
   const refresh = useCallback(async () => {
      if (!user || authLoading || !mountedRef.current) return;

      setRefreshing(true);
      lastFetchRef.current = ''; // Reset to allow refetch

      try {
         const { from, to } = getDateRange(dateRange);
         await store.fetchDashboardMetrics({ from, to });
      } catch (error) {
         console.error('Failed to refresh dashboard:', error);
      } finally {
         if (mountedRef.current) {
            setRefreshing(false);
         }
      }
   }, [user, authLoading, getDateRange, dateRange, store]);

   return {
      dashboardMetrics: store.dashboardMetrics,
      loading: authLoading || store.loading,
      error: store.error,
      refreshing,
      refresh,
      isAuthenticated: !!user && !authLoading,
   };
};
