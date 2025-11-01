"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualLabPerformanceService = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const performanceOptimization_1 = require("../../../utils/performanceOptimization");
class ManualLabPerformanceService {
    static async recordOrderProcessingMetrics(metrics) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics storage');
                return;
            }
            const key = `${this.REDIS_KEY_PREFIX}:order:${metrics.orderId}:${Date.now()}`;
            await redisClient.setex(key, this.METRICS_TTL, JSON.stringify(metrics));
            const timeSeriesKey = `${this.REDIS_KEY_PREFIX}:timeseries:order:${metrics.workplaceId}:${this.getTimeSlot(metrics.timestamp)}`;
            await redisClient.lpush(timeSeriesKey, JSON.stringify(metrics));
            await redisClient.expire(timeSeriesKey, this.METRICS_TTL);
            logger_1.default.debug('Order processing metrics recorded', {
                orderId: metrics.orderId,
                processingTime: metrics.totalProcessingTime,
                success: metrics.success,
                service: 'manual-lab-performance'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record order processing metrics', {
                orderId: metrics.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
    static async recordPDFGenerationMetrics(metrics) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics storage');
                return;
            }
            const key = `${this.REDIS_KEY_PREFIX}:pdf:${metrics.orderId}:${Date.now()}`;
            await redisClient.setex(key, this.METRICS_TTL, JSON.stringify(metrics));
            const timeSeriesKey = `${this.REDIS_KEY_PREFIX}:timeseries:pdf:${metrics.workplaceId}:${this.getTimeSlot(metrics.timestamp)}`;
            await redisClient.lpush(timeSeriesKey, JSON.stringify(metrics));
            await redisClient.expire(timeSeriesKey, this.METRICS_TTL);
            logger_1.default.debug('PDF generation metrics recorded', {
                orderId: metrics.orderId,
                generationTime: metrics.totalGenerationTime,
                pdfSize: metrics.pdfSize,
                fromCache: metrics.fromCache,
                service: 'manual-lab-performance'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record PDF generation metrics', {
                orderId: metrics.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
    static async recordAIServiceMetrics(metrics) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics storage');
                return;
            }
            const key = `${this.REDIS_KEY_PREFIX}:ai:${metrics.orderId}:${Date.now()}`;
            await redisClient.setex(key, this.METRICS_TTL, JSON.stringify(metrics));
            const timeSeriesKey = `${this.REDIS_KEY_PREFIX}:timeseries:ai:${metrics.workplaceId}:${this.getTimeSlot(metrics.timestamp)}`;
            await redisClient.lpush(timeSeriesKey, JSON.stringify(metrics));
            await redisClient.expire(timeSeriesKey, this.METRICS_TTL);
            logger_1.default.debug('AI service metrics recorded', {
                orderId: metrics.orderId,
                responseTime: metrics.aiServiceResponseTime,
                success: metrics.success,
                redFlags: metrics.redFlagsCount,
                service: 'manual-lab-performance'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record AI service metrics', {
                orderId: metrics.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
    static async recordDatabaseQueryMetrics(metrics) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics storage');
                return;
            }
            const key = `${this.REDIS_KEY_PREFIX}:db:${metrics.collection}:${Date.now()}`;
            await redisClient.setex(key, this.METRICS_TTL, JSON.stringify(metrics));
            const timeSeriesKey = `${this.REDIS_KEY_PREFIX}:timeseries:db:${metrics.workplaceId || 'global'}:${this.getTimeSlot(metrics.timestamp)}`;
            await redisClient.lpush(timeSeriesKey, JSON.stringify(metrics));
            await redisClient.expire(timeSeriesKey, this.METRICS_TTL);
            if (metrics.queryTime > 1000) {
                logger_1.default.warn('Slow database query detected', {
                    operation: metrics.operation,
                    collection: metrics.collection,
                    queryTime: metrics.queryTime,
                    documentsAffected: metrics.documentsAffected,
                    service: 'manual-lab-performance'
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to record database query metrics', {
                operation: metrics.operation,
                collection: metrics.collection,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
    static async recordCacheMetrics(metrics) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics storage');
                return;
            }
            const key = `${this.REDIS_KEY_PREFIX}:cache:${Date.now()}`;
            await redisClient.setex(key, this.METRICS_TTL, JSON.stringify(metrics));
            const timeSeriesKey = `${this.REDIS_KEY_PREFIX}:timeseries:cache:${metrics.workplaceId || 'global'}:${this.getTimeSlot(metrics.timestamp)}`;
            await redisClient.lpush(timeSeriesKey, JSON.stringify(metrics));
            await redisClient.expire(timeSeriesKey, this.METRICS_TTL);
            logger_1.default.debug('Cache metrics recorded', {
                operation: metrics.operation,
                cacheKey: metrics.cacheKey,
                hit: metrics.hit,
                operationTime: metrics.operationTime,
                service: 'manual-lab-performance'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record cache metrics', {
                operation: metrics.operation,
                cacheKey: metrics.cacheKey,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
    static async getPerformanceSummary(workplaceId, startTime, endTime) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                throw new Error('Redis not available for metrics retrieval');
            }
            const timeSlots = this.getTimeSlots(startTime, endTime);
            const [orderMetrics, pdfMetrics, aiMetrics, dbMetrics, cacheMetrics] = await Promise.all([
                this.collectTimeSeriesMetrics(redisClient, 'order', workplaceId, timeSlots),
                this.collectTimeSeriesMetrics(redisClient, 'pdf', workplaceId, timeSlots),
                this.collectTimeSeriesMetrics(redisClient, 'ai', workplaceId, timeSlots),
                this.collectTimeSeriesMetrics(redisClient, 'db', workplaceId, timeSlots),
                this.collectTimeSeriesMetrics(redisClient, 'cache', workplaceId, timeSlots)
            ]);
            const summary = {
                timeRange: { start: startTime, end: endTime },
                totalOrders: orderMetrics.length,
                successfulOrders: orderMetrics.filter(m => m.success).length,
                failedOrders: orderMetrics.filter(m => !m.success).length,
                averageOrderProcessingTime: this.calculateAverage(orderMetrics.map(m => m.totalProcessingTime)),
                totalPDFsGenerated: pdfMetrics.length,
                averagePDFGenerationTime: this.calculateAverage(pdfMetrics.map(m => m.totalGenerationTime)),
                averagePDFSize: this.calculateAverage(pdfMetrics.map(m => m.pdfSize)),
                pdfCacheHitRate: this.calculatePercentage(pdfMetrics.filter(m => m.fromCache).length, pdfMetrics.length),
                totalAIRequests: aiMetrics.length,
                averageAIResponseTime: this.calculateAverage(aiMetrics.map(m => m.aiServiceResponseTime)),
                aiSuccessRate: this.calculatePercentage(aiMetrics.filter(m => m.success).length, aiMetrics.length),
                averageRedFlags: this.calculateAverage(aiMetrics.map(m => m.redFlagsCount)),
                totalQueries: dbMetrics.length,
                averageQueryTime: this.calculateAverage(dbMetrics.map(m => m.queryTime)),
                slowQueries: dbMetrics.filter(m => m.queryTime > 1000).length,
                cacheHitRate: this.calculatePercentage(cacheMetrics.filter(m => m.hit).length, cacheMetrics.filter(m => m.operation === 'get').length),
                cacheOperations: cacheMetrics.length,
                topErrors: this.analyzeErrors([...orderMetrics, ...pdfMetrics, ...aiMetrics, ...dbMetrics, ...cacheMetrics])
            };
            logger_1.default.info('Performance summary generated', {
                workplaceId,
                timeRange: `${startTime.toISOString()} - ${endTime.toISOString()}`,
                totalOrders: summary.totalOrders,
                successRate: this.calculatePercentage(summary.successfulOrders, summary.totalOrders),
                service: 'manual-lab-performance'
            });
            return summary;
        }
        catch (error) {
            logger_1.default.error('Failed to generate performance summary', {
                workplaceId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
            throw error;
        }
    }
    static async getRealTimeMetrics(workplaceId) {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                throw new Error('Redis not available for metrics retrieval');
            }
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const recentTimeSlot = this.getTimeSlot(now);
            const [orderMetrics, cacheMetrics] = await Promise.all([
                this.collectTimeSeriesMetrics(redisClient, 'order', workplaceId, [recentTimeSlot]),
                this.collectTimeSeriesMetrics(redisClient, 'cache', workplaceId, [recentTimeSlot])
            ]);
            const recentOrders = orderMetrics.filter(m => new Date(m.timestamp) >= fiveMinutesAgo);
            const recentCacheOps = cacheMetrics.filter(m => new Date(m.timestamp) >= fiveMinutesAgo);
            return {
                activeOrders: recentOrders.length,
                averageResponseTime: this.calculateAverage(recentOrders.map(m => m.totalProcessingTime)),
                errorRate: this.calculatePercentage(recentOrders.filter(m => !m.success).length, recentOrders.length),
                cacheHitRate: this.calculatePercentage(recentCacheOps.filter(m => m.operation === 'get' && m.hit).length, recentCacheOps.filter(m => m.operation === 'get').length),
                lastUpdated: now
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get real-time metrics', {
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
            throw error;
        }
    }
    static async getPerformanceAlerts(workplaceId) {
        try {
            const realTimeMetrics = await this.getRealTimeMetrics(workplaceId);
            const alerts = [];
            if (realTimeMetrics.averageResponseTime > 10000) {
                alerts.push({
                    type: 'critical',
                    message: 'Average response time is critically high',
                    metric: 'averageResponseTime',
                    value: realTimeMetrics.averageResponseTime,
                    threshold: 10000,
                    timestamp: new Date()
                });
            }
            else if (realTimeMetrics.averageResponseTime > 5000) {
                alerts.push({
                    type: 'warning',
                    message: 'Average response time is elevated',
                    metric: 'averageResponseTime',
                    value: realTimeMetrics.averageResponseTime,
                    threshold: 5000,
                    timestamp: new Date()
                });
            }
            if (realTimeMetrics.errorRate > 10) {
                alerts.push({
                    type: 'critical',
                    message: 'Error rate is critically high',
                    metric: 'errorRate',
                    value: realTimeMetrics.errorRate,
                    threshold: 10,
                    timestamp: new Date()
                });
            }
            else if (realTimeMetrics.errorRate > 5) {
                alerts.push({
                    type: 'warning',
                    message: 'Error rate is elevated',
                    metric: 'errorRate',
                    value: realTimeMetrics.errorRate,
                    threshold: 5,
                    timestamp: new Date()
                });
            }
            if (realTimeMetrics.cacheHitRate < 50) {
                alerts.push({
                    type: 'warning',
                    message: 'Cache hit rate is low',
                    metric: 'cacheHitRate',
                    value: realTimeMetrics.cacheHitRate,
                    threshold: 50,
                    timestamp: new Date()
                });
            }
            return alerts;
        }
        catch (error) {
            logger_1.default.error('Failed to get performance alerts', {
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
            return [];
        }
    }
    static getTimeSlot(timestamp) {
        const hour = Math.floor(timestamp.getTime() / (60 * 60 * 1000));
        return hour.toString();
    }
    static getTimeSlots(startTime, endTime) {
        const slots = [];
        const startHour = Math.floor(startTime.getTime() / (60 * 60 * 1000));
        const endHour = Math.floor(endTime.getTime() / (60 * 60 * 1000));
        for (let hour = startHour; hour <= endHour; hour++) {
            slots.push(hour.toString());
        }
        return slots;
    }
    static async collectTimeSeriesMetrics(redisClient, metricType, workplaceId, timeSlots) {
        const allMetrics = [];
        for (const slot of timeSlots) {
            try {
                const key = `${this.REDIS_KEY_PREFIX}:timeseries:${metricType}:${workplaceId}:${slot}`;
                const metrics = await redisClient.lrange(key, 0, -1);
                for (const metricStr of metrics) {
                    try {
                        const metric = JSON.parse(metricStr);
                        allMetrics.push(metric);
                    }
                    catch (parseError) {
                        logger_1.default.warn('Failed to parse metric data', { metricStr });
                    }
                }
            }
            catch (error) {
                logger_1.default.warn('Failed to retrieve metrics from time slot', {
                    metricType,
                    workplaceId,
                    slot,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return allMetrics;
    }
    static calculateAverage(values) {
        if (values.length === 0)
            return 0;
        const sum = values.reduce((acc, val) => acc + (val || 0), 0);
        return Math.round(sum / values.length);
    }
    static calculatePercentage(numerator, denominator) {
        if (denominator === 0)
            return 0;
        return Math.round((numerator / denominator) * 100);
    }
    static analyzeErrors(metrics) {
        const errorCounts = {};
        const failedMetrics = metrics.filter(m => !m.success && m.errorType);
        failedMetrics.forEach(m => {
            errorCounts[m.errorType] = (errorCounts[m.errorType] || 0) + 1;
        });
        const totalErrors = failedMetrics.length;
        return Object.entries(errorCounts)
            .map(([errorType, count]) => ({
            errorType,
            count,
            percentage: this.calculatePercentage(count, totalErrors)
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    static async cleanupOldMetrics() {
        try {
            const redisClient = await (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                logger_1.default.warn('Redis not available for metrics cleanup');
                return;
            }
            const cutoffTime = Date.now() - (this.METRICS_TTL * 1000);
            const pattern = `${this.REDIS_KEY_PREFIX}:*`;
            const keys = await redisClient.keys(pattern);
            let deletedCount = 0;
            for (const key of keys) {
                try {
                    const ttl = await redisClient.ttl(key);
                    if (ttl === -1) {
                        await redisClient.del(key);
                        deletedCount++;
                    }
                }
                catch (error) {
                    logger_1.default.warn('Failed to check/delete metric key', { key });
                }
            }
            logger_1.default.info('Metrics cleanup completed', {
                totalKeys: keys.length,
                deletedKeys: deletedCount,
                service: 'manual-lab-performance'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup old metrics', {
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance'
            });
        }
    }
}
exports.ManualLabPerformanceService = ManualLabPerformanceService;
ManualLabPerformanceService.METRICS_TTL = 7 * 24 * 60 * 60;
ManualLabPerformanceService.REDIS_KEY_PREFIX = 'manual_lab:metrics';
exports.default = ManualLabPerformanceService;
//# sourceMappingURL=manualLabPerformanceService.js.map