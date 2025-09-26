import { dashboardService } from '../services/dashboardService';

export const testDashboardService = async () => {
    console.log('=== TESTING DASHBOARD SERVICE ===');

    try {
        console.log('🔄 Testing getDashboardAnalytics...');
        const analytics = await dashboardService.getDashboardAnalytics();

        console.log('✅ Dashboard Analytics Result:', {
            stats: analytics.stats,
            chartDataCounts: {
                patientsByMonth: analytics.patientsByMonth.length,
                medicationsByStatus: analytics.medicationsByStatus.length,
                clinicalNotesByType: analytics.clinicalNotesByType.length,
                mtrsByStatus: analytics.mtrsByStatus.length,
                patientAgeDistribution: analytics.patientAgeDistribution.length,
                monthlyActivity: analytics.monthlyActivity.length
            }
        });

        // Test individual chart data
        console.log('📊 Sample Chart Data:');
        console.log('Patients by Month:', analytics.patientsByMonth);
        console.log('Medications by Status:', analytics.medicationsByStatus);
        console.log('Patient Age Distribution:', analytics.patientAgeDistribution);

        return analytics;
    } catch (error) {
        console.error('❌ Dashboard Service Test Failed:', error);
        throw error;
    }
};

// Make it available globally for testing
(window as any).testDashboardService = testDashboardService;