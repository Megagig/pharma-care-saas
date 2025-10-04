"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.latencyTracker = exports.latencyMeasurementMiddleware = void 0;
const perf_hooks_1 = require("perf_hooks");
class LatencyTracker {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 10000;
    }
    addMetric(metric) {
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        if (metric.duration > 1000) {
            console.warn(`Slow API request detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
        }
    }
    getMetrics(endpoint, limit = 100) {
        let filtered = this.metrics;
        if (endpoint) {
            filtered = this.metrics.filter(m => m.endpoint === endpoint);
        }
        return filtered.slice(-limit);
    }
    getStats(endpoint) {
        let filtered = this.metrics;
        if (endpoint) {
            filtered = this.metrics.filter(m => m.endpoint === endpoint);
        }
        if (filtered.length === 0) {
            return { count: 0, p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
        }
        const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
        const count = durations.length;
        return {
            count,
            p50: this.percentile(durations, 50),
            p95: this.percentile(durations, 95),
            p99: this.percentile(durations, 99),
            avg: durations.reduce((sum, d) => sum + d, 0) / count,
            min: durations[0],
            max: durations[count - 1],
        };
    }
    percentile(sortedArray, p) {
        if (sortedArray.length === 0)
            return 0;
        const index = (p / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedArray[lower];
        }
        const weight = index - lower;
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
    getTopEndpoints(limit = 10) {
        const endpointStats = new Map();
        this.metrics.forEach(metric => {
            const key = `${metric.method} ${metric.endpoint}`;
            if (!endpointStats.has(key)) {
                endpointStats.set(key, []);
            }
            endpointStats.get(key).push(metric);
        });
        const results = Array.from(endpointStats.entries()).map(([endpoint, metrics]) => {
            const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const p95Duration = this.percentile(durations, 95);
            return {
                endpoint,
                count: metrics.length,
                avgDuration,
                p95Duration,
            };
        });
        return results
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    clearMetrics() {
        this.metrics = [];
    }
}
const latencyTracker = new LatencyTracker();
exports.latencyTracker = latencyTracker;
const latencyMeasurementMiddleware = (req, res, next) => {
    const startTime = perf_hooks_1.performance.now();
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const endTime = perf_hooks_1.performance.now();
        const duration = endTime - startTime;
        const metric = {
            endpoint: req.route?.path || req.path,
            method: req.method,
            duration: Math.round(duration * 100) / 100,
            timestamp: new Date(),
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
        };
        setImmediate(() => {
            latencyTracker.addMetric(metric);
        });
        try {
            if (!res.headersSent) {
                res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
            }
        }
        catch (error) {
        }
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.latencyMeasurementMiddleware = latencyMeasurementMiddleware;
//# sourceMappingURL=latencyMeasurement.js.map