"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceStats = exports.getExportJobStatus = exports.queueReportExport = exports.getReportSummary = exports.getAvailableReports = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const responseHelpers_1 = require("../utils/responseHelpers");
const logger_1 = __importDefault(require("../utils/logger"));
const ReportAggregationService_1 = __importDefault(require("../services/ReportAggregationService"));
const RedisCacheService_1 = require("../services/RedisCacheService");
const BackgroundJobService_1 = __importDefault(require("../services/BackgroundJobService"));
const ConnectionPoolService_1 = __importDefault(require("../services/ConnectionPoolService"));
const getAvailableReports = async (req, res) => {
    try {
        const reportTypes = [
            {
                id: 'patient-outcomes',
                name: 'Patient Outcome Analytics',
                description: 'Analyze therapy effectiveness and clinical parameter improvements',
                category: 'Clinical',
                icon: 'TrendingUp',
                permissions: ['view_patient_outcomes'],
            },
            {
                id: 'pharmacist-interventions',
                name: 'Pharmacist Intervention Tracking',
                description: 'Track intervention metrics and pharmacist performance',
                category: 'Performance',
                icon: 'Users',
                permissions: ['view_pharmacist_performance'],
            },
            {
                id: 'therapy-effectiveness',
                name: 'Therapy Effectiveness Metrics',
                description: 'Monitor medication adherence and therapy completion rates',
                category: 'Clinical',
                icon: 'Activity',
                permissions: ['view_therapy_metrics'],
            },
            {
                id: 'quality-improvement',
                name: 'Quality Improvement Dashboard',
                description: 'Analyze completion times and documentation quality',
                category: 'Quality',
                icon: 'CheckCircle',
                permissions: ['view_quality_metrics'],
            },
            {
                id: 'regulatory-compliance',
                name: 'Regulatory Compliance Reports',
                description: 'Generate compliance metrics and audit trails',
                category: 'Compliance',
                icon: 'Shield',
                permissions: ['view_compliance_reports'],
            },
            {
                id: 'cost-effectiveness',
                name: 'Cost-Effectiveness Analysis',
                description: 'Analyze cost savings and ROI from interventions',
                category: 'Financial',
                icon: 'DollarSign',
                permissions: ['view_financial_reports'],
            },
            {
                id: 'trend-forecasting',
                name: 'Trend Identification & Forecasting',
                description: 'Identify trends and generate predictive insights',
                category: 'Analytics',
                icon: 'TrendingUp',
                permissions: ['view_trend_analysis'],
            },
            {
                id: 'operational-efficiency',
                name: 'Operational Efficiency',
                description: 'Monitor workflow metrics and resource utilization',
                category: 'Operations',
                icon: 'Zap',
                permissions: ['view_operational_metrics'],
            },
            {
                id: 'medication-inventory',
                name: 'Medication Usage & Inventory',
                description: 'Analyze usage patterns and inventory optimization',
                category: 'Inventory',
                icon: 'Package',
                permissions: ['view_inventory_reports'],
            },
            {
                id: 'patient-demographics',
                name: 'Patient Demographics & Segmentation',
                description: 'Analyze patient population and service utilization',
                category: 'Demographics',
                icon: 'Users',
                permissions: ['view_patient_demographics'],
            },
            {
                id: 'adverse-events',
                name: 'Adverse Event & Incident Reporting',
                description: 'Monitor safety patterns and incident frequencies',
                category: 'Safety',
                icon: 'AlertTriangle',
                permissions: ['view_safety_reports'],
            },
        ];
        (0, responseHelpers_1.sendSuccess)(res, { reportTypes }, 'Available report types retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting available reports:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve available reports', 500);
    }
};
exports.getAvailableReports = getAvailableReports;
const getReportSummary = async (req, res) => {
    try {
        const userWorkplaceId = req.user?.workplaceId;
        const userRole = req.user?.role;
        const { period = '30d' } = req.query;
        const startDate = (0, moment_1.default)()
            .subtract(parseInt(period.toString(), 10) || 30, 'days')
            .toDate();
        const matchStage = {
            isDeleted: false,
            createdAt: { $gte: startDate },
        };
        if (userRole !== 'super_admin' && userWorkplaceId) {
            matchStage.workplaceId = new mongoose_1.default.Types.ObjectId(userWorkplaceId);
        }
        console.log(`🔍 Summary request - User: ${req.user?.email}, Role: ${userRole}, Match stage:`, matchStage);
        const [mtrStats, interventionStats, problemStats] = await Promise.all([
            MedicationTherapyReview_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        completedReviews: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                        },
                        totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
                        avgCompletionTime: {
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
                        },
                    },
                },
            ]),
            MTRIntervention_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalInterventions: { $sum: 1 },
                        acceptedInterventions: {
                            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                        },
                    },
                },
            ]),
            DrugTherapyProblem_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalProblems: { $sum: 1 },
                        resolvedProblems: {
                            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                        },
                    },
                },
            ]),
        ]);
        const mtr = mtrStats[0] || {};
        const intervention = interventionStats[0] || {};
        const problem = problemStats[0] || {};
        const summary = {
            totalReviews: mtr.totalReviews || 0,
            completedReviews: mtr.completedReviews || 0,
            completionRate: mtr.totalReviews > 0
                ? (mtr.completedReviews / mtr.totalReviews) * 100
                : 0,
            totalInterventions: intervention.totalInterventions || 0,
            interventionAcceptanceRate: intervention.totalInterventions > 0
                ? (intervention.acceptedInterventions /
                    intervention.totalInterventions) *
                    100
                : 0,
            totalProblems: problem.totalProblems || 0,
            problemResolutionRate: problem.totalProblems > 0
                ? (problem.resolvedProblems / problem.totalProblems) * 100
                : 0,
            totalCostSavings: mtr.totalCostSavings || 0,
            avgCompletionTime: mtr.avgCompletionTime || 0,
            formattedCostSavings: new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
            }).format(mtr.totalCostSavings || 0),
        };
        (0, responseHelpers_1.sendSuccess)(res, { summary, period }, 'Report summary generated successfully');
    }
    catch (error) {
        logger_1.default.error('Error generating report summary:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate report summary', 500);
    }
};
exports.getReportSummary = getReportSummary;
const queueReportExport = async (req, res) => {
    try {
        const { reportType, format, fileName } = req.body;
        const workplaceId = req.user?.workplaceId;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const filters = parseReportFilters(req.body.filters || {});
        const job = await BackgroundJobService_1.default
            .getInstance()
            .queueExportJob({
            reportType,
            workplaceId,
            userId,
            userEmail,
            filters,
            format,
            fileName: fileName ||
                `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`,
            options: req.body.options || {},
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            jobId: job.id,
            status: 'queued',
            estimatedTime: '2-5 minutes',
        }, 'Export job queued successfully');
    }
    catch (error) {
        logger_1.default.error('Error queuing export job:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to queue export job', 500);
    }
};
exports.queueReportExport = queueReportExport;
const getExportJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await BackgroundJobService_1.default.getInstance().getJobStatus(jobId, 'export');
        (0, responseHelpers_1.sendSuccess)(res, status, 'Job status retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting job status:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get job status', 500);
    }
};
exports.getExportJobStatus = getExportJobStatus;
const getPerformanceStats = async (req, res) => {
    try {
        const aggregationStats = ReportAggregationService_1.default.getInstance().getPerformanceStats();
        const cacheStats = RedisCacheService_1.RedisCacheService.getInstance().getStats();
        const connectionStats = ConnectionPoolService_1.default.getInstance().getStats();
        const queueStats = await BackgroundJobService_1.default.getInstance().getQueueStats();
        (0, responseHelpers_1.sendSuccess)(res, {
            aggregation: aggregationStats,
            cache: cacheStats,
            connections: connectionStats,
            queues: queueStats,
        }, 'Performance statistics retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting performance stats:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get performance stats', 500);
    }
};
exports.getPerformanceStats = getPerformanceStats;
async function getPatientOutcomesDataOptimized(workplaceId, filters) {
    const aggregationService = ReportAggregationService_1.default.getInstance();
    const facets = {
        therapyEffectiveness: [
            aggregationService.buildOptimizedGroupStage('reviewType', [
                'count',
                'completionRate',
                'totalCostSavings',
            ]),
        ],
        clinicalImprovements: [
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    bloodPressureImproved: {
                        $sum: { $cond: ['$clinicalOutcomes.bloodPressureImproved', 1, 0] },
                    },
                    bloodSugarImproved: {
                        $sum: { $cond: ['$clinicalOutcomes.bloodSugarImproved', 1, 0] },
                    },
                    cholesterolImproved: {
                        $sum: { $cond: ['$clinicalOutcomes.cholesterolImproved', 1, 0] },
                    },
                    painReduced: {
                        $sum: { $cond: ['$clinicalOutcomes.painReduced', 1, 0] },
                    },
                    totalReviews: { $sum: 1 },
                },
            },
        ],
        adverseEventReduction: [
            { $match: { status: 'completed' } },
            aggregationService.buildOptimizedGroupStage('reviewType', ['count']),
            {
                $addFields: {
                    adverseEventsReduced: {
                        $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
                    },
                },
            },
        ],
    };
    const pipeline = aggregationService.buildFacetedAggregation(workplaceId, filters, facets);
    const result = await aggregationService.executeAggregation(MedicationTherapyReview_1.default, pipeline, { allowDiskUse: true });
    return result.data[0] || {};
}
async function getPatientOutcomesData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    console.log('🔍 Generating patient outcomes report...');
    console.log('📊 Query will be limited to recent data for performance');
    try {
        console.log('🚀 Using ultra-fast query with 30-day limit and 50 record max');
        const simpleMatch = { isDeleted: { $ne: true } };
        if (workplaceId) {
            simpleMatch.workplaceId = new mongoose_1.default.Types.ObjectId(workplaceId);
        }
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30);
        simpleMatch.createdAt = { $gte: recentDate };
        const therapyEffectiveness = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
                { $match: simpleMatch },
                { $limit: 50 },
                {
                    $group: {
                        _id: '$reviewType',
                        totalReviews: { $sum: 1 },
                        completedReviews: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                        },
                    },
                },
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000))
        ]);
        console.log('✅ Patient outcomes report generated successfully');
        const therapyEffectivenessArray = Array.isArray(therapyEffectiveness) ? therapyEffectiveness : [];
        console.log('📈 Found', therapyEffectivenessArray.length, 'therapy effectiveness records');
        return {
            therapyEffectiveness: therapyEffectivenessArray,
            clinicalImprovements: {},
            adverseEventReduction: [],
        };
    }
    catch (error) {
        console.error('❌ Error in getPatientOutcomesData:', error);
        throw error;
    }
}
async function getPharmacistInterventionsDataOptimized(workplaceId, filters) {
    const aggregationService = ReportAggregationService_1.default.getInstance();
    const facets = {
        interventionMetrics: [
            aggregationService.buildOptimizedGroupStage('type', [
                'count',
                'acceptanceRate',
            ]),
        ],
        pharmacistPerformance: [
            aggregationService.buildOptimizedLookup('users', 'pharmacistId', '_id', 'pharmacist'),
            { $unwind: '$pharmacist' },
            {
                $group: {
                    _id: '$pharmacistId',
                    pharmacistName: { $first: '$pharmacist.name' },
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                    },
                },
            },
        ],
    };
    const pipeline = aggregationService.buildFacetedAggregation(workplaceId, filters, facets);
    const result = await aggregationService.executeAggregation(MTRIntervention_1.default, pipeline, { allowDiskUse: true });
    return result.data[0] || {};
}
async function getPharmacistInterventionsData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    console.log('🔍 Generating pharmacist interventions report...');
    try {
        const interventionMetrics = await Promise.race([
            MTRIntervention_1.default.aggregate([
                { $match: matchStage },
                { $limit: 5000 },
                {
                    $group: {
                        _id: { $ifNull: ['$type', 'Unknown'] },
                        totalInterventions: { $sum: 1 },
                        acceptedInterventions: {
                            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { totalInterventions: -1 } }
            ]).allowDiskUse(true).hint({ createdAt: 1, workplaceId: 1 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000))
        ]);
        console.log('✅ Pharmacist interventions report generated successfully');
        const interventionMetricsArray = Array.isArray(interventionMetrics) ? interventionMetrics : [];
        console.log('📈 Found', interventionMetricsArray.length, 'intervention metric records');
        return {
            interventionMetrics: interventionMetricsArray,
            pharmacistPerformance: [],
        };
    }
    catch (error) {
        console.error('❌ Error in getPharmacistInterventionsData:', error);
        throw error;
    }
}
async function getTherapyEffectivenessData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    console.log('🔍 Generating therapy effectiveness report...');
    try {
        const adherenceMetrics = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
                { $match: { ...matchStage, status: 'completed' } },
                { $limit: 5000 },
                {
                    $group: {
                        _id: { $ifNull: ['$reviewType', 'Unknown'] },
                        totalReviews: { $sum: 1 },
                        adherenceImproved: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$clinicalOutcomes.adherenceImproved', true] },
                                    1,
                                    0
                                ]
                            },
                        },
                        avgAdherenceScore: {
                            $avg: {
                                $cond: [
                                    { $and: [
                                            { $ne: ['$clinicalOutcomes.adherenceScore', null] },
                                            { $ne: ['$clinicalOutcomes.adherenceScore', undefined] }
                                        ] },
                                    '$clinicalOutcomes.adherenceScore',
                                    null
                                ]
                            }
                        },
                    },
                },
                { $sort: { totalReviews: -1 } }
            ]).allowDiskUse(true).hint({ createdAt: 1, workplaceId: 1, status: 1 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000))
        ]);
        console.log('✅ Therapy effectiveness report generated successfully');
        const adherenceMetricsArray = Array.isArray(adherenceMetrics) ? adherenceMetrics : [];
        console.log('📈 Found', adherenceMetricsArray.length, 'adherence metric records');
        return { adherenceMetrics: adherenceMetricsArray };
    }
    catch (error) {
        console.error('❌ Error in getTherapyEffectivenessData:', error);
        throw error;
    }
}
async function getQualityImprovementData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const completionTimeAnalysis = await MedicationTherapyReview_1.default.aggregate([
        { $match: { ...matchStage, status: 'completed' } },
        {
            $group: {
                _id: '$priority',
                avgCompletionTime: {
                    $avg: {
                        $divide: [
                            { $subtract: ['$completedAt', '$startedAt'] },
                            1000 * 60 * 60 * 24,
                        ],
                    },
                },
                count: { $sum: 1 },
            },
        },
    ]);
    return { completionTimeAnalysis };
}
async function getRegulatoryComplianceData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const complianceMetrics = await MedicationTherapyReview_1.default.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                compliantReviews: { $sum: { $cond: ['$isCompliant', 1, 0] } },
                avgComplianceScore: { $avg: '$complianceScore' },
            },
        },
    ]);
    return { complianceMetrics: complianceMetrics[0] || {} };
}
async function getCostEffectivenessData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const costSavings = await MTRIntervention_1.default.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$type',
                totalCostSavings: { $sum: '$costSavings' },
                totalImplementationCost: { $sum: '$implementationCost' },
                count: { $sum: 1 },
            },
        },
    ]);
    return { costSavings };
}
async function getTrendForecastingData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const trends = await MedicationTherapyReview_1.default.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                totalReviews: { $sum: 1 },
                completedReviews: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return { trends };
}
async function getOperationalEfficiencyData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const workflowMetrics = await MedicationTherapyReview_1.default.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: {
                    $avg: {
                        $cond: [
                            { $ne: ['$completedAt', null] },
                            {
                                $divide: [
                                    { $subtract: ['$completedAt', '$createdAt'] },
                                    1000 * 60 * 60,
                                ],
                            },
                            null,
                        ],
                    },
                },
            },
        },
    ]);
    return { workflowMetrics };
}
async function getMedicationInventoryData(workplaceId, filters) {
    return {
        usagePatterns: [],
        inventoryTurnover: [],
        expirationTracking: [],
    };
}
async function getPatientDemographicsData(workplaceId, filters) {
    return {
        ageDistribution: [],
        geographicPatterns: [],
        conditionSegmentation: [],
    };
}
async function getAdverseEventsData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const adverseEvents = await DrugTherapyProblem_1.default.aggregate([
        { $match: { ...matchStage, category: 'adverse_event' } },
        {
            $group: {
                _id: '$severity',
                count: { $sum: 1 },
                resolvedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                },
            },
        },
    ]);
    return { adverseEvents };
}
function parseReportFilters(query) {
    const filters = {};
    if (query.startDate || query.endDate) {
        filters.dateRange = {
            startDate: query.startDate
                ? new Date(query.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: query.endDate ? new Date(query.endDate) : new Date(),
        };
    }
    if (query.patientId)
        filters.patientId = query.patientId;
    if (query.pharmacistId)
        filters.pharmacistId = query.pharmacistId;
    if (query.therapyType)
        filters.therapyType = query.therapyType;
    if (query.priority)
        filters.priority = query.priority;
    if (query.location)
        filters.location = query.location;
    if (query.status)
        filters.status = query.status;
    return filters;
}
function buildMatchStage(workplaceId, filters) {
    const matchStage = {
        isDeleted: { $ne: true },
    };
    if (workplaceId) {
        matchStage.workplaceId = new mongoose_1.default.Types.ObjectId(workplaceId);
    }
    if (filters.dateRange) {
        matchStage.createdAt = {
            $gte: filters.dateRange.startDate,
            $lte: filters.dateRange.endDate,
        };
    }
    else {
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 90);
        matchStage.createdAt = {
            $gte: defaultStartDate,
            $lte: defaultEndDate,
        };
        console.log('📅 No date range specified, using default 90-day range for performance');
    }
    if (filters.patientId) {
        matchStage.patientId = new mongoose_1.default.Types.ObjectId(filters.patientId);
    }
    if (filters.pharmacistId) {
        matchStage.pharmacistId = new mongoose_1.default.Types.ObjectId(filters.pharmacistId);
    }
    if (filters.therapyType) {
        matchStage.reviewType = filters.therapyType;
    }
    if (filters.priority) {
        matchStage.priority = filters.priority;
    }
    if (filters.status) {
        matchStage.status = filters.status;
    }
    console.log('🔍 Built match stage:', JSON.stringify(matchStage, null, 2));
    return matchStage;
}
function generateSampleReportData(reportType) {
    console.log(`📊 Generating sample data for ${reportType}`);
    const sampleData = {
        'patient-outcomes': {
            therapyEffectiveness: [
                {
                    _id: 'Medication Review',
                    totalReviews: 25,
                    completedReviews: 20,
                    avgCompletionTime: 2.5,
                    totalProblemsResolved: 15,
                    totalCostSavings: 50000
                },
                {
                    _id: 'Adherence Counseling',
                    totalReviews: 18,
                    completedReviews: 16,
                    avgCompletionTime: 1.8,
                    totalProblemsResolved: 12,
                    totalCostSavings: 35000
                }
            ],
            clinicalImprovements: {
                bloodPressureImproved: 12,
                bloodSugarImproved: 8,
                cholesterolImproved: 6,
                painReduced: 10,
                totalReviews: 20
            },
            adverseEventReduction: [
                {
                    _id: 'Medication Review',
                    totalReviews: 20,
                    adverseEventsReduced: 5
                }
            ]
        },
        'pharmacist-interventions': {
            interventionMetrics: [
                {
                    _id: 'Drug Interaction',
                    totalInterventions: 15,
                    acceptedInterventions: 12,
                    avgAcceptanceRate: 80
                },
                {
                    _id: 'Dosage Adjustment',
                    totalInterventions: 10,
                    acceptedInterventions: 9,
                    avgAcceptanceRate: 90
                }
            ],
            pharmacistPerformance: [
                {
                    _id: 'pharmacist1',
                    pharmacistName: 'Dr. Sample Pharmacist',
                    totalInterventions: 25,
                    acceptedInterventions: 21
                }
            ]
        },
        'therapy-effectiveness': {
            adherenceMetrics: [
                {
                    _id: 'Hypertension',
                    totalReviews: 15,
                    adherenceImproved: 12,
                    avgAdherenceScore: 85
                },
                {
                    _id: 'Diabetes',
                    totalReviews: 10,
                    adherenceImproved: 8,
                    avgAdherenceScore: 78
                }
            ]
        }
    };
    return sampleData[reportType] || {
        message: 'Sample data not available for this report type',
        reportType,
        sampleMetrics: [
            { _id: 'Sample Category', count: 5, value: 100 }
        ]
    };
}
async function getTherapyEffectivenessDataOptimized(workplaceId, filters) {
    return await getTherapyEffectivenessData(workplaceId, filters);
}
async function getQualityImprovementDataOptimized(workplaceId, filters) {
    return await getQualityImprovementData(workplaceId, filters);
}
async function getRegulatoryComplianceDataOptimized(workplaceId, filters) {
    return await getRegulatoryComplianceData(workplaceId, filters);
}
async function getCostEffectivenessDataOptimized(workplaceId, filters) {
    return await getCostEffectivenessData(workplaceId, filters);
}
async function getTrendForecastingDataOptimized(workplaceId, filters) {
    return await getTrendForecastingData(workplaceId, filters);
}
async function getOperationalEfficiencyDataOptimized(workplaceId, filters) {
    return await getOperationalEfficiencyData(workplaceId, filters);
}
async function getMedicationInventoryDataOptimized(workplaceId, filters) {
    return await getMedicationInventoryData(workplaceId, filters);
}
async function getPatientDemographicsDataOptimized(workplaceId, filters) {
    return await getPatientDemographicsData(workplaceId, filters);
}
async function getAdverseEventsDataOptimized(workplaceId, filters) {
    return await getAdverseEventsData(workplaceId, filters);
}
//# sourceMappingURL=reportsController.js.map