declare class MTRNotificationScheduler {
    private jobs;
    start(): void;
    stop(): void;
    private scheduleOverdueFollowUpCheck;
    private schedulePendingReminderProcessing;
    private scheduleNotificationCleanup;
    scheduleDailyDigest(): void;
    scheduleWeeklyReport(): void;
    private cleanupOldNotifications;
    private sendDailyDigest;
    private sendWeeklyReport;
    getJobStatus(): Record<string, boolean>;
    triggerJob(jobName: string): Promise<void>;
}
export declare const mtrNotificationScheduler: MTRNotificationScheduler;
export default mtrNotificationScheduler;
//# sourceMappingURL=mtrNotificationScheduler.d.ts.map