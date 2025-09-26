"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutcomeMetricsReport = exports.getQualityAssuranceReport = exports.getPharmacistPerformanceReport = exports.getInterventionEffectivenessReport = exports.getMTRSummaryReport = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const MTRFollowUp_1 = __importDefault(require("../models/MTRFollowUp"));
const responseHelpers_1 = require("../utils/responseHelpers");
const getMTRSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate, pharmacistId, reviewType, priority } = req.query;
        const workplaceId = req.user?.workplaceId;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate)
                dateFilter.createdAt.$lte = new Date(endDate);
        }
        const additionalFilters = {};
        if (pharmacistId)
            additionalFilters.pharmacistId = new mongoose_1.default.Types.ObjectId(pharmacistId);
        if (reviewType)
            additionalFilters.reviewType = reviewType;
        if (priority)
            additionalFilters.priority = priority;
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...additionalFilters
        };
        const mtrStats = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    completedReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    inProgressReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
                    },
                    cancelledReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    onHoldReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] }
                    },
                    avgCompletionTime: {
                        $avg: {
                            $cond: [
                                { $ne: ['$completedAt', null] },
                                {
                                    $divide: [
                                        { $subtract: ['$completedAt', '$startedAt'] },
                                        1000 * 60 * 60 * 24
                                    ]
                                },
                                null
                            ]
                        }
                    },
                    totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
                    totalMedicationsOptimized: { $sum: '$clinicalOutcomes.medicationsOptimized' },
                    adherenceImprovedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] }
                    },
                    adverseEventsReducedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] }
                    },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' }
                }
            }
        ]);
        const reviewTypeDistribution = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$reviewType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        const priorityDistribution = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        const monthlyTrends = await MedicationTherapyReview_1.default.aggregate([
            {
                $match: {
                    ...matchStage,
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalReviews: { $sum: 1 },
                    completedReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    avgCompletionTime: {
                        $avg: {
                            $cond: [
                                { $ne: ['$completedAt', null] },
                                {
                                    $divide: [
                                        { $subtract: ['$completedAt', '$startedAt'] },
                                        1000 * 60 * 60 * 24
                                    ]
                                },
                                null
                            ]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        const summary = mtrStats[0] || {
            totalReviews: 0,
            completedReviews: 0,
            inProgressReviews: 0,
            cancelledReviews: 0,
            onHoldReviews: 0,
            avgCompletionTime: 0,
            totalProblemsResolved: 0,
            totalMedicationsOptimized: 0,
            adherenceImprovedCount: 0,
            adverseEventsReducedCount: 0,
            totalCostSavings: 0
        };
        const completionRate = summary.totalReviews > 0
            ? (summary.completedReviews / summary.totalReviews) * 100
            : 0;
        (0, responseHelpers_1.sendSuccess)(res, {
            summary: {
                ...summary,
                completionRate: Math.round(completionRate * 100) / 100,
                avgCompletionTime: Math.round((summary.avgCompletionTime || 0) * 100) / 100
            },
            distributions: {
                reviewType: reviewTypeDistribution,
                priority: priorityDistribution
            },
            trends: {
                monthly: monthlyTrends
            }
        }, 'MTR summary report generated successfully');
    }
    catch (error) {
        console.error('Error generating MTR summary report:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate MTR summary report', 500);
    }
};
exports.getMTRSummaryReport = getMTRSummaryReport;
const getInterventionEffectivenessReport = async (req, res) => {
    try {
        const { startDate, endDate, pharmacistId, interventionType } = req.query;
        const workplaceId = req.user?.workplaceId;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate)
                dateFilter.createdAt.$lte = new Date(endDate);
        }
        const additionalFilters = {};
        if (pharmacistId)
            additionalFilters.pharmacistId = new mongoose_1.default.Types.ObjectId(pharmacistId);
        if (interventionType)
            additionalFilters.type = interventionType;
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...additionalFilters
        };
        const interventionStats = await MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                    },
                    rejectedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'rejected'] }, 1, 0] }
                    },
                    modifiedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'modified'] }, 1, 0] }
                    },
                    pendingInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] }
                    },
                    avgAcceptanceRate: { $avg: '$acceptanceRate' }
                }
            }
        ]);
        const typeEffectiveness = await MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                    },
                    avgAcceptanceRate: { $avg: '$acceptanceRate' }
                }
            },
            {
                $addFields: {
                    acceptanceRate: {
                        $multiply: [
                            { $divide: ['$acceptedInterventions', '$totalInterventions'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { acceptanceRate: -1 } }
        ]);
        const categoryEffectiveness = await MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    acceptanceRate: {
                        $multiply: [
                            { $divide: ['$acceptedInterventions', '$totalInterventions'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { acceptanceRate: -1 } }
        ]);
        const pharmacistPerformance = await MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'pharmacistId',
                    foreignField: '_id',
                    as: 'pharmacist'
                }
            },
            { $unwind: '$pharmacist' },
            {
                $group: {
                    _id: '$pharmacistId',
                    pharmacistName: { $first: '$pharmacist.name' },
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                    },
                    avgAcceptanceRate: { $avg: '$acceptanceRate' }
                }
            },
            {
                $addFields: {
                    acceptanceRate: {
                        $multiply: [
                            { $divide: ['$acceptedInterventions', '$totalInterventions'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { acceptanceRate: -1 } }
        ]);
        const summary = interventionStats[0] || {
            totalInterventions: 0,
            acceptedInterventions: 0,
            rejectedInterventions: 0,
            modifiedInterventions: 0,
            pendingInterventions: 0,
            avgAcceptanceRate: 0
        };
        const overallAcceptanceRate = summary.totalInterventions > 0
            ? (summary.acceptedInterventions / summary.totalInterventions) * 100
            : 0;
        (0, responseHelpers_1.sendSuccess)(res, {
            summary: {
                ...summary,
                overallAcceptanceRate: Math.round(overallAcceptanceRate * 100) / 100
            },
            effectiveness: {
                byType: typeEffectiveness,
                byCategory: categoryEffectiveness
            },
            pharmacistPerformance
        }, 'Intervention effectiveness report generated successfully');
    }
    catch (error) {
        console.error('Error generating intervention effectiveness report:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate intervention effectiveness report', 500);
    }
};
exports.getInterventionEffectivenessReport = getInterventionEffectivenessReport;
const getPharmacistPerformanceReport = async (req, res) => {
    try {
        const { startDate, endDate, pharmacistId } = req.query;
        const workplaceId = req.user?.workplaceId;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate)
                dateFilter.createdAt.$lte = new Date(endDate);
        }
        const pharmacistFilter = {};
        if (pharmacistId) {
            pharmacistFilter.pharmacistId = new mongoose_1.default.Types.ObjectId(pharmacistId);
        }
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...pharmacistFilter
        };
        const pharmacistMTRStats = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'pharmacistId',
                    foreignField: '_id',
                    as: 'pharmacist'
                }
            },
            { $unwind: '$pharmacist' },
            {
                $group: {
                    _id: '$pharmacistId',
                    pharmacistName: { $first: '$pharmacist.name' },
                    totalReviews: { $sum: 1 },
                    completedReviews: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    avgCompletionTime: {
                        $avg: {
                            $cond: [
                                { $ne: ['$completedAt', null] },
                                {
                                    $divide: [
                                        { $subtract: ['$completedAt', '$startedAt'] },
                                        1000 * 60 * 60 * 24
                                    ]
                                },
                                null
                            ]
                        }
                    },
                    totalProblemsIdentified: { $sum: { $size: '$problems' } },
                    totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
                    totalMedicationsOptimized: { $sum: '$clinicalOutcomes.medicationsOptimized' },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' }
                }
            },
            {
                $addFields: {
                    completionRate: {
                        $multiply: [
                            { $divide: ['$completedReviews', '$totalReviews'] },
                            100
                        ]
                    },
                    problemResolutionRate: {
                        $multiply: [
                            {
                                $divide: [
                                    '$totalProblemsResolved',
                                    { $cond: [{ $eq: ['$totalProblemsIdentified', 0] }, 1, '$totalProblemsIdentified'] }
                                ]
                            },
                            100
                        ]
                    }
                }
            },
            { $sort: { completionRate: -1 } }
        ]);
        const pharmacistInterventionStats = await MTRIntervention_1.default.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'pharmacistId',
                    foreignField: '_id',
                    as: 'pharmacist'
                }
            },
            { $unwind: '$pharmacist' },
            {
                $group: {
                    _id: '$pharmacistId',
                    pharmacistName: { $first: '$pharmacist.name' },
                    totalInterventions: { $sum: 1 },
                    acceptedInterventions: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                    },
                    avgAcceptanceRate: { $avg: '$acceptanceRate' }
                }
            },
            {
                $addFields: {
                    interventionAcceptanceRate: {
                        $multiply: [
                            { $divide: ['$acceptedInterventions', '$totalInterventions'] },
                            100
                        ]
                    }
                }
            }
        ]);
        const combinedStats = pharmacistMTRStats.map(mtrStat => {
            const interventionStat = pharmacistInterventionStats.find(intStat => intStat._id.toString() === mtrStat._id.toString());
            return {
                ...mtrStat,
                totalInterventions: interventionStat?.totalInterventions || 0,
                acceptedInterventions: interventionStat?.acceptedInterventions || 0,
                interventionAcceptanceRate: interventionStat?.interventionAcceptanceRate || 0
            };
        });
        const qualityScores = combinedStats.map(stat => {
            const completionWeight = 0.3;
            const problemResolutionWeight = 0.3;
            const interventionAcceptanceWeight = 0.2;
            const efficiencyWeight = 0.2;
            const efficiencyScore = Math.max(0, 100 - ((stat.avgCompletionTime || 14) / 14) * 100);
            const qualityScore = (stat.completionRate * completionWeight) +
                (stat.problemResolutionRate * problemResolutionWeight) +
                (stat.interventionAcceptanceRate * interventionAcceptanceWeight) +
                (efficiencyScore * efficiencyWeight);
            return {
                ...stat,
                efficiencyScore: Math.round(efficiencyScore * 100) / 100,
                qualityScore: Math.round(qualityScore * 100) / 100
            };
        }).sort((a, b) => b.qualityScore - a.qualityScore);
        (0, responseHelpers_1.sendSuccess)(res, {
            pharmacistPerformance: qualityScores,
            summary: {
                totalPharmacists: qualityScores.length,
                avgQualityScore: qualityScores.length > 0
                    ? qualityScores.reduce((sum, p) => sum + p.qualityScore, 0) / qualityScores.length
                    : 0,
                topPerformer: qualityScores[0] || null
            }
        }, 'Pharmacist performance report generated successfully');
    }
    catch (error) {
        console.error('Error generating pharmacist performance report:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate pharmacist performance report', 500);
    }
};
exports.getPharmacistPerformanceReport = getPharmacistPerformanceReport;
const getQualityAssuranceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const workplaceId = req.user?.workplaceId;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate)
                dateFilter.createdAt.$lte = new Date(endDate);
        }
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter
        };
        const completionTimeAnalysis = await MedicationTherapyReview_1.default.aggregate([
            {
                $match: {
                    ...matchStage,
                    status: 'completed',
                    completedAt: { $ne: null }
                }
            },
            {
                $addFields: {
                    completionDays: {
                        $divide: [
                            { $subtract: ['$completedAt', '$startedAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$priority',
                    avgCompletionTime: { $avg: '$completionDays' },
                    minCompletionTime: { $min: '$completionDays' },
                    maxCompletionTime: { $max: '$completionDays' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const problemPatterns = await DrugTherapyProblem_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        category: '$category',
                        severity: '$severity'
                    },
                    count: { $sum: 1 },
                    resolvedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $multiply: [
                            { $divide: ['$resolvedCount', '$count'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        const followUpCompliance = await MTRFollowUp_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalFollowUps: { $sum: 1 },
                    completedFollowUps: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    missedFollowUps: {
                        $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
                    },
                    rescheduledFollowUps: {
                        $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    complianceRate: {
                        $multiply: [
                            { $divide: ['$completedFollowUps', '$totalFollowUps'] },
                            100
                        ]
                    }
                }
            }
        ]);
        const documentationQuality = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $addFields: {
                    hasCompletePlan: {
                        $and: [
                            { $ne: ['$plan', null] },
                            { $gt: [{ $size: { $ifNull: ['$plan.recommendations', []] } }, 0] },
                            { $ne: ['$plan.pharmacistNotes', ''] }
                        ]
                    },
                    hasMedications: { $gt: [{ $size: { $ifNull: ['$medications', []] } }, 0] },
                    hasProblems: { $gt: [{ $size: { $ifNull: ['$problems', []] } }, 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    reviewsWithCompletePlans: {
                        $sum: { $cond: ['$hasCompletePlan', 1, 0] }
                    },
                    reviewsWithMedications: {
                        $sum: { $cond: ['$hasMedications', 1, 0] }
                    },
                    reviewsWithProblems: {
                        $sum: { $cond: ['$hasProblems', 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    planCompletionRate: {
                        $multiply: [
                            { $divide: ['$reviewsWithCompletePlans', '$totalReviews'] },
                            100
                        ]
                    },
                    medicationDocumentationRate: {
                        $multiply: [
                            { $divide: ['$reviewsWithMedications', '$totalReviews'] },
                            100
                        ]
                    },
                    problemIdentificationRate: {
                        $multiply: [
                            { $divide: ['$reviewsWithProblems', '$totalReviews'] },
                            100
                        ]
                    }
                }
            }
        ]);
        const compliance = followUpCompliance[0] || {
            totalFollowUps: 0,
            completedFollowUps: 0,
            missedFollowUps: 0,
            rescheduledFollowUps: 0,
            complianceRate: 0
        };
        const docQuality = documentationQuality[0] || {
            totalReviews: 0,
            reviewsWithCompletePlans: 0,
            reviewsWithMedications: 0,
            reviewsWithProblems: 0,
            planCompletionRate: 0,
            medicationDocumentationRate: 0,
            problemIdentificationRate: 0
        };
        (0, responseHelpers_1.sendSuccess)(res, {
            completionTimeAnalysis,
            problemPatterns,
            followUpCompliance: compliance,
            documentationQuality: docQuality,
            qualityMetrics: {
                avgPlanCompletionRate: docQuality.planCompletionRate,
                avgFollowUpCompliance: compliance.complianceRate,
                avgProblemResolutionRate: problemPatterns.length > 0
                    ? problemPatterns.reduce((sum, p) => sum + p.resolutionRate, 0) / problemPatterns.length
                    : 0
            }
        }, 'Quality assurance report generated successfully');
    }
    catch (error) {
        console.error('Error generating quality assurance report:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate quality assurance report', 500);
    }
};
exports.getQualityAssuranceReport = getQualityAssuranceReport;
const getOutcomeMetricsReport = async (req, res) => {
    try {
        const { startDate, endDate, reviewType } = req.query;
        const workplaceId = req.user?.workplaceId;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.completedAt = {};
            if (startDate)
                dateFilter.completedAt.$gte = new Date(startDate);
            if (endDate)
                dateFilter.completedAt.$lte = new Date(endDate);
        }
        const additionalFilters = {};
        if (reviewType)
            additionalFilters.reviewType = reviewType;
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            isDeleted: false,
            status: 'completed',
            ...dateFilter,
            ...additionalFilters
        };
        const clinicalOutcomes = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
                    totalMedicationsOptimized: { $sum: '$clinicalOutcomes.medicationsOptimized' },
                    adherenceImprovedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] }
                    },
                    adverseEventsReducedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] }
                    },
                    qualityOfLifeImprovedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.qualityOfLifeImproved', 1, 0] }
                    },
                    clinicalParametersImprovedCount: {
                        $sum: { $cond: ['$clinicalOutcomes.clinicalParametersImproved', 1, 0] }
                    },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
                    avgProblemsPerReview: { $avg: '$clinicalOutcomes.problemsResolved' },
                    avgMedicationsPerReview: { $avg: '$clinicalOutcomes.medicationsOptimized' }
                }
            }
        ]);
        const outcomesByType = await MedicationTherapyReview_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$reviewType',
                    totalReviews: { $sum: 1 },
                    avgProblemsResolved: { $avg: '$clinicalOutcomes.problemsResolved' },
                    avgMedicationsOptimized: { $avg: '$clinicalOutcomes.medicationsOptimized' },
                    adherenceImprovedRate: {
                        $avg: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] }
                    },
                    avgCostSavings: { $avg: '$clinicalOutcomes.costSavings' }
                }
            },
            {
                $addFields: {
                    adherenceImprovedRate: {
                        $multiply: ['$adherenceImprovedRate', 100]
                    }
                }
            }
        ]);
        const monthlyOutcomes = await MedicationTherapyReview_1.default.aggregate([
            {
                $match: {
                    ...matchStage,
                    completedAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$completedAt' },
                        month: { $month: '$completedAt' }
                    },
                    totalReviews: { $sum: 1 },
                    totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
                    totalMedicationsOptimized: { $sum: '$clinicalOutcomes.medicationsOptimized' },
                    totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        const outcomes = clinicalOutcomes[0] || {
            totalReviews: 0,
            totalProblemsResolved: 0,
            totalMedicationsOptimized: 0,
            adherenceImprovedCount: 0,
            adverseEventsReducedCount: 0,
            qualityOfLifeImprovedCount: 0,
            clinicalParametersImprovedCount: 0,
            totalCostSavings: 0,
            avgProblemsPerReview: 0,
            avgMedicationsPerReview: 0
        };
        const adherenceImprovementRate = outcomes.totalReviews > 0
            ? (outcomes.adherenceImprovedCount / outcomes.totalReviews) * 100
            : 0;
        const adverseEventReductionRate = outcomes.totalReviews > 0
            ? (outcomes.adverseEventsReducedCount / outcomes.totalReviews) * 100
            : 0;
        (0, responseHelpers_1.sendSuccess)(res, {
            summary: {
                ...outcomes,
                adherenceImprovementRate: Math.round(adherenceImprovementRate * 100) / 100,
                adverseEventReductionRate: Math.round(adverseEventReductionRate * 100) / 100
            },
            outcomesByType,
            trends: {
                monthly: monthlyOutcomes
            }
        }, 'Outcome metrics report generated successfully');
    }
    catch (error) {
        console.error('Error generating outcome metrics report:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate outcome metrics report', 500);
    }
};
exports.getOutcomeMetricsReport = getOutcomeMetricsReport;
//# sourceMappingURL=mtrReportsController.js.map