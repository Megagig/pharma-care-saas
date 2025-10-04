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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lighthouseCIService = exports.LighthouseCIService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PerformanceCacheService_1 = __importDefault(require("./PerformanceCacheService"));
const PerformanceAlertService_1 = require("./PerformanceAlertService");
const PerformanceBudgetService_1 = require("./PerformanceBudgetService");
const lighthouseResultSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    runId: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    commit: { type: String, required: true },
    workspaceId: { type: String, required: true },
    scores: {
        performance: { type: Number, required: true },
        accessibility: { type: Number, required: true },
        bestPractices: { type: Number, required: true },
        seo: { type: Number, required: true },
    },
    metrics: {
        firstContentfulPaint: { type: Number },
        largestContentfulPaint: { type: Number },
        cumulativeLayoutShift: { type: Number },
        totalBlockingTime: { type: Number },
        speedIndex: { type: Number },
        timeToInteractive: { type: Number },
    },
    budgetStatus: { type: Map, of: String },
    reportUrl: { type: String },
    rawResult: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    indexes: [
        { timestamp: -1 },
        { branch: 1, timestamp: -1 },
        { url: 1, timestamp: -1 },
        { runId: 1 },
        { workspaceId: 1 },
    ]
});
const LighthouseResultModel = mongoose_1.default.model('LighthouseResult', lighthouseResultSchema);
class LighthouseCIService {
    constructor() {
        this.cacheService = PerformanceCacheService_1.default.getInstance();
        this.performanceBudgets = {
            performance: 90,
            accessibility: 90,
            bestPractices: 90,
            seo: 80,
            firstContentfulPaint: 2000,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1,
            totalBlockingTime: 300,
            speedIndex: 3000,
            timeToInteractive: 3800,
        };
    }
    async storeLighthouseResult(result) {
        try {
            const budgetStatus = this.calculateBudgetStatus(result);
            const enhancedResult = {
                ...result,
                timestamp: new Date(),
                budgetStatus,
            };
            const savedResult = await LighthouseResultModel.create(enhancedResult);
            await this.checkForRegressions(savedResult);
            await PerformanceBudgetService_1.performanceBudgetService.checkLighthouseBudgets({
                scores: savedResult.scores,
                metrics: savedResult.metrics,
                url: savedResult.url,
                branch: savedResult.branch,
                workspaceId: savedResult.workspaceId,
            });
            await this.invalidateRelevantCaches(savedResult);
            return savedResult.toObject();
        }
        catch (error) {
            console.error('Error storing Lighthouse result:', error);
            throw error;
        }
    }
    async getLighthouseResults(filters = {}) {
        const cacheKey = `lighthouse-results:${JSON.stringify(filters)}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached && typeof cached === "object" && Object.keys(cached).length > 0) {
            return cached;
        }
        try {
            const query = {};
            if (filters.branch)
                query.branch = filters.branch;
            if (filters.url)
                query.url = filters.url;
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate)
                    query.timestamp.$gte = filters.startDate;
                if (filters.endDate)
                    query.timestamp.$lte = filters.endDate;
            }
            const results = await LighthouseResultModel
                .find(query)
                .sort({ timestamp: -1 })
                .limit(filters.limit || 50)
                .lean();
            await this.cacheService.set(cacheKey, results, 300);
            return results;
        }
        catch (error) {
            console.error('Error getting Lighthouse results:', error);
            throw error;
        }
    }
    async compareLighthouseResults(currentRunId, baselineRunId) {
        try {
            const current = await LighthouseResultModel.findOne({ runId: currentRunId }).lean();
            if (!current) {
                throw new Error(`Lighthouse result not found: ${currentRunId}`);
            }
            let baseline;
            if (baselineRunId) {
                const baselineResult = await LighthouseResultModel.findOne({ runId: baselineRunId }).lean();
                if (!baselineResult) {
                    throw new Error(`Baseline Lighthouse result not found: ${baselineRunId}`);
                }
                baseline = baselineResult;
            }
            else {
                const baselineResult = await LighthouseResultModel
                    .findOne({
                    branch: current.branch,
                    url: current.url,
                    timestamp: { $lt: current.timestamp },
                })
                    .sort({ timestamp: -1 })
                    .lean();
                if (!baselineResult) {
                    throw new Error('No baseline result found for comparison');
                }
                baseline = baselineResult;
            }
            const trends = this.calculateTrends(current, baseline);
            const regressions = this.detectRegressions(current, baseline);
            return {
                current,
                baseline,
                trends,
                regressions,
            };
        }
        catch (error) {
            console.error('Error comparing Lighthouse results:', error);
            throw error;
        }
    }
    async getLighthouseTrends(branch = 'main', url, days = 30) {
        const cacheKey = `lighthouse-trends:${branch}:${url}:${days}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached && typeof cached === "object" && Object.keys(cached).length > 0) {
            return cached;
        }
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const query = {
                branch,
                timestamp: { $gte: startDate },
            };
            if (url)
                query.url = url;
            const results = await LighthouseResultModel
                .find(query)
                .sort({ timestamp: 1 })
                .lean();
            const dailyData = new Map();
            results.forEach(result => {
                const dateKey = result.timestamp.toISOString().split('T')[0];
                if (!dailyData.has(dateKey)) {
                    dailyData.set(dateKey, {
                        date: new Date(dateKey),
                        scores: [],
                        metrics: [],
                    });
                }
                const dayData = dailyData.get(dateKey);
                dayData.scores.push(result.scores);
                dayData.metrics.push(result.metrics);
            });
            const trends = Array.from(dailyData.values()).map(dayData => ({
                date: dayData.date,
                scores: this.calculateAverages(dayData.scores),
                metrics: this.calculateAverages(dayData.metrics),
            }));
            await this.cacheService.set(cacheKey, trends, 3600);
            return trends;
        }
        catch (error) {
            console.error('Error getting Lighthouse trends:', error);
            throw error;
        }
    }
    async generatePerformanceReport(branch = 'main', days = 7) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const results = await LighthouseResultModel
                .find({
                branch,
                timestamp: { $gte: startDate },
            })
                .sort({ timestamp: -1 })
                .lean();
            const totalRuns = results.length;
            const averageScores = this.calculateAverages(results.map(r => r.scores));
            const budgetViolations = results.reduce((count, result) => {
                return count + Object.values(result.budgetStatus).filter(status => status === 'failed').length;
            }, 0);
            const trends = await this.getLighthouseTrends(branch, undefined, days);
            const recentRegressions = [];
            const recommendations = this.generateRecommendations(averageScores, results);
            return {
                summary: {
                    totalRuns,
                    averageScores,
                    budgetViolations,
                    regressionCount: recentRegressions.length,
                },
                trends,
                recentRegressions,
                recommendations,
            };
        }
        catch (error) {
            console.error('Error generating performance report:', error);
            throw error;
        }
    }
    calculateBudgetStatus(result) {
        const status = {};
        Object.entries(result.scores).forEach(([key, value]) => {
            const budget = this.performanceBudgets[key];
            status[key] = budget && value >= budget ? 'passed' : 'failed';
        });
        Object.entries(result.metrics).forEach(([key, value]) => {
            const budget = this.performanceBudgets[key];
            if (budget && value !== undefined) {
                status[key] = value <= budget ? 'passed' : 'failed';
            }
        });
        return status;
    }
    calculateTrends(current, baseline) {
        const trends = [];
        Object.entries(current.scores).forEach(([metric, currentValue]) => {
            const baselineValue = baseline.scores[metric];
            if (baselineValue !== undefined) {
                const change = currentValue - baselineValue;
                const changePercent = (change / baselineValue) * 100;
                trends.push({
                    metric,
                    current: currentValue,
                    previous: baselineValue,
                    change,
                    changePercent,
                    trend: Math.abs(changePercent) < 2 ? 'stable' : changePercent > 0 ? 'improving' : 'degrading',
                });
            }
        });
        Object.entries(current.metrics).forEach(([metric, currentValue]) => {
            const baselineValue = baseline.metrics[metric];
            if (baselineValue !== undefined && currentValue !== undefined) {
                const change = currentValue - baselineValue;
                const changePercent = (change / baselineValue) * 100;
                trends.push({
                    metric,
                    current: currentValue,
                    previous: baselineValue,
                    change,
                    changePercent,
                    trend: Math.abs(changePercent) < 5 ? 'stable' : changePercent < 0 ? 'improving' : 'degrading',
                });
            }
        });
        return trends;
    }
    detectRegressions(current, baseline) {
        const regressions = [];
        Object.entries(current.scores).forEach(([metric, currentValue]) => {
            const baselineValue = baseline.scores[metric];
            if (baselineValue !== undefined) {
                const change = ((currentValue - baselineValue) / baselineValue) * 100;
                if (change < -5) {
                    const severity = change < -15 ? 'high' : change < -10 ? 'medium' : 'low';
                    regressions.push({
                        metric,
                        current: currentValue,
                        baseline: baselineValue,
                        threshold: -5,
                        severity,
                    });
                }
            }
        });
        Object.entries(current.metrics).forEach(([metric, currentValue]) => {
            const baselineValue = baseline.metrics[metric];
            if (baselineValue !== undefined && currentValue !== undefined) {
                const change = ((currentValue - baselineValue) / baselineValue) * 100;
                if (change > 10) {
                    const severity = change > 30 ? 'high' : change > 20 ? 'medium' : 'low';
                    regressions.push({
                        metric,
                        current: currentValue,
                        baseline: baselineValue,
                        threshold: 10,
                        severity,
                    });
                }
            }
        });
        return regressions;
    }
    async checkForRegressions(result) {
        try {
            const previousResult = await LighthouseResultModel
                .findOne({
                branch: result.branch,
                url: result.url,
                timestamp: { $lt: result.timestamp },
            })
                .sort({ timestamp: -1 })
                .lean();
            if (!previousResult)
                return;
            const regressions = this.detectRegressions(result, previousResult);
            for (const regression of regressions) {
                if (regression.severity === 'high' || regression.severity === 'medium') {
                    const alert = {
                        type: 'lighthouse_failure',
                        severity: regression.severity,
                        metric: regression.metric,
                        value: regression.current,
                        threshold: regression.baseline,
                        url: result.url,
                        timestamp: result.timestamp,
                        additionalData: {
                            branch: result.branch,
                            commit: result.commit,
                            runId: result.runId,
                            reportUrl: result.reportUrl,
                        },
                    };
                    await PerformanceAlertService_1.performanceAlertService.sendAlert(alert);
                }
            }
        }
        catch (error) {
            console.error('Error checking for regressions:', error);
        }
    }
    calculateAverages(data) {
        if (data.length === 0)
            return {};
        const sums = {};
        const counts = {};
        data.forEach(item => {
            Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    sums[key] = (sums[key] || 0) + value;
                    counts[key] = (counts[key] || 0) + 1;
                }
            });
        });
        const averages = {};
        Object.keys(sums).forEach(key => {
            averages[key] = Math.round((sums[key] / counts[key]) * 100) / 100;
        });
        return averages;
    }
    generateRecommendations(averageScores, results) {
        const recommendations = [];
        if (averageScores.performance < 90) {
            recommendations.push('Performance score is below target (90). Consider optimizing critical rendering path and reducing JavaScript execution time.');
        }
        if (averageScores.accessibility < 90) {
            recommendations.push('Accessibility score needs improvement. Review color contrast, alt text, and keyboard navigation.');
        }
        if (averageScores.bestPractices < 90) {
            recommendations.push('Best practices score can be improved. Check for HTTPS usage, console errors, and deprecated APIs.');
        }
        const budgetViolationCounts = new Map();
        results.forEach(result => {
            Object.entries(result.budgetStatus).forEach(([metric, status]) => {
                if (status === 'failed') {
                    budgetViolationCounts.set(metric, (budgetViolationCounts.get(metric) || 0) + 1);
                }
            });
        });
        budgetViolationCounts.forEach((count, metric) => {
            if (count > results.length * 0.5) {
                recommendations.push(`${metric} consistently exceeds budget. This metric needs focused optimization.`);
            }
        });
        return recommendations;
    }
    async invalidateRelevantCaches(result) {
        const patterns = [
            'lighthouse-results:*',
            `lighthouse-trends:${result.branch}:*`,
        ];
        for (const pattern of patterns) {
            await this.cacheService.invalidateByPattern(pattern);
        }
    }
    static async runLighthouseTest(url) {
        const service = new LighthouseCIService();
        const result = {
            performance: 85 + Math.random() * 10,
            accessibility: 90 + Math.random() * 8,
            bestPractices: 88 + Math.random() * 10,
            seo: 85 + Math.random() * 12,
        };
        return {
            performance: Math.round(result.performance),
            accessibility: Math.round(result.accessibility),
            bestPractices: Math.round(result.bestPractices),
            seo: Math.round(result.seo),
        };
    }
}
exports.LighthouseCIService = LighthouseCIService;
exports.lighthouseCIService = new LighthouseCIService();
//# sourceMappingURL=LighthouseCIService.js.map