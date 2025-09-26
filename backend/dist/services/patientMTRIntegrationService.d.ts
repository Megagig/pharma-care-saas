export interface PatientMTRSummary {
    patientId: string;
    totalMTRSessions: number;
    activeMTRSessions: number;
    completedMTRSessions: number;
    lastMTRDate?: string;
    nextScheduledMTR?: string;
    hasActiveMTR: boolean;
    mtrStatus: 'none' | 'active' | 'overdue' | 'scheduled';
    recentMTRs: any[];
}
export interface MTRPatientData {
    patient: any;
    medications: any[];
    dtps: any[];
    mtrHistory: any[];
    activeMTR?: any;
}
export interface MTRMedicationSync {
    patientMedications: any[];
    mtrMedications: any[];
    syncStatus: 'synced' | 'needs_update' | 'conflicts';
    conflicts?: {
        field: string;
        patientValue: any;
        mtrValue: any;
        medication: string;
    }[];
}
export declare class PatientMTRIntegrationService {
    getPatientMTRSummary(patientId: string, workplaceId: string): Promise<PatientMTRSummary>;
    getPatientDataForMTR(patientId: string, workplaceId: string): Promise<MTRPatientData>;
    syncMedicationsWithMTR(patientId: string, mtrId: string, workplaceId: string): Promise<MTRMedicationSync>;
    getPatientDashboardMTRData(patientId: string, workplaceId: string): Promise<{
        activeMTRs: any[];
        recentMTRs: any[];
        mtrSummary: PatientMTRSummary;
        pendingActions: any[];
    }>;
    searchPatientsWithMTR(params: any, workplaceId: string): Promise<{
        results: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}
export declare const patientMTRIntegrationService: PatientMTRIntegrationService;
//# sourceMappingURL=patientMTRIntegrationService.d.ts.map