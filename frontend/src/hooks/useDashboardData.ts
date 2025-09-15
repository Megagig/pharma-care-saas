import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { clinicalNoteService } from '../services/clinicalNoteService';
import { medicationService } from '../services/medicationService';
import { mtrService } from '../services/mtrService';

interface DashboardStats {
    totalPatients: number;
    totalClinicalNotes: number;
    totalMedications: number;
    totalMTRs: number;
    totalDiagnostics: number;
}

interface ChartData {
    name: string;
    value: number;
    color?: string;
}

interface DashboardData {
    stats: DashboardStats;
    patientsByMonth: ChartData[];
    medicationsByStatus: ChartData[];
    clinicalNotesByType: ChartData[];
    mtrsByStatus: ChartData[];
    patientAgeDistribution: ChartData[];
    monthlyActivity: ChartData[];
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

                console.log('Fetching real dashboard data from database...');

                // Fetch all data in parallel
                const [patientsResponse, notesResponse, medicationsResponse, mtrResponse] = await Promise.allSettled([
                    patientService.getPatients({ limit: 10000 }), // Get all patients for analytics
                    clinicalNoteService.getNotes({ limit: 10000 }), // Get all notes for analytics
                    medicationService.getMedications({ limit: 10000 }), // Get all medications for analytics
                    mtrService.getMTRSessions({ limit: 10000 }), // Get all MTR sessions for analytics
                ]);

                console.log('API Responses:', {
                    patients: patientsResponse,
                    notes: notesResponse,
                    medications: medicationsResponse,
                    mtrs: mtrResponse
                });

                // Extract data from responses
                const patientsData = patientsResponse.status === 'fulfilled' ? patientsResponse.value : null;
                const notesData = notesResponse.status === 'fulfilled' ? notesResponse.value : null;
                const medicationsData = medicationsResponse.status === 'fulfilled' ? medicationsResponse.value : null;
                const mtrData = mtrResponse.status === 'fulfilled' ? mtrResponse.value : null;

                // Calculate totals
                const totalPatients = patientsData?.meta?.total || patientsData?.data?.length || 0;
                const totalClinicalNotes = notesData?.meta?.total || notesData?.data?.length || 0;
                const totalMedications = medicationsData?.total || medicationsData?.medications?.length || 0;
                const totalMTRs = mtrData?.total || mtrData?.data?.length || 0;

                const stats: DashboardStats = {
                    totalPatients,
                    totalClinicalNotes,
                    totalMedications,
                    totalMTRs,
                    totalDiagnostics: 0, // This would need a diagnostics service
                };

                console.log('Calculated stats:', stats);

                // Process real data for charts
                const patientsByMonth = processPatientsByMonth(patientsData?.data || []);
                const medicationsByStatus = processMedicationsByStatus(medicationsData?.medications || []);
                const clinicalNotesByType = processClinicalNotesByType(notesData?.data || []);
                const mtrsByStatus = processMTRsByStatus(mtrData?.data || []);
                const patientAgeDistribution = processPatientAgeDistribution(patientsData?.data || []);
                const monthlyActivity = processMonthlyActivity(notesData?.data || [], medicationsData?.medications || []);

                console.log('Processed chart data:', {
                    patientsByMonth,
                    medicationsByStatus,
                    clinicalNotesByType,
                    mtrsByStatus,
                    patientAgeDistribution,
                    monthlyActivity
                });

