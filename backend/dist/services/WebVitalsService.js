"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebVitalsService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PerformanceCacheService_1 = require("./PerformanceCacheService");
const PerformanceAlertService_1 = require("./PerformanceAlertService");
const PerformanceBudgetService_1 = require("./PerformanceBudgetService");
const webVitalsSchema = new mongoose_1.Schema({
    name: { type: String, required: true, enum: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'] },
    value: { type: Number, required: true },
    id: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    url: { type: String, required: true },
    userAgent: { type: String, required: true },
    connectionType: { type: String },
    userId: { type: String },
    workspaceId: { type: String },
    sessionId: { type: String },
    deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'] },
    country: { type: String },
    ip: { type: String },
}, {
    timestamps: true,
    indexes: [
        { timestamp: -1 },
        { name: 1, timestamp: -1 },
        { workspaceId: 1, timestamp: -1 },
        { url: 1, timestamp: -1 },
        { deviceType: 1, timestamp: -1 },
    ]
});
const WebVitalsModel = mongoose_1.default.model('WebVitals', webVitalsSchema);
class WebVitalsService {
    constructor() {
        this.cacheService = new PerformanceCacheService_1.PerformanceCacheService();
        this.performanceBudgets = {
            FCP: { good: 1800, poor: 3000 },
            LCP: { good: 2500, poor: 4000 },
            CLS: { good: 0.1, poor: 0.25 },
            FID: { good: 100, poor: 300 },
            TTFB: { good: 800, poor: 1800 },
            INP: { good: 200, poor: 500 },
        };
    }
    async storeWebVitalsEntry(entry) {
        try {
            const enhancedEntry = {
                ...entry,
                timestamp: entry.timestamp || new Date(),
                deviceType: this.detectDeviceType(entry.userAgent),
                sessionId: entry.sessionId || this.generateSessionId(entry.userAgent, entry.ip),
            };
            await WebVitalsModel.create(enhancedEntry);
            await this.invalidateRelevantCaches(enhancedEntry);
            await this.checkPerformanceBudgets(enhancedEntry);
            await PerformanceBudgetService_1.performanceBudgetService.checkWebVitalsBudgets({ [enhancedEntry.name]: enhancedEntry.value }, {
                url: enhancedEntry.url,
                workspaceId: enhancedEntry.workspaceId,
                userAgent: enhancedEntry.userAgent,
                deviceType: enhancedEntry.deviceType,
            });
        }
        catch (error) {
            console.error('Error storing Web Vitals entry:', error);
            throw error;
        }
    }
    async getWebVitalsSummary(period = '24h', filters = {}) {
        const cacheKey = `web-vitals-summary:${period}:${JSON.stringify(filters)}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const startTime = this.getPeriodStartTime(period);
            const query = {
                timestamp: { $gte: startTime },
                ...filters,
            };
            const currentData = await WebVitalsModel.find(query).lean();
            const previousStartTime = this.getPreviousPeriodStartTime(period, startTime);
            const previousQuery = {
                ...query,
                timestamp: { $gte: previousStartTime, $lt: startTime },
            };
            const previousData = await WebVitalsModel.find(previousQuery).lean();
            const metrics = this.calculateMetrics(currentData);
            const previousMetrics = this.calculateMetrics(previousData);
            const trends = this.calculateTrends(metrics, previousMetrics);
            const budgetStatus = this.calculateBudgetStatus(metrics);
            const summary = {
                period,
                metrics,
                budgetStatus,
                totalSamples: currentData.length,
                lastUpdated: new Date(),
                trends,
            };
            await this.cacheService.set(cacheKey, summary, 300);
            return summary;
        }
        catch (error) {
            console.error('Error getting Web Vitals summary:', error);
            throw error;
        }
    }
    async getWebVitalsTimeSeries(metric, period = '24h', interval = '1h', filters = {}) {
        const cacheKey = `web-vitals-timeseries:${metric}:${period}:${interval}:${JSON.stringify(filters)}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const startTime = this.getPeriodStartTime(period);
            const intervalMs = this.getIntervalMs(interval);
            const pipeline = [
                {
                    $match: {
                        name: metric,
                        timestamp: { $gte: startTime },
                        ...filters,
                    }
                },
                {
                    $group: {
                        _id: {
                            $toDate: {
                                $subtract: [
                                    { $toLong: '$timestamp' },
                                    { $mod: [{ $toLong: '$timestamp' }, intervalMs] }
                                ]
                            }
                        },
                        avgValue: { $avg: '$value' },
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: { _id: 1 }
                },
                {
                    $project: {
                        timestamp: '$_id',
                        value: '$avgValue',
                        count: 1,
                        _id: 0,
                    }
                }
            ];
            const result = await WebVitalsModel.aggregate(pipeline);
            await this.cacheService.set(cacheKey, result, 120);
            return result;
        }
        catch (error) {
            console.error('Error getting Web Vitals time series:', error);
            throw error;
        }
    }
    async detectRegressions(metric, threshold = 0.2) {
        try {
            const currentHour = await this.getWebVitalsSummary('1h');
            const previousHourStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const previousHourEnd = new Date(Date.now() - 1 * 60 * 60 * 1000);
            const previousHourData = await WebVitalsModel.find({
                name: metric,
                timestamp: { $gte: previousHourStart, $lt: previousHourEnd },
            }).lean();
            const previousHourMetrics = this.calculateMetrics(previousHourData);
            const regressions = [];
            const currentValue = currentHour.metrics[metric]?.p95 || 0;
            const previousValue = previousHourMetrics[metric]?.p95 || 0;
            if (previousValue > 0) {
                const change = (currentValue - previousValue) / previousValue;
                if (change > threshold) {
                    const severity = change > 0.5 ? 'high' : change > 0.3 ? 'medium' : 'low';
                    regressions.push({
                        metric,
                        currentValue,
                        previousValue,
                        change,
                        severity,
                        timestamp: new Date(),
                    });
                }
            }
            return regressions;
        }
        catch (error) {
            console.error('Error detecting regressions:', error);
            return [];
        }
    }
    calculateMetrics(data) {
        const metrics = {};
        const groupedData = data.reduce((acc, entry) => {
            if (!acc[entry.name]) {
                acc[entry.name] = [];
            }
            acc[entry.name].push(entry.value);
            return acc;
        }, {});
        Object.entries(groupedData).forEach(([metricName, values]) => {
            if (values.length === 0)
                return;
            const sorted = values.sort((a, b) => a - b);
            const count = sorted.length;
            metrics[metricName] = {
                p50: this.percentile(sorted, 0.5),
                p75: this.percentile(sorted, 0.75),
                p95: this.percentile(sorted, 0.95),
                p99: this.percentile(sorted, 0.99),
                count,
                avg: values.reduce((sum, val) => sum + val, 0) / count,
            };
        });
        return metrics;
    }
    calculateTrends(current, previous) {
        const trends = {};
        Object.keys(current).forEach(metric => {
            const currentP95 = current[metric]?.p95 || 0;
            const previousP95 = previous[metric]?.p95 || 0;
            if (previousP95 > 0) {
                const change = ((currentP95 - previousP95) / previousP95) * 100;
                trends[metric] = {
                    change: Math.round(change * 100) / 100,
                    direction: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down',
                };
            }
            else {
                trends[metric] = { change: 0, direction: 'stable' };
            }
        });
        return trends;
    }
    calculateBudgetStatus(metrics) {
        const status = {};
        Object.entries(this.performanceBudgets).forEach(([metric, budgets]) => {
            const p75Value = metrics[metric]?.p75 || 0;
            if (p75Value <= budgets.good) {
                status[metric] = 'good';
            }
            else if (p75Value <= budgets.poor) {
                status[metric] = 'needs-improvement';
            }
            else {
                status[metric] = 'poor';
            }
        });
        return status;
    }
    percentile(sorted, p) {
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.max(0, index)];
    }
    detectDeviceType(userAgent) {
        const ua = userAgent.toLowerCase();
        if (/mobile|android|iphone/.test(ua))
            return 'mobile';
        if (/tablet|ipad/.test(ua))
            return 'tablet';
        return 'desktop';
    }
    generateSessionId(userAgent, ip) {
        const hash = require('crypto').createHash('md5');
        hash.update(userAgent + (ip || '') + Math.floor(Date.now() / (30 * 60 * 1000)));
        return hash.digest('hex');
    }
    getPeriodStartTime(period) {
        const now = new Date();
        switch (period) {
            case '1h':
                return new Date(now.getTime() - 60 * 60 * 1000);
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
    }
    getPreviousPeriodStartTime(period, currentStart) {
        const periodMs = Date.now() - currentStart.getTime();
        return new Date(currentStart.getTime() - periodMs);
    }
    getIntervalMs(interval) {
        switch (interval) {
            case '1m':
                return 60 * 1000;
            case '5m':
                return 5 * 60 * 1000;
            case '1h':
                return 60 * 60 * 1000;
            case '1d':
                return 24 * 60 * 60 * 1000;
            default:
                return 60 * 60 * 1000;
        }
    }
    async invalidateRelevantCaches(entry) {
        const patterns = [
            'web-vitals-summary:*',
            `web-vitals-timeseries:${entry.name}:*`,
        ];
        for (const pattern of patterns) {
            await this.cacheService.invalidate(pattern);
        }
    }
    async checkPerformanceBudgets(entry) {
        const budget = this.performanceBudgets[entry.name];
        if (!budget)
            return;
        let severity = 'low';
        let exceeded = false;
        if (entry.value > budget.poor) {
            severity = 'high';
            exceeded = true;
        }
        else if (entry.value > budget.good) {
            severity = 'medium';
            exceeded = true;
        }
        if (exceeded) {
            console.warn(`Performance budget exceeded: ${entry.name} = ${entry.value} (${severity} severity)`);
            await this.sendPerformanceAlert({
                type: 'performance_budget_exceeded',
                metric: entry.name,
                value: entry.value,
                budget: severity === 'high' ? budget.poor : budget.good,
                severity,
                url: entry.url,
                timestamp: entry.timestamp,
                userAgent: entry.userAgent,
                deviceType: entry.deviceType,
            });
        }
    }
    async sendPerformanceAlert(alertData) {
        const alert = {
            type: 'performance_budget_exceeded',
            severity: alertData.severity,
            metric: alertData.metric,
            value: alertData.value,
            threshold: alertData.budget,
            url: alertData.url,
            timestamp: alertData.timestamp,
            userAgent: alertData.userAgent,
            deviceType: alertData.deviceType,
            workspaceId: alertData.workspaceId,
        };
        await PerformanceAlertService_1.performanceAlertService.sendAlert(alert);
    }
}
exports.WebVitalsService = WebVitalsService;
//# sourceMappingURL=WebVitalsService.js.map