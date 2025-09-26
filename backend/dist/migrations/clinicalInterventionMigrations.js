"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = exports.MigrationManager = exports.clinicalInterventionMigrations = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const ClinicalIntervention_1 = __importDefault(require("../models/ClinicalIntervention"));
const migrationSchema = new mongoose_1.default.Schema({
    version: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    appliedAt: { type: Date, required: true, default: Date.now },
    executionTime: { type: Number, required: true },
});
const MigrationModel = mongoose_1.default.model('Migration', migrationSchema);
exports.clinicalInterventionMigrations = [
    {
        version: '1.0.0',
        description: 'Initial Clinical Interventions schema setup',
        up: async () => {
            logger_1.default.info('Creating Clinical Interventions collection and indexes...');
            await ClinicalIntervention_1.default.createCollection();
            const indexes = [
                { workplaceId: 1, isDeleted: 1, status: 1, identifiedDate: -1 },
                { workplaceId: 1, patientId: 1, isDeleted: 1, identifiedDate: -1 },
                { 'assignments.userId': 1, 'assignments.status': 1, workplaceId: 1 },
                { workplaceId: 1, category: 1, priority: 1, status: 1 },
                { workplaceId: 1, interventionNumber: 1 },
            ];
            for (const index of indexes) {
                const cleanIndex = Object.fromEntries(Object.entries(index).filter(([_, value]) => value !== undefined));
                await ClinicalIntervention_1.default.collection.createIndex(cleanIndex, {
                    background: true,
                });
            }
            logger_1.default.info('Clinical Interventions indexes created successfully');
        },
        down: async () => {
            logger_1.default.info('Dropping Clinical Interventions collection...');
            await ClinicalIntervention_1.default.collection.drop();
        },
    },
    {
        version: '1.1.0',
        description: 'Add text search indexes for Clinical Interventions',
        up: async () => {
            logger_1.default.info('Adding text search indexes...');
            await ClinicalIntervention_1.default.collection.createIndex({
                interventionNumber: 'text',
                issueDescription: 'text',
                implementationNotes: 'text',
            }, {
                name: 'intervention_text_search',
                background: true,
            });
            logger_1.default.info('Text search indexes created successfully');
        },
        down: async () => {
            logger_1.default.info('Dropping text search indexes...');
            await ClinicalIntervention_1.default.collection.dropIndex('intervention_text_search');
        },
    },
    {
        version: '1.2.0',
        description: 'Add performance optimization indexes',
        up: async () => {
            logger_1.default.info('Adding performance optimization indexes...');
            const performanceIndexes = [
                {
                    fields: { workplaceId: 1, status: 1, priority: 1, startedAt: 1 },
                    options: {
                        name: 'overdue_interventions',
                        background: true,
                        partialFilterExpression: {
                            status: {
                                $in: ['identified', 'planning', 'in_progress', 'implemented'],
                            },
                        },
                    },
                },
                {
                    fields: {
                        workplaceId: 1,
                        'followUp.scheduledDate': 1,
                        'followUp.required': 1,
                    },
                    options: {
                        name: 'followup_scheduling',
                        background: true,
                        sparse: true,
                        partialFilterExpression: {
                            'followUp.required': true,
                            'followUp.scheduledDate': { $exists: true },
                        },
                    },
                },
                {
                    fields: { workplaceId: 1, relatedMTRId: 1, isDeleted: 1 },
                    options: {
                        name: 'mtr_integration',
                        background: true,
                        sparse: true,
                    },
                },
            ];
            for (const { fields, options } of performanceIndexes) {
                const cleanFields = Object.fromEntries(Object.entries(fields).filter(([_, value]) => value !== undefined));
                await ClinicalIntervention_1.default.collection.createIndex(cleanFields, options);
            }
            logger_1.default.info('Performance optimization indexes created successfully');
        },
        down: async () => {
            logger_1.default.info('Dropping performance optimization indexes...');
            const indexesToDrop = [
                'overdue_interventions',
                'followup_scheduling',
                'mtr_integration',
            ];
            for (const indexName of indexesToDrop) {
                try {
                    await ClinicalIntervention_1.default.collection.dropIndex(indexName);
                }
                catch (error) {
                    logger_1.default.warn(`Failed to drop index ${indexName}:`, error);
                }
            }
        },
    },
    {
        version: '1.3.0',
        description: 'Migrate existing intervention data to new schema format',
        up: async () => {
            logger_1.default.info('Migrating existing intervention data...');
            const interventionsToMigrate = await ClinicalIntervention_1.default.find({
                $or: [
                    { interventionNumber: { $exists: false } },
                    { interventionNumber: { $regex: /^(?!CI-)/ } },
                ],
            });
            logger_1.default.info(`Found ${interventionsToMigrate.length} interventions to migrate`);
            for (const intervention of interventionsToMigrate) {
                try {
                    if (!intervention.interventionNumber ||
                        !intervention.interventionNumber.match(/^CI-\d{6}-\d{4}$/)) {
                        const newNumber = await ClinicalIntervention_1.default.generateNextInterventionNumber(intervention.workplaceId);
                        intervention.interventionNumber = newNumber;
                    }
                    if (!intervention.followUp) {
                        intervention.followUp = { required: false };
                    }
                    if (!intervention.relatedDTPIds) {
                        intervention.relatedDTPIds = [];
                    }
                    if (!intervention.strategies) {
                        intervention.strategies = [];
                    }
                    if (!intervention.assignments) {
                        intervention.assignments = [];
                    }
                    await intervention.save();
                    logger_1.default.debug(`Migrated intervention ${intervention._id}`);
                }
                catch (error) {
                    logger_1.default.error(`Failed to migrate intervention ${intervention._id}:`, error);
                }
            }
            logger_1.default.info('Data migration completed successfully');
        },
        down: async () => {
            logger_1.default.warn('Data migration rollback not implemented - manual intervention required');
        },
    },
    {
        version: '1.4.0',
        description: 'Add audit trail enhancements',
        up: async () => {
            logger_1.default.info('Adding audit trail enhancements...');
            const result = await ClinicalIntervention_1.default.updateMany({ createdBy: { $exists: false } }, {
                $set: {
                    createdBy: new mongoose_1.default.Types.ObjectId('000000000000000000000000'),
                    isDeleted: false,
                },
            });
            logger_1.default.info(`Updated ${result.modifiedCount} interventions with audit fields`);
        },
        down: async () => {
            logger_1.default.info('Removing audit trail enhancements...');
            await ClinicalIntervention_1.default.updateMany({}, {
                $unset: {
                    createdBy: 1,
                    updatedBy: 1,
                    isDeleted: 1,
                },
            });
        },
    },
    {
        version: '1.5.0',
        description: 'Optimize intervention number generation',
        up: async () => {
            logger_1.default.info('Optimizing intervention number generation...');
            await ClinicalIntervention_1.default.collection.createIndex({ workplaceId: 1, interventionNumber: 1 }, {
                name: 'unique_intervention_number_per_workplace',
                unique: true,
                background: true,
            });
            logger_1.default.info('Intervention number optimization completed');
        },
        down: async () => {
            logger_1.default.info('Removing intervention number optimization...');
            try {
                await ClinicalIntervention_1.default.collection.dropIndex('unique_intervention_number_per_workplace');
            }
            catch (error) {
                logger_1.default.warn('Failed to drop unique intervention number index:', error);
            }
        },
    },
];
class MigrationManager {
    static async getAppliedMigrations() {
        try {
            return await MigrationModel.find({}).sort({ appliedAt: 1 }).lean();
        }
        catch (error) {
            logger_1.default.error('Failed to get applied migrations:', error);
            return [];
        }
    }
    static async getPendingMigrations() {
        const applied = await this.getAppliedMigrations();
        const appliedVersions = new Set(applied.map((m) => m.version));
        return exports.clinicalInterventionMigrations.filter((migration) => !appliedVersions.has(migration.version));
    }
    static async applyMigration(migration) {
        const startTime = Date.now();
        try {
            logger_1.default.info(`Applying migration ${migration.version}: ${migration.description}`);
            await migration.up();
            const executionTime = Date.now() - startTime;
            await MigrationModel.create({
                version: migration.version,
                description: migration.description,
                appliedAt: new Date(),
                executionTime,
            });
            logger_1.default.info(`Migration ${migration.version} applied successfully in ${executionTime}ms`);
        }
        catch (error) {
            logger_1.default.error(`Failed to apply migration ${migration.version}:`, error);
            throw error;
        }
    }
    static async rollbackMigration(version) {
        const migration = exports.clinicalInterventionMigrations.find((m) => m.version === version);
        if (!migration) {
            throw new Error(`Migration ${version} not found`);
        }
        const startTime = Date.now();
        try {
            logger_1.default.info(`Rolling back migration ${version}: ${migration.description}`);
            await migration.down();
            await MigrationModel.deleteOne({ version });
            const executionTime = Date.now() - startTime;
            logger_1.default.info(`Migration ${version} rolled back successfully in ${executionTime}ms`);
        }
        catch (error) {
            logger_1.default.error(`Failed to rollback migration ${version}:`, error);
            throw error;
        }
    }
    static async applyPendingMigrations() {
        const pending = await this.getPendingMigrations();
        if (pending.length === 0) {
            logger_1.default.info('No pending migrations to apply');
            return;
        }
        logger_1.default.info(`Applying ${pending.length} pending migrations...`);
        for (const migration of pending) {
            await this.applyMigration(migration);
        }
        logger_1.default.info('All pending migrations applied successfully');
    }
    static async getMigrationStatus() {
        const applied = await this.getAppliedMigrations();
        const pending = await this.getPendingMigrations();
        return {
            applied,
            pending,
            total: exports.clinicalInterventionMigrations.length,
        };
    }
    static async validateMigrations() {
        const issues = [];
        try {
            const versions = exports.clinicalInterventionMigrations.map((m) => m.version);
            const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
            if (duplicates.length > 0) {
                issues.push(`Duplicate migration versions: ${duplicates.join(', ')}`);
            }
            const sortedVersions = [...versions].sort();
            if (JSON.stringify(versions) !== JSON.stringify(sortedVersions)) {
                issues.push('Migration versions are not in order');
            }
            const applied = await this.getAppliedMigrations();
            const codeVersions = new Set(versions);
            for (const appliedMigration of applied) {
                if (!codeVersions.has(appliedMigration.version)) {
                    issues.push(`Applied migration ${appliedMigration.version} not found in code`);
                }
            }
            return {
                valid: issues.length === 0,
                issues,
            };
        }
        catch (error) {
            issues.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
            return { valid: false, issues };
        }
    }
}
exports.MigrationManager = MigrationManager;
const runMigrations = async (command, version) => {
    try {
        switch (command) {
            case 'status':
                const status = await MigrationManager.getMigrationStatus();
                console.log('Migration Status:');
                console.log(`Applied: ${status.applied.length}/${status.total}`);
                console.log(`Pending: ${status.pending.length}`);
                if (status.pending.length > 0) {
                    console.log('\nPending migrations:');
                    status.pending.forEach((m) => {
                        console.log(`  ${m.version}: ${m.description}`);
                    });
                }
                break;
            case 'up':
                if (version) {
                    const migration = exports.clinicalInterventionMigrations.find((m) => m.version === version);
                    if (!migration) {
                        throw new Error(`Migration ${version} not found`);
                    }
                    await MigrationManager.applyMigration(migration);
                }
                else {
                    await MigrationManager.applyPendingMigrations();
                }
                break;
            case 'down':
                if (!version) {
                    throw new Error('Version required for rollback');
                }
                await MigrationManager.rollbackMigration(version);
                break;
            case 'validate':
                const validation = await MigrationManager.validateMigrations();
                if (validation.valid) {
                    console.log('All migrations are valid');
                }
                else {
                    console.error('Migration validation failed:');
                    validation.issues.forEach((issue) => console.error(`  - ${issue}`));
                    process.exit(1);
                }
                break;
            default:
                console.error('Unknown command. Use: status, up, down, validate');
                process.exit(1);
        }
    }
    catch (error) {
        logger_1.default.error('Migration command failed:', error);
        process.exit(1);
    }
};
exports.runMigrations = runMigrations;
if (require.main === module) {
    const [, , command, version] = process.argv;
    (0, exports.runMigrations)(command || 'status', version);
}
//# sourceMappingURL=clinicalInterventionMigrations.js.map