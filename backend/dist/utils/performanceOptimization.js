"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePerformanceOptimization = exports.MemoryOptimizer = exports.PerformanceMonitor = exports.QueryOptimizer = exports.CacheManager = exports.getRedisClient = exports.initializeRedisCache = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("./logger"));
let redisClient = null;
const initializeRedisCache = () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 10000,
        });
        redisClient.on('connect', () => {
            logger_1.default.info('Redis cache connected successfully');
        });
        redisClient.on('error', (error) => {
            logger_1.default.error('Redis cache connection error:', error);
        });
        return redisClient;
    }
    catch (error) {
        logger_1.default.error('Failed to initialize Redis cache:', error);
        return null;
    }
};
exports.initializeRedisCache = initializeRedisCache;
const getRedisClient = () => {
    return redisClient;
};
exports.getRedisClient = getRedisClient;
class CacheManager {
    static generateKey(type, identifier, workplaceId) {
        const parts = [this.keyPrefix, type, identifier];
        if (workplaceId) {
            parts.push(workplaceId);
        }
        return parts.join(':');
    }
    static async set(key, value, options = {}) {
        try {
            if (!redisClient)
                return false;
            const { ttl = this.defaultTTL, compress = false } = options;
            let serializedValue = JSON.stringify(value);
            if (compress && serializedValue.length > 1000) {
                const zlib = require('zlib');
                serializedValue = zlib.gzipSync(serializedValue).toString('base64');
                key = `${key}:compressed`;
            }
            await redisClient.setex(key, ttl, serializedValue);
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache set error:', error);
            return false;
        }
    }
    static async get(key) {
        try {
            if (!redisClient)
                return null;
            let value = await redisClient.get(key);
            if (!value) {
                const compressedValue = await redisClient.get(`${key}:compressed`);
                if (compressedValue) {
                    const zlib = require('zlib');
                    value = zlib.gunzipSync(Buffer.from(compressedValue, 'base64')).toString();
                }
            }
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.default.error('Cache get error:', error);
            return null;
        }
    }
    static async delete(pattern) {
        try {
            if (!redisClient)
                return false;
            if (pattern.includes('*')) {
                const keys = await redisClient.keys(pattern);
                if (keys.length > 0) {
                    await redisClient.del(...keys);
                }
            }
            else {
                await redisClient.del(pattern);
                await redisClient.del(`${pattern}:compressed`);
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache delete error:', error);
            return false;
        }
    }
    static async invalidateInterventionCaches(interventionId, patientId, workplaceId) {
        try {
            const patterns = [];
            if (interventionId) {
                patterns.push(this.generateKey('intervention', interventionId, '*'));
            }
            if (patientId) {
                patterns.push(this.generateKey('patient_interventions', patientId, '*'));
                patterns.push(this.generateKey('patient_summary', patientId, '*'));
            }
            if (workplaceId) {
                patterns.push(this.generateKey('dashboard', '*', workplaceId));
                patterns.push(this.generateKey('analytics', '*', workplaceId));
                patterns.push(this.generateKey('interventions_list', '*', workplaceId));
            }
            await Promise.all(patterns.map(pattern => this.delete(pattern)));
        }
        catch (error) {
            logger_1.default.error('Cache invalidation error:', error);
        }
    }
}
exports.CacheManager = CacheManager;
CacheManager.defaultTTL = 300;
CacheManager.keyPrefix = 'clinical_interventions:';
class QueryOptimizer {
    static optimizeInterventionQuery(baseQuery, options = {}) {
        const { includePatient = false, includeUser = false, includeAssignments = false, lean = true } = options;
        let query = baseQuery;
        if (lean) {
            query = query.lean();
        }
        if (includePatient) {
            query = query.populate('patientId', 'firstName lastName dateOfBirth mrn');
        }
        if (includeUser) {
            query = query.populate('identifiedBy', 'firstName lastName email');
        }
        if (includeAssignments) {
            query = query.populate('assignments.userId', 'firstName lastName email role');
        }
        return query;
    }
    static createDashboardAggregation(workplaceId, dateRange) {
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
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    categoryDistribution: [
                        {
                            $group: {
                                _id: '$category',
                                count: { $sum: 1 },
                                completed: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                successRate: {
                                    $cond: [
                                        { $gt: ['$count', 0] },
                                        { $multiply: [{ $divide: ['$completed', '$count'] }, 100] },
                                        0
                                    ]
                                }
                            }
                        }
                    ],
                    priorityDistribution: [
                        {
                            $group: {
                                _id: '$priority',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    resolutionMetrics: [
                        {
                            $match: {
                                status: 'completed',
                                actualDuration: { $exists: true, $gt: 0 }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgResolutionTime: { $avg: '$actualDuration' },
                                totalCostSavings: { $sum: '$outcomes.successMetrics.costSavings' }
                            }
                        }
                    ],
                    monthlyTrends: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$identifiedDate' },
                                    month: { $month: '$identifiedDate' }
                                },
                                total: { $sum: 1 },
                                completed: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                successRate: {
                                    $cond: [
                                        { $gt: ['$total', 0] },
                                        { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                                        0
                                    ]
                                }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } },
                        { $limit: 12 }
                    ]
                }
            }
        ];
    }
    static createUserAssignmentsQuery(userId, workplaceId, status) {
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            'assignments.userId': new mongoose_1.default.Types.ObjectId(userId),
            isDeleted: { $ne: true }
        };
        if (status && status.length > 0) {
            matchStage['assignments.status'] = { $in: status };
        }
        return [
            { $match: matchStage },
            {
                $addFields: {
                    userAssignments: {
                        $filter: {
                            input: '$assignments',
                            cond: {
                                $and: [
                                    { $eq: ['$$this.userId', new mongoose_1.default.Types.ObjectId(userId)] },
                                    status ? { $in: ['$$this.status', status] } : { $ne: ['$$this.status', null] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'patientId',
                    foreignField: '_id',
                    as: 'patient',
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1, mrn: 1 } }
                    ]
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
                    patient: 1,
                    userAssignments: 1
                }
            },
            { $sort: { priority: 1, identifiedDate: -1 } }
        ];
    }
}
exports.QueryOptimizer = QueryOptimizer;
class PerformanceMonitor {
    static async trackOperation(operation, fn, metadata) {
        const startTime = Date.now();
        let success = true;
        let error;
        let result;
        try {
            result = await fn();
            return result;
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err.message : 'Unknown error';
            throw err;
        }
        finally {
            const duration = Date.now() - startTime;
            this.recordMetric({
                operation,
                duration,
                timestamp: new Date(),
                success,
                error,
                metadata
            });
            if (duration > 1000) {
                logger_1.default.warn(`Slow operation detected: ${operation} took ${duration}ms`, {
                    operation,
                    duration,
                    metadata,
                    error
                });
            }
        }
    }
    static recordMetric(metric) {
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    static getPerformanceStats(operation) {
        let filteredMetrics = this.metrics;
        if (operation) {
            filteredMetrics = this.metrics.filter(m => m.operation === operation);
        }
        if (filteredMetrics.length === 0) {
            return {
                totalOperations: 0,
                averageDuration: 0,
                successRate: 0,
                slowOperations: 0,
                recentErrors: []
            };
        }
        const totalOperations = filteredMetrics.length;
        const successfulOperations = filteredMetrics.filter(m => m.success).length;
        const averageDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
        const slowOperations = filteredMetrics.filter(m => m.duration > 1000).length;
        const recentErrors = filteredMetrics
            .filter(m => !m.success && m.error)
            .slice(-10)
            .map(m => m.error);
        return {
            totalOperations,
            averageDuration: Math.round(averageDuration),
            successRate: Math.round((successfulOperations / totalOperations) * 100),
            slowOperations,
            recentErrors
        };
    }
    static clearMetrics() {
        this.metrics = [];
    }
    static exportMetrics(operation) {
        if (operation) {
            return this.metrics.filter(m => m.operation === operation);
        }
        return [...this.metrics];
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
PerformanceMonitor.metrics = [];
PerformanceMonitor.maxMetrics = 1000;
class MemoryOptimizer {
    static optimizeInterventionData(intervention) {
        const optimized = { ...intervention };
        if (optimized.patient) {
            optimized.patient = {
                _id: optimized.patient._id,
                firstName: optimized.patient.firstName,
                lastName: optimized.patient.lastName,
                displayName: `${optimized.patient.firstName} ${optimized.patient.lastName}`
            };
        }
        if (optimized.assignments) {
            optimized.assignments = optimized.assignments.map((assignment) => ({
                _id: assignment._id,
                userId: assignment.userId,
                role: assignment.role,
                status: assignment.status,
                assignedAt: assignment.assignedAt,
                userName: assignment.userId?.firstName && assignment.userId?.lastName
                    ? `${assignment.userId.firstName} ${assignment.userId.lastName}`
                    : undefined
            }));
        }
        if (optimized.issueDescription && optimized.issueDescription.length > 100) {
            optimized.issueDescriptionPreview = optimized.issueDescription.substring(0, 100) + '...';
        }
        return optimized;
    }
    static async processBatch(items, processor, batchSize = 100) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processor(batch);
            results.push(...batchResults);
            await new Promise(resolve => setImmediate(resolve));
        }
        return results;
    }
}
exports.MemoryOptimizer = MemoryOptimizer;
const initializePerformanceOptimization = () => {
    (0, exports.initializeRedisCache)();
    logger_1.default.info('Performance optimization initialized');
    setInterval(() => {
        const stats = PerformanceMonitor.getPerformanceStats();
        logger_1.default.info('Performance stats:', stats);
        if (stats.totalOperations > 5000) {
            PerformanceMonitor.clearMetrics();
        }
    }, 300000);
};
exports.initializePerformanceOptimization = initializePerformanceOptimization;
//# sourceMappingURL=performanceOptimization.js.map