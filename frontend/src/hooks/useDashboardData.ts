import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardStats, ChartDataPoint } from '../services/dashboardService';

interface DashboardData {
    stats: DashboardStats;
    patientsByMonth: ChartDataPoint[];
    medicationsByStatus: ChartDataPoint[];
    clinicalNotesByType: ChartDataPoint[];
    mtrsByStatus: ChartDataPoint[];
    patientAgeDistribution: ChartDataPoint[];
    monthlyActivity: ChartDataPoint[];
    workspaceInfo?: any;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
    const [data, setData] = useState<DashboardData>({
        stats: {
            totalPatients: 0,
            totalClinicalNotes: 0,
            totalMedications: 0,
            totalMTRs: 0,
            totalDiagnostics: 0,
        },
        patientsByMonth: [],
        medicationsByStatus: [],
        clinicalNotesByType: [],
        mtrsByStatus: [],
        patientAgeDistribution: [],
        monthlyActivity: [],
        loading: true,
        error: null,
        refresh: async () => { },
    });

    const fetchDashboardData = useCallback(async () => {
        try {
            setData(prev => ({ ...prev, loading: true, error: null }));

            console.log('🚀 Fetching optimized dashboard data...');

            // Use the optimized dashboard service
            const analytics = await dashboardService.getDashboardAnalytics();

            console.log('✅ Dashboard data received:', analytics);

            setData(prev => ({
                ...prev,
                ...analytics,
                loading: false,
                error: null,
            }));

        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);

            // Try to get just stats as fallback
            try {
                console.log('🔄 Attempting to get stats only...');
                const statsData = await dashboardService.getDashboardAnalytics();

                setData(prev => ({
                    ...prev,
                    stats: statsData.stats,
                    loading: false,
                    error: 'Some dashboard data may be incomplete',
                }));
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to load dashboard data',
                }));
            }
        }
    }, []);

    const refresh = useCallback(async () => {
        console.log('🔄 Refreshing dashboard data...');
        await fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Return data with refresh function - do NOT call setData here
    return { ...data, refresh };
};