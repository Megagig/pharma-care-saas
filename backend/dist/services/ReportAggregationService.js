"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportAggregationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const perf_hooks_1 = require("perf_hooks");
const logger_1 = __importDefault(require("../utils/logger"));
class ReportAggregationService {
    constructor() {
        this.performanceMetrics = new Map();
    }
    static getInstance() {
        if (!ReportAggregationService.instance) {
            ReportAggregationService.instance = new ReportAggregationService();
        }
        return ReportAggregationService.instance;
    }
    async executeAggregation(model, pipeline, options = {}, cacheKey) {
        const startTime = perf_hooks_1.performance.now();
        const operationId = `${model.modelName}_${Date.now()}`;
        try {
            const defaultOptions = {
                allowDiskUse: true,
                maxTimeMS: 30000,
                batchSize: 1000,
                ...options,
            };
            if (process.env.NODE_ENV === 'development') {
                logger_1.default.debug(`Executing aggregation for ${model.modelName}:`, {
                    pipeline: JSON.stringify(pipeline, null, 2),
                    options: defaultOptions,
                });
            }
            const aggregation = model.aggregate(pipeline, defaultOptions);
            const result = await aggregation.exec();
            const executionTime = perf_hooks_1.performance.now() - startTime;
            this.trackPerformance(model.modelName, executionTime);
            if (executionTime > 1000) {
                logger_1.default.warn(`Slow aggregation detected for ${model.modelName}:`, {
                    executionTime: `${executionTime.toFixed(2)}ms`,
                    pipeline: pipeline.slice(0, 3),
                    resultCount: result.length,
                });
            }
            return {
                data: result,
                executionTime,
                totalDocuments: result.length,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error(`Aggregation failed for ${model.modelName}:`, {
                error: error instanceof Error ? error.message : error,
                executionTime: `${executionTime.toFixed(2)}ms`,
                pipeline: pipeline.slice(0, 2),
            });
            throw error;
        }
    }
    buildOptimizedMatchStage(workplaceId, filters = {}, indexHints) {
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: { $ne: true },
        };
        if (filters.dateRange) {
            matchStage.createdAt = {
                $gte: filters.dateRange.startDate,
                $lte: filters.dateRange.endDate,
            };
        }
        if (filters.patientId) {
            matchStage.patientId = new mongoose_1.default.Types.ObjectId(filters.patientId);
        }
        if (filters.pharmacistId) {
            matchStage.pharmacistId = new mongoose_1.default.Types.ObjectId(filters.pharmacistId);
        }
        if (filters.status) {
            matchStage.status = filters.status;
        }
        if (filters.priority) {
            matchStage.priority = filters.priority;
        }
        if (filters.reviewType) {
            matchStage.reviewType = filters.reviewType;
        }
        return { $match: matchStage };
    }
    buildOptimizedGroupStage(groupBy, metrics) {
        const groupStage = {
            _id: `$${groupBy}`,
        };
        metrics.forEach((metric) => {
            switch (metric) {
                case 'count':
                    groupStage.count = { $sum: 1 };
                    break;
                case 'avgCompletionTime':
                    groupStage.avgCompletionTime = {
                        $avg: {
                            $cond: [
                                { $ne: ['$completedAt', null] },
                                {
                                    $divide: [
                                        { $subtract: ['$completedAt', '$startedAt'] },
                                        1000 * 60 * 60 * 24,
                                    ],
                                },
                                null,
                            ],
                        },
                    };
                    break;
                case 'totalCostSavings':
                    groupStage.totalCostSavings = { $sum: '$clinicalOutcomes.costSavings' };
                    break;
                case 'completionRate':
                    groupStage.totalReviews = { $sum: 1 };
                    groupStage.completedReviews = {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    };
                    break;
                case 'acceptanceRate':
                    groupStage.totalInterventions = { $sum: 1 };
                    groupStage.acceptedInterventions = {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                    };
                    break;
            }
        });
        return { $group: groupStage };
    }
    buildTimeSeriesAggregation(workplaceId, filters, interval = 'day') {
        const matchStage = this.buildOptimizedMatchStage(workplaceId, filters);
        let dateGrouping;
        switch (interval) {
            case 'hour':
                dateGrouping = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' },
                };
                break;
            case 'day':
                dateGrouping = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                };
                break;
            case 'week':
                dateGrouping = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' },
                };
                break;
            case 'month':
                dateGrouping = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                };
                break;
        }
        return [
            matchStage,
            {
                $group: {
                    _id: dateGrouping,
                    count: { $sum: 1 },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
                },
            },
            {
                $addFields: {
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day',
                            hour: '$_id.hour',
                        },
                    },
                    completionRate: {
                        $cond: [
                            { $gt: ['$count', 0] },
                            { $multiply: [{ $divide: ['$completedCount', '$count'] }, 100] },
                            0,
                        ],
                    },
                },
            },
            { $sort: { date: 1 } },
        ];
    }
    buildFacetedAggregation(workplaceId, filters, facets) {
        const matchStage = this.buildOptimizedMatchStage(workplaceId, filters);
        return [
            matchStage,
            {
                $facet: facets,
            },
        ];
    }
    buildOptimizedLookup(from, localField, foreignField, as, pipeline) {
        const lookupStage = {
            $lookup: {
                from,
                localField,
                foreignField,
                as,
            },
        };
        if (pipeline) {
            lookupStage.$lookup.pipeline = pipeline;
        }
        return lookupStage;
    }
    buildPaginationPipeline(page = 1, limit = 50, sortField = 'createdAt', sortOrder = -1) {
        const skip = (page - 1) * limit;
        return [
            { $sort: { [sortField]: sortOrder } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'count' }],
                },
            },
            {
                $addFields: {
                    totalCount: { $arrayElemAt: ['$totalCount.count', 0] },
                    page,
                    limit,
                    totalPages: {
                        $ceil: {
                            $divide: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit],
                        },
                    },
                },
            },
        ];
    }
    trackPerformance(modelName, executionTime) {
        if (!this.performanceMetrics.has(modelName)) {
            this.performanceMetrics.set(modelName, []);
        }
        const metrics = this.performanceMetrics.get(modelName);
        metrics.push(executionTime);
        if (metrics.length > 100) {
            metrics.shift();
        }
    }
    getPerformanceStats(modelName) {
        if (modelName) {
            const metrics = this.performanceMetrics.get(modelName) || [];
            if (metrics.length === 0)
                return {};
            return {
                modelName,
                count: metrics.length,
                avgExecutionTime: metrics.reduce((a, b) => a + b, 0) / metrics.length,
                minExecutionTime: Math.min(...metrics),
                maxExecutionTime: Math.max(...metrics),
                p95ExecutionTime: this.calculatePercentile(metrics, 95),
            };
        }
        const allStats = {};
        for (const [model, metrics] of this.performanceMetrics.entries()) {
            allStats[model] = this.getPerformanceStats(model);
        }
        return allStats;
    }
    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
    clearPerformanceMetrics() {
        this.performanceMetrics.clear();
    }
    getIndexRecommendations(modelName, queries) {
        const recommendations = [];
        const fieldUsage = {};
        queries.forEach((query) => {
            Object.keys(query).forEach((field) => {
                fieldUsage[field] = (fieldUsage[field] || 0) + 1;
            });
        });
        const sortedFields = Object.entries(fieldUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([field]) => field);
        if (sortedFields.includes('workplaceId') && sortedFields.includes('createdAt')) {
            recommendations.push('{ workplaceId: 1, createdAt: -1 }');
        }
        if (sortedFields.includes('workplaceId') && sortedFields.includes('status')) {
            recommendations.push('{ workplaceId: 1, status: 1 }');
        }
        if (sortedFields.includes('patientId') && sortedFields.includes('createdAt')) {
            recommendations.push('{ patientId: 1, createdAt: -1 }');
        }
        return recommendations;
    }
}
exports.ReportAggregationService = ReportAggregationService;
exports.default = ReportAggregationService.getInstance();
//# sourceMappingURL=ReportAggregationService.js.map