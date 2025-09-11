import mongoose from 'mongoose';
import logger from '../utils/logger';
import {
   MigrationValidationService,
   ValidationResult,
} from './migrationValidationService';

export interface MigrationMetrics {
   timestamp: Date;
   totalUsers: number;
   migratedUsers: number;
   totalWorkspaces: number;
   workspacesWithSubscriptions: number;
   totalSubscriptions: number;
   workspaceSubscriptions: number;
   userSubscriptions: number;
   validationScore: number;
   criticalIssues: number;
   errors: number;
   warnings: number;
   migrationProgress: number; // 0-100 percentage
}

export interface MigrationAlert {
   id: string;
   type: 'info' | 'warning' | 'error' | 'critical';
   title: string;
   message: string;
   timestamp: Date;
   resolved: boolean;
   metadata?: any;
}

export interface MigrationReport {
   id: string;
   timestamp: Date;
   type: 'daily' | 'weekly' | 'on_demand';
   metrics: MigrationMetrics;
   validation: ValidationResult;
   alerts: MigrationAlert[];
   recommendations: string[];
   nextActions: string[];
}

/**
 * Migration monitoring and alerting service
 */
export class MigrationMonitoringService {
   private validationService: MigrationValidationService;
   private alerts: MigrationAlert[] = [];
   private metrics: MigrationMetrics[] = [];

   constructor() {
      this.validationService = new MigrationValidationService();
   }

