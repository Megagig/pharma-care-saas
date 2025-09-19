"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClinicalNotesMigrationStatus = exports.rollbackClinicalNotesMigrations = exports.runClinicalNotesMigrations = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
class ClinicalNotesMigration {
    constructor() {
        this.migrationVersion = '1.0.0';
    }
    static getInstance() {
        if (!ClinicalNotesMigration.instance) {
            ClinicalNotesMigration.instance = new ClinicalNotesMigration();
        }
        return ClinicalNotesMigration.instance;
    }
    async runMigrations() {
        try {
            logger_1.default.info('Starting Clinical Notes migrations...');
            const migrations = [
                this.createIndexes.bind(this),
                this.migrateExistingNotes.bind(this),
                this.addAuditFields.bind(this),
                this.setupTextIndexes.bind(this),
                this.validateDataIntegrity.bind(this),
            ];
            let totalMigrated = 0;
            const errors = [];
            for (const migration of migrations) {
                try {
                    const result = await migration();
                    if (result.success) {
                        totalMigrated += result.migratedCount || 0;
                        logger_1.default.info(`Migration completed: ${result.message}`);
                    }
                    else {
                        errors.push(result.message);
                        logger_1.default.error(`Migration failed: ${result.message}`);
                    }
                }
                catch (error) {
                    const errorMessage = `Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMessage);
                    logger_1.default.error(errorMessage);
                }
            }
            if (errors.length > 0) {
                return {
                    success: false,
                    message: `Migrations completed with ${errors.length} errors`,
                    migratedCount: totalMigrated,
                    errors,
                };
            }
            logger_1.default.info(`Clinical Notes migrations completed successfully. Total records migrated: ${totalMigrated}`);
            return {
                success: true,
                message: 'All migrations completed successfully',
                migratedCount: totalMigrated,
            };
        }
        catch (error) {
            const errorMessage = `Critical migration error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger_1.default.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
                errors: [errorMessage],
            };
        }
    }
    async createIndexes() {
        try {
            const collection = mongoose_1.default.connection.db.collection('clinicalnotes');
            const indexes = [
                { workplaceId: 1, patient: 1, deletedAt: 1 },
                { workplaceId: 1, pharmacist: 1, deletedAt: 1 },
                { workplaceId: 1, type: 1, deletedAt: 1 },
                { workplaceId: 1, priority: 1, deletedAt: 1 },
                { workplaceId: 1, isConfidential: 1, deletedAt: 1 },
                { workplaceId: 1, followUpRequired: 1, deletedAt: 1 },
                { workplaceId: 1, createdAt: -1, deletedAt: 1 },
                { workplaceId: 1, updatedAt: -1, deletedAt: 1 },
                { workplaceId: 1, followUpDate: 1, deletedAt: 1 },
                { workplaceId: 1, tags: 1, deletedAt: 1 },
                { workplaceId: 1, 'laborResults.status': 1, deletedAt: 1 },
                { workplaceId: 1, locationId: 1, deletedAt: 1 },
            ];
            let createdCount = 0;
            for (const index of indexes) {
                try {
                    await collection.createIndex(index, {
                        background: true,
                        sparse: index.locationId ? true : false,
                    });
                    createdCount++;
                }
                catch (error) {
                    logger_1.default.warn(`Index creation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return {
                success: true,
                message: `Created ${createdCount} database indexes`,
                migratedCount: createdCount,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to create indexes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async migrateExistingNotes() {
        try {
            const notesToMigrate = await ClinicalNote_1.default.find({
                $or: [
                    { lastModifiedBy: { $exists: false } },
                    { createdBy: { $exists: false } },
                    { 'content.subjective': { $exists: false } },
                    { 'content.objective': { $exists: false } },
                    { 'content.assessment': { $exists: false } },
                    { 'content.plan': { $exists: false } },
                ],
            });
            let migratedCount = 0;
            const errors = [];
            for (const note of notesToMigrate) {
                try {
                    let needsUpdate = false;
                    if (!note.createdBy) {
                        note.createdBy = note.pharmacist;
                        needsUpdate = true;
                    }
                    if (!note.lastModifiedBy) {
                        note.lastModifiedBy = note.pharmacist;
                        needsUpdate = true;
                    }
                    if (!note.content) {
                        note.content = {};
                        needsUpdate = true;
                    }
                    if (note.description && !note.content.subjective) {
                        note.content.subjective = note.description;
                        needsUpdate = true;
                    }
                    if (!note.medications) {
                        note.medications = [];
                        needsUpdate = true;
                    }
                    if (!note.laborResults) {
                        note.laborResults = [];
                        needsUpdate = true;
                    }
                    if (!note.recommendations) {
                        note.recommendations = [];
                        needsUpdate = true;
                    }
                    if (!note.attachments) {
                        note.attachments = [];
                        needsUpdate = true;
                    }
                    if (!note.tags) {
                        note.tags = [];
                        needsUpdate = true;
                    }
                    if (note.priority === undefined) {
                        note.priority = 'medium';
                        needsUpdate = true;
                    }
                    if (note.isConfidential === undefined) {
                        note.isConfidential = false;
                        needsUpdate = true;
                    }
                    if (note.followUpRequired === undefined) {
                        note.followUpRequired = false;
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        await note.save();
                        migratedCount++;
                    }
                }
                catch (error) {
                    const errorMessage = `Failed to migrate note ${note._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMessage);
                    logger_1.default.error(errorMessage);
                }
            }
            return {
                success: errors.length === 0,
                message: `Migrated ${migratedCount} existing notes${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
                migratedCount,
                errors: errors.length > 0 ? errors : undefined,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to migrate existing notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async addAuditFields() {
        try {
            const result = await ClinicalNote_1.default.updateMany({
                $or: [
                    { createdBy: { $exists: false } },
                    { lastModifiedBy: { $exists: false } },
                ],
            }, [
                {
                    $set: {
                        createdBy: { $ifNull: ['$createdBy', '$pharmacist'] },
                        lastModifiedBy: { $ifNull: ['$lastModifiedBy', '$pharmacist'] },
                    },
                },
            ]);
            return {
                success: true,
                message: `Added audit fields to ${result.modifiedCount} notes`,
                migratedCount: result.modifiedCount,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to add audit fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async setupTextIndexes() {
        try {
            const collection = mongoose_1.default.connection.db.collection('clinicalnotes');
            await collection.createIndex({
                title: 'text',
                'content.subjective': 'text',
                'content.objective': 'text',
                'content.assessment': 'text',
                'content.plan': 'text',
                recommendations: 'text',
                tags: 'text',
            }, {
                background: true,
                name: 'clinical_notes_text_search',
                weights: {
                    title: 10,
                    'content.assessment': 8,
                    'content.plan': 8,
                    'content.subjective': 5,
                    'content.objective': 5,
                    recommendations: 3,
                    tags: 2,
                },
            });
            return {
                success: true,
                message: 'Created text search indexes',
                migratedCount: 1,
            };
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('already exists')) {
                return {
                    success: true,
                    message: 'Text search indexes already exist',
                    migratedCount: 0,
                };
            }
            return {
                success: false,
                message: `Failed to create text indexes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async validateDataIntegrity() {
        try {
            const issues = [];
            const notesWithoutPatient = await ClinicalNote_1.default.countDocuments({
                patient: { $exists: false },
            });
            if (notesWithoutPatient > 0) {
                issues.push(`${notesWithoutPatient} notes missing patient reference`);
            }
            const notesWithoutPharmacist = await ClinicalNote_1.default.countDocuments({
                pharmacist: { $exists: false },
            });
            if (notesWithoutPharmacist > 0) {
                issues.push(`${notesWithoutPharmacist} notes missing pharmacist reference`);
            }
            const notesWithoutWorkplace = await ClinicalNote_1.default.countDocuments({
                workplaceId: { $exists: false },
            });
            if (notesWithoutWorkplace > 0) {
                issues.push(`${notesWithoutWorkplace} notes missing workplace reference`);
            }
            const notesWithoutTitle = await ClinicalNote_1.default.countDocuments({
                $or: [{ title: { $exists: false } }, { title: '' }, { title: null }],
            });
            if (notesWithoutTitle > 0) {
                issues.push(`${notesWithoutTitle} notes missing title`);
            }
            const notesWithInvalidType = await ClinicalNote_1.default.countDocuments({
                type: {
                    $nin: [
                        'consultation',
                        'medication_review',
                        'follow_up',
                        'adverse_event',
                        'other',
                    ],
                },
            });
            if (notesWithInvalidType > 0) {
                issues.push(`${notesWithInvalidType} notes with invalid type`);
            }
            const notesWithInvalidPriority = await ClinicalNote_1.default.countDocuments({
                priority: { $nin: ['low', 'medium', 'high'] },
            });
            if (notesWithInvalidPriority > 0) {
                issues.push(`${notesWithInvalidPriority} notes with invalid priority`);
            }
            if (issues.length > 0) {
                return {
                    success: false,
                    message: `Data integrity issues found: ${issues.join(', ')}`,
                    errors: issues,
                };
            }
            const totalNotes = await ClinicalNote_1.default.countDocuments();
            const activeNotes = await ClinicalNote_1.default.countDocuments({
                deletedAt: { $exists: false },
            });
            const deletedNotes = await ClinicalNote_1.default.countDocuments({
                deletedAt: { $exists: true },
            });
            return {
                success: true,
                message: `Data integrity validation passed. Total: ${totalNotes}, Active: ${activeNotes}, Deleted: ${deletedNotes}`,
                migratedCount: totalNotes,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Data integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async rollbackMigrations() {
        try {
            logger_1.default.warn('Rolling back Clinical Notes migrations...');
            const collection = mongoose_1.default.connection.db.collection('clinicalnotes');
            try {
                await collection.dropIndex('clinical_notes_text_search');
            }
            catch (error) {
                logger_1.default.warn('Text search index not found during rollback');
            }
            logger_1.default.info('Clinical Notes migration rollback completed');
            return {
                success: true,
                message: 'Migration rollback completed (indexes removed, data preserved)',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    async getMigrationStatus() {
        try {
            const totalNotes = await ClinicalNote_1.default.countDocuments();
            const activeNotes = await ClinicalNote_1.default.countDocuments({
                deletedAt: { $exists: false },
            });
            const deletedNotes = await ClinicalNote_1.default.countDocuments({
                deletedAt: { $exists: true },
            });
            const collection = mongoose_1.default.connection.db.collection('clinicalnotes');
            const indexes = await collection.indexes();
            return {
                version: this.migrationVersion,
                totalNotes,
                activeNotes,
                deletedNotes,
                indexesCount: indexes.length,
                lastMigration: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get migration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
exports.default = ClinicalNotesMigration;
const runClinicalNotesMigrations = async () => {
    const migration = ClinicalNotesMigration.getInstance();
    return await migration.runMigrations();
};
exports.runClinicalNotesMigrations = runClinicalNotesMigrations;
const rollbackClinicalNotesMigrations = async () => {
    const migration = ClinicalNotesMigration.getInstance();
    return await migration.rollbackMigrations();
};
exports.rollbackClinicalNotesMigrations = rollbackClinicalNotesMigrations;
const getClinicalNotesMigrationStatus = async () => {
    const migration = ClinicalNotesMigration.getInstance();
    return await migration.getMigrationStatus();
};
exports.getClinicalNotesMigrationStatus = getClinicalNotesMigrationStatus;
//# sourceMappingURL=clinicalNotesMigration.js.map