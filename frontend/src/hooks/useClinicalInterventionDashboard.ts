type DateRange = 'week' | 'month' | 'quarter' | 'year';

export const useClinicalInterventionDashboard = (dateRange: DateRange) => {
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

    // Load data when component mounts and date range changes
    useEffect(() => {
        if (!mountedRef.current) {
            return;
        }

        const { from, to } = getDateRange(dateRange);
        const fetchKey = `${dateRange}-${from.getTime()}-${to.getTime()}`;

        // Prevent duplicate fetches
        if (fetchKey === lastFetchRef.current) {
            return;
        }

        lastFetchRef.current = fetchKey;
        store.fetchDashboardMetrics({ from, to });
    }, [dateRange, getDateRange, store]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Refresh function
    const refresh = useCallback(async () => {
        if (!mountedRef.current) return;

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
    }, [getDateRange, dateRange, store]);

    return {
        dashboardMetrics: store.dashboardMetrics,
        loading: store.loading.fetchDashboardMetrics || false,
        error: store.errors.fetchDashboardMetrics || null,
        refreshing,
        refresh,
        isAuthenticated: true, // Always true for super_admin access
    };
};