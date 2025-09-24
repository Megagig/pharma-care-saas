import { analyzeMuiUsage, migrationTracker, generateMigrationReport, MuiUsageAnalysis } from './migration-utils';

// Simple migration CLI utility
export class MigrationCLI {
    private srcPath: string;

    constructor(srcPath: string = './src') {
        this.srcPath = srcPath;
    }

    // Generate migration summary
    generateSummary(): string {
        const progress = migrationTracker.getProgress();
        const percentage = migrationTracker.getProgressPercentage();

        return `
MUI to shadcn/ui Migration Summary
=================================

Progress: ${percentage.toFixed(1)}% Complete
Total Components: ${progress.totalComponents}
Migrated: ${progress.migratedComponents}
In Progress: ${progress.componentsInProgress.length}
Failed: ${progress.failedComponents.length}

Status:
${progress.completedComponents.map(name => `✅ ${name}`).join('\n')}
${progress.componentsInProgress.map(name => `🔄 ${name}`).join('\n')}
${progress.failedComponents.map(({ name, error }) => `❌ ${name}: ${error}`).join('\n')}
    `;
    }

    // Initialize migration tracking
    initializeMigration(componentNames: string[]) {
        migrationTracker.setTotalComponents(componentNames.length);
        console.log(`Initialized migration for ${componentNames.length} components`);
    }

    // Mark component migration as started
    startComponent(componentName: string) {
        migrationTracker.startComponentMigration(componentName);
        console.log(`Started migrating ${componentName}`);
    }

    // Mark component migration as completed
    completeComponent(componentName: string) {
        migrationTracker.completeComponentMigration(componentName);
        console.log(`Completed migrating ${componentName}`);
    }

    // Mark component migration as failed
    failComponent(componentName: string, error: string) {
        migrationTracker.failComponentMigration(componentName, error);
        console.log(`Failed to migrate ${componentName}: ${error}`);
    }
}

// Export singleton instance
export const migrationCLI = new MigrationCLI();