   /**
    * Collect current migration metrics
    */
   async collectMetrics(): Promise<MigrationMetrics> {
      try {
         logger.info('Collecting migration metrics...');

         const User = mongoose.model('User');
         const Workplace = mongoose.model('Workplace');
         const Subscription = mongoose.model('Subscription');

         const [
            totalUsers,
            migratedUsers,
            totalWorkspaces,
            workspacesWithSubscriptions,
            totalSubscriptions,
            workspaceSubscriptions,
            userSubscriptions,
         ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ workplaceId: { $exists: true, $ne: null } }),
            Workplace.countDocuments(),
            Workplace.countDocuments({
               currentSubscriptionId: { $exists: true, $ne: null },
            }),
            Subscription.countDocuments(),
            Subscription.countDocuments({
               workspaceId: { $exists: true, $ne: null },
            }),
            Subscription.countDocuments({
               userId: { $exists: true, $ne: null },
            }),
         ]);

         // Run quick validation for score
         const validation =
            await this.validationService.runCompleteValidation();

         const migrationProgress = Math.round(
            ((migratedUsers / Math.max(totalUsers, 1) +
               workspaceSubscriptions / Math.max(totalSubscriptions, 1)) /
               2) *
               100
         );

         const metrics: MigrationMetrics = {
            timestamp: new Date(),
            totalUsers,
            migratedUsers,
            totalWorkspaces,
            workspacesWithSubscriptions,
            totalSubscriptions,
            workspaceSubscriptions,
            userSubscriptions,
            validationScore: validation.score,
            criticalIssues: validation.issues.filter(
               (i) => i.type === 'critical'
            ).length,
            errors: validation.issues.filter((i) => i.type === 'error').length,
            warnings: validation.issues.filter((i) => i.type === 'warning')
               .length,
            migrationProgress,
         };

         // Store metrics for trend analysis
         this.metrics.push(metrics);

         // Keep only last 100 metrics to prevent memory issues
         if (this.metrics.length > 100) {
            this.metrics = this.metrics.slice(-100);
         }

         logger.info('Migration metrics collected', {
            migrationProgress,
            validationScore: validation.score,
            criticalIssues: metrics.criticalIssues,
         });

         return metrics;
      } catch (error) {
         logger.error('Failed to collect migration metrics', { error });
         throw error;
      }
   }

   /**
    * Check for migration issues and generate alerts
    */
   async checkForAlerts(): Promise<MigrationAlert[]> {
      try {
         const newAlerts: MigrationAlert[] = [];
         const metrics = await this.collectMetrics();
         const validation =
            await this.validationService.runCompleteValidation();

         // Critical issues alert
         if (metrics.criticalIssues > 0) {
            newAlerts.push({
               id: `critical-issues-${Date.now()}`,
               type: 'critical',
               title: 'Critical Migration Issues Detected',
               message: `${metrics.criticalIssues} critical issues found that require immediate attention`,
               timestamp: new Date(),
               resolved: false,
               metadata: {
                  criticalIssues: validation.issues.filter(
                     (i) => i.type === 'critical'
                  ),
               },
            });
         }

         // Migration stalled alert
         const previousMetrics = this.metrics[this.metrics.length - 2];
         if (
            previousMetrics &&
            metrics.migrationProgress === previousMetrics.migrationProgress
         ) {
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

         // Low validation score alert
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

         // High error count alert
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
                  errors: validation.issues.filter((i) => i.type === 'error'),
               },
            });
         }

         // Legacy subscriptions remaining alert
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

         // Add new alerts to the collection
         this.alerts.push(...newAlerts);

         // Clean up old resolved alerts
         this.alerts = this.alerts.filter(
            (alert) =>
               !alert.resolved ||
               new Date().getTime() - alert.timestamp.getTime() <
                  7 * 24 * 60 * 60 * 1000 // Keep for 7 days
         );

         logger.info('Migration alerts checked', {
            newAlerts: newAlerts.length,
            totalAlerts: this.alerts.length,
         });

         return newAlerts;
      } catch (error) {
         logger.error('Failed to check for migration alerts', { error });
         throw error;
      }
   }

   /**
    * Generate comprehensive migration report
    */
   async generateReport(
      type: 'daily' | 'weekly' | 'on_demand' = 'on_demand'
   ): Promise<MigrationReport> {
      try {
         logger.info(`Generating ${type} migration report...`);

         const metrics = await this.collectMetrics();
         const validation =
            await this.validationService.runCompleteValidation();
         const alerts = await this.checkForAlerts();

         // Generate next actions based on current state
         const nextActions = this.generateNextActions(metrics, validation);

         const report: MigrationReport = {
            id: `migration-report-${type}-${Date.now()}`,
            timestamp: new Date(),
            type,
            metrics,
            validation,
            alerts: this.alerts.filter((a) => !a.resolved),
            recommendations: validation.recommendations,
            nextActions,
         };

         logger.info('Migration report generated', {
            type,
            migrationProgress: metrics.migrationProgress,
            validationScore: metrics.validationScore,
            activeAlerts: report.alerts.length,
         });

         return report;
      } catch (error) {
         logger.error('Failed to generate migration report', { error });
         throw error;
      }
   }

   /**
    * Get migration trend analysis
    */
   getTrendAnalysis(): {
      progressTrend: 'improving' | 'stable' | 'declining';
      validationTrend: 'improving' | 'stable' | 'declining';
      recentMetrics: MigrationMetrics[];
      averageProgress: number;
      averageValidationScore: number;
   } {
      if (this.metrics.length < 2) {
         return {
            progressTrend: 'stable',
            validationTrend: 'stable',
            recentMetrics: this.metrics,
            averageProgress: this.metrics[0]?.migrationProgress || 0,
            averageValidationScore: this.metrics[0]?.validationScore || 0,
         };
      }

      const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
      const averageProgress =
         recentMetrics.reduce((sum, m) => sum + m.migrationProgress, 0) /
         recentMetrics.length;
      const averageValidationScore =
         recentMetrics.reduce((sum, m) => sum + m.validationScore, 0) /
         recentMetrics.length;

      // Determine trends
      const firstHalf = recentMetrics.slice(
         0,
         Math.floor(recentMetrics.length / 2)
      );
      const secondHalf = recentMetrics.slice(
         Math.floor(recentMetrics.length / 2)
      );

      const firstHalfProgress =
         firstHalf.reduce((sum, m) => sum + m.migrationProgress, 0) /
         firstHalf.length;
      const secondHalfProgress =
         secondHalf.reduce((sum, m) => sum + m.migrationProgress, 0) /
         secondHalf.length;

      const firstHalfValidation =
         firstHalf.reduce((sum, m) => sum + m.validationScore, 0) /
         firstHalf.length;
      const secondHalfValidation =
         secondHalf.reduce((sum, m) => sum + m.validationScore, 0) /
         secondHalf.length;

      const progressTrend =
         secondHalfProgress > firstHalfProgress + 2
            ? 'improving'
            : secondHalfProgress < firstHalfProgress - 2
              ? 'declining'
              : 'stable';

      const validationTrend =
         secondHalfValidation > firstHalfValidation + 2
            ? 'improving'
            : secondHalfValidation < firstHalfValidation - 2
              ? 'declining'
              : 'stable';

      return {
         progressTrend,
         validationTrend,
         recentMetrics,
         averageProgress,
         averageValidationScore,
      };
   }

   /**
    * Resolve an alert
    */
   resolveAlert(alertId: string): boolean {
      const alert = this.alerts.find((a) => a.id === alertId);
      if (alert) {
         alert.resolved = true;
         logger.info('Alert resolved', { alertId, title: alert.title });
         return true;
      }
      return false;
   }

   /**
    * Get active alerts
    */
   getActiveAlerts(): MigrationAlert[] {
      return this.alerts.filter((a) => !a.resolved);
   }

   /**
    * Get migration status summary
    */
   async getStatusSummary(): Promise<{
      status: 'not_started' | 'in_progress' | 'completed' | 'failed';
      progress: number;
      validationScore: number;
      criticalIssues: number;
      estimatedCompletion?: Date;
      lastUpdated: Date;
   }> {
      try {
         const metrics = await this.collectMetrics();

         let status: 'not_started' | 'in_progress' | 'completed' | 'failed';

         if (metrics.migrationProgress === 0) {
            status = 'not_started';
         } else if (
            metrics.migrationProgress >= 100 &&
            metrics.validationScore >= 90
         ) {
            status = 'completed';
         } else if (metrics.criticalIssues > 0) {
            status = 'failed';
         } else {
            status = 'in_progress';
         }

         // Estimate completion based on trend
         let estimatedCompletion: Date | undefined;
         const trend = this.getTrendAnalysis();
         if (status === 'in_progress' && trend.progressTrend === 'improving') {
            const remainingProgress = 100 - metrics.migrationProgress;
            const progressRate = trend.averageProgress / this.metrics.length; // Progress per measurement
            const estimatedMeasurements =
               remainingProgress / Math.max(progressRate, 1);
            estimatedCompletion = new Date(
               Date.now() + estimatedMeasurements * 60 * 60 * 1000
            ); // Assuming hourly measurements
         }

         return {
            status,
            progress: metrics.migrationProgress,
            validationScore: metrics.validationScore,
            criticalIssues: metrics.criticalIssues,
            estimatedCompletion,
            lastUpdated: metrics.timestamp,
         };
      } catch (error) {
         logger.error('Failed to get migration status summary', { error });
         throw error;
      }
   }

   /**
    * Generate next actions based on current state
    */
   private generateNextActions(
      metrics: MigrationMetrics,
      validation: ValidationResult
   ): string[] {
      const actions: string[] = [];

      // Critical issues first
      if (metrics.criticalIssues > 0) {
         actions.push('🚨 Address critical issues immediately');
         actions.push('📋 Review critical issue details and fix root causes');
      }

      // Migration progress
      if (metrics.migrationProgress < 100) {
         if (metrics.totalUsers - metrics.migratedUsers > 0) {
            actions.push(
               `👥 Migrate ${metrics.totalUsers - metrics.migratedUsers} remaining users to workspaces`
            );
         }
         if (metrics.userSubscriptions > 0) {
            actions.push(
               `🔄 Migrate ${metrics.userSubscriptions} user-based subscriptions to workspace subscriptions`
            );
         }
      }

      // Validation improvements
      if (metrics.validationScore < 90) {
         actions.push(
            '🔧 Fix data consistency issues to improve validation score'
         );
         if (metrics.errors > 0) {
            actions.push(`⚠️ Resolve ${metrics.errors} validation errors`);
         }
      }

      // Monitoring and maintenance
      if (metrics.migrationProgress >= 90) {
         actions.push('📊 Set up ongoing monitoring for data integrity');
         actions.push('🧹 Clean up legacy data and references');
      }

      return actions;
   }
}

export default MigrationMonitoringService;
