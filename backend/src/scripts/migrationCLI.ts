#!/usr/bin/env node

import { Command } from 'commander';
import connectDB from '../config/db';
import logger from '../utils/logger';
import { MigrationValidationService } from '../services/migrationValidationService';
import { MigrationMonitoringService } from '../services/migrationMonitoringService';
import { EnhancedMigrationOrchestrator } from './enhancedMigration';
import { migrateToWorkspaceSubscriptions, rollbackWorkspaceMigration, validateMigration } from './migrateToWorkspaceSubscriptions';
import mongoose from 'mongoose';

const program = new Command();

program
    .name('migration-cli')
    .description('CLI tool for managing workspace subscription migrations')
    .version('1.0.0');

// Status command
program
    .command('status')
    .description('Get migration status overview')
    .action(async () => {
        try {
            await connectDB();
            const monitoringService = new MigrationMonitoringService();

            const status = await monitoringService.getStatusSummary();
            const metrics = await monitoringService.collectMetrics();
            const activeAlerts = monitoringService.getActiveAlerts();

            console.log('\n📊 Migration Status Overview');
            console.log('═'.repeat(50));
            console.log(`Status: ${getStatusEmoji(status.status)} ${status.status.toUpperCase()}`);
            console.log(`Progress: ${status.progress}%`);
            console.log(`Validation Score: ${status.validationScore}/100`);
            console.log(`Critical Issues: ${status.criticalIssues}`);
            console.log(`Active Alerts: ${activeAlerts.length}`);
            console.log(`Last Updated: ${status.lastUpdated.toLocaleString()}`);

            if (status.estimatedCompletion) {
                console.log(`Estimated Completion: ${status.estimatedCompletion.toLocaleString()}`);
            }

            console.log('\n📈 Detailed Metrics');
            console.log('─'.repeat(30));
            console.log(`Total Users: ${metrics.totalUsers}`);
            console.log(`Migrated Users: ${metrics.migratedUsers}`);
            console.log(`Users Remaining: ${metrics.totalUsers - metrics.migratedUsers}`);
            console.log(`Total Workspaces: ${metrics.totalWorkspaces}`);
            console.log(`Workspaces with Subscriptions: ${metrics.workspacesWithSubscriptions}`);
            console.log(`Legacy User Subscriptions: ${metrics.userSubscriptions}`);
            console.log(`Workspace Subscriptions: ${metrics.workspaceSubscriptions}`);

            if (activeAlerts.length > 0) {
                console.log('\n🚨 Active Alerts');
                console.log('─'.repeat(20));
                activeAlerts.forEach(alert => {
                    console.log(`${getAlertEmoji(alert.type)} ${alert.title}`);
                    console.log(`   ${alert.message}`);
                });
            }

        } catch (error) {
            console.error('❌ Failed to get migration status:', error);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
        }
    });

