export declare class MemoryManagementService {
    private static instance;
    private isMonitoring;
    private monitoringInterval;
    private readonly MONITORING_INTERVAL_MS;
    private constructor();
    static getInstance(): MemoryManagementService;
    startMonitoring(): void;
    stopMonitoring(): void;
    getMemoryStats(): {
        used: number;
        total: number;
        percentage: number;
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    private checkMemoryUsage;
    private performMemoryCleanup;
    private clearApplicationCaches;
    private clearModuleCache;
    private clearCustomCaches;
    getMemoryReport(): {
        current: ReturnType<typeof this.getMemoryStats>;
        monitoring: {
            active: boolean;
            interval: number;
            threshold: number;
        };
        recommendations: string[];
    };
    isMonitoringActive(): boolean;
}
declare const _default: MemoryManagementService;
export default _default;
//# sourceMappingURL=MemoryManagementService.d.ts.map