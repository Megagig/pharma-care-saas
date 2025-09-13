export interface OrderProcessingMetrics {
    orderId: string;
    workplaceId: string;
    patientId: string;
    orderCreationTime: number;
    pdfGenerationTime: number;
    totalProcessingTime: number;
    testCount: number;
    pdfSize: number;
    success: boolean;
    errorType?: string;
    timestamp: Date;
    userId: string;
    priority: 'routine' | 'urgent' | 'stat';
}
export interface PDFGenerationMetrics {
    orderId: string;
    templateRenderTime: number;
    qrCodeGenerationTime: number;
    barcodeGenerationTime: number;
    puppeteerProcessingTime: number;
    totalGenerationTime: number;
    pdfSize: number;
    pageCount: number;
    testCount: number;
    success: boolean;
    errorType?: string;
    fromCache: boolean;
    timestamp: Date;
    workplaceId: string;
}
export interface AIServiceMetrics {
    orderId: string;
    requestPreparationTime: number;
    aiServiceResponseTime: number;
    resultProcessingTime: number;
    totalAIProcessingTime: number;
    inputTokens?: number;
    outputTokens?: number;
    requestSize: number;
    responseSize: number;
    success: boolean;
    errorType?: string;
    retryCount: number;
    redFlagsCount: number;
    recommendationsCount: number;
    confidenceScore?: number;
    timestamp: Date;
    workplaceId: string;
    patientId: string;
}
export interface DatabaseQueryMetrics {
    operation: string;
    collection: string;
    queryTime: number;
    documentsAffected: number;
    indexesUsed: string[];
    success: boolean;
    errorType?: string;
    timestamp: Date;
    workplaceId?: string;
    userId?: string;
}
export interface CacheMetrics {
    operation: 'get' | 'set' | 'delete' | 'invalidate';
    cacheKey: string;
    operationTime: number;
    hit: boolean;
    dataSize?: number;
    ttl?: number;
    success: boolean;
    errorType?: string;
    timestamp: Date;
    workplaceId?: string;
}
export interface PerformanceSummary {
    timeRange: {
        start: Date;
        end: Date;
    };
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    averageOrderProcessingTime: number;
    totalPDFsGenerated: number;
    averagePDFGenerationTime: number;
    averagePDFSize: number;
    pdfCacheHitRate: number;
    totalAIRequests: number;
    averageAIResponseTime: number;
    aiSuccessRate: number;
    averageRedFlags: number;
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    cacheOperations: number;
    topErrors: Array<{
        errorType: string;
        count: number;
        percentage: number;
    }>;
}
export declare class ManualLabPerformanceService {
    private static readonly METRICS_TTL;
    private static readonly REDIS_KEY_PREFIX;
    static recordOrderProcessingMetrics(metrics: OrderProcessingMetrics): Promise<void>;
    static recordPDFGenerationMetrics(metrics: PDFGenerationMetrics): Promise<void>;
    static recordAIServiceMetrics(metrics: AIServiceMetrics): Promise<void>;
    static recordDatabaseQueryMetrics(metrics: DatabaseQueryMetrics): Promise<void>;
    static recordCacheMetrics(metrics: CacheMetrics): Promise<void>;
    static getPerformanceSummary(workplaceId: string, startTime: Date, endTime: Date): Promise<PerformanceSummary>;
    static getRealTimeMetrics(workplaceId: string): Promise<{
        activeOrders: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
        lastUpdated: Date;
    }>;
    static getPerformanceAlerts(workplaceId: string): Promise<Array<{
        type: 'warning' | 'critical';
        message: string;
        metric: string;
        value: number;
        threshold: number;
        timestamp: Date;
    }>>;
    private static getTimeSlot;
    private static getTimeSlots;
    private static collectTimeSeriesMetrics;
    private static calculateAverage;
    private static calculatePercentage;
    private static analyzeErrors;
    static cleanupOldMetrics(): Promise<void>;
}
export default ManualLabPerformanceService;
//# sourceMappingURL=manualLabPerformanceService.d.ts.map