// Validate command
program
    .command('validate')
    .description('Run comprehensive migration validation')
    .option('--detailed', 'Show detailed validation results')
    .action(async (options: any) => {
        try {
            await connectDB();
            const validationService = new MigrationValidationService();

            console.log('🔍 Running migration validation...\n');

            const result = await validationService.runCompleteValidation();

            console.log('📋 Validation Results');
            console.log('═'.repeat(40));
            console.log(`Overall Score: ${result.score}/100`);
            console.log(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
            console.log(`Issues: ${result.issues.length}`);
            console.log(`Warnings: ${result.warnings.length}`);

            if (result.issues.length > 0) {
                console.log('\n🚨 Issues Found');
                console.log('─'.repeat(20));
                result.issues.forEach(issue => {
                    console.log(`${getIssueEmoji(issue.type)} ${issue.category}: ${issue.description}`);
                    console.log(`   Count: ${issue.count}`);
                    if (issue.fixSuggestion) {
                        console.log(`   Fix: ${issue.fixSuggestion}`);
                    }
                    if (options.detailed && issue.affectedIds.length > 0) {
                        console.log(`   Affected IDs: ${issue.affectedIds.slice(0, 5).join(', ')}${issue.affectedIds.length > 5 ? '...' : ''}`);
                    }
                    console.log('');
                });
            }

            if (result.warnings.length > 0) {
                console.log('\n⚠️  Warnings');
                console.log('─'.repeat(15));
                result.warnings.forEach(warning => {
                    console.log(`${getWarningEmoji(warning.impact)} ${warning.type}: ${warning.description}`);
                    console.log(`   Count: ${warning.count}, Impact: ${warning.impact}`);
                });
            }

            if (result.recommendations.length > 0) {
                console.log('\n💡 Recommendations');
                console.log('─'.repeat(25));
                result.recommendations.forEach(rec => {
                    console.log(`• ${rec}`);
                });
            }

            console.log('\n📊 Statistics');
            console.log('─'.repeat(20));
            console.log(`Total Users: ${result.stats.totalUsers}`);
            console.log(`Users with Workspace: ${result.stats.usersWithWorkspace}`);
            console.log(`Users without Workspace: ${result.stats.usersWithoutWorkspace}`);
            console.log(`Total Workspaces: ${result.stats.totalWorkspaces}`);
            console.log(`Workspaces with Subscription: ${result.stats.workspacesWithSubscription}`);
            console.log(`Legacy User Subscriptions: ${result.stats.userSubscriptions}`);
            console.log(`Workspace Subscriptions: ${result.stats.workspaceSubscriptions}`);
            console.log(`Data Consistency Score: ${result.stats.dataConsistencyScore}/100`);

        } catch (error) {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
        }
    });

// Migrate command
program
    .command('migrate')
    .description('Execute migration with enhanced monitoring')
    .option('--dry-run', 'Run without making changes')
    .option('--batch-size <size>', 'Batch size for processing', '50')
    .option('--no-backup', 'Disable backup creation')
    .option('--no-progress', 'Disable progress tracking')
    .option('--no-integrity-checks', 'Disable integrity checks')
    .option('--continue-on-error', 'Continue processing on errors')
    .action(async (options: any) => {
        try {
            await connectDB();

            const orchestrator = new EnhancedMigrationOrchestrator({
                dryRun: options.dryRun,
                batchSize: parseInt(options.batchSize),
                enableBackup: options.backup !== false,
                enableProgressTracking: options.progress !== false,
                enableIntegrityChecks: options.integrityChecks !== false,
                continueOnError: options.continueOnError,
            });

            console.log('🚀 Starting enhanced migration...');
            console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
            console.log(`Batch Size: ${options.batchSize}`);
            console.log(`Backup: ${options.backup !== false ? 'Enabled' : 'Disabled'}`);
            console.log(`Progress Tracking: ${options.progress !== false ? 'Enabled' : 'Disabled'}`);
            console.log(`Integrity Checks: ${options.integrityChecks !== false ? 'Enabled' : 'Disabled'}`);
            console.log('');

            const result = await orchestrator.executeMigration();

            console.log('\n📋 Migration Results');
            console.log('═'.repeat(40));
            console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

            if (result.results.migration) {
                const migration = result.results.migration;
                console.log(`Workspaces Created: ${migration.workspacesCreated}`);
                console.log(`Subscriptions Migrated: ${migration.subscriptionsMigrated}`);
                console.log(`Users Updated: ${migration.usersUpdated}`);
                console.log(`Errors: ${migration.errors.length}`);
            }

            if (result.results.validation) {
                const validation = result.results.validation;
                console.log(`Validation Score: ${validation.stats.dataConsistencyScore}/100`);
                console.log(`Validation Issues: ${validation.issues.length}`);
            }

            if (result.integrityCheck) {
                console.log(`Orphaned Records: ${result.integrityCheck.orphanedUsers + result.integrityCheck.orphanedSubscriptions}`);
            }

            if (result.backupStats) {
                console.log(`Backups Created: ${result.backupStats.totalBackups}`);
            }

            if (!result.success) {
                console.log('\n❌ Migration completed with issues. Check logs for details.');
                process.exit(1);
            } else {
                console.log('\n✅ Migration completed successfully!');
            }

        } catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
        }
    });

// Rollback command
program
    .command('rollback')
    .description('Rollback migration changes')
    .option('--confirm', 'Confirm rollback operation')
    .action(async (options: any) => {
        try {
            if (!options.confirm) {
                console.log('⚠️  Rollback is a destructive operation.');
                console.log('Use --confirm flag to proceed with rollback.');
                process.exit(1);
            }

            await connectDB();

            const orchestrator = new EnhancedMigrationOrchestrator({
                enableIntegrityChecks: true,
                enableProgressTracking: true,
            });

            console.log('🔄 Starting migration rollback...');
            console.log('⚠️  This will revert workspace-based subscriptions to user-based subscriptions.');
            console.log('');

            const result = await orchestrator.executeRollback();

            console.log('\n📋 Rollback Results');
            console.log('═'.repeat(40));
            console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

            if (result.results.rollback) {
                const rollback = result.results.rollback;
                console.log(`Subscriptions Rolled Back: ${rollback.subscriptionsMigrated}`);
                console.log(`Errors: ${rollback.errors.length}`);
            }

            if (!result.success) {
                console.log('\n❌ Rollback completed with issues. Check logs for details.');
                process.exit(1);
            } else {
                console.log('\n✅ Rollback completed successfully!');
            }

        } catch (error) {
            console.error('❌ Rollback failed:', error);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
        }
    });