                setData({
                    stats,
                    patientsByMonth,
                    medicationsByStatus,
                    clinicalNotesByType,
                    mtrsByStatus,
                    patientAgeDistribution,
                    monthlyActivity,
                    loading: false,
                    error: null,
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to load dashboard data',
                }));
            }
        };

        fetchDashboardData();
    }, []);

    // Helper functions to process real data into chart format
    const processPatientsByMonth = (patients: any): ChartData[] => {
        console.log('Processing patients by month:', patients);

        // Ensure patients is an array
        const patientsArray = Array.isArray(patients) ? patients : [];

        const monthCounts: { [key: string]: number } = {};
        const currentDate = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            monthCounts[monthKey] = 0;
        }

        // Count patients by registration month
        patientsArray.forEach(patient => {
            if (patient && patient.createdAt) {
                const date = new Date(patient.createdAt);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                if (monthCounts.hasOwnProperty(monthKey)) {
                    monthCounts[monthKey]++;
                }
            }
        });

        console.log('Processed patients by month:', monthCounts);
        return Object.entries(monthCounts).map(([name, value]) => ({ name, value }));
    };

    const processMedicationsByStatus = (medications: any): ChartData[] => {
        console.log('Processing medications by status:', medications);

        // Ensure medications is an array
        const medicationsArray = Array.isArray(medications) ? medications : [];

        const statusCounts: { [key: string]: number } = {
            'Active': 0,
            'Completed': 0,
            'Discontinued': 0,
            'Paused': 0
        };

        medicationsArray.forEach(medication => {
            if (medication) {
                const status = medication.status || 'Active';
                const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
                if (statusCounts.hasOwnProperty(capitalizedStatus)) {
                    statusCounts[capitalizedStatus]++;
                }
            }
        });

        return [
            { name: 'Active', value: statusCounts.Active, color: '#4caf50' },
            { name: 'Completed', value: statusCounts.Completed, color: '#2196f3' },
            { name: 'Discontinued', value: statusCounts.Discontinued, color: '#ff9800' },
            { name: 'Paused', value: statusCounts.Paused, color: '#9e9e9e' },
        ].filter(item => item.value > 0);
    };

    const processClinicalNotesByType = (notes: any): ChartData[] => {
        console.log('Processing clinical notes by type:', notes);

        // Ensure notes is an array
        const notesArray = Array.isArray(notes) ? notes : [];

        const typeCounts: { [key: string]: number } = {};

        notesArray.forEach(note => {
            if (note) {
                const type = note.type || note.noteType || 'General';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
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
    };

    const processMTRsByStatus = (mtrs: any): ChartData[] => {
        console.log('Processing MTRs by status:', mtrs);

        // Ensure mtrs is an array
        const mtrsArray = Array.isArray(mtrs) ? mtrs : [];

        const statusCounts: { [key: string]: number } = {
            'In Progress': 0,
            'Completed': 0,
            'On Hold': 0,
            'Scheduled': 0
        };

        mtrsArray.forEach(mtr => {
            if (mtr) {
                const status = mtr.status || 'Scheduled';
                const formattedStatus = status.replace(/([A-Z])/g, ' $1').trim();
                const capitalizedStatus = formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1).toLowerCase();

                if (statusCounts.hasOwnProperty(capitalizedStatus)) {
                    statusCounts[capitalizedStatus]++;
                } else {
                    statusCounts['Scheduled']++;
                }
            }
        });

        return [
            { name: 'In Progress', value: statusCounts['In Progress'], color: '#ff9800' },
            { name: 'Completed', value: statusCounts.Completed, color: '#4caf50' },
            { name: 'On Hold', value: statusCounts['On Hold'], color: '#9e9e9e' },
            { name: 'Scheduled', value: statusCounts.Scheduled, color: '#2196f3' },
        ].filter(item => item.value > 0);
    };

    const processPatientAgeDistribution = (patients: any): ChartData[] => {
        console.log('Processing patient age distribution:', patients);

        // Ensure patients is an array
        const patientsArray = Array.isArray(patients) ? patients : [];

        const ageCounts: { [key: string]: number } = {
            '18-30': 0,
            '31-45': 0,
            '46-60': 0,
            '61-75': 0,
            '75+': 0
        };

        patientsArray.forEach(patient => {
            if (patient && patient.dateOfBirth) {
                const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                if (age >= 18 && age <= 30) ageCounts['18-30']++;
                else if (age >= 31 && age <= 45) ageCounts['31-45']++;
                else if (age >= 46 && age <= 60) ageCounts['46-60']++;
                else if (age >= 61 && age <= 75) ageCounts['61-75']++;
                else if (age > 75) ageCounts['75+']++;
            }
        });

        return Object.entries(ageCounts).map(([name, value]) => ({ name, value }));
    };

    const processMonthlyActivity = (notes: any, medications: unknown): ChartData[] => {
        console.log('Processing monthly activity:', { notes, medications });

        // Ensure both are arrays
        const notesArray = Array.isArray(notes) ? notes : [];
        const medicationsArray = Array.isArray(medications) ? medications : [];

        const monthCounts: { [key: string]: number } = {};
        const currentDate = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            monthCounts[monthKey] = 0;
        }

        // Count notes by month
        notesArray.forEach(note => {
            if (note && note.createdAt) {
                const date = new Date(note.createdAt);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                if (monthCounts.hasOwnProperty(monthKey)) {
                    monthCounts[monthKey]++;
                }
            }
        });

        // Count medications by month
        medicationsArray.forEach(medication => {
            if (medication && medication.createdAt) {
                const date = new Date(medication.createdAt);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                if (monthCounts.hasOwnProperty(monthKey)) {
                    monthCounts[monthKey]++;
                }
            }
        });

        return Object.entries(monthCounts).map(([name, value]) => ({ name, value }));
    };

    return data;
};