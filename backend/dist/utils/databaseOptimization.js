"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabaseOptimization = exports.OptimizedQueryBuilder = exports.DatabaseOptimizer = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
class DatabaseOptimizer {
    static async createOptimizedIndexes() {
        try {
            const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
            const indexes = [
                {
                    fields: { workplaceId: 1, isDeleted: 1, status: 1, identifiedDate: -1 },
                    options: {
                        name: 'workplace_active_interventions',
                        background: true
                    }
                },
                {
                    fields: { workplaceId: 1, patientId: 1, isDeleted: 1, identifiedDate: -1 },
                    options: {
                        name: 'patient_interventions_timeline',
                        background: true
                    }
                },
                {
                    fields: { 'assignments.userId': 1, 'assignments.status': 1, workplaceId: 1 },
                    options: {
                        name: 'user_assignments_active',
                        background: true,
                        sparse: true
                    }
                },
                {
                    fields: { workplaceId: 1, category: 1, priority: 1, status: 1 },
                    options: {
                        name: 'category_priority_filter',
                        background: true
                    }
                },
                {
                    fields: { workplaceId: 1, status: 1, priority: 1, startedAt: 1 },
                    options: {
                        name: 'overdue_interventions',
                        background: true,
                        partialFilterExpression: {
                            status: { $in: ['identified', 'planning', 'in_progress', 'implemented'] }
                        }
                    }
                },
                {
                    fields: { workplaceId: 1, 'followUp.scheduledDate': 1, 'followUp.required': 1 },
                    options: {
                        name: 'followup_scheduling',
                        background: true,
                        sparse: true,
                        partialFilterExpression: {
                            'followUp.required': true,
                            'followUp.scheduledDate': { $exists: true }
                        }
                    }
                },
                {
                    fields: { workplaceId: 1, relatedMTRId: 1, isDeleted: 1 },
                    options: {
                        name: 'mtr_integration',
                        background: true,
                        sparse: true
                    }
                },
                {
                    fields: {
                        interventionNumber: 'text',
                        issueDescription: 'text',
                        implementationNotes: 'text'
                    },
                    options: {
                        name: 'intervention_text_search',
                        background: true
                    }
                },
                {
                    fields: { workplaceId: 1, identifiedDate: -1, status: 1, category: 1 },
                    options: {
                        name: 'analytics_reporting',
                        background: true
                    }
                },
                {
                    fields: { workplaceId: 1, completedAt: -1, status: 1 },
                    options: {
                        name: 'completion_tracking',
                        background: true,
                        sparse: true,
                        partialFilterExpression: {
                            status: { $in: ['completed', 'cancelled'] }
                        }
                    }
                },
                {
                    fields: { workplaceId: 1, interventionNumber: 1 },
                    options: {
                        name: 'unique_intervention_number',
                        unique: true,
                        background: true
                    }
                }
            ];
            for (const indexDef of indexes) {
                try {
                    await ClinicalIntervention.collection.createIndex(indexDef.fields, indexDef.options || {});
                    logger_1.default.info(`Created index: ${indexDef.options?.name || 'unnamed'}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.error(`Failed to create index ${indexDef.options?.name}:`, error);
                    }
                }
            }
            logger_1.default.info('Database optimization indexes created successfully');
        }
        catch (error) {
            logger_1.default.error('Error creating optimized indexes:', error);
            throw error;
        }
    }
    static async analyzeIndexUsage() {
        try {
            const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
            const db = mongoose_1.default.connection.db;
            const indexStats = await ClinicalIntervention.collection.aggregate([
                { $indexStats: {} }
            ]).toArray();
            const collStats = await db.command({
                collStats: 'clinicalinterventions'
            });
            const unusedIndexes = indexStats
                .filter(stat => stat.accesses.ops === 0)
                .map(stat => stat.name);
            const recommendations = [];
            if (collStats.count > 1000) {
                recommendations.push('Consider partitioning by workplaceId for large datasets');
            }
            if (unusedIndexes.length > 0) {
                recommendations.push(`Remove unused indexes: ${unusedIndexes.join(', ')}`);
            }
            const lowSelectivityIndexes = indexStats.filter(stat => {
                const selectivity = stat.accesses.ops / (collStats.count || 1);
                return selectivity < 0.1 && stat.accesses.ops > 0;
            });
            if (lowSelectivityIndexes.length > 0) {
                recommendations.push('Review low-selectivity indexes for optimization');
            }
            return {
                totalIndexes: indexStats.length,
                unusedIndexes,
                slowQueries: [],
                recommendations
            };
        }
        catch (error) {
            logger_1.default.error('Error analyzing index usage:', error);
            throw error;
        }
    }
    static async explainQuery(model, query, options = {}) {
        try {
            const explanation = await model.find(query, null, options).explain('executionStats');
            const stats = explanation.executionStats;
            const isOptimal = stats.totalDocsExamined <= stats.totalDocsReturned * 2;
            logger_1.default.info('Query execution stats:', {
                totalDocsExamined: stats.totalDocsExamined,
                totalDocsReturned: stats.totalDocsReturned,
                executionTimeMillis: stats.executionTimeMillis,
                isOptimal,
                indexesUsed: explanation.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN'
            });
            return {
                ...stats,
                isOptimal,
                recommendations: isOptimal ? [] : [
                    'Consider adding appropriate indexes',
                    'Review query selectivity',
                    'Check for unnecessary field projections'
                ]
            };
        }
        catch (error) {
            logger_1.default.error('Error explaining query:', error);
            throw error;
        }
    }
    static async performMaintenance() {
        try {
            const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
            const stats = await ClinicalIntervention.collection.stats();
            logger_1.default.info('Collection statistics:', {
                count: stats.count,
                avgObjSize: stats.avgObjSize,
                storageSize: stats.storageSize,
                totalIndexSize: stats.totalIndexSize
            });
            if (stats.storageSize > stats.size * 2) {
                logger_1.default.warn('Collection fragmentation detected, consider compacting');
            }
            await this.analyzeIndexUsage();
            logger_1.default.info('Database maintenance completed');
        }
        catch (error) {
            logger_1.default.error('Error during database maintenance:', error);
            throw error;
        }
    }
    static optimizeConnectionPool() {
        const options = {
            maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10'),
            minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2'),
            maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME || '30000'),
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000'),
            socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000'),
            bufferMaxEntries: 0,
            bufferCommands: false,
        };
        mongoose_1.default.set('bufferCommands', false);
        logger_1.default.info('MongoDB connection pool optimized:', options);
    }
}
exports.DatabaseOptimizer = DatabaseOptimizer;
class OptimizedQueryBuilder {
    static buildInterventionListQuery(filters) {
        const { workplaceId, patientId, category, priority, status, identifiedBy, assignedTo, dateFrom, dateTo, search } = filters;
        const pipeline = [];
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: { $ne: true }
        };
        if (patientId)
            matchStage.patientId = new mongoose_1.default.Types.ObjectId(patientId);
        if (category)
            matchStage.category = category;
        if (priority)
            matchStage.priority = priority;
        if (status)
            matchStage.status = status;
        if (identifiedBy)
            matchStage.identifiedBy = new mongoose_1.default.Types.ObjectId(identifiedBy);
        if (dateFrom || dateTo) {
            matchStage.identifiedDate = {};
            if (dateFrom)
                matchStage.identifiedDate.$gte = dateFrom;
            if (dateTo)
                matchStage.identifiedDate.$lte = dateTo;
        }
        pipeline.push({ $match: matchStage });
        if (assignedTo) {
            pipeline.push({
                $match: {
                    'assignments.userId': new mongoose_1.default.Types.ObjectId(assignedTo)
                }
            });
        }
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { interventionNumber: { $regex: search, $options: 'i' } },
                        { issueDescription: { $regex: search, $options: 'i' } },
                        { implementationNotes: { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }
        pipeline.push({
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patient',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            mrn: 1,
                            dateOfBirth: 1
                        }
                    }
                ]
            }
        });
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'identifiedBy',
                foreignField: '_id',
                as: 'identifiedByUser',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1
                        }
                    }
                ]
            }
        });
        pipeline.push({ $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } }, { $unwind: { path: '$identifiedByUser', preserveNullAndEmptyArrays: true } });
        pipeline.push({
            $project: {
                interventionNumber: 1,
                category: 1,
                priority: 1,
                status: 1,
                identifiedDate: 1,
                startedAt: 1,
                completedAt: 1,
                issueDescriptionPreview: { $substr: ['$issueDescription', 0, 100] },
                patient: 1,
                identifiedByUser: 1,
                assignmentCount: { $size: { $ifNull: ['$assignments', []] } },
                strategyCount: { $size: { $ifNull: ['$strategies', []] } },
                hasOutcome: { $ne: ['$outcomes', null] },
                followUpRequired: '$followUp.required',
                followUpScheduled: '$followUp.scheduledDate',
                createdAt: 1,
                updatedAt: 1
            }
        });
        return pipeline;
    }
    static buildDashboardMetricsQuery(workplaceId, dateRange) {
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: { $ne: true }
        };
        if (dateRange) {
            matchStage.identifiedDate = {
                $gte: dateRange.from,
                $lte: dateRange.to
            };
        }
        return [
            { $match: matchStage },
            {
                $facet: {
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                active: {
                                    $sum: {
                                        $cond: [
                                            { $in: ['$status', ['identified', 'planning', 'in_progress', 'implemented']] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                completed: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                    }
                                },
                                overdue: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $in: ['$status', ['identified', 'planning', 'in_progress', 'implemented']] },
                                                    {
                                                        $lt: [
                                                            '$startedAt',
                                                            {
                                                                $dateSubtract: {
                                                                    startDate: new Date(),
                                                                    unit: 'day',
                                                                    amount: {
                                                                        $switch: {
                                                                            branches: [
                                                                                { case: { $in: ['$priority', ['critical', 'high']] }, then: 1 },
                                                                                { case: { $eq: ['$priority', 'medium'] }, then: 3 },
                                                                                { case: { $eq: ['$priority', 'low'] }, then: 7 }
                                                                            ],
                                                                            default: 3
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                avgResolutionTime: {
                                    $avg: {
                                        $cond: [
                                            { $and: [{ $eq: ['$status', 'completed'] }, { $gt: ['$actualDuration', 0] }] },
                                            '$actualDuration',
                                            null
                                        ]
                                    }
                                },
                                totalCostSavings: {
                                    $sum: {
                                        $ifNull: ['$outcomes.successMetrics.costSavings', 0]
                                    }
                                }
                            }
                        }
                    ],
                    categoryStats: [
                        {
                            $group: {
                                _id: '$category',
                                count: { $sum: 1 },
                                completed: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                    }
                                },
                                successful: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$status', 'completed'] },
                                                    { $eq: ['$outcomes.successMetrics.problemResolved', true] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                successRate: {
                                    $cond: [
                                        { $gt: ['$completed', 0] },
                                        { $multiply: [{ $divide: ['$successful', '$completed'] }, 100] },
                                        0
                                    ]
                                }
                            }
                        }
                    ],
                    priorityStats: [
                        {
                            $group: {
                                _id: '$priority',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    recentInterventions: [
                        { $sort: { identifiedDate: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: 'patients',
                                localField: 'patientId',
                                foreignField: '_id',
                                as: 'patient',
                                pipeline: [{ $project: { firstName: 1, lastName: 1 } }]
                            }
                        },
                        { $unwind: '$patient' },
                        {
                            $project: {
                                interventionNumber: 1,
                                category: 1,
                                priority: 1,
                                status: 1,
                                identifiedDate: 1,
                                patientName: {
                                    $concat: ['$patient.firstName', ' ', '$patient.lastName']
                                }
                            }
                        }
                    ]
                }
            }
        ];
    }
}
exports.OptimizedQueryBuilder = OptimizedQueryBuilder;
const initializeDatabaseOptimization = async () => {
    try {
        DatabaseOptimizer.optimizeConnectionPool();
        await DatabaseOptimizer.createOptimizedIndexes();
        setInterval(async () => {
            try {
                await DatabaseOptimizer.performMaintenance();
            }
            catch (error) {
                logger_1.default.error('Scheduled maintenance error:', error);
            }
        }, 24 * 60 * 60 * 1000);
        logger_1.default.info('Database optimization initialized successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize database optimization:', error);
        throw error;
    }
};
exports.initializeDatabaseOptimization = initializeDatabaseOptimization;
//# sourceMappingURL=databaseOptimization.js.map