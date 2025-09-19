import { EventEmitter } from 'events';
export interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
    metadata?: Record<string, any>;
}
export interface AlertRule {
    id: string;
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    channels: string[];
}
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'firing' | 'resolved';
    firedAt: Date;
    resolvedAt?: Date;
    message: string;
}
export declare class PerformanceCollector extends EventEmitter {
    private metrics;
    private maxMetrics;
    private alertRules;
    private activeAlerts;
    private alertHistory;
    constructor();
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>, metadata?: Record<string, any>): void;
    recordDatabaseQuery(operation: string, collection: string, duration: number, documentsExamined: number, documentsReturned: number, indexUsed: boolean): void;
    recordApiEndpoint(method: string, path: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number): void;
    recordMemoryUsage(): void;
    recordCpuUsage(): void;
    recordInterventionMetrics(operation: string, workplaceId: string, duration: number, success: boolean, metadata?: Record<string, any>): void;
    getMetrics(name?: string, startTime?: Date, endTime?: Date, tags?: Record<string, string>): PerformanceMetric[];
    getAggregatedStats(name: string, startTime?: Date, endTime?: Date, tags?: Record<string, string>): {
        count: number;
        sum: number;
        avg: number;
        min: number;
        max: number;
        p50: number;
        p95: number;
        p99: number;
    };
    addAlertRule(rule: Omit<AlertRule, 'id'>): string;
    private checkAlertRules;
    private initializeDefaultRules;
    startSystemMetricsCollection(): void;
    generatePerformanceReport(startTime: Date, endTime: Date): {
        summary: Record<string, any>;
        apiPerformance: Record<string, any>;
        databasePerformance: Record<string, any>;
        systemMetrics: Record<string, any>;
        alerts: Alert[];
    };
    private generateId;
    private percentile;
    private evaluateCondition;
    private generateAlertMessage;
    private startMetricsCleanup;
}
export declare const createPerformanceMiddleware: (collector: PerformanceCollector) => (req: any, res: any, next: any) => void;
export declare const performanceCollector: PerformanceCollector;
export default performanceCollector;
//# sourceMappingURL=performanceMonitoring.d.ts.map