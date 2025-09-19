export declare class WorkspaceStatsCronService {
    private dailyRecalculationJob;
    private monthlyApiResetJob;
    private staleStatsCheckJob;
    start(): void;
    stop(): void;
    private startDailyRecalculation;
    private startMonthlyApiReset;
    private startStaleStatsCheck;
    triggerDailyRecalculation(): Promise<void>;
    triggerMonthlyApiReset(): Promise<void>;
    getStatus(): {
        dailyRecalculation: boolean;
        monthlyApiReset: boolean;
        staleStatsCheck: boolean;
    };
}
declare const _default: WorkspaceStatsCronService;
export default _default;
//# sourceMappingURL=WorkspaceStatsCronService.d.ts.map