// Monitor command
program
    .command('monitor')
    .description('Monitor migration progress in real-time')
    .option('--interval <seconds>', 'Monitoring interval in seconds', '30')
    .action(async (options: any) => {
        try {
            await connectDB();
            const monitoringService = new MigrationMonitoringService();
            const interval = parseInt(options.interval) * 1000;

            console.log('📊 Starting migration monitoring...');
            console.log(`Refresh interval: ${options.interval} seconds`);
            console.log('Press Ctrl+C to stop monitoring\n');

            const monitor = async () => {
                try {
                    const status = await monitoringService.getStatusSummary();
                    const metrics = await monitoringService.collectMetrics();

                    // Clear screen and show updated status
                    console.clear();
                    console.log('📊 Migration Monitor - Live Status');
                    console.log('═'.repeat(50));
                    console.log(`Time: ${new Date().toLocaleString()}`);
                    console.log(`Status: ${getStatusEmoji(status.status)} ${status.status.toUpperCase()}`);
                    console.log(`Progress: ${'█'.repeat(Math.floor(status.progress / 5))}${'░'.repeat(20 - Math.floor(status.progress / 5))} ${status.progress}%`);
                    console.log(`Validation Score: ${status.validationScore}/100`);
                    console.log(`Critical Issues: ${status.criticalIssues}`);
                    console.log('');
                    console.log(`Users: ${metrics.migratedUsers}/${metrics.totalUsers} migrated`);
                    console.log(`Workspaces: ${metrics.workspacesWithSubscriptions}/${metrics.totalWorkspaces} with subscriptions`);
                    console.log(`Subscriptions: ${metrics.workspaceSubscriptions} workspace, ${metrics.userSubscriptions} legacy`);

                    if (status.estimatedCompletion) {
                        console.log(`Estimated completion: ${status.estimatedCompletion.toLocaleString()}`);
                    }

                    const activeAlerts = monitoringService.getActiveAlerts();
                    if (activeAlerts.length > 0) {
                        console.log('\n🚨 Active Alerts:');
                        activeAlerts.slice(0, 3).forEach(alert => {
                            console.log(`${getAlertEmoji(alert.type)} ${alert.title}`);
                        });
                        if (activeAlerts.length > 3) {
                            console.log(`... and ${activeAlerts.length - 3} more alerts`);
                        }
                    }

                    console.log(`\nNext update in ${options.interval} seconds...`);

                } catch (error) {
                    console.error('Monitor error:', error);
                }
            };

            // Initial run
            await monitor();

            // Set up interval
            const intervalId = setInterval(monitor, interval);

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                clearInterval(intervalId);
                console.log('\n\n👋 Monitoring stopped.');
                mongoose.connection.close().then(() => process.exit(0));
            });

        } catch (error) {
            console.error('❌ Failed to start monitoring:', error);
            process.exit(1);
        }
    });

// Report command
program
    .command('report')
    .description('Generate migration report')
    .option('--type <type>', 'Report type (daily, weekly, on_demand)', 'on_demand')
    .option('--output <file>', 'Output file path (optional)')
    .action(async (options: any) => {
        try {
            await connectDB();
            const monitoringService = new MigrationMonitoringService();

            console.log(`📄 Generating ${options.type} migration report...`);

            const report = await monitoringService.generateReport(options.type);

            if (options.output) {
                const fs = require('fs').promises;
                await fs.writeFile(options.output, JSON.stringify(report, null, 2));
                console.log(`✅ Report saved to ${options.output}`);
            } else {
                console.log('\n📋 Migration Report');
                console.log('═'.repeat(40));
                console.log(`Report ID: ${report.id}`);
                console.log(`Generated: ${report.timestamp.toLocaleString()}`);
                console.log(`Type: ${report.type}`);
                console.log(`Migration Progress: ${report.metrics.migrationProgress}%`);
                console.log(`Validation Score: ${report.metrics.validationScore}/100`);
                console.log(`Active Alerts: ${report.alerts.length}`);

                if (report.recommendations.length > 0) {
                    console.log('\n💡 Recommendations:');
                    report.recommendations.forEach(rec => console.log(`• ${rec}`));
                }

                if (report.nextActions.length > 0) {
                    console.log('\n📋 Next Actions:');
                    report.nextActions.forEach(action => console.log(`• ${action}`));
                }
            }

        } catch (error) {
            console.error('❌ Failed to generate report:', error);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
        }
    });

// Helper functions for emojis
function getStatusEmoji(status: string): string {
    switch (status) {
        case 'not_started': return '⏸️';
        case 'in_progress': return '🔄';
        case 'completed': return '✅';
        case 'failed': return '❌';
        default: return '❓';
    }
}

function getAlertEmoji(type: string): string {
    switch (type) {
        case 'critical': return '🚨';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '📢';
    }
}

function getIssueEmoji(type: string): string {
    switch (type) {
        case 'critical': return '🚨';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return '📢';
    }
}

function getWarningEmoji(impact: string): string {
    switch (impact) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚠️';
    }
}

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}