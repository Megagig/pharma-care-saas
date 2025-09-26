import { Job, JobOptions } from 'bull';
interface ExportJobData {
    reportType: string;
    workplaceId: string;
    userId: string;
    userEmail: string;
    filters: any;
    format: 'pdf' | 'excel' | 'csv';
    fileName: string;
    options?: {
        includeCharts?: boolean;
        includeRawData?: boolean;
        customTemplate?: string;
    };
}
interface ReportGenerationJobData {
    reportType: string;
    workplaceId: string;
    scheduleId: string;
    recipients: string[];
    filters: any;
    format: string[];
    templateId?: string;
}
export declare class BackgroundJobService {
    private static instance;
    private exportQueue;
    private reportQueue;
    private cleanupQueue;
    constructor();
    static getInstance(): BackgroundJobService;
    queueExportJob(data: ExportJobData, options?: JobOptions): Promise<Job<ExportJobData>>;
    queueScheduledReport(data: ReportGenerationJobData, options?: JobOptions): Promise<Job<ReportGenerationJobData>>;
    getJobStatus(jobId: string, queueType: 'export' | 'report'): Promise<any>;
    cancelJob(jobId: string, queueType: 'export' | 'report'): Promise<boolean>;
    getQueueStats(): Promise<{
        export: any;
        report: any;
        cleanup: any;
    }>;
    private setupJobProcessors;
    private setupEventHandlers;
    private processExportJob;
    private processScheduledReportJob;
    private processCleanupJob;
    private scheduleCleanupJobs;
    private getQueueStatistics;
    private generateReportData;
    private sendExportNotification;
    private sendExportFailureNotification;
    private sendScheduledReportNotification;
    private sendScheduledReportFailureNotification;
    shutdown(): Promise<void>;
}
declare const _default: BackgroundJobService;
export default _default;
//# sourceMappingURL=BackgroundJobService.d.ts.map