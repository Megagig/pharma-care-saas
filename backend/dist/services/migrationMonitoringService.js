"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationMonitoringService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const migrationValidationService_1 = require("./migrationValidationService");
class MigrationMonitoringService {
    constructor() {
        this.alerts = [];
        this.metrics = [];
        this.validationService = new migrationValidationService_1.MigrationValidationService();
    }
    async collectMetrics() {
        try {
            logger_1.default.info('Collecting migration metrics...');
            const User = mongoose_1.default.model('User');
            const Workplace = mongoose_1.default.model('Workplace');
            const Subscription = mongoose_1.default.model('Subscription');
            const [totalUsers, migratedUsers, totalWorkspaces, workspacesWithSubscriptions, totalSubscriptions, workspaceSubscriptions, userSubscriptions,] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ workplaceId: { $exists: true, $ne: null } }),
                Workplace.countDocuments(),
                Workplace.countDocuments({ currentSubscriptionId: { $exists: true, $ne: null } }),
                Subscription.countDocuments(),
                Subscription.countDocuments({ workspaceId: { $exists: true, $ne: null } }),
                Subscription.countDocuments({ userId: { $exists: true, $ne: null } }),
            ]);
            const validation = await this.validationService.runCompleteValidation();
            const migrationProgress = Math.round(((migratedUsers / Math.max(totalUsers, 1)) +
                (workspaceSubscriptions / Math.max(totalSubscriptions, 1))) / 2 * 100);
            const metrics = {
                timestamp: new Date(),
                totalUsers,
                migratedUsers,
                totalWorkspaces,
                workspacesWithSubscriptions,
                totalSubscriptions,
                workspaceSubscriptions,
                userSubscriptions,
                validationScore: validation.score,
                criticalIssues: validation.issues.filter(i => i.type === 'critical').length,
                errors: validation.issues.filter(i => i.type === 'error').length,
                warnings: validation.issues.filter(i => i.type === 'warning').length,
                migrationProgress,
            };
            this.metrics.push(metrics);
            if (this.metrics.length > 100) {
                this.metrics = this.metrics.slice(-100);
            }
            logger_1.default.info('Migration metrics collected', {
                migrationProgress,
                validationScore: validation.score,
                criticalIssues: metrics.criticalIssues,
            });
            return metrics;
        }
        catch (error) {
            logger_1.default.error('Failed to collect migration metrics', { error });
            throw error;
        }
    }
    async checkForAlerts() {
        try {
            const newAlerts = [];
            const metrics = await this.collectMetrics();
            const validation = await this.validationService.runCompleteValidation();
            if (metrics.criticalIssues > 0) {
                newAlerts.push({
                    id: `critical-issues-${Date.now()}`,
                    type: 'critical',
                    title: 'Critical Migration Issues Detected',
                    message: `${metrics.criticalIssues} critical issues found that require immediate attention`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        criticalIssues: validation.issues.filter(i => i.type === 'critical'),
                    },
                });
            }
            const previousMetrics = this.metrics[this.metrics.length - 2];
            if (previousMetrics && metrics.migrationProgress === previousMetrics.migrationProgress) {
                newAlerts.push({
                    id: `migration-stalled-${Date.now()}`,
                    type: 'warning',
                    title: 'Migration Progress Stalled',
                    message: `Migration progress has not changed: ${metrics.migrationProgress}%`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        currentProgress: metrics.migrationProgress,
                        previousProgress: previousMetrics.migrationProgress,
                    },
                });
            }
            if (metrics.validationScore < 70) {
                newAlerts.push({
                    id: `low-validation-score-${Date.now()}`,
                    type: 'error',
                    title: 'Low Validation Score',
                    message: `Validation score is ${metrics.validationScore}%, indicating data quality issues`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        validationScore: metrics.validationScore,
                        issueCount: metrics.errors + metrics.criticalIssues,
                    },
                });
            }
            if (metrics.errors > 10) {
                newAlerts.push({
                    id: `high-error-count-${Date.now()}`,
                    type: 'warning',
                    title: 'High Error Count',
                    message: `${metrics.errors} errors detected in migration validation`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        errorCount: metrics.errors,
                        errors: validation.issues.filter(i => i.type === 'error'),
                    },
                });
            }
            if (metrics.userSubscriptions > 0) {
                newAlerts.push({
                    id: `legacy-subscriptions-${Date.now()}`,
                    type: 'info',
                    title: 'Legacy Subscriptions Remaining',
                    message: `${metrics.userSubscriptions} user-based subscriptions still need migration`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        userSubscriptions: metrics.userSubscriptions,
                    },
                });
            }
            this.alerts.push(...newAlerts);
            this.alerts = this.alerts.filter(alert => !alert.resolved ||
                (new Date().getTime() - alert.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000);
            logger_1.default.info('Migration alerts checked', {
                newAlerts: newAlerts.length,
                totalAlerts: this.alerts.length,
            });
            return newAlerts;
        }
        catch (error) {
            logger_1.default.error('Failed to check for migration alerts', { error });
            throw error;
        }
    }
    async generateReport(type = 'on_demand') {
        try {
            logger_1.default.info(`Generating ${type} migration report...`);
            const metrics = await this.collectMetrics();
            const validation = await this.validationService.runCompleteValidation();
            const alerts = await this.checkForAlerts();
            const nextActions = this.generateNextActions(metrics, validation);
            const report = {
                id: `migration-report-${type}-${Date.now()}`,
                timestamp: new Date(),
                type,
                metrics,
                validation,
                alerts: this.alerts.filter(a => !a.resolved),
                recommendations: validation.recommendations,
                nextActions,
            };
            logger_1.default.info('Migration report generated', {
                type,
                migrationProgress: metrics.migrationProgress,
                validationScore: metrics.validationScore,
                activeAlerts: report.alerts.length,
            });
            return report;
        }
        catch (error) {
            logger_1.default.error('Failed to generate migration report', { error });
            throw error;
        }
    }
    getTrendAnalysis() {
        if (this.metrics.length < 2) {
            return {
                progressTrend: 'stable',
                validationTrend: 'stable',
                recentMetrics: this.metrics,
                averageProgress: this.metrics[0]?.migrationProgress || 0,
                averageValidationScore: this.metrics[0]?.validationScore || 0,
            };
        }
        const recentMetrics = this.metrics.slice(-10);
        const averageProgress = recentMetrics.reduce((sum, m) => sum + m.migrationProgress, 0) / recentMetrics.length;
        const averageValidationScore = recentMetrics.reduce((sum, m) => sum + m.validationScore, 0) / recentMetrics.length;
        const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
        const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));
        const firstHalfProgress = firstHalf.reduce((sum, m) => sum + m.migrationProgress, 0) / firstHalf.length;
        const secondHalfProgress = secondHalf.reduce((sum, m) => sum + m.migrationProgress, 0) / secondHalf.length;
        const firstHalfValidation = firstHalf.reduce((sum, m) => sum + m.validationScore, 0) / firstHalf.length;
        const secondHalfValidation = secondHalf.reduce((sum, m) => sum + m.validationScore, 0) / secondHalf.length;
        const progressTrend = secondHalfProgress > firstHalfProgress + 2 ? 'improving' :
            secondHalfProgress < firstHalfProgress - 2 ? 'declining' : 'stable';
        const validationTrend = secondHalfValidation > firstHalfValidation + 2 ? 'improving' :
            secondHalfValidation < firstHalfValidation - 2 ? 'declining' : 'stable';
        return {
            progressTrend,
            validationTrend,
            recentMetrics,
            averageProgress,
            averageValidationScore,
        };
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            logger_1.default.info('Alert resolved', { alertId, title: alert.title });
            return true;
        }
        return false;
    }
    getActiveAlerts() {
        return this.alerts.filter(a => !a.resolved);
    }
    async getStatusSummary() {
        try {
            const metrics = await this.collectMetrics();
            let status;
            if (metrics.migrationProgress === 0) {
                status = 'not_started';
            }
            else if (metrics.migrationProgress >= 100 && metrics.validationScore >= 90) {
                status = 'completed';
            }
            else if (metrics.criticalIssues > 0) {
                status = 'failed';
            }
            else {
                status = 'in_progress';
            }
            let estimatedCompletion;
            const trend = this.getTrendAnalysis();
            if (status === 'in_progress' && trend.progressTrend === 'improving') {
                const remainingProgress = 100 - metrics.migrationProgress;
                const progressRate = trend.averageProgress / this.metrics.length;
                const estimatedMeasurements = remainingProgress / Math.max(progressRate, 1);
                estimatedCompletion = new Date(Date.now() + estimatedMeasurements * 60 * 60 * 1000);
            }
            return {
                status,
                progress: metrics.migrationProgress,
                validationScore: metrics.validationScore,
                criticalIssues: metrics.criticalIssues,
                estimatedCompletion,
                lastUpdated: metrics.timestamp,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get migration status summary', { error });
            throw error;
        }
    }
    generateNextActions(metrics, validation) {
        const actions = [];
        if (metrics.criticalIssues > 0) {
            actions.push('🚨 Address critical issues immediately');
            actions.push('📋 Review critical issue details and fix root causes');
        }
        if (metrics.migrationProgress < 100) {
            if (metrics.totalUsers - metrics.migratedUsers > 0) {
                actions.push(`👥 Migrate ${metrics.totalUsers - metrics.migratedUsers} remaining users to workspaces`);
            }
            if (metrics.userSubscriptions > 0) {
                actions.push(`🔄 Migrate ${metrics.userSubscriptions} user-based subscriptions to workspace subscriptions`);
            }
        }
        if (metrics.validationScore < 90) {
            actions.push('🔧 Fix data consistency issues to improve validation score');
            if (metrics.errors > 0) {
                actions.push(`⚠️ Resolve ${metrics.errors} validation errors`);
            }
        }
        if (metrics.migrationProgress >= 90) {
            actions.push('📊 Set up ongoing monitoring for data integrity');
            actions.push('🧹 Clean up legacy data and references');
        }
        return actions;
    }
}
exports.MigrationMonitoringService = MigrationMonitoringService;
exports.default = MigrationMonitoringService;
//# sourceMappingURL=migrationMonitoringService.js.map