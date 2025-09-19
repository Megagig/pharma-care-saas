"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../utils/logger"));
const performanceOptimizationService_1 = __importDefault(require("../services/performanceOptimizationService"));
class PerformanceMiddleware {
    constructor() {
        this.requestMetrics = new Map();
        this.slowRequestThreshold = 5000;
        this.memoryWarningThreshold = 0.8;
        this.cpuWarningThreshold = 0.8;
        this.monitor = (req, res, next) => {
            const startTime = Date.now();
            const startCpuUsage = process.cpuUsage();
            const startMemory = process.memoryUsage();
            const requestId = this.generateRequestId();
            req.requestId = requestId;
            let queryCount = 0;
            let cacheHits = 0;
            let cacheMisses = 0;
            const originalQuery = req.query;
            req.query = new Proxy(originalQuery, {
                get: (target, prop) => {
                    if (typeof prop === 'string' && prop.startsWith('db_')) {
                        queryCount++;
                    }
                    return target[prop];
                },
            });
            const originalJson = res.json;
            res.json = (body) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const endCpuUsage = process.cpuUsage(startCpuUsage);
                const endMemory = process.memoryUsage();
                const metrics = {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    responseTime,
                    memoryUsage: endMemory,
                    cpuUsage: endCpuUsage,
                    queryCount,
                    cacheHits,
                    cacheMisses,
                    timestamp: new Date(startTime),
                    userId: req.user?._id?.toString(),
                    workplaceId: req.workspaceContext?.workspace?._id?.toString(),
                };
                this.storeMetrics(metrics);
                this.checkPerformanceWarnings(metrics);
                if (responseTime > this.slowRequestThreshold) {
                    logger_1.default.warn('Slow request detected', {
                        requestId,
                        method: req.method,
                        url: req.originalUrl,
                        responseTime,
                        statusCode: res.statusCode,
                        userId: req.user?._id?.toString(),
                    });
                }
                return originalJson.call(res, body);
            };
            next();
        };
        this.monitorQuery = (queryType, collection) => {
            return (req, res, next) => {
                const startTime = Date.now();
                const originalJson = res.json;
                res.json = function (body) {
                    const queryTime = Date.now() - startTime;
                    if (queryTime > 1000) {
                        logger_1.default.warn('Slow database query detected', {
                            requestId: req.requestId,
                            queryType,
                            collection,
                            queryTime,
                            url: req.originalUrl,
                        });
                    }
                    performanceOptimizationService_1.default.updateConnectionPoolStats({
                        totalConnections: 10,
                        activeConnections: 5,
                        idleConnections: 5,
                        waitingRequests: 0,
                        averageWaitTime: queryTime,
                        connectionErrors: 0,
                    });
                    return originalJson.call(this, body);
                };
                next();
            };
        };
        this.monitorMemory = (req, res, next) => {
            const memoryUsage = process.memoryUsage();
            const heapUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
            if (heapUsagePercent > this.memoryWarningThreshold) {
                logger_1.default.warn('High memory usage detected', {
                    requestId: req.requestId,
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsagePercent: Math.round(heapUsagePercent * 100),
                    url: req.originalUrl,
                });
                if (global.gc) {
                    global.gc();
                    logger_1.default.info('Garbage collection triggered');
                }
            }
            next();
        };
        this.monitorCache = (cacheType) => {
            return (req, res, next) => {
                const startTime = Date.now();
                req.cacheMetrics = {
                    type: cacheType,
                    startTime,
                    hits: 0,
                    misses: 0,
                };
                next();
            };
        };
        this.monitorRateLimit = (req, res, next) => {
            const rateLimitHeaders = {
                limit: res.get('X-RateLimit-Limit'),
                remaining: res.get('X-RateLimit-Remaining'),
                reset: res.get('X-RateLimit-Reset'),
            };
            if (rateLimitHeaders.remaining && parseInt(rateLimitHeaders.remaining) < 10) {
                logger_1.default.warn('Rate limit approaching', {
                    requestId: req.requestId,
                    userId: req.user?._id,
                    remaining: rateLimitHeaders.remaining,
                    limit: rateLimitHeaders.limit,
                    url: req.originalUrl,
                });
            }
            next();
        };
        this.monitorBackgroundJobs = (req, res, next) => {
            const jobTriggeringEndpoints = [
                '/api/diagnostics',
                '/api/lab/orders',
                '/api/interactions/check',
            ];
            const isJobTrigger = jobTriggeringEndpoints.some(endpoint => req.originalUrl.includes(endpoint));
            if (isJobTrigger) {
                const queueSize = this.getBackgroundJobQueueSize();
                if (queueSize > 100) {
                    logger_1.default.warn('High background job queue size', {
                        requestId: req.requestId,
                        queueSize,
                        url: req.originalUrl,
                    });
                }
            }
            next();
        };
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    storeMetrics(metrics) {
        this.requestMetrics.set(metrics.requestId, metrics);
        if (this.requestMetrics.size > 1000) {
            const oldestKey = this.requestMetrics.keys().next().value;
            if (oldestKey) {
                this.requestMetrics.delete(oldestKey);
            }
        }
        logger_1.default.debug('Request performance metrics', {
            requestId: metrics.requestId,
            method: metrics.method,
            url: metrics.url,
            responseTime: metrics.responseTime,
            statusCode: metrics.statusCode,
            memoryUsed: metrics.memoryUsage.heapUsed,
            queryCount: metrics.queryCount,
        });
    }
    checkPerformanceWarnings(metrics) {
        const warnings = [];
        if (metrics.responseTime > this.slowRequestThreshold) {
            warnings.push(`Slow response time: ${metrics.responseTime}ms`);
        }
        const memoryPercent = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
        if (memoryPercent > this.memoryWarningThreshold) {
            warnings.push(`High memory usage: ${Math.round(memoryPercent * 100)}%`);
        }
        if (metrics.cpuUsage) {
            const cpuPercent = (metrics.cpuUsage.user + metrics.cpuUsage.system) / 1000000;
            if (cpuPercent > this.cpuWarningThreshold) {
                warnings.push(`High CPU usage: ${Math.round(cpuPercent * 100)}%`);
            }
        }
        if (metrics.queryCount > 10) {
            warnings.push(`High query count: ${metrics.queryCount}`);
        }
        if (warnings.length > 0) {
            logger_1.default.warn('Performance warnings detected', {
                requestId: metrics.requestId,
                warnings,
                metrics: {
                    responseTime: metrics.responseTime,
                    memoryUsage: metrics.memoryUsage.heapUsed,
                    queryCount: metrics.queryCount,
                },
            });
        }
    }
    getBackgroundJobQueueSize() {
        return Math.floor(Math.random() * 50);
    }
    getPerformanceStats() {
        const metrics = Array.from(this.requestMetrics.values());
        if (metrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                slowRequests: 0,
                errorRate: 0,
                memoryTrend: [],
                topSlowEndpoints: [],
            };
        }
        const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
        const slowRequests = metrics.filter(m => m.responseTime > this.slowRequestThreshold).length;
        const errorRequests = metrics.filter(m => m.statusCode >= 400).length;
        const endpointStats = new Map();
        for (const metric of metrics) {
            const endpoint = `${metric.method} ${metric.url.split('?')[0]}`;
            const existing = endpointStats.get(endpoint) || { totalTime: 0, count: 0 };
            existing.totalTime += metric.responseTime;
            existing.count++;
            endpointStats.set(endpoint, existing);
        }
        const topSlowEndpoints = Array.from(endpointStats.entries())
            .map(([url, stats]) => ({
            url,
            averageResponseTime: stats.totalTime / stats.count,
            requestCount: stats.count,
        }))
            .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
            .slice(0, 10);
        const memoryTrend = metrics
            .slice(-10)
            .map(m => m.memoryUsage.heapUsed);
        return {
            totalRequests: metrics.length,
            averageResponseTime: totalResponseTime / metrics.length,
            slowRequests,
            errorRate: errorRequests / metrics.length,
            memoryTrend,
            topSlowEndpoints,
        };
    }
    getRealTimeMetrics() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const last100Requests = Array.from(this.requestMetrics.values())
            .slice(-100);
        const recentRequests = Array.from(this.requestMetrics.values())
            .filter(m => m.timestamp.getTime() > oneMinuteAgo);
        const averageResponseTime = last100Requests.length > 0 ?
            last100Requests.reduce((sum, m) => sum + m.responseTime, 0) / last100Requests.length : 0;
        return {
            currentMemoryUsage: process.memoryUsage(),
            activeRequests: 0,
            requestsPerMinute: recentRequests.length,
            averageResponseTimeLast100: averageResponseTime,
        };
    }
    clearOldMetrics(olderThanMs = 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        for (const [requestId, metrics] of this.requestMetrics.entries()) {
            if (metrics.timestamp.getTime() < cutoff) {
                this.requestMetrics.delete(requestId);
            }
        }
    }
    exportMetrics() {
        return Array.from(this.requestMetrics.values());
    }
}
exports.default = new PerformanceMiddleware();
//# sourceMappingURL=performanceMiddleware.js.map