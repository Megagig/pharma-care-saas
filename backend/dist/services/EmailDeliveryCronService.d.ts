export declare class EmailDeliveryCronService {
    private retryJobRunning;
    private cleanupJobRunning;
    private bounceJobRunning;
    start(): void;
    stop(): void;
    getStatus(): {
        retryJobRunning: boolean;
        cleanupJobRunning: boolean;
        bounceJobRunning: boolean;
    };
}
export declare const emailDeliveryCronService: EmailDeliveryCronService;
//# sourceMappingURL=EmailDeliveryCronService.d.ts.map