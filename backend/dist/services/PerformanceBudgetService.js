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
exports.performanceBudgetService = exports.PerformanceBudgetService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PerformanceCacheService_1 = __importDefault(require("./PerformanceCacheService"));
const PerformanceAlertService_1 = require("./PerformanceAlertService");
const performanceBudgetSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    workspaceId: { type: String },
    isActive: { type: Boolean, default: true },
    budgets: {
        lighthouse: {
            performance: { min: Number, target: Number },
            accessibility: { min: Number, target: Number },
            bestPractices: { min: Number, target: Number },
            seo: { min: Number, target: Number },
        },
        webVitals: {
            FCP: { max: Number, target: Number },
            LCP: { max: Number, target: Number },
            CLS: { max: Number, target: Number },
            FID: { max: Number, target: Number },
            TTFB: { max: Number, target: Number },
            INP: { max: Number, target: Number },
        },
        bundleSize: {
            totalGzip: { max: Number, target: Number },
            totalBrotli: { max: Number, target: Number },
            mainChunk: { max: Number, target: Number },
            vendorChunk: { max: Number, target: Number },
        },
        apiLatency: {
            p50: { max: Number, target: Number },
            p95: { max: Number, target: Number },
            p99: { max: Number, target: Number },
        },
    },
    alerting: {
        enabled: { type: Boolean, default: true },
        channels: [{ type: String, enum: ['email', 'slack', 'webhook'] }],
        escalation: { type: Map, of: mongoose_1.Schema.Types.Mixed },
        cooldown: { type: Number, default: 15 },
    },
}, {
    timestamps: true,
    indexes: [
        { workspaceId: 1, isActive: 1 },
        { name: 1 },
    ]
});
const budgetViolationSchema = new mongoose_1.Schema({
    budgetId: { type: String, required: true },
    budgetName: { type: String, required: true },
    category: { type: String, required: true, enum: ['lighthouse', 'webVitals', 'bundleSize', 'apiLatency'] },
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    budget: { type: Number, required: true },
    target: { type: Number, required: true },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    timestamp: { type: Date, required: true, default: Date.now },
    url: { type: String },
    branch: { type: String },
    workspaceId: { type: String },
    additionalData: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    indexes: [
        { budgetId: 1, timestamp: -1 },
        { workspaceId: 1, timestamp: -1 },
        { category: 1, metric: 1, timestamp: -1 },
        { severity: 1, timestamp: -1 },
    ]
});
const PerformanceBudgetModel = mongoose_1.default.model('PerformanceBudget', performanceBudgetSchema);
const BudgetViolationModel = mongoose_1.default.model('BudgetViolation', budgetViolationSchema);
class PerformanceBudgetService {
    constructor() {
        this.cacheService = PerformanceCacheService_1.default.getInstance();
    }
    async createBudget(budget) {
        try {
            const savedBudget = await PerformanceBudgetModel.create(budget);
            await this.invalidateBudgetCaches();
            return savedBudget.toObject();
        }
        catch (error) {
            console.error('Error creating performance budget:', error);
            throw error;
        }
    }
    async updateBudget(id, updates) {
        try {
            const updatedBudget = await PerformanceBudgetModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
            if (updatedBudget) {
                await this.invalidateBudgetCaches();
            }
            return updatedBudget;
        }
        catch (error) {
            console.error('Error updating performance budget:', error);
            throw error;
        }
    }
    async deleteBudget(id) {
        try {
            const result = await PerformanceBudgetModel.findByIdAndDelete(id);
            if (result) {
                await this.invalidateBudgetCaches();
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error deleting performance budget:', error);
            throw error;
        }
    }
    async getBudgets(workspaceId) {
        const cacheKey = `performance-budgets:${workspaceId || 'global'}`;
        const cached = await this.cacheService.getCachedApiResponse(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const query = { isActive: true };
            if (workspaceId) {
                query.$or = [{ workspaceId }, { workspaceId: { $exists: false } }];
            }
            const budgets = await PerformanceBudgetModel.find(query).lean();
            await this.cacheService.cacheApiResponse(cacheKey, budgets, { ttl: 600 });
            return budgets;
        }
        catch (error) {
            console.error('Error getting performance budgets:', error);
            throw error;
        }
    }
    async getBudget(id) {
        try {
            const budget = await PerformanceBudgetModel.findById(id).lean();
            return budget;
        }
        catch (error) {
            console.error('Error getting performance budget:', error);
            throw error;
        }
    }
    async checkLighthouseBudgets(result) {
        try {
            const budgets = await this.getBudgets(result.workspaceId);
            const violations = [];
            for (const budget of budgets) {
                Object.entries(result.scores).forEach(([metric, value]) => {
                    const budgetConfig = budget.budgets.lighthouse[metric];
                    if (budgetConfig && value < budgetConfig.min) {
                        const severity = this.calculateSeverity(value, budgetConfig.min, budgetConfig.target);
                        violations.push({
                            budgetId: budget.id,
                            budgetName: budget.name,
                            category: 'lighthouse',
                            metric,
                            value,
                            budget: budgetConfig.min,
                            target: budgetConfig.target,
                            severity,
                            timestamp: new Date(),
                            url: result.url,
                            branch: result.branch,
                            workspaceId: result.workspaceId,
                        });
                    }
                });
                Object.entries(result.metrics).forEach(([metric, value]) => {
                    const webVitalsBudget = budget.budgets.webVitals[metric];
                    if (webVitalsBudget && value > webVitalsBudget.max) {
                        const severity = this.calculateSeverity(value, webVitalsBudget.max, webVitalsBudget.target, true);
                        violations.push({
                            budgetId: budget.id,
                            budgetName: budget.name,
                            category: 'webVitals',
                            metric,
                            value,
                            budget: webVitalsBudget.max,
                            target: webVitalsBudget.target,
                            severity,
                            timestamp: new Date(),
                            url: result.url,
                            branch: result.branch,
                            workspaceId: result.workspaceId,
                        });
                    }
                });
            }
            for (const violation of violations) {
                await this.recordViolation(violation);
                await this.sendViolationAlert(violation);
            }
            return violations;
        }
        catch (error) {
            console.error('Error checking Lighthouse budgets:', error);
            return [];
        }
    }
    async checkWebVitalsBudgets(metrics, context) {
        try {
            const budgets = await this.getBudgets(context.workspaceId);
            const violations = [];
            for (const budget of budgets) {
                Object.entries(metrics).forEach(([metric, value]) => {
                    const budgetConfig = budget.budgets.webVitals[metric];
                    if (budgetConfig && value > budgetConfig.max) {
                        const severity = this.calculateSeverity(value, budgetConfig.max, budgetConfig.target, true);
                        violations.push({
                            budgetId: budget.id,
                            budgetName: budget.name,
                            category: 'webVitals',
                            metric,
                            value,
                            budget: budgetConfig.max,
                            target: budgetConfig.target,
                            severity,
                            timestamp: new Date(),
                            url: context.url,
                            workspaceId: context.workspaceId,
                            additionalData: {
                                userAgent: context.userAgent,
                                deviceType: context.deviceType,
                            },
                        });
                    }
                });
            }
            for (const violation of violations) {
                await this.recordViolation(violation);
                await this.sendViolationAlert(violation);
            }
            return violations;
        }
        catch (error) {
            console.error('Error checking Web Vitals budgets:', error);
            return [];
        }
    }
    async checkBundleSizeBudgets(bundleData, context) {
        try {
            const budgets = await this.getBudgets(context.workspaceId);
            const violations = [];
            for (const budget of budgets) {
                Object.entries(bundleData).forEach(([metric, value]) => {
                    const budgetConfig = budget.budgets.bundleSize[metric];
                    if (budgetConfig && value > budgetConfig.max) {
                        const severity = this.calculateSeverity(value, budgetConfig.max, budgetConfig.target, true);
                        violations.push({
                            budgetId: budget.id,
                            budgetName: budget.name,
                            category: 'bundleSize',
                            metric,
                            value,
                            budget: budgetConfig.max,
                            target: budgetConfig.target,
                            severity,
                            timestamp: new Date(),
                            branch: context.branch,
                            workspaceId: context.workspaceId,
                            additionalData: {
                                commit: context.commit,
                            },
                        });
                    }
                });
            }
            for (const violation of violations) {
                await this.recordViolation(violation);
                await this.sendViolationAlert(violation);
            }
            return violations;
        }
        catch (error) {
            console.error('Error checking bundle size budgets:', error);
            return [];
        }
    }
    async checkAPILatencyBudgets(latencyData, context) {
        try {
            const budgets = await this.getBudgets(context.workspaceId);
            const violations = [];
            for (const budget of budgets) {
                Object.entries(latencyData).forEach(([metric, value]) => {
                    const budgetConfig = budget.budgets.apiLatency[metric];
                    if (budgetConfig && value > budgetConfig.max) {
                        const severity = this.calculateSeverity(value, budgetConfig.max, budgetConfig.target, true);
                        violations.push({
                            budgetId: budget.id,
                            budgetName: budget.name,
                            category: 'apiLatency',
                            metric,
                            value,
                            budget: budgetConfig.max,
                            target: budgetConfig.target,
                            severity,
                            timestamp: new Date(),
                            workspaceId: context.workspaceId,
                            additionalData: {
                                endpoint: context.endpoint,
                            },
                        });
                    }
                });
            }
            for (const violation of violations) {
                await this.recordViolation(violation);
                await this.sendViolationAlert(violation);
            }
            return violations;
        }
        catch (error) {
            console.error('Error checking API latency budgets:', error);
            return [];
        }
    }
    async getBudgetReport(budgetId, period = '7d') {
        try {
            const budget = await this.getBudget(budgetId);
            if (!budget) {
                throw new Error(`Budget not found: ${budgetId}`);
            }
            const startTime = this.getPeriodStartTime(period);
            const violations = await BudgetViolationModel.find({
                budgetId,
                timestamp: { $gte: startTime },
            }).lean();
            const totalChecks = await this.estimateTotalChecks(budgetId, startTime);
            const violationRate = totalChecks > 0 ? (violations.length / totalChecks) * 100 : 0;
            const averageScores = this.calculateAverageScores(violations);
            const trends = await this.calculateBudgetTrends(budgetId, startTime);
            const recommendations = this.generateBudgetRecommendations(violations, budget);
            return {
                budgetId,
                budgetName: budget.name,
                period,
                summary: {
                    totalChecks,
                    violations: violations.length,
                    violationRate,
                    averageScores,
                },
                violations,
                trends,
                recommendations,
            };
        }
        catch (error) {
            console.error('Error generating budget report:', error);
            throw error;
        }
    }
    calculateSeverity(value, budget, target, higherIsBad = false) {
        const deviation = higherIsBad
            ? (value - budget) / budget
            : (budget - value) / budget;
        if (deviation > 0.5)
            return 'critical';
        if (deviation > 0.3)
            return 'high';
        if (deviation > 0.1)
            return 'medium';
        return 'low';
    }
    async recordViolation(violation) {
        try {
            await BudgetViolationModel.create(violation);
        }
        catch (error) {
            console.error('Error recording budget violation:', error);
        }
    }
    async sendViolationAlert(violation) {
        try {
            const budget = await this.getBudget(violation.budgetId);
            if (!budget || !budget.alerting.enabled) {
                return;
            }
            const alert = {
                type: 'performance_budget_exceeded',
                severity: violation.severity,
                metric: violation.metric,
                value: violation.value,
                threshold: violation.budget,
                url: violation.url || 'N/A',
                timestamp: violation.timestamp,
                additionalData: {
                    budgetName: violation.budgetName,
                    category: violation.category,
                    target: violation.target,
                    ...violation.additionalData,
                },
            };
            await PerformanceAlertService_1.performanceAlertService.sendAlert(alert);
        }
        catch (error) {
            console.error('Error sending violation alert:', error);
        }
    }
    getPeriodStartTime(period) {
        const now = new Date();
        switch (period) {
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }
    async estimateTotalChecks(budgetId, startTime) {
        const violations = await BudgetViolationModel.countDocuments({
            budgetId,
            timestamp: { $gte: startTime },
        });
        return Math.max(violations * 10, violations);
    }
    calculateAverageScores(violations) {
        const scores = {};
        violations.forEach(violation => {
            if (!scores[violation.metric]) {
                scores[violation.metric] = violation.value;
            }
            else {
                scores[violation.metric] = (scores[violation.metric] + violation.value) / 2;
            }
        });
        return scores;
    }
    async calculateBudgetTrends(budgetId, startTime) {
        return {};
    }
    generateBudgetRecommendations(violations, budget) {
        const recommendations = [];
        const violationsByCategory = violations.reduce((acc, violation) => {
            if (!acc[violation.category])
                acc[violation.category] = [];
            acc[violation.category].push(violation);
            return acc;
        }, {});
        Object.entries(violationsByCategory).forEach(([category, categoryViolations]) => {
            const count = categoryViolations.length;
            switch (category) {
                case 'lighthouse':
                    recommendations.push(`${count} Lighthouse score violations detected. Focus on optimizing critical rendering path and reducing JavaScript execution time.`);
                    break;
                case 'webVitals':
                    recommendations.push(`${count} Web Vitals violations detected. Review LCP optimization, layout stability, and input responsiveness.`);
                    break;
                case 'bundleSize':
                    recommendations.push(`${count} bundle size violations detected. Consider code splitting, tree shaking, and dependency optimization.`);
                    break;
                case 'apiLatency':
                    recommendations.push(`${count} API latency violations detected. Review database queries, caching strategies, and server performance.`);
                    break;
            }
        });
        return recommendations;
    }
    async invalidateBudgetCaches() {
        const patterns = [
            'performance-budgets:*',
        ];
        for (const pattern of patterns) {
            await this.cacheService.invalidateByPattern(pattern);
        }
    }
    async createDefaultBudget(workspaceId) {
        const defaultBudget = {
            name: 'Default Performance Budget',
            description: 'Default performance budget with industry standard thresholds',
            workspaceId,
            isActive: true,
            budgets: {
                lighthouse: {
                    performance: { min: 90, target: 95 },
                    accessibility: { min: 90, target: 95 },
                    bestPractices: { min: 90, target: 95 },
                    seo: { min: 80, target: 90 },
                },
                webVitals: {
                    FCP: { max: 1800, target: 1200 },
                    LCP: { max: 2500, target: 1800 },
                    CLS: { max: 0.1, target: 0.05 },
                    FID: { max: 100, target: 50 },
                    TTFB: { max: 800, target: 400 },
                    INP: { max: 200, target: 100 },
                },
                bundleSize: {
                    totalGzip: { max: 500 * 1024, target: 300 * 1024 },
                    totalBrotli: { max: 400 * 1024, target: 250 * 1024 },
                    mainChunk: { max: 200 * 1024, target: 150 * 1024 },
                    vendorChunk: { max: 300 * 1024, target: 200 * 1024 },
                },
                apiLatency: {
                    p50: { max: 200, target: 100 },
                    p95: { max: 500, target: 300 },
                    p99: { max: 1000, target: 600 },
                },
            },
            alerting: {
                enabled: true,
                channels: ['slack'],
                escalation: {
                    low: { delay: 0, channels: ['slack'] },
                    medium: { delay: 0, channels: ['slack', 'email'] },
                    high: { delay: 0, channels: ['slack', 'email'] },
                    critical: { delay: 0, channels: ['slack', 'email'] },
                },
                cooldown: 15,
            },
        };
        return await this.createBudget(defaultBudget);
    }
}
exports.PerformanceBudgetService = PerformanceBudgetService;
exports.performanceBudgetService = new PerformanceBudgetService();
//# sourceMappingURL=PerformanceBudgetService.js.map