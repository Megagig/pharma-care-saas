import { Job } from 'bullmq';
export interface AIAnalysisJobData {
    type: 'drug-interaction' | 'clinical-decision-support' | 'medication-review' | 'patient-risk-assessment';
    patientId: string;
    workspaceId: string;
    userId: string;
    parameters: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}
export interface DataExportJobData {
    type: 'patient-data' | 'clinical-notes' | 'medication-history' | 'audit-logs';
    workspaceId: string;
    userId: string;
    userEmail: string;
    filters: Record<string, any>;
    format: 'pdf' | 'excel' | 'csv' | 'json';
    fileName: string;
    includeAttachments?: boolean;
}
export interface CacheWarmupJobData {
    type: 'dashboard' | 'patient-lists' | 'clinical-notes' | 'medications' | 'reports';
    workspaceId: string;
    targetUsers?: string[];
    priority: 'low' | 'medium' | 'high';
}
export interface DatabaseMaintenanceJobData {
    type: 'index-optimization' | 'cleanup-expired-data' | 'performance-analysis' | 'backup-verification';
    workspaceId?: string;
    parameters: Record<string, any>;
}
export interface JobResult {
    success: boolean;
    data?: any;
    executionTime: number;
    error?: string;
    metrics?: Record<string, any>;
}
export declare class PerformanceJobService {
    private static instance;
    private aiAnalysisQueue;
    private dataExportQueue;
    private cacheWarmupQueue;
    private databaseMaintenanceQueue;
    private aiAnalysisWorker;
    private dataExportWorker;
    private cacheWarmupWorker;
    private databaseMaintenanceWorker;
    private queueEvents;
    private constructor();
    static getInstance(): PerformanceJobService;
    private initializeQueues;
    private initializeWorkers;
    queueAIAnalysis(data: AIAnalysisJobData): Promise<Job<AIAnalysisJobData> | null>;
    queueDataExport(data: DataExportJobData): Promise<Job<DataExportJobData>>;
    queueCacheWarmup(data: CacheWarmupJobData): Promise<Job<CacheWarmupJobData>>;
    queueDatabaseMaintenance(data: DatabaseMaintenanceJobData): Promise<Job<DatabaseMaintenanceJobData>>;
    private processAIAnalysisJob;
    private processDataExportJob;
    private processCacheWarmupJob;
    private processDatabaseMaintenanceJob;
    private setupEventHandlers;
    private scheduleRecurringJobs;
    getJobStatistics(): Promise<Record<string, any>>;
    private getPriority;
    private performDrugInteractionAnalysis;
    private performClinicalDecisionSupport;
    private performMedicationReview;
    private performPatientRiskAssessment;
    private fetchExportData;
    private generateExportFile;
    private sendExportNotification;
    private warmDashboardCache;
    private warmPatientListsCache;
    private warmClinicalNotesCache;
    private warmMedicationsCache;
    private warmReportsCache;
    private cleanupExpiredData;
    private verifyBackupIntegrity;
    shutdown(): Promise<void>;
}
export default PerformanceJobService;
//# sourceMappingURL=PerformanceJobService.d.ts.map