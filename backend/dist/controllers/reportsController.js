"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceStats = exports.getExportJobStatus = exports.queueReportExport = exports.getReportSummary = exports.getAvailableReports = exports.getUnifiedReportData = void 0;
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
const getUnifiedReportData = async (req, res) => {
    try {
        const { reportType } = req.params;
        const userWorkplaceId = req.user?.workplaceId;
        const userRole = req.user?.role;
        const filters = parseReportFilters(req.query);
        const workplaceId = userRole === 'super_admin' ? null : userWorkplaceId?.toString() || '';
        console.log(`🔍 Report request - User: ${req.user?.email}, Role: ${userRole}, WorkplaceId: ${workplaceId || 'ALL'}`);
        const cachedReportService = new RedisCacheService_1.CachedReportService();
        const reportData = await cachedReportService.getCachedReportData(reportType || '', workplaceId || 'all-workplaces', filters, async () => {
            switch (reportType) {
                case 'patient-outcomes':
                    return await getPatientOutcomesDataOptimized(workplaceId, filters);
                case 'pharmacist-interventions':
                    return await getPharmacistInterventionsDataOptimized(workplaceId, filters);
                case 'therapy-effectiveness':
                    return await getTherapyEffectivenessDataOptimized(workplaceId, filters);
                case 'quality-improvement':
                    return await getQualityImprovementDataOptimized(workplaceId, filters);
                case 'regulatory-compliance':
                    return await getRegulatoryComplianceDataOptimized(workplaceId, filters);
                case 'cost-effectiveness':
                    return await getCostEffectivenessDataOptimized(workplaceId, filters);
                case 'trend-forecasting':
                    return await getTrendForecastingDataOptimized(workplaceId, filters);
                case 'operational-efficiency':
                    return await getOperationalEfficiencyDataOptimized(workplaceId, filters);
                case 'medication-inventory':
                    return await getMedicationInventoryDataOptimized(workplaceId, filters);
                case 'patient-demographics':
                    return await getPatientDemographicsDataOptimized(workplaceId, filters);
                case 'adverse-events':
                    return await getAdverseEventsDataOptimized(workplaceId, filters);
                default:
                    throw new Error('Invalid report type specified');
            }
        }, 300);
        (0, responseHelpers_1.sendSuccess)(res, {
            reportType,
            data: reportData,
            filters,
            generatedAt: new Date(),
            currency: { code: 'NGN', symbol: '₦' },
            cached: true,
        }, `${reportType} report generated successfully`);
    }
    catch (error) {
        logger_1.default.error(`Error generating ${req.params.reportType} report:`, error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate report', 500);
    }
};
exports.getUnifiedReportData = getUnifiedReportData;
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
    const [therapyEffectiveness, clinicalImprovements, adverseEventReduction] = await Promise.all([
        MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$reviewType',
                    totalReviews: { $sum: 1 },
                    completedReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
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
                    totalProblemsResolved: {
                        $sum: '$clinicalOutcomes.problemsResolved',
                    },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
                },
            },
        ]),
        MedicationTherapyReview_1.default.aggregate([
            { $match: { ...matchStage, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    bloodPressureImproved: {
                        $sum: {
                            $cond: ['$clinicalOutcomes.bloodPressureImproved', 1, 0],
                        },
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
        ]),
        MedicationTherapyReview_1.default.aggregate([
            { $match: { ...matchStage, status: 'completed' } },
            {
                $group: {
                    _id: '$reviewType',
                    totalReviews: { $sum: 1 },
                    adverseEventsReduced: {
                        $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
                    },
                },
            },
        ]),
    ]);
    return {
        therapyEffectiveness,
        clinicalImprovements: clinicalImprovements[0] || {},
        adverseEventReduction,
    };
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
    const [interventionMetrics, pharmacistPerformance] = await Promise.all([
        MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                    },
                    avgAcceptanceRate: { $avg: '$acceptanceRate' },
                },
            },
        ]),
        MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'pharmacistId',
                    foreignField: '_id',
                    as: 'pharmacist',
                },
            },
            { $unwind: '$pharmacist' },
            {
                $group: {
                    _id: '$pharmacistId',
                    pharmacistName: {
                        $first: '$pharmacist.name',
                    },
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                    },
                },
            },
        ]),
    ]);
}
async function getTherapyEffectivenessData(workplaceId, filters) {
    const matchStage = buildMatchStage(workplaceId, filters);
    const adherenceMetrics = await MedicationTherapyReview_1.default.aggregate([
        { $match: { ...matchStage, status: 'completed' } },
        {
            $group: {
                _id: '$reviewType',
                totalReviews: { $sum: 1 },
                adherenceImproved: {
                    $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] },
                },
                avgAdherenceScore: { $avg: '$clinicalOutcomes.adherenceScore' },
            },
        },
    ]);
    return { adherenceMetrics };
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
        isDeleted: false,
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
    return matchStage;
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