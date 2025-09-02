"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationDashboardController = void 0;
const migrationValidationService_1 = require("../services/migrationValidationService");
const migrationMonitoringService_1 = require("../services/migrationMonitoringService");
const enhancedMigration_1 = require("../scripts/enhancedMigration");
const logger_1 = __importDefault(require("../utils/logger"));
const validationService = new migrationValidationService_1.MigrationValidationService();
const monitoringService = new migrationMonitoringService_1.MigrationMonitoringService();
class MigrationDashboardController {
    static async getStatus(req, res) {
        try {
            const status = await monitoringService.getStatusSummary();
            const trendAnalysis = monitoringService.getTrendAnalysis();
            const activeAlerts = monitoringService.getActiveAlerts();
            res.json({
                success: true,
                data: {
                    status,
                    trends: trendAnalysis,
                    activeAlerts: activeAlerts.length,
                    lastUpdated: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get migration status', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration status',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async getMetrics(req, res) {
        try {
            const metrics = await monitoringService.collectMetrics();
            const trendAnalysis = monitoringService.getTrendAnalysis();
            res.json({
                success: true,
                data: {
                    current: metrics,
                    trends: trendAnalysis,
                    history: trendAnalysis.recentMetrics,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get migration metrics', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration metrics',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async runValidation(req, res) {
        try {
            logger_1.default.info('Running migration validation via API');
            const validation = await validationService.runCompleteValidation();
            res.json({
                success: true,
                data: validation,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to run migration validation', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to run migration validation',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async getAlerts(req, res) {
        try {
            const alerts = await monitoringService.checkForAlerts();
            const activeAlerts = monitoringService.getActiveAlerts();
            res.json({
                success: true,
                data: {
                    newAlerts: alerts,
                    activeAlerts,
                    totalActive: activeAlerts.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get migration alerts', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration alerts',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async resolveAlert(req, res) {
        try {
            const { alertId } = req.params;
            if (!alertId) {
                res.status(400).json({
                    success: false,
                    message: 'Alert ID is required',
                });
                return;
            }
            const resolved = monitoringService.resolveAlert(alertId);
            if (resolved) {
                res.json({
                    success: true,
                    message: 'Alert resolved successfully',
                    data: { alertId },
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'Alert not found',
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to resolve migration alert', { error, alertId: req.params.alertId });
            res.status(500).json({
                success: false,
                message: 'Failed to resolve alert',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async generateReport(req, res) {
        try {
            const { type = 'on_demand' } = req.query;
            if (!['daily', 'weekly', 'on_demand'].includes(type)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid report type. Must be daily, weekly, or on_demand',
                });
                return;
            }
            const report = await monitoringService.generateReport(type);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to generate migration report', { error, type: req.query.type });
            res.status(500).json({
                success: false,
                message: 'Failed to generate migration report',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async runDryRun(req, res) {
        try {
            logger_1.default.info('Running migration dry run via API');
            const orchestrator = new enhancedMigration_1.EnhancedMigrationOrchestrator({
                dryRun: true,
                enableIntegrityChecks: true,
                enableProgressTracking: false,
                enableBackup: false,
            });
            const result = await orchestrator.dryRun();
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to run migration dry run', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to run migration dry run',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async executeMigration(req, res) {
        try {
            const { dryRun = false, batchSize = 50, enableBackup = true, enableProgressTracking = true, enableIntegrityChecks = true, continueOnError = false, } = req.body;
            logger_1.default.info('Executing migration via API', {
                dryRun,
                batchSize,
                enableBackup,
                enableProgressTracking,
                enableIntegrityChecks,
                continueOnError,
            });
            const orchestrator = new enhancedMigration_1.EnhancedMigrationOrchestrator({
                dryRun,
                batchSize,
                enableBackup,
                enableProgressTracking,
                enableIntegrityChecks,
                continueOnError,
            });
            const result = await orchestrator.executeMigration();
            res.json({
                success: result.success,
                data: result,
                message: result.success ? 'Migration completed successfully' : 'Migration completed with issues',
            });
        }
        catch (error) {
            logger_1.default.error('Failed to execute migration', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to execute migration',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async executeRollback(req, res) {
        try {
            logger_1.default.info('Executing migration rollback via API');
            const orchestrator = new enhancedMigration_1.EnhancedMigrationOrchestrator({
                enableIntegrityChecks: true,
                enableProgressTracking: true,
            });
            const result = await orchestrator.executeRollback();
            res.json({
                success: result.success,
                data: result,
                message: result.success ? 'Rollback completed successfully' : 'Rollback completed with issues',
            });
        }
        catch (error) {
            logger_1.default.error('Failed to execute migration rollback', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to execute migration rollback',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async getProgress(req, res) {
        try {
            const status = await monitoringService.getStatusSummary();
            const metrics = await monitoringService.collectMetrics();
            res.json({
                success: true,
                data: {
                    status: status.status,
                    progress: status.progress,
                    validationScore: status.validationScore,
                    criticalIssues: status.criticalIssues,
                    estimatedCompletion: status.estimatedCompletion,
                    lastUpdated: status.lastUpdated,
                    details: {
                        totalUsers: metrics.totalUsers,
                        migratedUsers: metrics.migratedUsers,
                        totalWorkspaces: metrics.totalWorkspaces,
                        workspacesWithSubscriptions: metrics.workspacesWithSubscriptions,
                        userSubscriptions: metrics.userSubscriptions,
                        workspaceSubscriptions: metrics.workspaceSubscriptions,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get migration progress', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration progress',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    static async getHealthCheck(req, res) {
        try {
            const status = await monitoringService.getStatusSummary();
            const activeAlerts = monitoringService.getActiveAlerts();
            const criticalAlerts = activeAlerts.filter(a => a.type === 'critical');
            const health = {
                status: criticalAlerts.length > 0 ? 'unhealthy' :
                    status.criticalIssues > 0 ? 'degraded' : 'healthy',
                migrationProgress: status.progress,
                validationScore: status.validationScore,
                criticalIssues: status.criticalIssues,
                criticalAlerts: criticalAlerts.length,
                lastChecked: new Date(),
            };
            res.json({
                success: true,
                data: health,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get migration health check', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration health check',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
}
exports.MigrationDashboardController = MigrationDashboardController;
exports.default = MigrationDashboardController;
//# sourceMappingURL=migrationDashboardController.js.map