"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceCollector = exports.createPerformanceMiddleware = exports.PerformanceCollector = void 0;
const logger_1 = __importDefault(require("./logger"));
const events_1 = require("events");
class PerformanceCollector extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.maxMetrics = 1000;
        this.alertRules = [];
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.initializeDefaultRules();
        this.startMetricsCleanup();
    }
    recordMetric(name, value, unit = 'ms', tags = {}, metadata) {
        const metric = {
            id: this.generateId(),
            name,
            value,
            unit,
            timestamp: new Date(),
            tags,
            metadata,
        };
        this.metrics.push(metric);
        this.emit('metric', metric);
        this.checkAlertRules(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    recordDatabaseQuery(operation, collection, duration, documentsExamined, documentsReturned, indexUsed) {
        this.recordMetric('db_query_duration', duration, 'ms', {
            operation,
            collection,
            index_used: indexUsed.toString(),
        }, {
            documentsExamined,
            documentsReturned,
            efficiency: documentsReturned / Math.max(documentsExamined, 1),
        });
        const efficiency = documentsReturned / Math.max(documentsExamined, 1);
        this.recordMetric('db_query_efficiency', efficiency * 100, '%', {
            operation,
            collection,
        });
    }
    recordApiEndpoint(method, path, statusCode, duration, requestSize, responseSize) {
        this.recordMetric('api_request_duration', duration, 'ms', {
            method,
            path,
            status_code: statusCode.toString(),
            status_class: Math.floor(statusCode / 100) + 'xx',
        }, {
            requestSize,
            responseSize,
        });
        this.recordMetric('api_request_rate', 1, 'count', {
            method,
            path,
            status_code: statusCode.toString(),
        });
        if (statusCode >= 400) {
            this.recordMetric('api_error_rate', 1, 'count', {
                method,
                path,
                status_code: statusCode.toString(),
            });
        }
    }
    recordMemoryUsage() {
        const memUsage = process.memoryUsage();
        this.recordMetric('memory_heap_used', memUsage.heapUsed / 1024 / 1024, 'MB');
        this.recordMetric('memory_heap_total', memUsage.heapTotal / 1024 / 1024, 'MB');
        this.recordMetric('memory_external', memUsage.external / 1024 / 1024, 'MB');
        this.recordMetric('memory_rss', memUsage.rss / 1024 / 1024, 'MB');
        const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        this.recordMetric('memory_heap_usage_percent', heapUsagePercent, '%');
    }
    recordCpuUsage() {
        const cpuUsage = process.cpuUsage();
        this.recordMetric('cpu_user_time', cpuUsage.user / 1000, 'ms');
        this.recordMetric('cpu_system_time', cpuUsage.system / 1000, 'ms');
    }
    recordInterventionMetrics(operation, workplaceId, duration, success, metadata) {
        this.recordMetric('intervention_operation_duration', duration, 'ms', {
            operation,
            workplace_id: workplaceId,
            success: success.toString(),
        }, metadata);
        this.recordMetric('intervention_operation_success', success ? 1 : 0, 'count', {
            operation,
            workplace_id: workplaceId,
        });
    }
    getMetrics(name, startTime, endTime, tags) {
        let filtered = this.metrics;
        if (name) {
            filtered = filtered.filter((m) => m.name === name);
        }
        if (startTime) {
            filtered = filtered.filter((m) => m.timestamp >= startTime);
        }
        if (endTime) {
            filtered = filtered.filter((m) => m.timestamp <= endTime);
        }
        if (tags) {
            filtered = filtered.filter((m) => {
                return Object.entries(tags).every(([key, value]) => m.tags[key] === value);
            });
        }
        return filtered;
    }
    getAggregatedStats(name, startTime, endTime, tags) {
        const metrics = this.getMetrics(name, startTime, endTime, tags);
        if (metrics.length === 0) {
            return {
                count: 0,
                sum: 0,
                avg: 0,
                min: 0,
                max: 0,
                p50: 0,
                p95: 0,
                p99: 0,
            };
        }
        const values = metrics.map((m) => m.value).sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        return {
            count: values.length,
            sum,
            avg: sum / values.length,
            min: values[0] || 0,
            max: values[values.length - 1] || 0,
            p50: this.percentile(values, 50),
            p95: this.percentile(values, 95),
            p99: this.percentile(values, 99),
        };
    }
    addAlertRule(rule) {
        const alertRule = {
            id: this.generateId(),
            ...rule,
        };
        this.alertRules.push(alertRule);
        return alertRule.id;
    }
    checkAlertRules(metric) {
        const applicableRules = this.alertRules.filter((rule) => rule.enabled && rule.metric === metric.name);
        for (const rule of applicableRules) {
            const isTriggered = this.evaluateCondition(metric.value, rule.condition, rule.threshold);
            const alertKey = `${rule.id}_${JSON.stringify(metric.tags)}`;
            if (isTriggered) {
                if (!this.activeAlerts.has(alertKey)) {
                    const alert = {
                        id: this.generateId(),
                        ruleId: rule.id,
                        ruleName: rule.name,
                        metric: rule.metric,
                        value: metric.value,
                        threshold: rule.threshold,
                        severity: rule.severity,
                        status: 'firing',
                        firedAt: new Date(),
                        message: this.generateAlertMessage(rule, metric),
                    };
                    this.activeAlerts.set(alertKey, alert);
                    this.alertHistory.push(alert);
                    this.emit('alert', alert);
                    logger_1.default.warn(`Alert fired: ${alert.message}`, {
                        alertId: alert.id,
                        ruleId: rule.id,
                        metric: metric.name,
                        value: metric.value,
                        threshold: rule.threshold,
                    });
                }
            }
            else {
                const activeAlert = this.activeAlerts.get(alertKey);
                if (activeAlert && activeAlert.status === 'firing') {
                    activeAlert.status = 'resolved';
                    activeAlert.resolvedAt = new Date();
                    this.activeAlerts.delete(alertKey);
                    this.emit('alertResolved', activeAlert);
                    logger_1.default.info(`Alert resolved: ${activeAlert.message}`, {
                        alertId: activeAlert.id,
                        duration: activeAlert.resolvedAt.getTime() - activeAlert.firedAt.getTime(),
                    });
                }
            }
        }
    }
    initializeDefaultRules() {
        this.addAlertRule({
            name: 'High API Response Time',
            metric: 'api_request_duration',
            condition: 'gt',
            threshold: 5000,
            duration: 60,
            severity: 'high',
            enabled: true,
            channels: ['email', 'slack'],
        });
        this.addAlertRule({
            name: 'Slow Database Query',
            metric: 'db_query_duration',
            condition: 'gt',
            threshold: 10000,
            duration: 30,
            severity: 'medium',
            enabled: true,
            channels: ['email'],
        });
        this.addAlertRule({
            name: 'High Memory Usage',
            metric: 'memory_heap_usage_percent',
            condition: 'gt',
            threshold: 90,
            duration: 300,
            severity: 'high',
            enabled: true,
            channels: ['email', 'slack'],
        });
        this.addAlertRule({
            name: 'High Error Rate',
            metric: 'api_error_rate',
            condition: 'gt',
            threshold: 10,
            duration: 60,
            severity: 'critical',
            enabled: true,
            channels: ['email', 'slack', 'webhook'],
        });
        this.addAlertRule({
            name: 'Slow Intervention Operation',
            metric: 'intervention_operation_duration',
            condition: 'gt',
            threshold: 3000,
            duration: 120,
            severity: 'medium',
            enabled: true,
            channels: ['email'],
        });
    }
    startSystemMetricsCollection() {
        setInterval(() => {
            this.recordMemoryUsage();
            this.recordCpuUsage();
        }, 30000);
        logger_1.default.info('System metrics collection started');
    }
    generatePerformanceReport(startTime, endTime) {
        const timeRange = { startTime, endTime };
        const apiStats = this.getAggregatedStats('api_request_duration', startTime, endTime);
        const errorStats = this.getAggregatedStats('api_error_rate', startTime, endTime);
        const dbStats = this.getAggregatedStats('db_query_duration', startTime, endTime);
        const dbEfficiencyStats = this.getAggregatedStats('db_query_efficiency', startTime, endTime);
        const memoryStats = this.getAggregatedStats('memory_heap_usage_percent', startTime, endTime);
        const cpuStats = this.getAggregatedStats('cpu_user_time', startTime, endTime);
        const alertsInRange = this.alertHistory.filter((alert) => alert.firedAt >= startTime && alert.firedAt <= endTime);
        return {
            summary: {
                timeRange: {
                    start: startTime.toISOString(),
                    end: endTime.toISOString(),
                    duration: endTime.getTime() - startTime.getTime(),
                },
                totalRequests: apiStats.count,
                averageResponseTime: Math.round(apiStats.avg),
                errorCount: errorStats.sum,
                alertCount: alertsInRange.length,
            },
            apiPerformance: {
                requestCount: apiStats.count,
                averageResponseTime: Math.round(apiStats.avg),
                p95ResponseTime: Math.round(apiStats.p95),
                p99ResponseTime: Math.round(apiStats.p99),
                errorRate: (errorStats.sum / Math.max(apiStats.count, 1)) * 100,
            },
            databasePerformance: {
                queryCount: dbStats.count,
                averageQueryTime: Math.round(dbStats.avg),
                p95QueryTime: Math.round(dbStats.p95),
                averageEfficiency: Math.round(dbEfficiencyStats.avg),
            },
            systemMetrics: {
                averageMemoryUsage: Math.round(memoryStats.avg),
                peakMemoryUsage: Math.round(memoryStats.max),
                averageCpuTime: Math.round(cpuStats.avg),
            },
            alerts: alertsInRange,
        };
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    percentile(values, p) {
        if (values.length === 0)
            return 0;
        const index = (p / 100) * (values.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return values[lower] || 0;
        }
        return ((values[lower] || 0) * (upper - index) +
            (values[upper] || 0) * (index - lower));
    }
    evaluateCondition(value, condition, threshold) {
        switch (condition) {
            case 'gt':
                return value > threshold;
            case 'gte':
                return value >= threshold;
            case 'lt':
                return value < threshold;
            case 'lte':
                return value <= threshold;
            case 'eq':
                return value === threshold;
            default:
                return false;
        }
    }
    generateAlertMessage(rule, metric) {
        return `${rule.name}: ${metric.name} is ${metric.value}${metric.unit}, threshold is ${rule.threshold}${metric.unit}`;
    }
    startMetricsCleanup() {
        setInterval(() => {
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
            this.alertHistory = this.alertHistory.filter((a) => a.firedAt > cutoff);
            logger_1.default.info('Cleaned up old performance metrics and alerts');
        }, 60 * 60 * 1000);
    }
}
exports.PerformanceCollector = PerformanceCollector;
const createPerformanceMiddleware = (collector) => {
    return (req, res, next) => {
        const startTime = Date.now();
        const requestSize = req.get('content-length') || 0;
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const duration = Date.now() - startTime;
            const responseSize = res.get('content-length') || 0;
            collector.recordApiEndpoint(req.method, req.route?.path || req.path, res.statusCode, duration, parseInt(requestSize), parseInt(responseSize));
            originalEnd.call(this, chunk, encoding);
        };
        next();
    };
};
exports.createPerformanceMiddleware = createPerformanceMiddleware;
exports.performanceCollector = new PerformanceCollector();
exports.default = exports.performanceCollector;
//# sourceMappingURL=performanceMonitoring.js.map