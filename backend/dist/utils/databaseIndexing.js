"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseIndexingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
class DatabaseIndexingService {
    constructor() {
        this.indexRecommendations = [];
    }
    static getInstance() {
        if (!DatabaseIndexingService.instance) {
            DatabaseIndexingService.instance = new DatabaseIndexingService();
        }
        return DatabaseIndexingService.instance;
    }
    async createReportIndexes() {
        logger_1.default.info('Creating optimized indexes for report collections...');
        try {
            await Promise.all([
                this.createMTRIndexes(),
                this.createInterventionIndexes(),
                this.createProblemIndexes(),
                this.createMedicationIndexes(),
                this.createAuditIndexes(),
                this.createTemplateIndexes(),
                this.createScheduleIndexes(),
            ]);
            logger_1.default.info('All report indexes created successfully');
        }
        catch (error) {
            logger_1.default.error('Failed to create report indexes:', error);
            throw error;
        }
    }
    async createMTRIndexes() {
        const collection = mongoose_1.default.connection.db.collection('medicationtherapyreviews');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, status: 1, createdAt: -1 },
                options: {
                    name: 'workplace_status_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, patientId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_patient_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, pharmacistId: 1, status: 1 },
                options: {
                    name: 'workplace_pharmacist_status_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, reviewType: 1, createdAt: -1 },
                options: {
                    name: 'workplace_reviewtype_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, priority: 1, status: 1 },
                options: {
                    name: 'workplace_priority_status_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, completedAt: -1 },
                options: {
                    name: 'workplace_completed_idx',
                    sparse: true,
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, 'clinicalOutcomes.costSavings': -1 },
                options: {
                    name: 'workplace_costsavings_idx',
                    background: true,
                },
            },
            {
                fields: {
                    'patient.name': 'text',
                    'medications.name': 'text',
                    notes: 'text',
                },
                options: {
                    name: 'mtr_text_search_idx',
                    background: true,
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'MedicationTherapyReview');
    }
    async createInterventionIndexes() {
        const collection = mongoose_1.default.connection.db.collection('mtrinterventions');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, type: 1, outcome: 1 },
                options: {
                    name: 'workplace_type_outcome_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, pharmacistId: 1, outcome: 1 },
                options: {
                    name: 'workplace_pharmacist_outcome_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, mtrId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_mtr_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, costSavings: -1 },
                options: {
                    name: 'workplace_costsavings_idx',
                    background: true,
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'MTRIntervention');
    }
    async createProblemIndexes() {
        const collection = mongoose_1.default.connection.db.collection('drugtherapyproblems');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, category: 1, status: 1 },
                options: {
                    name: 'workplace_category_status_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, severity: 1, status: 1 },
                options: {
                    name: 'workplace_severity_status_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, category: 1, severity: 1 },
                options: {
                    name: 'workplace_category_severity_idx',
                    background: true,
                    partialFilterExpression: { category: 'adverse_event' },
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'DrugTherapyProblem');
    }
    async createMedicationIndexes() {
        const collection = mongoose_1.default.connection.db.collection('medicationmanagements');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, 'medication.name': 1, status: 1 },
                options: {
                    name: 'workplace_medication_status_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, patientId: 1, status: 1 },
                options: {
                    name: 'workplace_patient_status_idx',
                    background: true,
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'MedicationManagement');
    }
    async createAuditIndexes() {
        const auditCollections = [
            'mtrauditlogs',
            'reportauditlogs',
            'communicationauditlogs',
        ];
        for (const collectionName of auditCollections) {
            const collection = mongoose_1.default.connection.db.collection(collectionName);
            const indexes = [
                {
                    fields: { workplaceId: 1, timestamp: -1 },
                    options: {
                        name: 'workplace_timestamp_idx',
                        background: true,
                    },
                },
                {
                    fields: { workplaceId: 1, userId: 1, timestamp: -1 },
                    options: {
                        name: 'workplace_user_timestamp_idx',
                        background: true,
                    },
                },
                {
                    fields: { workplaceId: 1, action: 1, timestamp: -1 },
                    options: {
                        name: 'workplace_action_timestamp_idx',
                        background: true,
                    },
                },
                {
                    fields: { timestamp: 1 },
                    options: {
                        name: 'audit_ttl_idx',
                        expireAfterSeconds: 365 * 24 * 60 * 60,
                        background: true,
                    },
                },
            ];
            await this.createIndexes(collection, indexes, collectionName);
        }
    }
    async createTemplateIndexes() {
        const collection = mongoose_1.default.connection.db.collection('reporttemplates');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, reportType: 1, isPublic: 1 },
                options: {
                    name: 'workplace_type_public_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, createdBy: 1, createdAt: -1 },
                options: {
                    name: 'workplace_creator_date_idx',
                    background: true,
                },
            },
            {
                fields: {
                    name: 'text',
                    description: 'text',
                },
                options: {
                    name: 'template_text_search_idx',
                    background: true,
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'ReportTemplate');
    }
    async createScheduleIndexes() {
        const collection = mongoose_1.default.connection.db.collection('reportschedules');
        const indexes = [
            {
                fields: { workplaceId: 1, createdAt: -1 },
                options: {
                    name: 'workplace_date_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, isActive: 1, nextRun: 1 },
                options: {
                    name: 'workplace_active_nextrun_idx',
                    background: true,
                },
            },
            {
                fields: { isActive: 1, nextRun: 1 },
                options: {
                    name: 'active_nextrun_idx',
                    background: true,
                },
            },
            {
                fields: { workplaceId: 1, createdBy: 1, isActive: 1 },
                options: {
                    name: 'workplace_creator_active_idx',
                    background: true,
                },
            },
        ];
        await this.createIndexes(collection, indexes, 'ReportSchedule');
    }
    async createIndexes(collection, indexes, collectionName) {
        try {
            for (const indexDef of indexes) {
                const { fields, options = {} } = indexDef;
                const existingIndexes = await collection.indexes();
                const indexName = options.name || this.generateIndexName(fields);
                const indexExists = existingIndexes.some((idx) => idx.name === indexName || this.compareIndexFields(idx.key, fields));
                if (!indexExists) {
                    await collection.createIndex(fields, options);
                    logger_1.default.info(`Created index ${indexName} on ${collectionName}`);
                }
                else {
                    logger_1.default.debug(`Index ${indexName} already exists on ${collectionName}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Failed to create indexes for ${collectionName}:`, error);
            throw error;
        }
    }
    generateIndexName(fields) {
        return Object.entries(fields)
            .map(([field, direction]) => `${field}_${direction}`)
            .join('_');
    }
    compareIndexFields(existing, proposed) {
        const existingKeys = Object.keys(existing).sort();
        const proposedKeys = Object.keys(proposed).sort();
        if (existingKeys.length !== proposedKeys.length) {
            return false;
        }
        return existingKeys.every((key, index) => key === proposedKeys[index] && existing[key] === proposed[key]);
    }
    async analyzeQueryPerformance() {
        logger_1.default.info('Analyzing query performance for index recommendations...');
        try {
            const recommendations = [];
            const slowQueries = await this.getSlowQueries();
            for (const query of slowQueries) {
                const recommendation = this.generateIndexRecommendation(query);
                if (recommendation) {
                    recommendations.push(recommendation);
                }
            }
            this.indexRecommendations = recommendations;
            return recommendations;
        }
        catch (error) {
            logger_1.default.error('Failed to analyze query performance:', error);
            return [];
        }
    }
    async getSlowQueries() {
        try {
            await mongoose_1.default.connection.db.admin().command({
                profile: 2,
                slowms: 100,
            });
            const profilerData = await mongoose_1.default.connection.db
                .collection('system.profile')
                .find({
                ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                ns: { $regex: /^reports_/ },
            })
                .sort({ ts: -1 })
                .limit(100)
                .toArray();
            return profilerData;
        }
        catch (error) {
            logger_1.default.error('Failed to get slow queries:', error);
            return [];
        }
    }
    generateIndexRecommendation(query) {
        try {
            const { ns, command, ts, millis } = query;
            const collection = ns.split('.')[1];
            if (!command || !command.filter) {
                return null;
            }
            const filterFields = Object.keys(command.filter);
            const sortFields = command.sort ? Object.keys(command.sort) : [];
            const indexFields = {};
            filterFields.forEach(field => {
                if (field !== '_id') {
                    indexFields[field] = 1;
                }
            });
            sortFields.forEach(field => {
                if (!indexFields[field]) {
                    indexFields[field] = command.sort[field];
                }
            });
            if (Object.keys(indexFields).length === 0) {
                return null;
            }
            return {
                collection,
                index: {
                    fields: indexFields,
                    options: {
                        background: true,
                        name: `${collection}_${this.generateIndexName(indexFields)}_recommended`,
                    },
                },
                reason: `Slow query detected (${millis}ms) - would benefit from compound index`,
                priority: millis > 1000 ? 'high' : millis > 500 ? 'medium' : 'low',
                estimatedImpact: `Could reduce query time from ${millis}ms to <50ms`,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to generate index recommendation:', error);
            return null;
        }
    }
    getIndexRecommendations() {
        return this.indexRecommendations;
    }
    async dropUnusedIndexes() {
        logger_1.default.info('Analyzing and dropping unused indexes...');
        try {
            const collections = await mongoose_1.default.connection.db.listCollections().toArray();
            for (const collectionInfo of collections) {
                const collection = mongoose_1.default.connection.db.collection(collectionInfo.name);
                const indexes = await collection.indexes();
                for (const index of indexes) {
                    if (index.name === '_id_')
                        continue;
                    const stats = await collection.aggregate([
                        { $indexStats: {} },
                        { $match: { name: index.name } },
                    ]).toArray();
                    if (stats.length > 0 && stats[0].accesses.ops === 0) {
                        logger_1.default.info(`Dropping unused index ${index.name} from ${collectionInfo.name}`);
                        await collection.dropIndex(index.name);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Failed to drop unused indexes:', error);
        }
    }
    async getIndexStats() {
        try {
            const collections = await mongoose_1.default.connection.db.listCollections().toArray();
            const stats = [];
            for (const collectionInfo of collections) {
                const collection = mongoose_1.default.connection.db.collection(collectionInfo.name);
                const indexStats = await collection.aggregate([{ $indexStats: {} }]).toArray();
                stats.push({
                    collection: collectionInfo.name,
                    indexes: indexStats,
                });
            }
            return stats;
        }
        catch (error) {
            logger_1.default.error('Failed to get index stats:', error);
            return [];
        }
    }
}
exports.DatabaseIndexingService = DatabaseIndexingService;
exports.default = DatabaseIndexingService;
//# sourceMappingURL=databaseIndexing.js.map