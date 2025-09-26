"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTherapyEffectivenessDataOptimized = getTherapyEffectivenessDataOptimized;
exports.getQualityImprovementDataOptimized = getQualityImprovementDataOptimized;
exports.getRegulatoryComplianceDataOptimized = getRegulatoryComplianceDataOptimized;
exports.getCostEffectivenessDataOptimized = getCostEffectivenessDataOptimized;
exports.getTrendForecastingDataOptimized = getTrendForecastingDataOptimized;
exports.getOperationalEfficiencyDataOptimized = getOperationalEfficiencyDataOptimized;
exports.getMedicationInventoryDataOptimized = getMedicationInventoryDataOptimized;
exports.getPatientDemographicsDataOptimized = getPatientDemographicsDataOptimized;
exports.getAdverseEventsDataOptimized = getAdverseEventsDataOptimized;
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const ReportAggregationService_1 = __importDefault(require("../services/ReportAggregationService"));
const aggregationService = ReportAggregationService_1.default.getInstance();
async function getTherapyEffectivenessDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, { ...filters, status: 'completed' }),
        aggregationService.buildOptimizedGroupStage('reviewType', ['count', 'avgAdherenceScore']),
        {
            $addFields: {
                adherenceImproved: { $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] } },
            },
        },
    ];
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return { adherenceMetrics: result.data };
}
async function getQualityImprovementDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, { ...filters, status: 'completed' }),
        {
            $group: {
                _id: '$priority',
                avgCompletionTime: {
                    $avg: { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60 * 24] }
                },
                count: { $sum: 1 },
            },
        },
    ];
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return { completionTimeAnalysis: result.data };
}
async function getRegulatoryComplianceDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, filters),
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                compliantReviews: { $sum: { $cond: ['$isCompliant', 1, 0] } },
                avgComplianceScore: { $avg: '$complianceScore' },
            },
        },
    ];
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return { complianceMetrics: result.data[0] || {} };
}
async function getCostEffectivenessDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, filters),
        {
            $group: {
                _id: '$type',
                totalCostSavings: { $sum: '$costSavings' },
                totalImplementationCost: { $sum: '$implementationCost' },
                count: { $sum: 1 },
                avgROI: {
                    $avg: {
                        $cond: [
                            { $gt: ['$implementationCost', 0] },
                            { $divide: ['$costSavings', '$implementationCost'] },
                            0,
                        ],
                    },
                },
            },
        },
    ];
    const result = await aggregationService.executeAggregation(MTRIntervention_1.default, pipeline, { allowDiskUse: true });
    return { costSavings: result.data };
}
async function getTrendForecastingDataOptimized(workplaceId, filters) {
    const pipeline = aggregationService.buildTimeSeriesAggregation(workplaceId, filters, 'month');
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return { trends: result.data };
}
async function getOperationalEfficiencyDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, filters),
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: {
                    $avg: {
                        $cond: [
                            { $ne: ['$completedAt', null] },
                            { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000 * 60 * 60] },
                            null,
                        ],
                    },
                },
                avgQueueTime: {
                    $avg: {
                        $cond: [
                            { $ne: ['$startedAt', null] },
                            { $divide: [{ $subtract: ['$startedAt', '$createdAt'] }, 1000 * 60 * 60] },
                            null,
                        ],
                    },
                },
            },
        },
    ];
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return { workflowMetrics: result.data };
}
async function getMedicationInventoryDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, filters),
        {
            $group: {
                _id: '$medication.name',
                totalUsage: { $sum: '$medication.quantity' },
                avgDailyUsage: { $avg: '$medication.dailyDose' },
                uniquePatients: { $addToSet: '$patientId' },
            },
        },
        {
            $addFields: {
                patientCount: { $size: '$uniquePatients' },
            },
        },
        { $sort: { totalUsage: -1 } },
        { $limit: 50 },
    ];
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return {
        usagePatterns: result.data,
        inventoryTurnover: [],
        expirationTracking: [],
    };
}
async function getPatientDemographicsDataOptimized(workplaceId, filters) {
    const facets = {
        ageDistribution: [
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lt: ['$patient.age', 18] }, then: '0-17' },
                                { case: { $lt: ['$patient.age', 30] }, then: '18-29' },
                                { case: { $lt: ['$patient.age', 50] }, then: '30-49' },
                                { case: { $lt: ['$patient.age', 65] }, then: '50-64' },
                            ],
                            default: '65+',
                        },
                    },
                    count: { $sum: 1 },
                    uniquePatients: { $addToSet: '$patientId' },
                },
            },
            {
                $addFields: {
                    patientCount: { $size: '$uniquePatients' },
                },
            },
        ],
        conditionSegmentation: [
            { $unwind: '$conditions' },
            {
                $group: {
                    _id: '$conditions.name',
                    count: { $sum: 1 },
                    avgSeverity: { $avg: '$conditions.severity' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ],
    };
    const pipeline = aggregationService.buildFacetedAggregation(workplaceId, filters, facets);
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return result.data[0] || {};
}
async function getAdverseEventsDataOptimized(workplaceId, filters) {
    const pipeline = [
        aggregationService.buildOptimizedMatchStage(workplaceId, { ...filters, category: 'adverse_event' }),
        {
            $group: {
                _id: '$severity',
                count: { $sum: 1 },
                resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', 'resolved'] },
                            { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                            null,
                        ],
                    },
                },
            },
        },
        { $sort: { count: -1 } },
    ];
    const result = await aggregationService.executeAggregation(DrugTherapyProblem_1.default, pipeline, { allowDiskUse: true });
    return { adverseEvents: result.data };
}
//# sourceMappingURL=optimizedReportHelpers.js.map