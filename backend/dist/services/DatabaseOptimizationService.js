"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class DatabaseOptimizationService {
    constructor() {
        this.performanceMetrics = [];
        this.MAX_METRICS_HISTORY = 1000;
        this.setupIndexes();
    }
    static getInstance() {
        if (!DatabaseOptimizationService.instance) {
            DatabaseOptimizationService.instance = new DatabaseOptimizationService();
        }
        return DatabaseOptimizationService.instance;
    }
    async setupIndexes() {
        const indexes = [
            {
                collection: 'users',
                index: { email: 1 },
                options: { unique: true },
                description: 'Unique index for user email lookups',
            },
            {
                collection: 'users',
                index: { workspaceId: 1, role: 1 },
                description: 'Compound index for workspace user queries',
            },
            {
                collection: 'users',
                index: { createdAt: -1 },
                description: 'Index for user registration analytics',
            },
            {
                collection: 'users',
                index: { lastLoginAt: -1 },
                description: 'Index for user activity analytics',
            },
            {
                collection: 'users',
                index: { isActive: 1, workspaceId: 1 },
                description: 'Index for active user queries by workspace',
            },
            {
                collection: 'systemmetrics',
                index: { timestamp: -1 },
                description: 'Index for time-series metrics queries',
            },
            {
                collection: 'systemmetrics',
                index: { metricType: 1, timestamp: -1 },
                description: 'Compound index for metric type and time queries',
            },
            {
                collection: 'useranalytics',
                index: { userId: 1, timestamp: -1 },
                description: 'Compound index for user analytics queries',
            },
            {
                collection: 'useranalytics',
                index: { workspaceId: 1, timestamp: -1 },
                description: 'Compound index for workspace analytics',
            },
            {
                collection: 'useranalytics',
                index: { eventType: 1, timestamp: -1 },
                description: 'Index for event-based analytics',
            },
            {
                collection: 'subscriptionanalytics',
                index: { subscriptionId: 1, timestamp: -1 },
                description: 'Compound index for subscription analytics',
            },
            {
                collection: 'subscriptionanalytics',
                index: { planType: 1, timestamp: -1 },
                description: 'Index for plan-based analytics',
            },
            {
                collection: 'subscriptionanalytics',
                index: { workspaceId: 1, status: 1 },
                description: 'Index for workspace subscription queries',
            },
            {
                collection: 'usersessions',
                index: { userId: 1, isActive: 1 },
                description: 'Index for active user sessions',
            },
            {
                collection: 'usersessions',
                index: { sessionId: 1 },
                options: { unique: true },
                description: 'Unique index for session lookups',
            },
            {
                collection: 'usersessions',
                index: { createdAt: -1 },
                options: { expireAfterSeconds: 86400 * 30 },
                description: 'TTL index for session cleanup',
            },
            {
                collection: 'usersessions',
                index: { ipAddress: 1, createdAt: -1 },
                description: 'Index for IP-based security queries',
            },
            {
                collection: 'securityauditlogs',
                index: { userId: 1, timestamp: -1 },
                description: 'Index for user audit queries',
            },
            {
                collection: 'securityauditlogs',
                index: { action: 1, timestamp: -1 },
                description: 'Index for action-based audit queries',
            },
            {
                collection: 'securityauditlogs',
                index: { ipAddress: 1, timestamp: -1 },
                description: 'Index for IP-based security analysis',
            },
            {
                collection: 'securityauditlogs',
                index: { timestamp: -1 },
                options: { expireAfterSeconds: 86400 * 365 },
                description: 'TTL index for audit log retention',
            },
            {
                collection: 'notificationrules',
                index: { isActive: 1, trigger: 1 },
                description: 'Index for active notification rules',
            },
            {
                collection: 'notificationtemplates',
                index: { channel: 1, isActive: 1 },
                description: 'Index for active templates by channel',
            },
            {
                collection: 'tenants',
                index: { status: 1, type: 1 },
                description: 'Index for tenant status and type queries',
            },
            {
                collection: 'tenants',
                index: { subscriptionPlan: 1, status: 1 },
                description: 'Index for subscription plan queries',
            },
            {
                collection: 'tenants',
                index: { createdAt: -1 },
                description: 'Index for tenant creation analytics',
            },
            {
                collection: 'tenants',
                index: { lastActivity: -1 },
                description: 'Index for tenant activity tracking',
            },
            {
                collection: 'supporttickets',
                index: { status: 1, priority: 1 },
                description: 'Index for ticket status and priority queries',
            },
            {
                collection: 'supporttickets',
                index: { assignedTo: 1, status: 1 },
                description: 'Index for assigned ticket queries',
            },
            {
                collection: 'supporttickets',
                index: { createdBy: 1, createdAt: -1 },
                description: 'Index for user ticket history',
            },
            {
                collection: 'supporttickets',
                index: { tenantId: 1, status: 1 },
                description: 'Index for tenant support queries',
            },
            {
                collection: 'knowledgebasearticles',
                index: { category: 1, isPublished: 1 },
                description: 'Index for published articles by category',
            },
            {
                collection: 'knowledgebasearticles',
                index: { tags: 1, isPublished: 1 },
                description: 'Index for article tag searches',
            },
            {
                collection: 'knowledgebasearticles',
                index: { title: 'text', content: 'text' },
                description: 'Full-text search index for articles',
            },
            {
                collection: 'apiendpoints',
                index: { path: 1, method: 1 },
                options: { unique: true },
                description: 'Unique index for API endpoint identification',
            },
            {
                collection: 'apiendpoints',
                index: { isActive: 1, version: 1 },
                description: 'Index for active API endpoints by version',
            },
            {
                collection: 'apikeys',
                index: { keyHash: 1 },
                options: { unique: true },
                description: 'Unique index for API key lookups',
            },
            {
                collection: 'apikeys',
                index: { developerId: 1, isActive: 1 },
                description: 'Index for developer API keys',
            },
            {
                collection: 'apikeys',
                index: { expiresAt: 1 },
                options: { expireAfterSeconds: 0 },
                description: 'TTL index for API key expiration',
            },
            {
                collection: 'apiusagemetrics',
                index: { apiKeyId: 1, timestamp: -1 },
                description: 'Index for API usage by key',
            },
            {
                collection: 'apiusagemetrics',
                index: { endpoint: 1, timestamp: -1 },
                description: 'Index for endpoint usage analytics',
            },
            {
                collection: 'apiusagemetrics',
                index: { timestamp: -1 },
                options: { expireAfterSeconds: 86400 * 90 },
                description: 'TTL index for usage metrics retention',
            },
        ];
        await this.createIndexes(indexes);
    }
    async createIndexes(indexes) {
        logger_1.default.info(`Creating ${indexes.length} database indexes for optimization`);
        for (const indexDef of indexes) {
            try {
                const collection = mongoose_1.default.connection.db?.collection(indexDef.collection);
                if (!collection) {
                    logger_1.default.warn(`Collection ${indexDef.collection} not found, skipping index creation`);
                    continue;
                }
                await collection.createIndex(indexDef.index, indexDef.options || {});
                logger_1.default.debug(`Created index for ${indexDef.collection}: ${indexDef.description}`);
            }
            catch (error) {
                if (error.code !== 85) {
                    logger_1.default.error(`Failed to create index for ${indexDef.collection}:`, error);
                }
            }
        }
        logger_1.default.info('Database index creation completed');
    }
    async analyzeQueryPerformance(collection, operation, query) {
        const startTime = Date.now();
        try {
            const db = mongoose_1.default.connection.db;
            if (!db) {
                throw new Error('Database connection not available');
            }
            const explainResult = await db.collection(collection).find(query).explain('executionStats');
            const executionStats = explainResult.executionStats;
            const metrics = {
                collection,
                operation,
                executionTime: Date.now() - startTime,
                documentsExamined: executionStats.totalDocsExamined || 0,
                documentsReturned: executionStats.totalDocsReturned || 0,
                indexUsed: executionStats.totalDocsExamined <= executionStats.totalDocsReturned * 2,
                timestamp: new Date(),
            };
            this.recordPerformanceMetrics(metrics);
            return metrics;
        }
        catch (error) {
            logger_1.default.error(`Failed to analyze query performance for ${collection}:`, error);
            throw error;
        }
    }
    getOptimizedUserAnalyticsPipeline(timeRange) {
        return [
            {
                $match: {
                    createdAt: {
                        $gte: timeRange.start,
                        $lte: timeRange.end,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    count: { $sum: 1 },
                    activeUsers: {
                        $sum: {
                            $cond: [{ $eq: ['$isActive', true] }, 1, 0],
                        },
                    },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ];
    }
    getOptimizedSubscriptionAnalyticsPipeline(timeRange) {
        return [
            {
                $match: {
                    timestamp: {
                        $gte: timeRange.start,
                        $lte: timeRange.end,
                    },
                },
            },
            {
                $group: {
                    _id: '$planType',
                    totalRevenue: { $sum: '$revenue' },
                    subscriptionCount: { $sum: 1 },
                    avgRevenue: { $avg: '$revenue' },
                },
            },
            {
                $sort: { totalRevenue: -1 },
            },
        ];
    }
    getOptimizedActiveSessionsQuery() {
        return {
            isActive: true,
            lastActivity: {
                $gte: new Date(Date.now() - 30 * 60 * 1000),
            },
        };
    }
    getOptimizedSecurityAuditQuery(filters) {
        const query = {};
        if (filters.userId) {
            query.userId = filters.userId;
        }
        if (filters.action) {
            query.action = filters.action;
        }
        if (filters.ipAddress) {
            query.ipAddress = filters.ipAddress;
        }
        if (filters.timeRange) {
            query.timestamp = {
                $gte: filters.timeRange.start,
                $lte: filters.timeRange.end,
            };
        }
        return query;
    }
    async getCursorPaginatedResults(model, query = {}, options = {}) {
        const { limit = 20, cursor, sortField = '_id', sortOrder = -1, } = options;
        const paginatedQuery = { ...query };
        if (cursor) {
            const cursorCondition = sortOrder === 1 ? '$gt' : '$lt';
            paginatedQuery[sortField] = { [cursorCondition]: cursor };
        }
        const results = await model
            .find(paginatedQuery)
            .sort({ [sortField]: sortOrder })
            .limit(limit + 1)
            .lean()
            .exec();
        const hasMore = results.length > limit;
        if (hasMore) {
            results.pop();
        }
        const nextCursor = hasMore && results.length > 0
            ? results[results.length - 1][sortField]
            : undefined;
        return {
            data: results,
            nextCursor: nextCursor?.toString(),
            hasMore,
        };
    }
    async executeOptimizedAggregation(model, pipeline, options = {}) {
        const { allowDiskUse = true, maxTimeMS = 30000, } = options;
        const startTime = Date.now();
        try {
            const results = await model.aggregate(pipeline, {
                allowDiskUse,
                maxTimeMS,
            });
            const executionTime = Date.now() - startTime;
            this.recordPerformanceMetrics({
                collection: model.collection.name,
                operation: 'aggregation',
                executionTime,
                documentsExamined: 0,
                documentsReturned: results.length,
                indexUsed: true,
                timestamp: new Date(),
            });
            return results;
        }
        catch (error) {
            logger_1.default.error(`Aggregation failed for ${model.collection.name}:`, error);
            throw error;
        }
    }
    recordPerformanceMetrics(metrics) {
        this.performanceMetrics.push(metrics);
        if (this.performanceMetrics.length > this.MAX_METRICS_HISTORY) {
            this.performanceMetrics.shift();
        }
        if (metrics.executionTime > 1000) {
            logger_1.default.warn(`Slow query detected in ${metrics.collection}:`, {
                operation: metrics.operation,
                executionTime: metrics.executionTime,
                documentsExamined: metrics.documentsExamined,
                documentsReturned: metrics.documentsReturned,
                indexUsed: metrics.indexUsed,
            });
        }
    }
    getPerformanceStats() {
        const totalQueries = this.performanceMetrics.length;
        const averageExecutionTime = totalQueries > 0
            ? this.performanceMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
            : 0;
        const slowQueries = this.performanceMetrics.filter(m => m.executionTime > 1000).length;
        const indexUsageRate = totalQueries > 0
            ? (this.performanceMetrics.filter(m => m.indexUsed).length / totalQueries) * 100
            : 0;
        return {
            totalQueries,
            averageExecutionTime,
            slowQueries,
            indexUsageRate,
            recentMetrics: this.performanceMetrics.slice(-10),
        };
    }
    async analyzeIndexUsage() {
        const suggestions = [];
        const unusedIndexes = [];
        const collections = [];
        try {
            const db = mongoose_1.default.connection.db;
            if (!db) {
                throw new Error('Database connection not available');
            }
            const collectionNames = await db.listCollections().toArray();
            for (const collectionInfo of collectionNames) {
                const collectionName = collectionInfo.name;
                collections.push(collectionName);
                try {
                    const collection = db.collection(collectionName);
                    const indexStats = [];
                    for (const indexStat of indexStats) {
                        const indexName = indexStat.name;
                        const usageCount = indexStat.accesses?.ops || 0;
                        if (indexName === '_id_') {
                            continue;
                        }
                        if (usageCount === 0) {
                            unusedIndexes.push(`${collectionName}.${indexName}`);
                        }
                    }
                }
                catch (error) {
                    logger_1.default.debug(`Could not analyze indexes for collection ${collectionName}:`, error);
                }
            }
            const slowQueries = this.performanceMetrics.filter(m => m.executionTime > 1000);
            if (slowQueries.length > 0) {
                suggestions.push('Consider adding indexes for frequently queried fields in slow queries');
            }
            const lowIndexUsage = this.performanceMetrics.filter(m => !m.indexUsed);
            const totalQueries = this.performanceMetrics.length;
            if (lowIndexUsage.length > totalQueries * 0.2) {
                suggestions.push('Review query patterns and add appropriate compound indexes');
            }
            return {
                collections,
                suggestions,
                unusedIndexes,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to analyze index usage:', error);
            return {
                collections: [],
                suggestions: ['Failed to analyze index usage - check database connection'],
                unusedIndexes: [],
            };
        }
    }
    clearPerformanceMetrics() {
        this.performanceMetrics = [];
        logger_1.default.info('Performance metrics history cleared');
    }
}
exports.DatabaseOptimizationService = DatabaseOptimizationService;
exports.default = DatabaseOptimizationService.getInstance();
//# sourceMappingURL=DatabaseOptimizationService.js.map