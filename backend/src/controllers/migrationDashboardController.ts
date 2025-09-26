import { Request, Response } from 'express';
import { MigrationValidationService } from '../services/migrationValidationService';
import { MigrationMonitoringService } from '../services/migrationMonitoringService';
import { EnhancedMigrationOrchestrator } from '../scripts/enhancedMigration';
import logger from '../utils/logger';

const validationService = new MigrationValidationService();
const monitoringService = new MigrationMonitoringService();

/**
 * Migration dashboard controller for monitoring and managing migrations
 */
export class MigrationDashboardController {

    /**
     * Get migration status overview
     */
    static async getStatus(req: Request, res: Response): Promise<void> {
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

        } catch (error) {
            logger.error('Failed to get migration status', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration status',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Get detailed migration metrics
     */
    static async getMetrics(req: Request, res: Response): Promise<void> {
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

        } catch (error) {
            logger.error('Failed to get migration metrics', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration metrics',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Run migration validation
     */
    static async runValidation(req: Request, res: Response): Promise<void> {
        try {
            logger.info('Running migration validation via API');

            const validation = await validationService.runCompleteValidation();

            res.json({
                success: true,
                data: validation,
            });

        } catch (error) {
            logger.error('Failed to run migration validation', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to run migration validation',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Get migration alerts
     */
    static async getAlerts(req: Request, res: Response): Promise<void> {
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

        } catch (error) {
            logger.error('Failed to get migration alerts', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration alerts',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Resolve a migration alert
     */
    static async resolveAlert(req: Request, res: Response): Promise<void> {
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
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Alert not found',
                });
            }

        } catch (error) {
            logger.error('Failed to resolve migration alert', { error, alertId: req.params.alertId });
            res.status(500).json({
                success: false,
                message: 'Failed to resolve alert',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Generate migration report
     */
    static async generateReport(req: Request, res: Response): Promise<void> {
        try {
            const { type = 'on_demand' } = req.query;

            if (!['daily', 'weekly', 'on_demand'].includes(type as string)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid report type. Must be daily, weekly, or on_demand',
                });
                return;
            }

            const report = await monitoringService.generateReport(type as 'daily' | 'weekly' | 'on_demand');

            res.json({
                success: true,
                data: report,
            });

        } catch (error) {
            logger.error('Failed to generate migration report', { error, type: req.query.type });
            res.status(500).json({
                success: false,
                message: 'Failed to generate migration report',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Run migration dry run
     */
    static async runDryRun(req: Request, res: Response): Promise<void> {
        try {
            logger.info('Running migration dry run via API');

            const orchestrator = new EnhancedMigrationOrchestrator({
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

        } catch (error) {
            logger.error('Failed to run migration dry run', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to run migration dry run',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Execute migration with monitoring
     */
    static async executeMigration(req: Request, res: Response): Promise<void> {
        try {
            const {
                dryRun = false,
                batchSize = 50,
                enableBackup = true,
                enableProgressTracking = true,
                enableIntegrityChecks = true,
                continueOnError = false,
            } = req.body;

            logger.info('Executing migration via API', {
                dryRun,
                batchSize,
                enableBackup,
                enableProgressTracking,
                enableIntegrityChecks,
                continueOnError,
            });

            const orchestrator = new EnhancedMigrationOrchestrator({
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

        } catch (error) {
            logger.error('Failed to execute migration', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to execute migration',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Execute migration rollback
     */
    static async executeRollback(req: Request, res: Response): Promise<void> {
        try {
            logger.info('Executing migration rollback via API');

            const orchestrator = new EnhancedMigrationOrchestrator({
                enableIntegrityChecks: true,
                enableProgressTracking: true,
            });

            const result = await orchestrator.executeRollback();

            res.json({
                success: result.success,
                data: result,
                message: result.success ? 'Rollback completed successfully' : 'Rollback completed with issues',
            });

        } catch (error) {
            logger.error('Failed to execute migration rollback', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to execute migration rollback',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Get migration progress in real-time
     */
    static async getProgress(req: Request, res: Response): Promise<void> {
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

        } catch (error) {
            logger.error('Failed to get migration progress', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration progress',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }

    /**
     * Get migration health check
     */
    static async getHealthCheck(req: Request, res: Response): Promise<void> {
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

        } catch (error) {
            logger.error('Failed to get migration health check', { error });
            res.status(500).json({
                success: false,
                message: 'Failed to get migration health check',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
}

export default MigrationDashboardController;