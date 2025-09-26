export interface RetentionPolicy {
    category: string;
    retentionDays: number;
    archiveAfterDays: number;
    compressionEnabled: boolean;
    exportFormat: 'json' | 'csv';
    archiveLocation: string;
}
export interface ArchiveJob {
    id: string;
    category: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    recordsProcessed: number;
    recordsArchived: number;
    recordsDeleted: number;
    archiveFilePath?: string;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}
declare class AuditRetentionService {
    private static instance;
    private retentionPolicies;
    private archiveJobs;
    private readonly DEFAULT_POLICIES;
    static getInstance(): AuditRetentionService;
    private initializeDefaultPolicies;
    setRetentionPolicy(policy: RetentionPolicy): void;
    getRetentionPolicy(category: string): RetentionPolicy | undefined;
    getAllRetentionPolicies(): RetentionPolicy[];
    runRetentionCleanup(): Promise<{
        totalProcessed: number;
        totalArchived: number;
        totalDeleted: number;
        jobResults: Array<{
            category: string;
            result: any;
        }>;
    }>;
    runCategoryRetention(category: string, policy: RetentionPolicy): Promise<ArchiveJob>;
    private archiveOldRecords;
    private deleteExpiredRecords;
    getArchiveJob(jobId: string): ArchiveJob | undefined;
    getAllArchiveJobs(): ArchiveJob[];
    restoreArchivedRecords(archiveFilePath: string, category: string): Promise<{
        recordsRestored: number;
    }>;
    getRetentionStatistics(): Promise<{
        totalRecords: number;
        archivedRecords: number;
        recordsByCategory: Record<string, {
            total: number;
            archived: number;
        }>;
        oldestRecord: Date | null;
        newestRecord: Date | null;
        archiveJobs: {
            total: number;
            completed: number;
            failed: number;
            running: number;
        };
    }>;
    scheduleRetentionCleanup(intervalHours?: number): void;
    cleanupOldArchiveJobs(daysToKeep?: number): void;
}
export { AuditRetentionService };
export default AuditRetentionService;
//# sourceMappingURL=auditRetentionService.d.ts.map