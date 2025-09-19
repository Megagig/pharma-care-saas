export declare class UsageAlertCronService {
    private usageAlertJob;
    start(): void;
    stop(): void;
    private startUsageAlertCheck;
    triggerUsageAlertCheck(): Promise<void>;
    getStatus(): {
        usageAlertCheck: boolean;
    };
}
declare const _default: UsageAlertCronService;
export default _default;
//# sourceMappingURL=UsageAlertCronService.d.ts.map