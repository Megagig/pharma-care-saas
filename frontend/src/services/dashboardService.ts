import { apiClient } from './apiClient';

export interface DashboardStats {
    totalPatients: number;
    totalClinicalNotes: number;
    totalMedications: number;
    totalMTRs: number;
    totalDiagnostics: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    color?: string;
}

export interface DashboardAnalytics {
    stats: DashboardStats;
    patientsByMonth: ChartDataPoint[];
    medicationsByStatus: ChartDataPoint[];
    clinicalNotesByType: ChartDataPoint[];
    mtrsByStatus: ChartDataPoint[];
    patientAgeDistribution: ChartDataPoint[];
    monthlyActivity: ChartDataPoint[];
}

class DashboardService {
    /**
     * Fetch comprehensive dashboard analytics from real API data
     */
    async getDashboardAnalytics(): Promise<DashboardAnalytics> {
        try {
            console.log('Fetching dashboard analytics from real API data...');

            // Fetch all data in parallel with proper error handling
            const [
                patientsResponse,
                notesResponse,
                medicationsResponse,
                mtrResponse
            ] = await Promise.allSettled([
                this.fetchPatients(),
                this.fetchClinicalNotes(),
                this.fetchMedications(),
                this.fetchMTRSessions()
            ]);

            // Extract data safely
            const patientsData = patientsResponse.status === 'fulfilled' ? patientsResponse.value : [];
            const notesData = notesResponse.status === 'fulfilled' ? notesResponse.value : [];
            const medicationsData = medicationsResponse.status === 'fulfilled' ? medicationsResponse.value : [];
            const mtrData = mtrResponse.status === 'fulfilled' ? mtrResponse.value : [];

            console.log('Raw API data:', {
                patients: patientsData.length,
                notes: notesData.length,
                medications: medicationsData.length,
                mtrs: mtrData.length
            });

            // Calculate stats
            const stats: DashboardStats = {
                totalPatients: patientsData.length,
                totalClinicalNotes: notesData.length,
                totalMedications: medicationsData.length,
                totalMTRs: mtrData.length,
                totalDiagnostics: 0 // Will be implemented when diagnostics API is available
            };

            // Process chart data
            const analytics: DashboardAnalytics = {
                stats,
                patientsByMonth: this.processPatientsByMonth(patientsData),
                medicationsByStatus: this.processMedicationsByStatus(medicationsData),
                clinicalNotesByType: this.processClinicalNotesByType(notesData),
                mtrsByStatus: this.processMTRsByStatus(mtrData),
                patientAgeDistribution: this.processPatientAgeDistribution(patientsData),
                monthlyActivity: this.processMonthlyActivity(notesData, medicationsData, mtrData)
            };

            console.log('Processed dashboard analytics:', analytics);
            return analytics;

        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            throw new Error('Failed to fetch dashboard analytics');
        }
    }

