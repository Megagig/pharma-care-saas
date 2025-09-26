import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export interface PerformanceMetrics {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
    queryCount: number;
    cacheHits: number;
    cacheMisses: number;
    timestamp: Date;
    userId?: string;
    workplaceId?: string;
}
declare class PerformanceMiddleware {
    private requestMetrics;
    private slowRequestThreshold;
    private memoryWarningThreshold;
    private cpuWarningThreshold;
    monitor: (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorQuery: (queryType: string, collection?: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorMemory: (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorCache: (cacheType: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorRateLimit: (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorBackgroundJobs: (req: AuthRequest, res: Response, next: NextFunction) => void;
    private generateRequestId;
    private storeMetrics;
    private checkPerformanceWarnings;
    private getBackgroundJobQueueSize;
    getPerformanceStats(): {
        totalRequests: number;
        averageResponseTime: number;
        slowRequests: number;
        errorRate: number;
        memoryTrend: number[];
        topSlowEndpoints: Array<{
            url: string;
            averageResponseTime: number;
            requestCount: number;
        }>;
    };
    getRealTimeMetrics(): {
        currentMemoryUsage: NodeJS.MemoryUsage;
        activeRequests: number;
        requestsPerMinute: number;
        averageResponseTimeLast100: number;
    };
    clearOldMetrics(olderThanMs?: number): void;
    exportMetrics(): PerformanceMetrics[];
}
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            cacheMetrics?: {
                type: string;
                startTime: number;
                hits: number;
                misses: number;
            };
        }
    }
}
declare const _default: PerformanceMiddleware;
export default _default;
//# sourceMappingURL=performanceMiddleware.d.ts.map