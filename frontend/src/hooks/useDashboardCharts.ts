interface DashboardChartsData {
    clinicalNotesByType: ChartDataPoint[];
    mtrsByStatus: ChartDataPoint[];
    patientsByMonth: ChartDataPoint[];
    medicationsByStatus: ChartDataPoint[];
    patientAgeDistribution: ChartDataPoint[];
    monthlyActivity: ChartDataPoint[];
    loading: boolean;
    error: string | null;
}

export const useDashboardCharts = () => {
    const [data, setData] = useState<DashboardChartsData>({ 
        clinicalNotesByType: [],
        mtrsByStatus: [],
        patientsByMonth: [],
        medicationsByStatus: [],
        patientAgeDistribution: [],
        monthlyActivity: [],
        loading: true,
        error: null}
    });

    const [refreshKey, setRefreshKey] = useState(0);

    const fetchChartData = async () => {
        try {
            setData(prev => ({ ...prev, loading: true, error: null }));

            console.log('Fetching real chart data from API...');

            const analytics = await dashboardService.getDashboardAnalytics();

            console.log('Chart data received:', {
                clinicalNotesByType: analytics.clinicalNotesByType.length,
                mtrsByStatus: analytics.mtrsByStatus.length,
                patientsByMonth: analytics.patientsByMonth.length,
                medicationsByStatus: analytics.medicationsByStatus.length,
                patientAgeDistribution: analytics.patientAgeDistribution.length,
                monthlyActivity: analytics.monthlyActivity.length}

            setData({ 
                clinicalNotesByType: analytics.clinicalNotesByType,
                mtrsByStatus: analytics.mtrsByStatus,
                patientsByMonth: analytics.patientsByMonth,
                medicationsByStatus: analytics.medicationsByStatus,
                patientAgeDistribution: analytics.patientAgeDistribution,
                monthlyActivity: analytics.monthlyActivity,
                loading: false,
                error: null}
            });

        } catch (error) {
            console.error('Error fetching chart data:', error);
            setData(prev => ({ 
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load chart data'}
            }));
        }
    };

    const refresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        fetchChartData();
    }, [refreshKey]);

    return {
        ...data,
        refresh,
    };
};

export default useDashboardCharts;