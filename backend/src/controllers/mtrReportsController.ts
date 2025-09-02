import { Response } from 'express';
import mongoose from 'mongoose';
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import DrugTherapyProblem from '../models/DrugTherapyProblem';
import MTRIntervention from '../models/MTRIntervention';
import MTRFollowUp from '../models/MTRFollowUp';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { AuthRequest } from '../middlewares/auth';

/**
 * MTR Reports Controller
 * Handles analytics and reporting endpoints for MTR module
 */

interface DateRange {
    start: Date;
    end: Date;
}

interface ReportFilters {
    dateRange?: DateRange;
    pharmacistId?: string;
    patientId?: string;
    reviewType?: string;
    priority?: string;
}

/**
 * Get MTR summary statistics
 */
export const getMTRSummaryReport = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, pharmacistId, reviewType, priority } = req.query;
        const workplaceId = req.user?.workplaceId;

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
        }

        // Build additional filters
        const additionalFilters: any = {};
        if (pharmacistId) additionalFilters.pharmacistId = new mongoose.Types.ObjectId(pharmacistId as string);
        if (reviewType) additionalFilters.reviewType = reviewType;
        if (priority) additionalFilters.priority = priority;

        const matchStage = {
            workplaceId: new mongoose.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...additionalFilters
        };

        // Aggregate MTR statistics
        const mtrStats = await MedicationTherapyReview.aggregate([
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
                                        1000 * 60 * 60 * 24 // Convert to days
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

        // Get review type distribution
        const reviewTypeDistribution = await MedicationTherapyReview.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$reviewType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get priority distribution
        const priorityDistribution = await MedicationTherapyReview.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get monthly trends (last 12 months)
        const monthlyTrends = await MedicationTherapyReview.aggregate([
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

        // Calculate completion rate
        const completionRate = summary.totalReviews > 0
            ? (summary.completedReviews / summary.totalReviews) * 100
            : 0;

        sendSuccess(res, {
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

    } catch (error) {
        console.error('Error generating MTR summary report:', error);
        sendError(res, 'SERVER_ERROR', 'Failed to generate MTR summary report', 500);
    }
};

/**
 * Get intervention effectiveness report
 */
export const getInterventionEffectivenessReport = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, pharmacistId, interventionType } = req.query;
        const workplaceId = req.user?.workplaceId;

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
        }

        // Build additional filters
        const additionalFilters: any = {};
        if (pharmacistId) additionalFilters.pharmacistId = new mongoose.Types.ObjectId(pharmacistId as string);
        if (interventionType) additionalFilters.type = interventionType;

        const matchStage = {
            workplaceId: new mongoose.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...additionalFilters
        };

        // Get intervention statistics
        const interventionStats = await MTRIntervention.aggregate([
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

        // Get intervention type effectiveness
        const typeEffectiveness = await MTRIntervention.aggregate([
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

        // Get intervention category effectiveness
        const categoryEffectiveness = await MTRIntervention.aggregate([
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

        // Get pharmacist performance
        const pharmacistPerformance = await MTRIntervention.aggregate([
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

        // Calculate overall acceptance rate
        const overallAcceptanceRate = summary.totalInterventions > 0
            ? (summary.acceptedInterventions / summary.totalInterventions) * 100
            : 0;

        sendSuccess(res, {
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

    } catch (error) {
        console.error('Error generating intervention effectiveness report:', error);
        sendError(res, 'SERVER_ERROR', 'Failed to generate intervention effectiveness report', 500);
    }
};

/**
 * Get pharmacist performance analytics
 */
export const getPharmacistPerformanceReport = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, pharmacistId } = req.query;
        const workplaceId = req.user?.workplaceId;

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
        }

        // Build pharmacist filter
        const pharmacistFilter: any = {};
        if (pharmacistId) {
            pharmacistFilter.pharmacistId = new mongoose.Types.ObjectId(pharmacistId as string);
        }

        const matchStage = {
            workplaceId: new mongoose.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter,
            ...pharmacistFilter
        };

        // Get pharmacist MTR performance
        const pharmacistMTRStats = await MedicationTherapyReview.aggregate([
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

        // Get pharmacist intervention performance
        const pharmacistInterventionStats = await MTRIntervention.aggregate([
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

        // Merge MTR and intervention stats
        const combinedStats = pharmacistMTRStats.map(mtrStat => {
            const interventionStat = pharmacistInterventionStats.find(
                intStat => intStat._id.toString() === mtrStat._id.toString()
            );

            return {
                ...mtrStat,
                totalInterventions: interventionStat?.totalInterventions || 0,
                acceptedInterventions: interventionStat?.acceptedInterventions || 0,
                interventionAcceptanceRate: interventionStat?.interventionAcceptanceRate || 0
            };
        });

        // Calculate quality scores
        const qualityScores = combinedStats.map(stat => {
            const completionWeight = 0.3;
            const problemResolutionWeight = 0.3;
            const interventionAcceptanceWeight = 0.2;
            const efficiencyWeight = 0.2;

            // Efficiency score based on completion time (lower is better, max 14 days)
            const efficiencyScore = Math.max(0, 100 - ((stat.avgCompletionTime || 14) / 14) * 100);

            const qualityScore =
                (stat.completionRate * completionWeight) +
                (stat.problemResolutionRate * problemResolutionWeight) +
                (stat.interventionAcceptanceRate * interventionAcceptanceWeight) +
                (efficiencyScore * efficiencyWeight);

            return {
                ...stat,
                efficiencyScore: Math.round(efficiencyScore * 100) / 100,
                qualityScore: Math.round(qualityScore * 100) / 100
            };
        }).sort((a, b) => b.qualityScore - a.qualityScore);

        sendSuccess(res, {
            pharmacistPerformance: qualityScores,
            summary: {
                totalPharmacists: qualityScores.length,
                avgQualityScore: qualityScores.length > 0
                    ? qualityScores.reduce((sum, p) => sum + p.qualityScore, 0) / qualityScores.length
                    : 0,
                topPerformer: qualityScores[0] || null
            }
        }, 'Pharmacist performance report generated successfully');

    } catch (error) {
        console.error('Error generating pharmacist performance report:', error);
        sendError(res, 'SERVER_ERROR', 'Failed to generate pharmacist performance report', 500);
    }
};

/**
 * Get quality assurance report
 */
export const getQualityAssuranceReport = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const workplaceId = req.user?.workplaceId;

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
        }

        const matchStage = {
            workplaceId: new mongoose.Types.ObjectId(workplaceId),
            isDeleted: false,
            ...dateFilter
        };

        // Get completion time analysis
        const completionTimeAnalysis = await MedicationTherapyReview.aggregate([
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

        // Get problem identification patterns
        const problemPatterns = await DrugTherapyProblem.aggregate([
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

        // Get follow-up compliance
        const followUpCompliance = await MTRFollowUp.aggregate([
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

        // Get documentation quality metrics
        const documentationQuality = await MedicationTherapyReview.aggregate([
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

        sendSuccess(res, {
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

    } catch (error) {
        console.error('Error generating quality assurance report:', error);
        sendError(res, 'SERVER_ERROR', 'Failed to generate quality assurance report', 500);
    }
};

/**
 * Get outcome metrics report
 */
export const getOutcomeMetricsReport = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, reviewType } = req.query;
        const workplaceId = req.user?.workplaceId;

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.completedAt = {};
            if (startDate) dateFilter.completedAt.$gte = new Date(startDate as string);
            if (endDate) dateFilter.completedAt.$lte = new Date(endDate as string);
        }

        // Build additional filters
        const additionalFilters: any = {};
        if (reviewType) additionalFilters.reviewType = reviewType;

        const matchStage = {
            workplaceId: new mongoose.Types.ObjectId(workplaceId),
            isDeleted: false,
            status: 'completed',
            ...dateFilter,
            ...additionalFilters
        };

        // Get clinical outcomes
        const clinicalOutcomes = await MedicationTherapyReview.aggregate([
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

        // Get outcomes by review type
        const outcomesByType = await MedicationTherapyReview.aggregate([
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

        // Get monthly outcome trends
        const monthlyOutcomes = await MedicationTherapyReview.aggregate([
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

        // Calculate improvement rates
        const adherenceImprovementRate = outcomes.totalReviews > 0
            ? (outcomes.adherenceImprovedCount / outcomes.totalReviews) * 100
            : 0;

        const adverseEventReductionRate = outcomes.totalReviews > 0
            ? (outcomes.adverseEventsReducedCount / outcomes.totalReviews) * 100
            : 0;

        sendSuccess(res, {
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

    } catch (error) {
        console.error('Error generating outcome metrics report:', error);
        sendError(res, 'SERVER_ERROR', 'Failed to generate outcome metrics report', 500);
    }
};