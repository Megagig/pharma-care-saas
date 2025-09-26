"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacistReviewService = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const ClinicalIntervention_1 = __importDefault(require("../../../models/ClinicalIntervention"));
const User_1 = __importDefault(require("../../../models/User"));
const auditService_1 = require("../../../services/auditService");
class PharmacistReviewService {
    async submitReviewDecision(resultId, reviewData) {
        try {
            const reviewer = await User_1.default.findOne({
                _id: reviewData.reviewedBy,
                workplaceId: reviewData.workplaceId,
            });
            if (!reviewer) {
                throw new Error('Reviewer not found or does not belong to this workplace');
            }
            const result = await DiagnosticResult_1.default.findOne({
                _id: resultId,
                workplaceId: new mongoose_1.Types.ObjectId(reviewData.workplaceId),
                isDeleted: false,
            });
            if (!result) {
                throw new Error('Diagnostic result not found');
            }
            if (result.pharmacistReview) {
                throw new Error('Diagnostic result has already been reviewed');
            }
            this.validateReviewData(reviewData);
            const review = {
                status: reviewData.status,
                modifications: reviewData.modifications,
                rejectionReason: reviewData.rejectionReason,
                reviewedBy: new mongoose_1.Types.ObjectId(reviewData.reviewedBy),
                reviewedAt: new Date(),
                reviewNotes: reviewData.reviewNotes,
                clinicalJustification: reviewData.clinicalJustification,
            };
            result.pharmacistReview = review;
            result.updatedBy = new mongoose_1.Types.ObjectId(reviewData.reviewedBy);
            if (reviewData.status === 'approved' || reviewData.status === 'modified') {
                result.followUpRequired = this.determineFollowUpRequired(result, reviewData);
                if (result.followUpRequired) {
                    result.followUpDate = this.calculateFollowUpDate(result);
                    result.followUpInstructions = this.generateFollowUpInstructions(result, reviewData);
                }
            }
            const updatedResult = await result.save();
            await auditService_1.AuditService.logActivity({
                userId: reviewData.reviewedBy,
                workplaceId: reviewData.workplaceId,
                userRole: reviewer.role,
            }, {
                action: 'diagnostic_result_reviewed',
                resourceType: 'DiagnosticResult',
                resourceId: resultId,
                complianceCategory: 'clinical_review',
                details: {
                    reviewStatus: reviewData.status,
                    hasModifications: !!reviewData.modifications,
                    hasRejectionReason: !!reviewData.rejectionReason,
                    followUpRequired: result.followUpRequired,
                    confidenceScore: result.aiMetadata.confidenceScore,
                },
            });
            logger_1.default.info('Diagnostic result reviewed successfully', {
                resultId,
                reviewStatus: reviewData.status,
                reviewedBy: reviewData.reviewedBy,
                followUpRequired: result.followUpRequired,
            });
            return updatedResult;
        }
        catch (error) {
            logger_1.default.error('Failed to submit review decision:', error);
            throw new Error(`Failed to submit review decision: ${error}`);
        }
    }
    async createInterventionFromResult(resultId, interventionData, createdBy, workplaceId) {
        try {
            const result = await DiagnosticResult_1.default.findOne({
                _id: resultId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                isDeleted: false,
            }).populate('requestId');
            if (!result) {
                throw new Error('Diagnostic result not found');
            }
            if (!result.pharmacistReview || !['approved', 'modified'].includes(result.pharmacistReview.status)) {
                throw new Error('Can only create interventions from approved or modified diagnostic results');
            }
            const request = result.requestId;
            if (!request) {
                throw new Error('Original diagnostic request not found');
            }
            const intervention = new ClinicalIntervention_1.default({
                patientId: request.patientId,
                pharmacistId: new mongoose_1.Types.ObjectId(createdBy),
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                type: interventionData.type,
                title: interventionData.title,
                description: interventionData.description,
                priority: interventionData.priority,
                category: interventionData.category,
                recommendations: interventionData.recommendations,
                status: 'active',
                relatedDocuments: [{
                        documentType: 'diagnostic_result',
                        documentId: result._id,
                        relationship: 'generated_from',
                    }],
                followUpRequired: interventionData.followUpRequired,
                followUpDate: interventionData.followUpDate,
                targetOutcome: interventionData.targetOutcome,
                monitoringParameters: interventionData.monitoringParameters || [],
                createdBy: new mongoose_1.Types.ObjectId(createdBy),
            });
            const savedIntervention = await intervention.save();
            result.updatedBy = new mongoose_1.Types.ObjectId(createdBy);
            await result.save();
            await auditService_1.AuditService.logActivity({
                userId: createdBy,
                workplaceId: workplaceId,
                userRole: 'pharmacist',
            }, {
                action: 'intervention_created_from_diagnostic',
                resourceType: 'ClinicalIntervention',
                resourceId: savedIntervention._id.toString(),
                complianceCategory: 'clinical_intervention',
                details: {
                    diagnosticResultId: resultId,
                    interventionType: interventionData.type,
                    priority: interventionData.priority,
                    followUpRequired: interventionData.followUpRequired,
                    recommendationsCount: interventionData.recommendations.length,
                },
            });
            logger_1.default.info('Clinical intervention created from diagnostic result', {
                interventionId: savedIntervention._id,
                resultId,
                type: interventionData.type,
                priority: interventionData.priority,
                createdBy,
            });
            return savedIntervention;
        }
        catch (error) {
            logger_1.default.error('Failed to create intervention from diagnostic result:', error);
            throw new Error(`Failed to create intervention: ${error}`);
        }
    }
    async getPendingReviews(workplaceId, page = 1, limit = 20, filters = {}) {
        try {
            const query = {
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                pharmacistReview: { $exists: false },
                isDeleted: false,
            };
            if (filters.priority) {
                const requests = await DiagnosticRequest_1.default.find({
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    priority: filters.priority,
                }).select('_id');
                query.requestId = { $in: requests.map(r => r._id) };
            }
            if (filters.confidenceRange) {
                query['aiMetadata.confidenceScore'] = {
                    $gte: filters.confidenceRange.min,
                    $lte: filters.confidenceRange.max,
                };
            }
            if (filters.hasRedFlags !== undefined) {
                if (filters.hasRedFlags) {
                    query['redFlags.0'] = { $exists: true };
                }
                else {
                    query.redFlags = { $size: 0 };
                }
            }
            let sortOrder = { createdAt: 1 };
            switch (filters.orderBy) {
                case 'newest':
                    sortOrder = { createdAt: -1 };
                    break;
                case 'priority':
                    sortOrder = { 'riskAssessment.overallRisk': -1, createdAt: 1 };
                    break;
                case 'confidence':
                    sortOrder = { 'aiMetadata.confidenceScore': 1, createdAt: 1 };
                    break;
            }
            const skip = (page - 1) * limit;
            const [results, total] = await Promise.all([
                DiagnosticResult_1.default.find(query)
                    .populate({
                    path: 'requestId',
                    populate: {
                        path: 'patientId',
                        select: 'firstName lastName dateOfBirth',
                    },
                })
                    .sort(sortOrder)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                DiagnosticResult_1.default.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit);
            logger_1.default.info('Pending reviews retrieved', {
                workplaceId,
                total,
                page,
                filters: Object.keys(filters).length,
            });
            return {
                results: results,
                total,
                page,
                totalPages,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get pending reviews:', error);
            throw new Error(`Failed to get pending reviews: ${error}`);
        }
    }
    async getReviewWorkflowStatus(workplaceId) {
        try {
            const [totalPending, totalReviewed, reviewStats, oldestPending,] = await Promise.all([
                DiagnosticResult_1.default.countDocuments({
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    pharmacistReview: { $exists: false },
                    isDeleted: false,
                }),
                DiagnosticResult_1.default.countDocuments({
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    pharmacistReview: { $exists: true },
                    isDeleted: false,
                }),
                DiagnosticResult_1.default.aggregate([
                    {
                        $match: {
                            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                            pharmacistReview: { $exists: true },
                            isDeleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: '$pharmacistReview.status',
                            count: { $sum: 1 },
                            avgReviewTime: {
                                $avg: {
                                    $subtract: ['$pharmacistReview.reviewedAt', '$createdAt'],
                                },
                            },
                        },
                    },
                ]),
                DiagnosticResult_1.default.findOne({
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    pharmacistReview: { $exists: false },
                    isDeleted: false,
                }).sort({ createdAt: 1 }),
            ]);
            let totalApproved = 0;
            let totalModified = 0;
            let totalRejected = 0;
            let totalReviewTime = 0;
            let reviewCount = 0;
            reviewStats.forEach((stat) => {
                switch (stat._id) {
                    case 'approved':
                        totalApproved = stat.count;
                        break;
                    case 'modified':
                        totalModified = stat.count;
                        break;
                    case 'rejected':
                        totalRejected = stat.count;
                        break;
                }
                totalReviewTime += stat.avgReviewTime * stat.count;
                reviewCount += stat.count;
            });
            const averageReviewTime = reviewCount > 0 ? totalReviewTime / reviewCount : 0;
            const oldestPendingDays = oldestPending
                ? Math.ceil((Date.now() - oldestPending.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            return {
                totalPending,
                totalReviewed,
                totalApproved,
                totalModified,
                totalRejected,
                averageReviewTime: Math.round(averageReviewTime / (1000 * 60 * 60)),
                oldestPendingDays,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get review workflow status:', error);
            throw new Error(`Failed to get review workflow status: ${error}`);
        }
    }
    async getReviewAnalytics(workplaceId, dateRange) {
        try {
            const matchStage = {
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                pharmacistReview: { $exists: true },
                'pharmacistReview.reviewedAt': {
                    $gte: dateRange.from,
                    $lte: dateRange.to,
                },
                isDeleted: false,
            };
            const [reviewerStats, qualityMetrics, timeMetrics,] = await Promise.all([
                this.getReviewerStats(matchStage),
                this.getQualityMetrics(matchStage),
                this.getTimeMetrics(matchStage),
            ]);
            return {
                reviewerStats,
                qualityMetrics,
                timeMetrics,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get review analytics:', error);
            throw new Error(`Failed to get review analytics: ${error}`);
        }
    }
    validateReviewData(reviewData) {
        if (reviewData.status === 'modified' && !reviewData.modifications) {
            throw new Error('Modifications are required when status is modified');
        }
        if (reviewData.status === 'rejected' && !reviewData.rejectionReason) {
            throw new Error('Rejection reason is required when status is rejected');
        }
        if (reviewData.modifications && reviewData.modifications.length > 2000) {
            throw new Error('Modifications cannot exceed 2000 characters');
        }
        if (reviewData.rejectionReason && reviewData.rejectionReason.length > 1000) {
            throw new Error('Rejection reason cannot exceed 1000 characters');
        }
        if (reviewData.reviewNotes && reviewData.reviewNotes.length > 1000) {
            throw new Error('Review notes cannot exceed 1000 characters');
        }
        if (reviewData.clinicalJustification && reviewData.clinicalJustification.length > 1000) {
            throw new Error('Clinical justification cannot exceed 1000 characters');
        }
    }
    determineFollowUpRequired(result, reviewData) {
        if (result.riskAssessment.overallRisk === 'high' || result.riskAssessment.overallRisk === 'critical') {
            return true;
        }
        if (result.redFlags && result.redFlags.length > 0) {
            return true;
        }
        if (result.referralRecommendation?.recommended) {
            return true;
        }
        if (result.medicationSuggestions && result.medicationSuggestions.length > 0) {
            return true;
        }
        if (reviewData.modifications && reviewData.modifications.toLowerCase().includes('follow')) {
            return true;
        }
        return false;
    }
    calculateFollowUpDate(result) {
        const now = new Date();
        let daysToAdd = 7;
        switch (result.riskAssessment.overallRisk) {
            case 'critical':
                daysToAdd = 1;
                break;
            case 'high':
                daysToAdd = 3;
                break;
            case 'medium':
                daysToAdd = 7;
                break;
            case 'low':
                daysToAdd = 14;
                break;
        }
        if (result.redFlags && result.redFlags.some(flag => flag.severity === 'critical')) {
            daysToAdd = Math.min(daysToAdd, 1);
        }
        else if (result.redFlags && result.redFlags.some(flag => flag.severity === 'high')) {
            daysToAdd = Math.min(daysToAdd, 3);
        }
        if (result.referralRecommendation?.recommended) {
            switch (result.referralRecommendation.urgency) {
                case 'immediate':
                    daysToAdd = 1;
                    break;
                case 'within_24h':
                    daysToAdd = 2;
                    break;
                case 'within_week':
                    daysToAdd = 7;
                    break;
                case 'routine':
                    daysToAdd = 14;
                    break;
            }
        }
        return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    generateFollowUpInstructions(result, reviewData) {
        const instructions = [];
        if (result.redFlags && result.redFlags.length > 0) {
            result.redFlags.forEach(flag => {
                if (flag.action) {
                    instructions.push(flag.action);
                }
            });
        }
        if (result.referralRecommendation?.recommended) {
            instructions.push(`Schedule ${result.referralRecommendation.urgency} referral to ${result.referralRecommendation.specialty}`);
            if (result.referralRecommendation.followUpInstructions) {
                instructions.push(result.referralRecommendation.followUpInstructions);
            }
        }
        if (result.medicationSuggestions && result.medicationSuggestions.length > 0) {
            instructions.push('Monitor medication adherence and effectiveness');
            instructions.push('Assess for adverse effects');
        }
        if (reviewData.modifications) {
            const modificationLines = reviewData.modifications.split('\n').filter(line => line.trim().length > 0 &&
                (line.toLowerCase().includes('follow') || line.toLowerCase().includes('monitor')));
            instructions.push(...modificationLines);
        }
        if (instructions.length === 0) {
            instructions.push('Follow up on patient progress and symptom resolution');
        }
        return instructions;
    }
    async getReviewerStats(matchStage) {
        const stats = await DiagnosticResult_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$pharmacistReview.reviewedBy',
                    totalReviews: { $sum: 1 },
                    approvedCount: {
                        $sum: { $cond: [{ $eq: ['$pharmacistReview.status', 'approved'] }, 1, 0] },
                    },
                    avgReviewTime: {
                        $avg: {
                            $subtract: ['$pharmacistReview.reviewedAt', '$createdAt'],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'reviewer',
                },
            },
        ]);
        return stats.map((stat) => ({
            reviewerId: stat._id.toString(),
            reviewerName: stat.reviewer[0] ? `${stat.reviewer[0].firstName} ${stat.reviewer[0].lastName}` : 'Unknown',
            totalReviews: stat.totalReviews,
            approvalRate: (stat.approvedCount / stat.totalReviews) * 100,
            averageReviewTime: Math.round(stat.avgReviewTime / (1000 * 60 * 60)),
        }));
    }
    async getQualityMetrics(matchStage) {
        const [metrics, rejectionReasons, interventionRate] = await Promise.all([
            DiagnosticResult_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        avgConfidence: { $avg: '$aiMetadata.confidenceScore' },
                        avgQuality: { $avg: '$validationScore' },
                    },
                },
            ]),
            DiagnosticResult_1.default.aggregate([
                {
                    $match: {
                        ...matchStage,
                        'pharmacistReview.status': 'rejected',
                    },
                },
                {
                    $group: {
                        _id: '$pharmacistReview.rejectionReason',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),
            Promise.resolve({ interventionCreationRate: 0.75 }),
        ]);
        return {
            averageConfidenceScore: metrics[0]?.avgConfidence || 0,
            averageQualityScore: metrics[0]?.avgQuality || 0,
            commonRejectionReasons: rejectionReasons.map((r) => r._id).filter(Boolean),
            interventionCreationRate: interventionRate.interventionCreationRate,
        };
    }
    async getTimeMetrics(matchStage) {
        const [timeStats, hourlyStats] = await Promise.all([
            DiagnosticResult_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        avgTimeToReview: {
                            $avg: {
                                $subtract: ['$pharmacistReview.reviewedAt', '$createdAt'],
                            },
                        },
                        avgProcessingTime: { $avg: '$aiMetadata.processingTime' },
                    },
                },
            ]),
            DiagnosticResult_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $hour: '$pharmacistReview.reviewedAt' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 3 },
            ]),
        ]);
        return {
            averageTimeToReview: Math.round((timeStats[0]?.avgTimeToReview || 0) / (1000 * 60 * 60)),
            averageProcessingTime: Math.round((timeStats[0]?.avgProcessingTime || 0) / 1000),
            peakReviewHours: hourlyStats.map((h) => h._id),
        };
    }
}
exports.PharmacistReviewService = PharmacistReviewService;
exports.default = new PharmacistReviewService();
//# sourceMappingURL=pharmacistReviewService.js.map