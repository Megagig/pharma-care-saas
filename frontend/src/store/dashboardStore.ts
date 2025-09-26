import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Dashboard data types
interface DashboardMetrics {
    totalPatients: number;
    activeMedications: number;
    pendingClinicalNotes: number;
    systemAlerts: number;
}

interface DashboardChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string[];
    }[];
}

interface RecentActivity {
    id: string;
    type: 'patient' | 'medication' | 'clinical_note' | 'system';
    title: string;
    description: string;
    timestamp: Date;
    user: string;
}

interface DashboardState {
    // Data state
    metrics: DashboardMetrics | null;
    charts: {
        patientGrowth: DashboardChartData | null;
        medicationUsage: DashboardChartData | null;
        clinicalNotesActivity: DashboardChartData | null;
    };
    recentActivities: RecentActivity[];

    // UI state
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;

    // Actions
    setMetrics: (metrics: DashboardMetrics) => void;
    setChartData: (chartType: keyof DashboardState['charts'], data: DashboardChartData) => void;
    addRecentActivity: (activity: RecentActivity) => void;
    clearRecentActivities: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    refreshData: () => Promise<void>;
    reset: () => void;
}

const initialMetrics: DashboardMetrics = {
    totalPatients: 0,
    activeMedications: 0,
    pendingClinicalNotes: 0,
    systemAlerts: 0,
};

export const useDashboardStore = create<DashboardState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                metrics: null,
                charts: {
                    patientGrowth: null,
                    medicationUsage: null,
                    clinicalNotesActivity: null,
                },
                recentActivities: [],
                isLoading: false,
                error: null,
                lastUpdated: null,

                // Actions
                setMetrics: (metrics) => {
                    set({ metrics, lastUpdated: new Date() });
                },

                setChartData: (chartType, data) => {
                    set((state) => ({
                        charts: {
                            ...state.charts,
                            [chartType]: data,
                        },
                        lastUpdated: new Date(),
                    }));
                },

                addRecentActivity: (activity) => {
                    set((state) => ({
                        recentActivities: [activity, ...state.recentActivities].slice(0, 50), // Keep last 50 activities
                        lastUpdated: new Date(),
                    }));
                },

                clearRecentActivities: () => {
                    set({ recentActivities: [], lastUpdated: new Date() });
                },

                setLoading: (isLoading) => {
                    set({ isLoading });
                },

                setError: (error) => {
                    set({ error, isLoading: false });
                },

                refreshData: async () => {
                    const state = get();

                    try {
                        state.setLoading(true);
                        state.setError(null);

                        // Simulate API calls - in a real app, these would be actual API requests
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Mock data for demonstration
                        const mockMetrics: DashboardMetrics = {
                            totalPatients: 1247,
                            activeMedications: 3421,
                            pendingClinicalNotes: 23,
                            systemAlerts: 5,
                        };

                        const mockPatientGrowth: DashboardChartData = {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                            datasets: [{
                                label: 'New Patients',
                                data: [65, 78, 90, 81, 96, 105],
                                backgroundColor: ['rgba(59, 130, 246, 0.5)'],
                                borderColor: ['rgb(59, 130, 246)'],
                            }],
                        };

                        const mockMedicationUsage: DashboardChartData = {
                            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                            datasets: [{
                                label: 'Medication Orders',
                                data: [120, 135, 125, 140],
                                backgroundColor: ['rgba(16, 185, 129, 0.5)'],
                                borderColor: ['rgb(16, 185, 129)'],
                            }],
                        };

                        const mockClinicalNotesActivity: DashboardChartData = {
                            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                            datasets: [{
                                label: 'Clinical Notes Created',
                                data: [12, 19, 15, 25, 22],
                                backgroundColor: ['rgba(245, 158, 11, 0.5)'],
                                borderColor: ['rgb(245, 158, 11)'],
                            }],
                        };

                        // Update state with mock data
                        state.setMetrics(mockMetrics);
                        state.setChartData('patientGrowth', mockPatientGrowth);
                        state.setChartData('medicationUsage', mockMedicationUsage);
                        state.setChartData('clinicalNotesActivity', mockClinicalNotesActivity);

                        // Add sample recent activity
                        state.addRecentActivity({
                            id: Date.now().toString(),
                            type: 'patient',
                            title: 'New Patient Registered',
                            description: 'John Doe was added to the system',
                            timestamp: new Date(),
                            user: 'Dr. Smith',
                        });

                    } catch (error) {
                        state.setError(error instanceof Error ? error.message : 'Failed to refresh dashboard data');
                    } finally {
                        state.setLoading(false);
                    }
                },

                reset: () => {
                    set({
                        metrics: null,
                        charts: {
                            patientGrowth: null,
                            medicationUsage: null,
                            clinicalNotesActivity: null,
                        },
                        recentActivities: [],
                        isLoading: false,
                        error: null,
                        lastUpdated: null,
                    });
                },
            }),
            {
                name: 'dashboard-storage',
                partialize: (state) => ({
                    metrics: state.metrics,
                    charts: state.charts,
                    recentActivities: state.recentActivities,
                    lastUpdated: state.lastUpdated,
                }),
            }
        ),
        {
            name: 'dashboard-store',
        }
    )
);

// Selectors for efficient data access
export const selectDashboardMetrics = (state: DashboardState) => state.metrics;
export const selectDashboardCharts = (state: DashboardState) => state.charts;
export const selectRecentActivities = (state: DashboardState) => state.recentActivities;
export const selectDashboardLoading = (state: DashboardState) => state.isLoading;
export const selectDashboardError = (state: DashboardState) => state.error;

// Hook for accessing dashboard data with selectors
export const useDashboardMetrics = () => useDashboardStore(selectDashboardMetrics);
export const useDashboardCharts = () => useDashboardStore(selectDashboardCharts);
export const useRecentActivities = () => useDashboardStore(selectRecentActivities);
export const useDashboardLoading = () => useDashboardStore(selectDashboardLoading);
export const useDashboardError = () => useDashboardStore(selectDashboardError);
