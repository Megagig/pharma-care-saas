"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = __importDefault(require("../utils/logger"));
const WebVitalsService_1 = require("./WebVitalsService");
const PerformanceAlertService_1 = require("./PerformanceAlertService");
const FeatureFlagService_1 = __importDefault(require("./FeatureFlagService"));
class DeploymentMonitoringService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.activeDeployments = new Map();
        this.monitoringIntervals = new Map();
        this.rollbackTimeouts = new Map();
        this.defaultThresholds = {
            lighthouse: {
                performance: 85,
                accessibility: 90,
                bestPractices: 90,
                seo: 90,
            },
            webVitals: {
                FCP: 2000,
                LCP: 3000,
                CLS: 0.15,
                TTFB: 1000,
                FID: 200,
            },
            apiLatency: {
                p95: 1000,
                maxIncrease: 50,
            },
            errorRate: 5,
            throughputDecrease: 30,
        };
    }
    async startDeploymentMonitoring(deploymentId, rolloutPercentage, thresholds) {
        logger_1.default.info(`Starting deployment monitoring for ${deploymentId} with ${rolloutPercentage}% rollout`);
        const deployment = {
            id: deploymentId,
            startTime: new Date(),
            status: 'starting',
            rolloutPercentage,
            metrics: [],
            alerts: [],
            rollbackTriggers: [],
            rollbackExecuted: false,
        };
        this.activeDeployments.set(deploymentId, deployment);
        const finalThresholds = {
            ...this.defaultThresholds,
            ...thresholds,
        };
        const monitoringInterval = setInterval(async () => {
            await this.collectMetrics(deploymentId, finalThresholds);
        }, 30000);
        this.monitoringIntervals.set(deploymentId, monitoringInterval);
        const rollbackTimeout = setTimeout(async () => {
            await this.executeRollback(deploymentId, 'timeout', 'Deployment monitoring timeout reached');
        }, 30 * 60 * 1000);
        this.rollbackTimeouts.set(deploymentId, rollbackTimeout);
        deployment.status = 'monitoring';
        this.emit('deploymentStarted', deployment);
    }
    async collectMetrics(deploymentId, thresholds) {
        try {
            const deployment = this.activeDeployments.get(deploymentId);
            if (!deployment || deployment.rollbackExecuted) {
                return;
            }
            const metrics = await this.getCurrentMetrics();
            deployment.metrics.push(metrics);
            if (deployment.metrics.length > 100) {
                deployment.metrics = deployment.metrics.slice(-100);
            }
            await this.checkThresholds(deploymentId, metrics, thresholds);
            this.emit('metricsCollected', { deploymentId, metrics });
        }
        catch (error) {
            logger_1.default.error(`Error collecting metrics for deployment ${deploymentId}:`, error);
        }
    }
    async getCurrentMetrics() {
        return {
            timestamp: new Date(),
            lighthouse: {
                performance: await this.getLighthouseScore(),
                accessibility: 95,
                bestPractices: 92,
                seo: 98,
            },
            webVitals: await this.getWebVitalsMetrics(),
            apiLatency: await this.getAPILatencyMetrics(),
            errorRate: await this.getErrorRate(),
            throughput: await this.getThroughput(),
            activeUsers: await this.getActiveUsers(),
            featureFlagMetrics: FeatureFlagService_1.default.getMetrics(),
        };
    }
    async getLighthouseScore() {
        try {
            return 88 + Math.random() * 10;
        }
        catch (error) {
            logger_1.default.error('Error getting Lighthouse score:', error);
            return 0;
        }
    }
    async getWebVitalsMetrics() {
        try {
            const recentMetrics = await WebVitalsService_1.WebVitalsService.getRecentMetrics(5 * 60 * 1000);
            if (recentMetrics.length === 0) {
                return {
                    FCP: 0,
                    LCP: 0,
                    CLS: 0,
                    TTFB: 0,
                    FID: 0,
                };
            }
            const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
            return {
                FCP: avg(recentMetrics.map(m => m.FCP).filter(Boolean)),
                LCP: avg(recentMetrics.map(m => m.LCP).filter(Boolean)),
                CLS: avg(recentMetrics.map(m => m.CLS).filter(Boolean)),
                TTFB: avg(recentMetrics.map(m => m.TTFB).filter(Boolean)),
                FID: avg(recentMetrics.map(m => m.FID).filter(Boolean)),
            };
        }
        catch (error) {
            logger_1.default.error('Error getting Web Vitals metrics:', error);
            return {
                FCP: 0,
                LCP: 0,
                CLS: 0,
                TTFB: 0,
                FID: 0,
            };
        }
    }
    async getAPILatencyMetrics() {
        try {
            const baseLatency = 200 + Math.random() * 300;
            return {
                p50: baseLatency,
                p95: baseLatency * 2.5,
                p99: baseLatency * 4,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting API latency metrics:', error);
            return {
                p50: 0,
                p95: 0,
                p99: 0,
            };
        }
    }
    async getErrorRate() {
        try {
            return Math.random() * 2;
        }
        catch (error) {
            logger_1.default.error('Error getting error rate:', error);
            return 0;
        }
    }
    async getThroughput() {
        try {
            return 50 + Math.random() * 100;
        }
        catch (error) {
            logger_1.default.error('Error getting throughput:', error);
            return 0;
        }
    }
    async getActiveUsers() {
        try {
            return Math.floor(100 + Math.random() * 500);
        }
        catch (error) {
            logger_1.default.error('Error getting active users:', error);
            return 0;
        }
    }
    async checkThresholds(deploymentId, metrics, thresholds) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment)
            return;
        const violations = [];
        if (metrics.lighthouse.performance < thresholds.lighthouse.performance) {
            violations.push({
                type: 'performance',
                threshold: thresholds.lighthouse.performance,
                duration: 0,
                severity: 'high',
            });
        }
        if (metrics.webVitals.LCP > thresholds.webVitals.LCP) {
            violations.push({
                type: 'performance',
                threshold: thresholds.webVitals.LCP,
                duration: 0,
                severity: 'medium',
            });
        }
        if (metrics.webVitals.CLS > thresholds.webVitals.CLS) {
            violations.push({
                type: 'performance',
                threshold: thresholds.webVitals.CLS,
                duration: 0,
                severity: 'medium',
            });
        }
        if (metrics.apiLatency.p95 > thresholds.apiLatency.p95) {
            violations.push({
                type: 'api_latency',
                threshold: thresholds.apiLatency.p95,
                duration: 0,
                severity: 'high',
            });
        }
        if (metrics.errorRate > thresholds.errorRate) {
            violations.push({
                type: 'error_rate',
                threshold: thresholds.errorRate,
                duration: 0,
                severity: 'critical',
            });
        }
        deployment.rollbackTriggers.push(...violations);
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        const highViolations = violations.filter(v => v.severity === 'high');
        if (criticalViolations.length > 0) {
            await this.executeRollback(deploymentId, 'critical_threshold', `Critical performance violations detected: ${criticalViolations.map(v => v.type).join(', ')}`);
        }
        else if (highViolations.length >= 2) {
            await this.executeRollback(deploymentId, 'multiple_high_violations', `Multiple high-severity violations detected: ${highViolations.map(v => v.type).join(', ')}`);
        }
        if (violations.length > 0) {
            await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                type: 'deployment_threshold_violation',
                severity: violations.some(v => v.severity === 'critical') ? 'critical' : 'high',
                message: `Performance threshold violations during deployment ${deploymentId}`,
                data: {
                    deploymentId,
                    violations,
                    metrics,
                },
            });
        }
    }
    async executeRollback(deploymentId, reason, message) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment || deployment.rollbackExecuted) {
            return;
        }
        logger_1.default.error(`Executing rollback for deployment ${deploymentId}: ${reason} - ${message}`);
        deployment.rollbackExecuted = true;
        deployment.status = 'rolled_back';
        deployment.endTime = new Date();
        try {
            this.stopMonitoring(deploymentId);
            const performanceFeatures = [
                'themeOptimization',
                'bundleOptimization',
                'apiCaching',
                'databaseOptimization',
                'cursorPagination',
                'backgroundJobs',
                'serviceWorker',
                'virtualization',
                'reactQueryOptimization',
            ];
            for (const feature of performanceFeatures) {
                process.env[`FEATURE_${feature.toUpperCase()}`] = 'false';
                process.env.FEATURE_ROLLOUT_PERCENTAGE = '0';
            }
            FeatureFlagService_1.default.clearCache();
            await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                type: 'deployment_rollback',
                severity: 'critical',
                message: `Deployment ${deploymentId} has been rolled back: ${message}`,
                data: {
                    deploymentId,
                    reason,
                    message,
                    rollbackTime: new Date(),
                },
            });
            this.emit('deploymentRolledBack', { deploymentId, reason, message });
            logger_1.default.info(`Rollback completed for deployment ${deploymentId}`);
        }
        catch (error) {
            logger_1.default.error(`Error during rollback for deployment ${deploymentId}:`, error);
            await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
                type: 'rollback_failed',
                severity: 'critical',
                message: `Rollback failed for deployment ${deploymentId}: ${error.message}`,
                data: {
                    deploymentId,
                    error: error.message,
                },
            });
        }
    }
    async completeDeployment(deploymentId) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        deployment.status = 'success';
        deployment.endTime = new Date();
        this.stopMonitoring(deploymentId);
        logger_1.default.info(`Deployment ${deploymentId} completed successfully`);
        this.emit('deploymentCompleted', deployment);
        await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
            type: 'deployment_success',
            severity: 'info',
            message: `Deployment ${deploymentId} completed successfully with ${deployment.rolloutPercentage}% rollout`,
            data: {
                deploymentId,
                rolloutPercentage: deployment.rolloutPercentage,
                duration: deployment.endTime.getTime() - deployment.startTime.getTime(),
                metricsCount: deployment.metrics.length,
            },
        });
    }
    stopMonitoring(deploymentId) {
        const interval = this.monitoringIntervals.get(deploymentId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(deploymentId);
        }
        const timeout = this.rollbackTimeouts.get(deploymentId);
        if (timeout) {
            clearTimeout(timeout);
            this.rollbackTimeouts.delete(deploymentId);
        }
    }
    getDeploymentStatus(deploymentId) {
        return this.activeDeployments.get(deploymentId) || null;
    }
    getActiveDeployments() {
        return Array.from(this.activeDeployments.values());
    }
    async forceRollback(deploymentId, reason) {
        await this.executeRollback(deploymentId, 'manual', reason);
    }
    async updateRolloutPercentage(deploymentId, newPercentage) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        if (newPercentage < 0 || newPercentage > 100) {
            throw new Error('Rollout percentage must be between 0 and 100');
        }
        const oldPercentage = deployment.rolloutPercentage;
        deployment.rolloutPercentage = newPercentage;
        process.env.FEATURE_ROLLOUT_PERCENTAGE = newPercentage.toString();
        FeatureFlagService_1.default.clearCache();
        logger_1.default.info(`Updated rollout percentage for deployment ${deploymentId}: ${oldPercentage}% -> ${newPercentage}%`);
        this.emit('rolloutUpdated', { deploymentId, oldPercentage, newPercentage });
        await PerformanceAlertService_1.PerformanceAlertService.sendAlert({
            type: 'rollout_updated',
            severity: 'info',
            message: `Rollout percentage updated for deployment ${deploymentId}: ${oldPercentage}% -> ${newPercentage}%`,
            data: {
                deploymentId,
                oldPercentage,
                newPercentage,
            },
        });
    }
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;
        for (const [deploymentId, deployment] of this.activeDeployments.entries()) {
            if (deployment.endTime && (now - deployment.endTime.getTime()) > maxAge) {
                this.activeDeployments.delete(deploymentId);
                this.stopMonitoring(deploymentId);
                logger_1.default.info(`Cleaned up old deployment: ${deploymentId}`);
            }
        }
    }
}
exports.default = new DeploymentMonitoringService();
//# sourceMappingURL=DeploymentMonitoringService.js.map