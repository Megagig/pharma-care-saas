"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitoringService = exports.PerformanceMonitoringService = void 0;
const WebVitalsService_1 = require("./WebVitalsService");
const LighthouseCIService_1 = require("./LighthouseCIService");
const PerformanceBudgetService_1 = require("./PerformanceBudgetService");
const PerformanceCacheService_1 = require("./PerformanceCacheService");
class PerformanceMonitoringService {
    constructor() {
        this.webVitalsService = new WebVitalsService_1.WebVitalsService();
        this.lighthouseService = new LighthouseCIService_1.LighthouseCIService();
        this.budgetService = new PerformanceBudgetService_1.PerformanceBudgetService();
        this.cacheService = new PerformanceCacheService_1.PerformanceCacheService();
    }
    async getPerformanceOverview(workspaceId) {
        const cacheKey = `performance-overview:${workspaceId || 'global'}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const webVitalsSummary = await this.webVitalsService.getWebVitalsSummary('24h', { workspaceId });
            const lighthouseResults = await this.lighthouseService.getLighthouseResults({
                limit: 10,
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            });
            const budgets = await this.budgetService.getBudgets(workspaceId);
            const activeBudgets = budgets.filter(b => b.isActive);
            const recentWebVitalsViolations = 0;
            const recentLighthouseViolations = 0;
            const recentBudgetViolations = 0;
            const webVitalsTrend = this.calculateTrendDirection(webVitalsSummary.trends);
            const lighthouseTrend = this.calculateLighthouseTrend(lighthouseResults);
            const apiMetrics = {
                p95Latency: 250,
                errorRate: 0.5,
                throughput: 1200,
                trendDirection: 'stable',
            };
            const alertInfo = {
                activeAlerts: 2,
                recentAlerts: 5,
                criticalAlerts: 0,
            };
            const recommendations = this.generateOverviewRecommendations({
                webVitalsSummary,
                lighthouseResults,
                budgets: activeBudgets,
                apiMetrics,
            });
            const overview = {
                timestamp: new Date(),
                webVitals: {
                    summary: webVitalsSummary,
                    recentViolations: recentWebVitalsViolations,
                    trendDirection: webVitalsTrend,
                },
                lighthouse: {
                    latestScores: lighthouseResults[0]?.scores || {},
                    recentRuns: lighthouseResults.length,
                    budgetViolations: recentLighthouseViolations,
                    trendDirection: lighthouseTrend,
                },
                budgets: {
                    totalBudgets: budgets.length,
                    activeBudgets: activeBudgets.length,
                    recentViolations: recentBudgetViolations,
                    violationRate: recentBudgetViolations > 0 ? (recentBudgetViolations / (activeBudgets.length * 10)) * 100 : 0,
                },
                api: apiMetrics,
                alerts: alertInfo,
                recommendations,
            };
            await this.cacheService.set(cacheKey, overview, 300);
            return overview;
        }
        catch (error) {
            console.error('Error getting performance overview:', error);
            throw error;
        }
    }
    async getPerformanceTrends(period = '7d', workspaceId) {
        try {
            const trends = [];
            const webVitalsSummary = await this.webVitalsService.getWebVitalsSummary(period, { workspaceId });
            Object.entries(webVitalsSummary.trends || {}).forEach(([metric, trend]) => {
                trends.push({
                    metric,
                    category: 'webVitals',
                    current: trend.current || 0,
                    previous: trend.previous || 0,
                    change: trend.change || 0,
                    changePercent: ((trend.change || 0) / (trend.previous || 1)) * 100,
                    trend: Math.abs(trend.change || 0) < 5 ? 'stable' : (trend.change || 0) > 0 ? 'degrading' : 'improving',
                    timestamp: new Date(),
                });
            });
            const lighthouseTrends = await this.lighthouseService.getLighthouseTrends('main', undefined, this.getPeriodDays(period));
            if (lighthouseTrends.length >= 2) {
                const latest = lighthouseTrends[lighthouseTrends.length - 1];
                const previous = lighthouseTrends[lighthouseTrends.length - 2];
                Object.entries(latest.scores).forEach(([metric, current]) => {
                    const prev = previous.scores[metric] || 0;
                    const change = current - prev;
                    trends.push({
                        metric,
                        category: 'lighthouse',
                        current,
                        previous: prev,
                        change,
                        changePercent: prev > 0 ? (change / prev) * 100 : 0,
                        trend: Math.abs(change) < 2 ? 'stable' : change > 0 ? 'improving' : 'degrading',
                        timestamp: new Date(latest.date),
                    });
                });
            }
            return trends;
        }
        catch (error) {
            console.error('Error getting performance trends:', error);
            return [];
        }
    }
    async generatePerformanceReport(period = '7d', workspaceId) {
        try {
            const overview = await this.getPerformanceOverview(workspaceId);
            const trends = await this.getPerformanceTrends(period, workspaceId);
            const topIssues = this.analyzeTopIssues(overview, trends);
            const recommendations = this.generateDetailedRecommendations(overview, trends, topIssues);
            const budgetCompliance = await this.calculateBudgetCompliance(workspaceId, period);
            return {
                period,
                generatedAt: new Date(),
                overview,
                trends,
                topIssues,
                recommendations,
                budgetCompliance,
            };
        }
        catch (error) {
            console.error('Error generating performance report:', error);
            throw error;
        }
    }
    async getPerformanceAlerts(workspaceId, limit = 50) {
        return [];
    }
    async resolveAlert(alertId) {
        return true;
    }
    calculateTrendDirection(trends) {
        if (!trends)
            return 'stable';
        const trendValues = Object.values(trends).map((t) => t.change || 0);
        const avgChange = trendValues.reduce((sum, val) => sum + val, 0) / trendValues.length;
        if (Math.abs(avgChange) < 5)
            return 'stable';
        return avgChange > 0 ? 'degrading' : 'improving';
    }
    calculateLighthouseTrend(results) {
        if (results.length < 2)
            return 'stable';
        const latest = results[0];
        const previous = results[1];
        const latestAvg = Object.values(latest.scores).reduce((sum, val) => sum + val, 0) / Object.keys(latest.scores).length;
        const previousAvg = Object.values(previous.scores).reduce((sum, val) => sum + val, 0) / Object.keys(previous.scores).length;
        const change = latestAvg - previousAvg;
        if (Math.abs(change) < 2)
            return 'stable';
        return change > 0 ? 'improving' : 'degrading';
    }
    generateOverviewRecommendations(data) {
        const recommendations = [];
        if (data.webVitalsSummary.budgetStatus) {
            Object.entries(data.webVitalsSummary.budgetStatus).forEach(([metric, status]) => {
                if (status === 'poor') {
                    recommendations.push(`Optimize ${metric}: Current performance is below acceptable thresholds`);
                }
            });
        }
        if (data.lighthouseResults.length > 0) {
            const latest = data.lighthouseResults[0];
            Object.entries(latest.scores).forEach(([category, score]) => {
                if (score < 90) {
                    recommendations.push(`Improve ${category} score: Currently at ${score}, target is 90+`);
                }
            });
        }
        if (data.budgets.length === 0) {
            recommendations.push('Set up performance budgets to monitor and prevent regressions');
        }
        return recommendations.slice(0, 5);
    }
    analyzeTopIssues(overview, trends) {
        const issues = [];
        trends.forEach(trend => {
            if (trend.trend === 'degrading' && Math.abs(trend.changePercent) > 10) {
                issues.push({
                    category: trend.category,
                    metric: trend.metric,
                    severity: Math.abs(trend.changePercent) > 25 ? 'high' : 'medium',
                    count: 1,
                    impact: `${trend.changePercent.toFixed(1)}% degradation`,
                });
            }
        });
        if (overview.budgets.violationRate > 20) {
            issues.push({
                category: 'budgets',
                metric: 'violation_rate',
                severity: overview.budgets.violationRate > 50 ? 'high' : 'medium',
                count: overview.budgets.recentViolations,
                impact: `${overview.budgets.violationRate.toFixed(1)}% violation rate`,
            });
        }
        return issues.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }
    generateDetailedRecommendations(overview, trends, topIssues) {
        const recommendations = [];
        topIssues.forEach(issue => {
            if (issue.severity === 'high') {
                recommendations.push({
                    category: issue.category,
                    priority: 'high',
                    title: `Address ${issue.metric} degradation`,
                    description: `The ${issue.metric} metric has degraded significantly. Immediate attention required.`,
                    estimatedImpact: 'High - User experience impact',
                });
            }
        });
        if (overview.api.p95Latency > 500) {
            recommendations.push({
                category: 'api',
                priority: 'high',
                title: 'Optimize API response times',
                description: 'P95 latency is above 500ms. Consider database optimization, caching, or query improvements.',
                estimatedImpact: 'High - Reduces user wait times',
            });
        }
        if (overview.budgets.activeBudgets === 0) {
            recommendations.push({
                category: 'budgets',
                priority: 'medium',
                title: 'Implement performance budgets',
                description: 'Set up performance budgets to prevent regressions and maintain performance standards.',
                estimatedImpact: 'Medium - Prevents future issues',
            });
        }
        return recommendations;
    }
    async calculateBudgetCompliance(workspaceId, period = '7d') {
        return {
            overallScore: 85,
            categoryScores: {
                lighthouse: 90,
                webVitals: 80,
                bundleSize: 85,
                apiLatency: 85,
            },
            violationsByCategory: {
                lighthouse: 2,
                webVitals: 5,
                bundleSize: 1,
                apiLatency: 3,
            },
        };
    }
    getPeriodDays(period) {
        switch (period) {
            case '24h': return 1;
            case '7d': return 7;
            case '30d': return 30;
            default: return 7;
        }
    }
}
exports.PerformanceMonitoringService = PerformanceMonitoringService;
exports.performanceMonitoringService = new PerformanceMonitoringService();
//# sourceMappingURL=PerformanceMonitoringService.js.map