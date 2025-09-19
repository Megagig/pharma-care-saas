declare class DiagnosticCronService {
    private jobs;
    initializeCronJobs(): void;
    private scheduleJob;
    startAllJobs(): void;
    stopAllJobs(): void;
    stopJob(name: string): void;
    startJob(name: string): void;
    getJobsStatus(): Record<string, boolean>;
    private processMissedFollowUps;
    private processAdherenceAssessments;
    private processPendingNotifications;
    private checkOverdueFollowUps;
    private checkAdherenceIssues;
    private dailyMaintenance;
    private cleanupOldNotifications;
    private archiveOldFollowUps;
    private generateDailyAdherenceSummary;
    private cleanupExpiredAlerts;
    triggerJob(jobName: string): Promise<void>;
    getAvailableJobs(): string[];
    updateJobSchedule(jobName: string, newSchedule: string): void;
    private getJobFunction;
    shutdown(): Promise<void>;
}
export declare const diagnosticCronService: DiagnosticCronService;
export default diagnosticCronService;
//# sourceMappingURL=diagnosticCronService.d.ts.map