interface SlowQuery {
    command: string;
    collection: string;
    duration: number;
    timestamp: Date;
    query?: any;
    planSummary?: string;
}
interface DatabaseStats {
    collections: Array<{
        name: string;
        count: number;
        size: number;
        avgObjSize: number;
        indexes: number;
    }>;
    indexes: Array<{
        collection: string;
        name: string;
        size: number;
        usage: number;
    }>;
    slowQueries: SlowQuery[];
    connectionStats: {
        current: number;
        available: number;
        totalCreated: number;
    };
}
declare class DatabaseProfiler {
    private slowQueries;
    private readonly maxSlowQueries;
    private profilingEnabled;
    enableProfiling(slowMs?: number): Promise<void>;
    disableProfiling(): Promise<void>;
    private startProfilingCollection;
    private addSlowQuery;
    getDatabaseStats(): Promise<DatabaseStats>;
    private getIndexUsageStats;
    getSlowQueries(limit?: number): SlowQuery[];
    createOptimalIndexes(): Promise<void>;
    analyzeSlowQueries(): Promise<Array<{
        collection: string;
        query: string;
        avgDuration: number;
        count: number;
        recommendation: string;
    }>>;
    clearSlowQueries(): void;
}
declare const _default: DatabaseProfiler;
export default _default;
//# sourceMappingURL=DatabaseProfiler.d.ts.map