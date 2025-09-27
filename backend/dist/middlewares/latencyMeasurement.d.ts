import { Request, Response, NextFunction } from 'express';
interface LatencyMetric {
    endpoint: string;
    method: string;
    duration: number;
    timestamp: Date;
    statusCode: number;
    userAgent?: string;
    ip?: string;
}
declare class LatencyTracker {
    private metrics;
    private readonly maxMetrics;
    addMetric(metric: LatencyMetric): void;
    getMetrics(endpoint?: string, limit?: number): LatencyMetric[];
    getStats(endpoint?: string): {
        count: number;
        p50: number;
        p95: number;
        p99: number;
        avg: number;
        min: number;
        max: number;
    };
    private percentile;
    getTopEndpoints(limit?: number): Array<{
        endpoint: string;
        count: number;
        avgDuration: number;
        p95Duration: number;
    }>;
    clearMetrics(): void;
}
declare const latencyTracker: LatencyTracker;
export declare const latencyMeasurementMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export { latencyTracker, LatencyMetric };
//# sourceMappingURL=latencyMeasurement.d.ts.map