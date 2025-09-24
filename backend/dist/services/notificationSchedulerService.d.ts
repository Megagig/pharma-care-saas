export declare class NotificationSchedulerService {
    private scheduledJobs;
    private isRunning;
    constructor();
    start(): void;
    stop(): void;
    private setupDefaultJobs;
    addJob(id: string, cronExpression: string, taskFunction: () => Promise<void>, description: string): void;
    removeJob(id: string): void;
    private processScheduledNotifications;
    private retryFailedNotifications;
    private sendDailyDigests;
    private sendWeeklyDigests;
    private sendDigestToUser;
    private createDigestContent;
    private cleanupExpiredNotifications;
    private archiveOldNotifications;
    private updateNotificationStatistics;
    scheduleOneTimeNotification(notificationData: any, scheduledFor: Date): Promise<void>;
    getStatus(): {
        isRunning: boolean;
        jobCount: number;
        jobs: Array<{
            id: string;
            description: string;
            cronExpression: string;
        }>;
    };
}
export declare const notificationSchedulerService: NotificationSchedulerService;
export default notificationSchedulerService;
//# sourceMappingURL=notificationSchedulerService.d.ts.map