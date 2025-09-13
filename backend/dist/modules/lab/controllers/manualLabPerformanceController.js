"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceDashboard = exports.cleanupOldMetrics = exports.getSystemHealth = exports.clearWorkplaceCache = exports.getCacheStats = exports.getPerformanceAlerts = exports.getRealTimeMetrics = exports.getPerformanceSummary = void 0;
const manualLabPerformanceService_1 = __importDefault(require("../services/manualLabPerformanceService"));
const manualLabCacheService_1 = __importDefault(require("../services/manualLabCacheService"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const logger_1 = __importDefault(require("../../../utils/logger"));
exports.getPerformanceSummary = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { startTime, endTime } = req.query;
    if (!startTime || !endTime) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Start time and end time are required', 400);
    }
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
        }
        if (start >= end) {
            return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Start time must be before end time', 400);
        }
        const maxRangeMs = 30 * 24 * 60 * 60 * 1000;
        if (end.getTime() - start.getTime() > maxRangeMs) {
            return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Time range cannot exceed 30 days', 400);
        }
        const summary = await manualLabPerformanceService_1.default.getPerformanceSummary(context.workplaceId, start, end);
        (0, responseHelpers_1.sendSuccess)(res, {
            summary,
            metadata: {
                requestedRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                generatedAt: new Date().toISOString()
            }
        });
        logger_1.default.info('Performance summary retrieved', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            timeRange: `${start.toISOString()} - ${end.toISOString()}`,
            totalOrders: summary.totalOrders,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve performance summary', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            startTime,
            endTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve performance summary', 500);
    }
});
exports.getRealTimeMetrics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const metrics = await manualLabPerformanceService_1.default.getRealTimeMetrics(context.workplaceId);
        (0, responseHelpers_1.sendSuccess)(res, {
            metrics,
            metadata: {
                generatedAt: new Date().toISOString(),
                dataFreshness: '5 minutes'
            }
        });
        logger_1.default.debug('Real-time metrics retrieved', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            activeOrders: metrics.activeOrders,
            averageResponseTime: metrics.averageResponseTime,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve real-time metrics', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve real-time metrics', 500);
    }
});
exports.getPerformanceAlerts = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const alerts = await manualLabPerformanceService_1.default.getPerformanceAlerts(context.workplaceId);
        (0, responseHelpers_1.sendSuccess)(res, {
            alerts,
            metadata: {
                alertCount: alerts.length,
                criticalAlerts: alerts.filter(a => a.type === 'critical').length,
                warningAlerts: alerts.filter(a => a.type === 'warning').length,
                generatedAt: new Date().toISOString()
            }
        });
        if (alerts.length > 0) {
            logger_1.default.warn('Performance alerts detected', {
                workplaceId: context.workplaceId,
                userId: context.userId,
                alertCount: alerts.length,
                criticalAlerts: alerts.filter(a => a.type === 'critical').length,
                service: 'manual-lab-performance-api'
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve performance alerts', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve performance alerts', 500);
    }
});
exports.getCacheStats = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const stats = await manualLabCacheService_1.default.getCacheStats();
        (0, responseHelpers_1.sendSuccess)(res, {
            stats,
            metadata: {
                generatedAt: new Date().toISOString(),
                workplaceId: context.workplaceId
            }
        });
        logger_1.default.debug('Cache statistics retrieved', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            redisConnected: stats.redisConnected,
            manualLabKeys: stats.manualLabKeys,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve cache statistics', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve cache statistics', 500);
    }
});
exports.clearWorkplaceCache = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to clear cache', 403);
    }
    try {
        await manualLabCacheService_1.default.clearWorkplaceCache(context.workplaceId);
        (0, responseHelpers_1.sendSuccess)(res, {
            message: 'Workplace cache cleared successfully',
            metadata: {
                workplaceId: context.workplaceId,
                clearedAt: new Date().toISOString(),
                clearedBy: context.userId
            }
        });
        logger_1.default.info('Workplace cache cleared', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            userRole: req.user.role,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to clear workplace cache', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to clear workplace cache', 500);
    }
});
exports.getSystemHealth = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const [realTimeMetrics, cacheStats, alerts] = await Promise.all([
            manualLabPerformanceService_1.default.getRealTimeMetrics(context.workplaceId),
            manualLabCacheService_1.default.getCacheStats(),
            manualLabPerformanceService_1.default.getPerformanceAlerts(context.workplaceId)
        ]);
        const criticalAlerts = alerts.filter(a => a.type === 'critical');
        const warningAlerts = alerts.filter(a => a.type === 'warning');
        let healthStatus;
        if (criticalAlerts.length > 0) {
            healthStatus = 'critical';
        }
        else if (warningAlerts.length > 0 || realTimeMetrics.errorRate > 5) {
            healthStatus = 'warning';
        }
        else {
            healthStatus = 'healthy';
        }
        const health = {
            status: healthStatus,
            timestamp: new Date().toISOString(),
            metrics: {
                activeOrders: realTimeMetrics.activeOrders,
                averageResponseTime: realTimeMetrics.averageResponseTime,
                errorRate: realTimeMetrics.errorRate,
                cacheHitRate: realTimeMetrics.cacheHitRate
            },
            cache: {
                connected: cacheStats.redisConnected,
                totalKeys: cacheStats.totalKeys,
                manualLabKeys: cacheStats.manualLabKeys,
                memoryUsage: cacheStats.memoryUsage
            },
            alerts: {
                total: alerts.length,
                critical: criticalAlerts.length,
                warning: warningAlerts.length
            }
        };
        (0, responseHelpers_1.sendSuccess)(res, {
            health,
            metadata: {
                workplaceId: context.workplaceId,
                generatedAt: new Date().toISOString()
            }
        });
        logger_1.default.debug('System health status retrieved', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            healthStatus,
            alertCount: alerts.length,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve system health status', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve system health status', 500);
    }
});
exports.cleanupOldMetrics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to cleanup metrics', 403);
    }
    try {
        await manualLabPerformanceService_1.default.cleanupOldMetrics();
        (0, responseHelpers_1.sendSuccess)(res, {
            message: 'Old metrics cleaned up successfully',
            metadata: {
                cleanedAt: new Date().toISOString(),
                cleanedBy: context.userId
            }
        });
        logger_1.default.info('Old metrics cleaned up', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            userRole: req.user.role,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to cleanup old metrics', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to cleanup old metrics', 500);
    }
});
exports.getPerformanceDashboard = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { timeRange = '24h' } = req.query;
    try {
        const endTime = new Date();
        let startTime;
        switch (timeRange) {
            case '1h':
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
                break;
            case '6h':
                startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        }
        const [summary, realTimeMetrics, alerts, cacheStats] = await Promise.all([
            manualLabPerformanceService_1.default.getPerformanceSummary(context.workplaceId, startTime, endTime),
            manualLabPerformanceService_1.default.getRealTimeMetrics(context.workplaceId),
            manualLabPerformanceService_1.default.getPerformanceAlerts(context.workplaceId),
            manualLabCacheService_1.default.getCacheStats()
        ]);
        const dashboard = {
            timeRange: {
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                range: timeRange
            },
            summary,
            realTime: realTimeMetrics,
            alerts: {
                items: alerts,
                counts: {
                    total: alerts.length,
                    critical: alerts.filter(a => a.type === 'critical').length,
                    warning: alerts.filter(a => a.type === 'warning').length
                }
            },
            cache: cacheStats,
            metadata: {
                generatedAt: new Date().toISOString(),
                workplaceId: context.workplaceId
            }
        };
        (0, responseHelpers_1.sendSuccess)(res, { dashboard });
        logger_1.default.info('Performance dashboard data retrieved', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            timeRange,
            totalOrders: summary.totalOrders,
            alertCount: alerts.length,
            service: 'manual-lab-performance-api'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve performance dashboard data', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            timeRange,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'manual-lab-performance-api'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve performance dashboard data', 500);
    }
});
exports.default = {
    getPerformanceSummary: exports.getPerformanceSummary,
    getRealTimeMetrics: exports.getRealTimeMetrics,
    getPerformanceAlerts: exports.getPerformanceAlerts,
    getCacheStats: exports.getCacheStats,
    clearWorkplaceCache: exports.clearWorkplaceCache,
    getSystemHealth: exports.getSystemHealth,
    cleanupOldMetrics: exports.cleanupOldMetrics,
    getPerformanceDashboard: exports.getPerformanceDashboard
};
//# sourceMappingURL=manualLabPerformanceController.js.map