    /**
     * Fetch patients data from API
     */
    private async fetchPatients(): Promise<any[]> {
        try {
            const response = await apiClient.get('/api/patients', {
                params: { limit: 10000 } // Get all patients for analytics
            });

            // Handle different response structures
            if (response.data?.data?.results) {
                return response.data.data.results;
            } else if (response.data?.data) {
                return Array.isArray(response.data.data) ? response.data.data : [];
            } else if (response.data?.results) {
                return response.data.results;
            } else if (Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }

    /**
     * Fetch clinical notes data from API
     */
    private async fetchClinicalNotes(): Promise<any[]> {
        try {
            const response = await apiClient.get('/api/notes', {
                params: { limit: 10000 } // Get all notes for analytics
            });

            // Handle different response structures
            if (response.data?.data?.results) {
                return response.data.data.results;
            } else if (response.data?.data) {
                return Array.isArray(response.data.data) ? response.data.data : [];
            } else if (response.data?.results) {
                return response.data.results;
            } else if (Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching clinical notes:', error);
            return [];
        }
    }

    /**
     * Fetch medications data from API
     */
    private async fetchMedications(): Promise<any[]> {
        try {
            const response = await apiClient.get('/api/medications', {
                params: { limit: 10000 } // Get all medications for analytics
            });

            // Handle different response structures
            if (response.data?.data?.medications) {
                return response.data.data.medications;
            } else if (response.data?.medications) {
                return response.data.medications;
            } else if (response.data?.data?.results) {
                return response.data.data.results;
            } else if (response.data?.data) {
                return Array.isArray(response.data.data) ? response.data.data : [];
            } else if (Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching medications:', error);
            return [];
        }
    }

    /**
     * Fetch MTR sessions data from API
     */
    private async fetchMTRSessions(): Promise<any[]> {
        try {
            const response = await apiClient.get('/api/mtr', {
                params: { limit: 10000 } // Get all MTR sessions for analytics
            });

            // Handle different response structures
            if (response.data?.data?.results) {
                return response.data.data.results;
            } else if (response.data?.data) {
                return Array.isArray(response.data.data) ? response.data.data : [];
            } else if (response.data?.results) {
                return response.data.results;
            } else if (Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching MTR sessions:', error);
            return [];
        }
    }

    /**
     * Process patients by month for chart
     */
    private processPatientsByMonth(patients: any[]): ChartDataPoint[] {
        const monthCounts: { [key: string]: number } = {};
        const currentDate = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            monthCounts[monthKey] = 0;
        }

        // Count patients by registration month
        patients.forEach(patient => {
            if (patient?.createdAt) {
                const date = new Date(patient.createdAt);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (monthCounts.hasOwnProperty(monthKey)) {
                    monthCounts[monthKey]++;
                }
            }
        });

        return Object.entries(monthCounts).map(([name, value]) => ({ name, value }));
    }

    /**
     * Process medications by status for pie chart
     */
    private processMedicationsByStatus(medications: any[]): ChartDataPoint[] {
        const statusCounts: { [key: string]: number } = {
            'Active': 0,
            'Completed': 0,
            'Discontinued': 0,
            'Paused': 0
        };

        medications.forEach(medication => {
            if (medication?.status) {
                const status = medication.status.charAt(0).toUpperCase() + medication.status.slice(1).toLowerCase();
                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                } else {
                    statusCounts['Active']++; // Default to active if unknown status
                }
            } else {
                statusCounts['Active']++; // Default to active if no status
            }
        });

        return [
            { name: 'Active', value: statusCounts.Active, color: '#4caf50' },
            { name: 'Completed', value: statusCounts.Completed, color: '#2196f3' },
            { name: 'Discontinued', value: statusCounts.Discontinued, color: '#ff9800' },
            { name: 'Paused', value: statusCounts.Paused, color: '#9e9e9e' },
        ].filter(item => item.value > 0);
    }

    /**
     * Process clinical notes by type for bar chart
     */
    private processClinicalNotesByType(notes: any[]): ChartDataPoint[] {
        const typeCounts: { [key: string]: number } = {};

        notes.forEach(note => {
            if (note) {
                const type = note.type || note.noteType || 'General';
                const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace('_', ' ');
                typeCounts[displayType] = (typeCounts[displayType] || 0) + 1;
            }
        });

        const colors = ['#9c27b0', '#3f51b5', '#009688', '#f44336', '#607d8b', '#795548', '#ff5722'];
        return Object.entries(typeCounts)
            .map(([name, value], index) => ({
                name,
                value,
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7); // Top 7 types
    }

    /**
     * Process MTR sessions by status for pie chart
     */
    private processMTRsByStatus(mtrs: any[]): ChartDataPoint[] {
        const statusCounts: { [key: string]: number } = {
            'In Progress': 0,
            'Completed': 0,
            'Scheduled': 0,
            'On Hold': 0
        };

        mtrs.forEach(mtr => {
            if (mtr?.status) {
                let status = mtr.status;

                // Normalize status names
                switch (status.toLowerCase()) {
                    case 'in_progress':
                    case 'inprogress':
                    case 'active':
                        status = 'In Progress';
                        break;
                    case 'completed':
                    case 'finished':
                        status = 'Completed';
                        break;
                    case 'scheduled':
                    case 'pending':
                        status = 'Scheduled';
                        break;
                    case 'on_hold':
                    case 'onhold':
                    case 'paused':
                        status = 'On Hold';
                        break;
                    default:
                        status = 'Scheduled'; // Default fallback
                }

                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                } else {
                    statusCounts['Scheduled']++;
                }
            } else {
                statusCounts['Scheduled']++; // Default if no status
            }
        });

        return [
            { name: 'In Progress', value: statusCounts['In Progress'], color: '#ff9800' },
            { name: 'Completed', value: statusCounts.Completed, color: '#4caf50' },
            { name: 'Scheduled', value: statusCounts.Scheduled, color: '#2196f3' },
            { name: 'On Hold', value: statusCounts['On Hold'], color: '#9e9e9e' },
        ].filter(item => item.value > 0);
    }

    /**
     * Process patient age distribution for bar chart
     */
    private processPatientAgeDistribution(patients: any[]): ChartDataPoint[] {
        const ageCounts: { [key: string]: number } = {
            '0-17': 0,
            '18-30': 0,
            '31-45': 0,
            '46-60': 0,
            '61-75': 0,
            '75+': 0
        };

        patients.forEach(patient => {
            if (patient) {
                let age = 0;

                // Calculate age from different possible fields
                if (patient.dateOfBirth) {
                    age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                } else if (patient.age) {
                    age = patient.age;
                } else if (patient.birthDate) {
                    age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
                }

                // Categorize by age group
                if (age < 18) ageCounts['0-17']++;
                else if (age >= 18 && age <= 30) ageCounts['18-30']++;
                else if (age >= 31 && age <= 45) ageCounts['31-45']++;
                else if (age >= 46 && age <= 60) ageCounts['46-60']++;
                else if (age >= 61 && age <= 75) ageCounts['61-75']++;
                else if (age > 75) ageCounts['75+']++;
            }
        });

        return Object.entries(ageCounts)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0); // Only show age groups with patients
    }

    /**
     * Process monthly activity trend for line chart
     */
    private processMonthlyActivity(notes: any[], medications: any[], mtrs: any[]): ChartDataPoint[] {
        const monthCounts: { [key: string]: number } = {};
        const currentDate = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            monthCounts[monthKey] = 0;
        }

        // Count all activities by month
        const allActivities = [
            ...notes.map(item => ({ ...item, type: 'note' })),
            ...medications.map(item => ({ ...item, type: 'medication' })),
            ...mtrs.map(item => ({ ...item, type: 'mtr' }))
        ];

        allActivities.forEach(activity => {
            if (activity?.createdAt) {
                const date = new Date(activity.createdAt);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (monthCounts.hasOwnProperty(monthKey)) {
                    monthCounts[monthKey]++;
                }
            }
        });

        return Object.entries(monthCounts).map(([name, value]) => ({ name, value }));
    }

    /**
     * Get system activities for recent activities section
     */
    async getSystemActivities(limit: number = 10): Promise<any[]> {
        try {
            // This will be handled by the existing activityService
            // Just return empty array for now as activityService handles this
            return [];
        } catch (error) {
            console.error('Error fetching system activities:', error);
            return [];
        }
    }

    /**
     * Get user activities for recent activities section
     */
    async getUserActivities(limit: number = 10): Promise<any[]> {
        try {
            // This will be handled by the existing activityService
            // Just return empty array for now as activityService handles this
            return [];
        } catch (error) {
            console.error('Error fetching user activities:', error);
            return [];
        }
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;