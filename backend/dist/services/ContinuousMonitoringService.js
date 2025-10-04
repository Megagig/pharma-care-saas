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
const events_1 = require("events");
const cron = __importStar(require("node-cron"));
const logger_1 = __importDefault(require("../utils/logger"));
const WebVitalsService_1 = require("./WebVitalsService");
const LighthouseCIService_1 = require("./LighthouseCIService");
const PerformanceAlertService_1 = require("./PerformanceAlertService");
class ContinuousMonitoringService extends events_1.EventEmitter {
    constructor() {
        super();
        this.monitoringTasks = new Map();
        this.cronJobs = new Map();
        this.isRunning = false;
        this.config = this.getDefaultConfig();
    }
    async start(config) {
        if (this.isRunning) {
            logger_1.default.warn('Continuous monitoring is already running');
            return;
        }
        this.config = { ...this.config, ...config };
        this.isRunning = true;
        logger_1.default.info('Starting continuous performance monitoring');
        if (this.config.webVitals.enabled) {
            await this.startWebVitalsMonitoring();
        }
        if (this.config.lighthouse.enabled) {
            await this.startLighthouseMonitoring();
        }
        if (this.config.apiLatency.enabled) {
            await this.startAPILatencyMonitoring();
        }
        if (this.config.regressionDetection.enabled) {
            await this.startRegressionDetection();
        }
        this.scheduleReports();
        this.emit('monitoringStarted', this.config);
        logger_1.default.info('Continuous performance monitoring started');
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        logger_1.default.info('Stopping continuous performance monitoring');
        for (const [name, task] of this.monitoringTasks) {
            clearInterval(task);
            logger_1.default.info(`Stopped monitoring task: ${name}`);
        }
        this.monitoringTasks.clear();
        for (const [name, job] of this.cronJobs) {
            job.stop();
            logger_1.default.info(`Stopped cron job: ${name}`);
        }
        this.cronJobs.clear();
        this.isRunning = false;
        this.emit('monitoringStopped');
        logger_1.default.info('Continuous performance monitoring stopped');
    }
    async startWebVitalsMonitoring() {
        logger_1.default.info('Starting Web Vitals monitoring');
        const interval = setInterval(async () => {
            try {
                await this.checkWebVitalsThresholds();
            }
            catch (error) {
                logger_1.default.error('Error in Web Vitals monitoring:', error);
            }
        }, this.config.webVitals.collectionInterval * 60 * 1000);
        this.monitoringTasks.set('webVitals', interval);
    }
    async startLighthouseMonitoring() {
        logger_1.default.info('Starting Lighthouse monitoring');
        const job = cron.schedule(this.config.lighthouse.schedule, async () => {
            try {
                await this.runLighthouseChecks();
            }
            catch (error) {
                logger_1.default.error('Error in Lighthouse monitoring:', error);
            }
        });
        this.cronJobs.set('lighthouse', job);
    }
    async startAPILatencyMonitoring() {
        logger_1.default.info('Starting API latency monitoring');
        const interval = setInterval(async () => {
            try {
                await this.checkAPILatencyThresholds();
            }
            catch (error) {
                logger_1.default.error('Error in API latency monitoring:', error);
            }
        }, this.config.apiLatency.monitoringInterval * 60 * 1000);
        this.monitoringTasks.set('apiLatency', interval);
    }
    async startRegressionDetection() {
        logger_1.default.info('Starting regression detection');
        const interval = setInterval(async () => {
            try {
                await this.detectPerformanceRegressions();
            }
            catch (error) {
                logger_1.default.error('Error in regression detection:', error);
            }
        }, this.config.regressionDetection.analysisInterval * 60 * 1000);
        this.monitoringTasks.set('regressionDetection', interval);
    }
    async checkWebVitalsThresholds() {
        const recentMetrics = await WebVitalsService_1.WebVitalsService.getRecentMetrics(this.config.webVitals.collectionInterval * 60 * 1000);
        if (recentMetrics.length === 0) {
            return;
        }
        const averages = this.calculateWebVitalsAverages(recentMetrics);
        const thresholds = this.config.webVitals.alertThresholds;
        const violations = [];
        if (averages.LCP > thresholds.LCP) {
            violations.push({ metric: 'LCP', value: averages.LCP, threshold: thresholds.LCP });
        }
        if (averages.FID > thresholds.FID) {
            violations.push({ metric: 'FID', value: averages.FID, threshold: thresholds.FID });
        }
        if (averages.CLS > thresholds.CLS) {
            violations.push({ metric: 'CLS', value: averages.CLS, threshold: thresholds.CLS });
        }
        if (averages.TTFB > thresholds.TTFB) {
            violations.push({ metric: 'TTFB', value: averages.TTFB, threshold: thresholds.TTFB });
        }
        for (const violation of violations) {
            await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                type: 'web_vitals_threshold',
                severity: 'medium',
                message: `Web Vitals threshold exceeded: ${violation.metric} = ${violation.value} > ${violation.threshold}`,
                data: {
                    metric: violation.metric,
                    value: violation.value,
                    threshold: violation.threshold,
                    sampleSize: recentMetrics.length,
                },
            });
        }
        this.emit('webVitalsChecked', { averages, violations });
    }
    async runLighthouseChecks() {
        for (const url of this.config.lighthouse.urls) {
            try {
                const result = await LighthouseCIService_1.LighthouseCIService.runLighthouseTest(url);
                const thresholds = this.config.lighthouse.alertThresholds;
                const violations = [];
                if (result.performance < thresholds.performance) {
                    violations.push({ metric: 'Performance', value: result.performance, threshold: thresholds.performance });
                }
                if (result.accessibility < thresholds.accessibility) {
                    violations.push({ metric: 'Accessibility', value: result.accessibility, threshold: thresholds.accessibility });
                }
                if (result.bestPractices < thresholds.bestPractices) {
                    violations.push({ metric: 'Best Practices', value: result.bestPractices, threshold: thresholds.bestPractices });
                }
                if (result.seo < thresholds.seo) {
                    violations.push({ metric: 'SEO', value: result.seo, threshold: thresholds.seo });
                }
                for (const violation of violations) {
                    await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                        type: 'lighthouse_threshold',
                        severity: violation.metric === 'Performance' ? 'high' : 'medium',
                        message: `Lighthouse ${violation.metric} threshold exceeded: ${violation.value} < ${violation.threshold}`,
                        data: {
                            url,
                            metric: violation.metric,
                            value: violation.value,
                            threshold: violation.threshold,
                            fullResult: result,
                        },
                    });
                }
                this.emit('lighthouseChecked', { url, result, violations });
            }
            catch (error) {
                logger_1.default.error(`Error running Lighthouse check for ${url}:`, error);
            }
        }
    }
    async checkAPILatencyThresholds() {
        for (const endpoint of this.config.apiLatency.endpoints) {
            try {
                const metrics = await this.measureEndpointLatency(endpoint);
                const thresholds = this.config.apiLatency.alertThresholds;
                const violations = [];
                if (metrics.p95 > thresholds.p95) {
                    violations.push({ metric: 'P95 Latency', value: metrics.p95, threshold: thresholds.p95 });
                }
                if (metrics.errorRate > thresholds.errorRate) {
                    violations.push({ metric: 'Error Rate', value: metrics.errorRate, threshold: thresholds.errorRate });
                }
                for (const violation of violations) {
                    await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                        type: 'api_latency_threshold',
                        severity: 'high',
                        message: `API ${violation.metric} threshold exceeded for ${endpoint}: ${violation.value} > ${violation.threshold}`,
                        data: {
                            endpoint,
                            metric: violation.metric,
                            value: violation.value,
                            threshold: violation.threshold,
                            fullMetrics: metrics,
                        },
                    });
                }
                this.emit('apiLatencyChecked', { endpoint, metrics, violations });
            }
            catch (error) {
                logger_1.default.error(`Error checking API latency for ${endpoint}:`, error);
            }
        }
    }
    async detectPerformanceRegressions() {
        logger_1.default.info('Running regression detection analysis');
        try {
            const trends = await this.analyzePerformanceTrends();
            const regressions = [];
            for (const trend of trends) {
                if (trend.trend === 'degrading' && trend.significance === 'high') {
                    const regression = {
                        id: `regression_${Date.now()}_${trend.metric}`,
                        timestamp: new Date(),
                        metric: trend.metric,
                        severity: this.calculateRegressionSeverity(trend.changePercentage),
                        currentValue: trend.data[trend.data.length - 1]?.value || 0,
                        baselineValue: trend.data[0]?.value || 0,
                        changePercentage: trend.changePercentage,
                        affectedUsers: await this.estimateAffectedUsers(trend.metric),
                        description: `Performance regression detected in ${trend.metric}: ${trend.changePercentage.toFixed(1)}% degradation over ${trend.period}`,
                        recommendations: this.generateRegressionRecommendations(trend.metric, trend.changePercentage),
                    };
                    regressions.push(regression);
                }
            }
            for (const regression of regressions) {
                await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                    type: 'performance_regression',
                    severity: regression.severity,
                    message: regression.description,
                    data: regression,
                });
            }
            this.emit('regressionDetected', regressions);
        }
        catch (error) {
            logger_1.default.error('Error in regression detection:', error);
        }
    }
    async analyzePerformanceTrends() {
        const trends = [];
        const lookbackHours = this.config.regressionDetection.lookbackPeriod;
        const webVitalsData = await WebVitalsService_1.WebVitalsService.getMetricsInRange(new Date(Date.now() - lookbackHours * 60 * 60 * 1000), new Date());
        if (webVitalsData.length > 0) {
            const webVitalsTrends = this.calculateMetricTrends(webVitalsData, ['LCP', 'FID', 'CLS', 'TTFB']);
            trends.push(...webVitalsTrends);
        }
        const apiTrends = await this.simulateAPITrends();
        trends.push(...apiTrends);
        return trends;
    }
    calculateMetricTrends(data, metrics) {
        const trends = [];
        for (const metric of metrics) {
            const values = data.map(d => ({ timestamp: new Date(d.timestamp), value: d[metric] }))
                .filter(d => d.value != null)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            if (values.length < 2)
                continue;
            const firstValue = values[0].value;
            const lastValue = values[values.length - 1].value;
            const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
            let trend;
            let significance;
            if (Math.abs(changePercentage) < 5) {
                trend = 'stable';
                significance = 'low';
            }
            else if (changePercentage > 0) {
                trend = 'degrading';
                significance = changePercentage > 20 ? 'high' : changePercentage > 10 ? 'medium' : 'low';
            }
            else {
                trend = 'improving';
                significance = Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low';
            }
            trends.push({
                metric,
                period: 'day',
                trend,
                changePercentage,
                significance,
                data: values,
            });
        }
        return trends;
    }
    async simulateAPITrends() {
        return [];
    }
    calculateWebVitalsAverages(metrics) {
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        return {
            LCP: avg(metrics.map(m => m.LCP).filter(Boolean)),
            FID: avg(metrics.map(m => m.FID).filter(Boolean)),
            CLS: avg(metrics.map(m => m.CLS).filter(Boolean)),
            TTFB: avg(metrics.map(m => m.TTFB).filter(Boolean)),
        };
    }
    async measureEndpointLatency(endpoint) {
        return {
            p50: 200 + Math.random() * 100,
            p95: 400 + Math.random() * 200,
            errorRate: Math.random() * 2,
        };
    }
    calculateRegressionSeverity(changePercentage) {
        const absChange = Math.abs(changePercentage);
        if (absChange > 50)
            return 'critical';
        if (absChange > 25)
            return 'high';
        if (absChange > 10)
            return 'medium';
        return 'low';
    }
    async estimateAffectedUsers(metric) {
        const baseUsers = 1000;
        switch (metric) {
            case 'LCP':
            case 'FID':
                return Math.floor(baseUsers * 0.8);
            case 'CLS':
            case 'TTFB':
                return Math.floor(baseUsers * 0.6);
            default:
                return Math.floor(baseUsers * 0.4);
        }
    }
    generateRegressionRecommendations(metric, changePercentage) {
        const recommendations = [];
        switch (metric) {
            case 'LCP':
                recommendations.push('Review image optimization and lazy loading implementation');
                recommendations.push('Check server response times and CDN performance');
                recommendations.push('Analyze critical resource loading and preloading strategies');
                break;
            case 'FID':
                recommendations.push('Review JavaScript bundle size and execution time');
                recommendations.push('Check for blocking third-party scripts');
                recommendations.push('Analyze main thread blocking tasks');
                break;
            case 'CLS':
                recommendations.push('Review dynamic content insertion and image dimensions');
                recommendations.push('Check font loading strategies and web font optimization');
                recommendations.push('Analyze layout shift sources in recent deployments');
                break;
            case 'TTFB':
                recommendations.push('Review server performance and database query optimization');
                recommendations.push('Check CDN configuration and caching strategies');
                recommendations.push('Analyze API response times and backend performance');
                break;
            default:
                recommendations.push('Review recent deployments and configuration changes');
                recommendations.push('Check monitoring data for correlation with other metrics');
        }
        if (Math.abs(changePercentage) > 25) {
            recommendations.unshift('Consider immediate rollback if recent deployment caused this regression');
        }
        return recommendations;
    }
    scheduleReports() {
        if (this.config.reporting.dailyReport) {
            const dailyJob = cron.schedule('0 9 * * *', async () => {
                await this.generateDailyReport();
            });
            this.cronJobs.set('dailyReport', dailyJob);
        }
        if (this.config.reporting.weeklyReport) {
            const weeklyJob = cron.schedule('0 9 * * 1', async () => {
                await this.generateWeeklyReport();
            });
            this.cronJobs.set('weeklyReport', weeklyJob);
        }
        if (this.config.reporting.monthlyReport) {
            const monthlyJob = cron.schedule('0 9 1 * *', async () => {
                await this.generateMonthlyReport();
            });
            this.cronJobs.set('monthlyReport', monthlyJob);
        }
    }
    async generateDailyReport() {
        logger_1.default.info('Generating daily performance report');
        try {
            const report = {
                date: new Date().toISOString().split('T')[0],
                summary: 'Daily performance summary',
            };
            await this.sendReport('Daily Performance Report', report);
        }
        catch (error) {
            logger_1.default.error('Error generating daily report:', error);
        }
    }
    async generateWeeklyReport() {
        logger_1.default.info('Generating weekly performance report');
        try {
            const report = {
                week: new Date().toISOString().split('T')[0],
                summary: 'Weekly performance summary',
            };
            await this.sendReport('Weekly Performance Report', report);
        }
        catch (error) {
            logger_1.default.error('Error generating weekly report:', error);
        }
    }
    async generateMonthlyReport() {
        logger_1.default.info('Generating monthly performance report');
        try {
            const report = {
                month: new Date().toISOString().split('T')[0],
                summary: 'Monthly performance summary',
            };
            await this.sendReport('Monthly Performance Report', report);
        }
        catch (error) {
            logger_1.default.error('Error generating monthly report:', error);
        }
    }
    async sendReport(subject, report) {
        logger_1.default.info(`Sending report: ${subject}`);
    }
    getDefaultConfig() {
        return {
            webVitals: {
                enabled: true,
                collectionInterval: 5,
                alertThresholds: {
                    LCP: 2500,
                    FID: 100,
                    CLS: 0.1,
                    TTFB: 800,
                },
            },
            lighthouse: {
                enabled: true,
                schedule: '0 */6 * * *',
                urls: [
                    process.env.PRODUCTION_URL || 'https://app.pharmacare.com',
                ],
                alertThresholds: {
                    performance: 85,
                    accessibility: 90,
                    bestPractices: 90,
                    seo: 90,
                },
            },
            apiLatency: {
                enabled: true,
                monitoringInterval: 10,
                endpoints: [
                    '/api/patients',
                    '/api/notes',
                    '/api/medications',
                    '/api/dashboard/overview',
                ],
                alertThresholds: {
                    p95: 1000,
                    errorRate: 5,
                },
            },
            regressionDetection: {
                enabled: true,
                analysisInterval: 30,
                lookbackPeriod: 24,
                regressionThreshold: 10,
            },
            reporting: {
                dailyReport: true,
                weeklyReport: true,
                monthlyReport: true,
                recipients: process.env.PERFORMANCE_REPORT_RECIPIENTS?.split(',') || [],
            },
        };
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            activeTasks: Array.from(this.monitoringTasks.keys()),
            activeJobs: Array.from(this.cronJobs.keys()),
        };
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.isRunning) {
            await this.stop();
            await this.start(this.config);
        }
        logger_1.default.info('Monitoring configuration updated');
    }
}
exports.default = new ContinuousMonitoringService();
//# sourceMappingURL=ContinuousMonitoringService.js.map