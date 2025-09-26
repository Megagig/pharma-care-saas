import { useState, useEffect } from 'react';
import { dashboardService, DashboardStats, ChartDataPoint } from '../services/dashboardService';

// Types are now imported from dashboardService

interface DashboardData {
    stats: DashboardStats;
    patientsByMonth: ChartDataPoint[];
    medicationsByStatus: ChartDataPoint[];
    clinicalNotesByType: ChartDataPoint[];
    mtrsByStatus: ChartDataPoint[];
    patientAgeDistribution: ChartDataPoint[];
    monthlyActivity: ChartDataPoint[];
    loading: boolean;
    error: string | null;
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
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setData(prev => ({ ...prev, loading: true, error: null }));

                console.log('Fetching real dashboard data using new dashboard service...');

                // Use the new dashboard service to get all analytics
                const analytics = await dashboardService.getDashboardAnalytics();

                console.log('Dashboard analytics received:', analytics);

                setData({
                    ...analytics,
                    loading: false,
                    error: null,
                });

            } catch (error) {
                console.error('❌ Error fetching dashboard data:', error);

                // Try to get fallback data from the service
                try {
                    console.log('🔄 Attempting to get fallback data...');
                    const fallbackAnalytics = await dashboardService.getDashboardAnalytics();
                    setData({
                        ...fallbackAnalytics,
                        loading: false,
                        error: null, // Don't show error if fallback works
                    });
                } catch (fallbackError) {
                    console.error('❌ Fallback data also failed:', fallbackError);
                    setData(prev => ({
                        ...prev,
                        loading: false,
                        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
                    }));
                }
            }
        };

        fetchDashboardData();
    }, []);

    // Processing functions are now handled by the dashboard service

    return data;
};