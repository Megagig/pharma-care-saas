"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePatientAccess = exports.getDiagnosticReferrals = exports.getAllDiagnosticCases = exports.getDiagnosticAnalytics = exports.getReviewWorkflowStatus = exports.createInterventionFromResult = exports.getPendingReviews = exports.rejectDiagnosticResult = exports.approveDiagnosticResult = exports.getDiagnosticDashboard = exports.getPatientDiagnosticHistory = exports.cancelDiagnosticRequest = exports.retryDiagnosticRequest = exports.getDiagnosticRequest = exports.createDiagnosticRequest = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const diagnosticService_1 = require("../services/diagnosticService");
const pharmacistReviewService_1 = require("../services/pharmacistReviewService");
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const DiagnosticHistory_1 = __importDefault(require("../../../models/DiagnosticHistory"));
const diagnosticService = new diagnosticService_1.DiagnosticService();
const pharmacistReviewService = new pharmacistReviewService_1.PharmacistReviewService();
exports.createDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId, locationId, inputSnapshot, priority = 'routine', consentObtained, } = req.body;
    if (!consentObtained) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Patient consent is required for AI diagnostic processing', 400);
    }
    try {
        const diagnosticRequest = await diagnosticService.createDiagnosticRequest({
            patientId,
            pharmacistId: context.userId,
            workplaceId: context.workplaceId,
            locationId,
            inputSnapshot,
            priority,
            consentObtained,
        });
        diagnosticService
            .processDiagnosticRequest(diagnosticRequest._id.toString())
            .catch((error) => {
            logger_1.default.error('Async diagnostic processing failed:', {
                requestId: diagnosticRequest._id,
                error: error.message,
            });
        });
        (0, responseHelpers_1.createAuditLog)('CREATE_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', diagnosticRequest._id.toString(), context, {
            patientId,
            priority,
            symptomsCount: inputSnapshot.symptoms.subjective.length,
        });
        logger_1.default.info('🚨🚨🚨 DIAGNOSTIC REQUEST CREATED SUCCESSFULLY 🚨🚨🚨');
        logger_1.default.info(`🚨 Request ID: ${diagnosticRequest._id}`);
        logger_1.default.info(`🚨 Request ID toString: ${diagnosticRequest._id.toString()}`);
        logger_1.default.info(`🚨 Request status: ${diagnosticRequest.status}`);
        (0, responseHelpers_1.sendSuccess)(res, {
            request: diagnosticRequest,
            message: 'Diagnostic request created successfully. Processing will begin shortly.',
        }, 'Diagnostic request created successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to create diagnostic request:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage === 'ACTIVE_REQUEST_EXISTS') {
            return (0, responseHelpers_1.sendError)(res, 'CONFLICT', 'An active diagnostic request already exists for this patient. Please wait for the current request to complete before submitting a new one.', 409);
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to create diagnostic request: ${errorMessage}`, 500);
    }
});
exports.getDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic request ID is required', 400);
    }
    try {
        const request = await diagnosticService.getDiagnosticRequest(id, context.workplaceId);
        if (!request) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
        }
        (0, responseHelpers_1.checkTenantAccess)(request.workplaceId.toString(), context.workplaceId, context.isAdmin);
        let result = null;
        if (request.status === 'completed') {
            result = await diagnosticService.getDiagnosticResult(id, context.workplaceId);
        }
        const responseData = {
            request,
            result,
            status: request.status,
            processingTime: request.processingDuration,
            isActive: ['pending', 'processing'].includes(request.status),
            canRetry: request.status === 'failed' && request.retryCount < 3,
        };
        (0, responseHelpers_1.sendSuccess)(res, responseData, 'Diagnostic request retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.retryDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic request ID is required', 400);
    }
    try {
        const request = await DiagnosticRequest_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!request) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
        }
        if (!request.canRetry()) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Request cannot be retried (maximum attempts exceeded or invalid status)', 400);
        }
        const result = await diagnosticService.retryDiagnosticRequest(id);
        (0, responseHelpers_1.createAuditLog)('RETRY_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', id, context, {
            retryCount: request.retryCount + 1,
            previousStatus: request.status,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            request: result.request,
            result: result.result,
            processingTime: result.processingTime,
        }, 'Diagnostic request retried successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to retry diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to retry diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.cancelDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic request ID is required', 400);
    }
    try {
        const request = await DiagnosticRequest_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!request) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
        }
        if (!['pending', 'processing'].includes(request.status)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Can only cancel pending or processing requests', 400);
        }
        await diagnosticService.cancelDiagnosticRequest(id, context.workplaceId, context.userId);
        (0, responseHelpers_1.createAuditLog)('CANCEL_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', id, context, {
            previousStatus: request.status,
        });
        (0, responseHelpers_1.sendSuccess)(res, {}, 'Diagnostic request cancelled successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to cancel diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to cancel diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getPatientDiagnosticHistory = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    try {
        if (!patientId) {
            return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Patient ID is required', 400);
        }
        const history = await diagnosticService.getPatientDiagnosticHistory(patientId, context.workplaceId, parsedPage, parsedLimit);
        (0, responseHelpers_1.respondWithPaginatedResults)(res, history.requests, history.total, history.page, parsedLimit, `Found ${history.total} diagnostic requests for patient`);
    }
    catch (error) {
        logger_1.default.error('Failed to get patient diagnostic history:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get patient diagnostic history: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticDashboard = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const workplaceFilter = context.userRole === 'super_admin'
            ? {}
            : { workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId) };
        const [totalRequests, pendingRequests, processingRequests, completedRequests, failedRequests, pendingReviews, recentRequests,] = await Promise.all([
            DiagnosticRequest_1.default.countDocuments({
                ...workplaceFilter,
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                ...workplaceFilter,
                status: 'pending',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                ...workplaceFilter,
                status: 'processing',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                ...workplaceFilter,
                status: 'completed',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                ...workplaceFilter,
                status: 'failed',
                isDeleted: false,
            }),
            DiagnosticResult_1.default.countDocuments({
                ...workplaceFilter,
                pharmacistReview: { $exists: false },
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.find({
                ...workplaceFilter,
                isDeleted: false,
            })
                .populate('patientId', 'firstName lastName')
                .populate('pharmacistId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);
        const confidenceMatchFilter = context.userRole === 'super_admin'
            ? { 'request.isDeleted': false, confidenceScore: { $exists: true, $ne: null } }
            : { 'request.workplaceId': new mongoose_1.Types.ObjectId(context.workplaceId), 'request.isDeleted': false, confidenceScore: { $exists: true, $ne: null } };
        const avgConfidenceResult = await DiagnosticResult_1.default.aggregate([
            {
                $lookup: {
                    from: 'diagnosticrequests',
                    localField: 'requestId',
                    foreignField: '_id',
                    as: 'request'
                }
            },
            {
                $match: confidenceMatchFilter
            },
            {
                $group: {
                    _id: null,
                    avgConfidence: { $avg: '$confidenceScore' }
                }
            }
        ]);
        const averageConfidence = avgConfidenceResult.length > 0
            ? Math.round(avgConfidenceResult[0].avgConfidence * 100)
            : 0;
        const referralsGenerated = await DiagnosticResult_1.default.countDocuments({
            ...workplaceFilter,
            'referralRecommendation.recommended': true,
            isDeleted: false,
        });
        const formattedRecentRequests = recentRequests.map((request) => ({
            ...request,
            caseId: request._id.toString(),
        }));
        const dashboardData = {
            summary: {
                totalCases: totalRequests,
                completedCases: completedRequests,
                pendingFollowUps: pendingRequests + processingRequests,
                averageConfidence,
                referralsGenerated,
            },
            statistics: {
                total: totalRequests,
                pending: pendingRequests,
                processing: processingRequests,
                completed: completedRequests,
                failed: failedRequests,
                pendingReviews,
            },
            recentRequests: formattedRecentRequests,
            alerts: {
                hasFailedRequests: failedRequests > 0,
                hasPendingReviews: pendingReviews > 0,
                hasStuckProcessing: processingRequests > 0,
            },
        };
        (0, responseHelpers_1.sendSuccess)(res, dashboardData, 'Diagnostic dashboard data retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic dashboard:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get diagnostic dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.approveDiagnosticResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { modifications, reviewNotes, clinicalJustification } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic request ID is required', 400);
    }
    try {
        const result = await pharmacistReviewService.submitReviewDecision(id, {
            status: modifications ? 'modified' : 'approved',
            modifications,
            reviewNotes,
            clinicalJustification,
            reviewedBy: context.userId,
            workplaceId: context.workplaceId,
        });
        (0, responseHelpers_1.createAuditLog)('APPROVE_DIAGNOSTIC_RESULT', 'DiagnosticResult', id, context, {
            hasModifications: !!modifications,
            confidenceScore: result.aiMetadata.confidenceScore,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            result,
            approved: true,
            modified: !!modifications,
        }, 'Diagnostic result approved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to approve diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to approve diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.rejectDiagnosticResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason, reviewNotes, clinicalJustification } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic request ID is required', 400);
    }
    if (!rejectionReason || rejectionReason.trim().length === 0) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Rejection reason is required', 400);
    }
    try {
        const result = await pharmacistReviewService.submitReviewDecision(id, {
            status: 'rejected',
            rejectionReason,
            reviewNotes,
            clinicalJustification,
            reviewedBy: context.userId,
            workplaceId: context.workplaceId,
        });
        (0, responseHelpers_1.createAuditLog)('REJECT_DIAGNOSTIC_RESULT', 'DiagnosticResult', id, context, {
            rejectionReason: rejectionReason.substring(0, 100),
            confidenceScore: result.aiMetadata.confidenceScore,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            result,
            rejected: true,
        }, 'Diagnostic result rejected successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to reject diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to reject diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getPendingReviews = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, priority, confidenceMin, confidenceMax, hasRedFlags, orderBy = 'oldest', } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const filters = {};
    if (priority)
        filters.priority = priority;
    if (confidenceMin !== undefined || confidenceMax !== undefined) {
        filters.confidenceRange = {
            min: parseFloat(confidenceMin) || 0,
            max: parseFloat(confidenceMax) || 1,
        };
    }
    if (hasRedFlags !== undefined) {
        filters.hasRedFlags = hasRedFlags === 'true';
    }
    if (orderBy)
        filters.orderBy = orderBy;
    try {
        const reviews = await pharmacistReviewService.getPendingReviews(context.workplaceId, parsedPage, parsedLimit, filters);
        (0, responseHelpers_1.respondWithPaginatedResults)(res, reviews.results, reviews.total, reviews.page, parsedLimit, `Found ${reviews.total} pending reviews`);
    }
    catch (error) {
        logger_1.default.error('Failed to get pending reviews:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get pending reviews: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.createInterventionFromResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const interventionData = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!id) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Diagnostic result ID is required', 400);
    }
    try {
        const intervention = await pharmacistReviewService.createInterventionFromResult(id, interventionData, context.userId, context.workplaceId);
        (0, responseHelpers_1.createAuditLog)('CREATE_INTERVENTION_FROM_DIAGNOSTIC', 'ClinicalIntervention', intervention._id.toString(), context, {
            diagnosticResultId: id,
            interventionType: interventionData.type,
            priority: interventionData.priority,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            intervention,
        }, 'Clinical intervention created successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to create intervention from diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to create intervention: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getReviewWorkflowStatus = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const status = await pharmacistReviewService.getReviewWorkflowStatus(context.workplaceId);
        (0, responseHelpers_1.sendSuccess)(res, status, 'Review workflow status retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get review workflow status:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get review workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticAnalytics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { from, to, dateFrom, dateTo } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const fromDate = from || dateFrom
        ? new Date(from || dateFrom)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to || dateTo
        ? new Date(to || dateTo)
        : new Date();
    try {
        const matchStage = context.userRole === 'super_admin'
            ? {
                createdAt: {
                    $gte: fromDate,
                    $lte: toDate,
                },
                isDeleted: { $ne: true },
            }
            : {
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                createdAt: {
                    $gte: fromDate,
                    $lte: toDate,
                },
                isDeleted: { $ne: true },
            };
        console.log('🔍 Analytics query:', { matchStage, fromDate, toDate, userRole: context.userRole });
        const [totalCases, completedCases, pendingFollowUps, avgMetrics, topDiagnoses, completionTrends, referralsCount] = await Promise.all([
            DiagnosticRequest_1.default.countDocuments(matchStage),
            DiagnosticRequest_1.default.countDocuments({ ...matchStage, status: 'completed' }),
            DiagnosticRequest_1.default.countDocuments({ ...matchStage, status: { $in: ['pending', 'processing'] } }),
            DiagnosticResult_1.default.aggregate([
                {
                    $lookup: {
                        from: 'diagnosticrequests',
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'request'
                    }
                },
                {
                    $match: context.userRole === 'super_admin'
                        ? {
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            confidenceScore: { $exists: true, $ne: null }
                        }
                        : {
                            'request.workplaceId': new mongoose_1.Types.ObjectId(context.workplaceId),
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            confidenceScore: { $exists: true, $ne: null }
                        }
                },
                {
                    $group: {
                        _id: null,
                        avgConfidence: { $avg: '$confidenceScore' },
                        avgProcessingTime: { $avg: '$processingDuration' },
                    },
                },
            ]),
            DiagnosticResult_1.default.aggregate([
                {
                    $lookup: {
                        from: 'diagnosticrequests',
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'request'
                    }
                },
                {
                    $match: context.userRole === 'super_admin'
                        ? {
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            'differentialDiagnoses': { $exists: true, $ne: [] }
                        }
                        : {
                            'request.workplaceId': new mongoose_1.Types.ObjectId(context.workplaceId),
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            'differentialDiagnoses': { $exists: true, $ne: [] }
                        }
                },
                { $unwind: '$differentialDiagnoses' },
                {
                    $group: {
                        _id: '$differentialDiagnoses.condition',
                        count: { $sum: 1 },
                        averageConfidence: { $avg: '$differentialDiagnoses.probability' },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        condition: '$_id',
                        count: 1,
                        averageConfidence: { $multiply: ['$averageConfidence', 100] },
                    },
                },
            ]),
            DiagnosticRequest_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt',
                            },
                        },
                        casesCreated: { $sum: 1 },
                        casesCompleted: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            DiagnosticResult_1.default.aggregate([
                {
                    $lookup: {
                        from: 'diagnosticrequests',
                        localField: 'requestId',
                        foreignField: '_id',
                        as: 'request'
                    }
                },
                {
                    $match: context.userRole === 'super_admin'
                        ? {
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            'referralRecommendation.recommended': true
                        }
                        : {
                            'request.workplaceId': new mongoose_1.Types.ObjectId(context.workplaceId),
                            'request.createdAt': { $gte: fromDate, $lte: toDate },
                            'request.isDeleted': { $ne: true },
                            'referralRecommendation.recommended': true
                        }
                },
                {
                    $count: 'referralsCount'
                }
            ]).then(result => result.length > 0 ? result[0].referralsCount : 0),
        ]);
        const analytics = {
            summary: {
                totalCases,
                averageConfidence: avgMetrics.length > 0 ? avgMetrics[0].avgConfidence || 0 : 0,
                averageProcessingTime: avgMetrics.length > 0 ? avgMetrics[0].avgProcessingTime || 0 : 0,
                completedCases,
                pendingFollowUps,
                referralsGenerated: referralsCount,
            },
            topDiagnoses,
            completionTrends,
            dateRange: { from: fromDate, to: toDate },
        };
        (0, responseHelpers_1.sendSuccess)(res, analytics, 'Diagnostic analytics retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic analytics:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get diagnostic analytics: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getAllDiagnosticCases = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { page = 1, limit = 20, status, patientId, search, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
    try {
        const query = context.userRole === 'super_admin'
            ? {}
            : { workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId) };
        if (status) {
            query.status = status;
        }
        if (patientId) {
            query.patientId = new mongoose_1.Types.ObjectId(patientId);
        }
        if (search) {
            query.$or = [
                { caseId: { $regex: search, $options: 'i' } },
                { 'inputSnapshot.symptoms.subjective': { $regex: search, $options: 'i' } },
                { 'inputSnapshot.symptoms.objective': { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const [cases, totalCases] = await Promise.all([
            DiagnosticRequest_1.default.find(query)
                .populate('patientId', 'firstName lastName dateOfBirth gender')
                .populate('pharmacistId', 'firstName lastName')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            DiagnosticRequest_1.default.countDocuments(query),
        ]);
        const formattedCases = cases.map((caseItem) => ({
            _id: caseItem._id,
            caseId: caseItem._id.toString(),
            patientId: caseItem.patientId,
            pharmacistId: caseItem.pharmacistId,
            symptoms: caseItem.inputSnapshot?.symptoms || {},
            status: caseItem.status,
            createdAt: caseItem.createdAt,
            updatedAt: caseItem.updatedAt,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            cases: formattedCases,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(totalCases / parseInt(limit)),
                count: formattedCases.length,
                totalCases,
            },
            filters: {
                status,
                patientId,
                search,
                sortBy,
                sortOrder,
            },
        }, 'Diagnostic cases retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic cases:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get diagnostic cases: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticReferrals = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { page = 1, limit = 20, status, specialty, } = req.query;
    try {
        const query = {
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            'referral.generated': true,
        };
        if (status) {
            query['referral.status'] = status;
        }
        if (specialty) {
            query['referral.specialty'] = specialty;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [results, totalReferrals] = await Promise.all([
            DiagnosticHistory_1.default.find(query)
                .populate('patientId', 'firstName lastName age gender')
                .populate('pharmacistId', 'firstName lastName')
                .populate('diagnosticCaseId', 'caseId status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            DiagnosticHistory_1.default.countDocuments(query),
        ]);
        const statistics = {
            pending: await DiagnosticHistory_1.default.countDocuments({
                ...query,
                'referral.status': 'pending',
            }),
            sent: await DiagnosticHistory_1.default.countDocuments({
                ...query,
                'referral.status': 'sent',
            }),
            acknowledged: await DiagnosticHistory_1.default.countDocuments({
                ...query,
                'referral.status': 'acknowledged',
            }),
            completed: await DiagnosticHistory_1.default.countDocuments({
                ...query,
                'referral.status': 'completed',
            }),
        };
        const formattedReferrals = results.map((result) => ({
            _id: result._id,
            patientId: result.patientId,
            pharmacistId: result.pharmacistId,
            caseId: result.caseId || (result.diagnosticCaseId?.caseId),
            referral: {
                generated: result.referral?.generated || false,
                generatedAt: result.referral?.generatedAt,
                specialty: result.referral?.specialty || result.analysisSnapshot?.referralRecommendation?.specialty,
                urgency: result.referral?.urgency || result.analysisSnapshot?.referralRecommendation?.urgency,
                status: result.referral?.status || 'pending',
                sentAt: result.referral?.sentAt,
                acknowledgedAt: result.referral?.acknowledgedAt,
                completedAt: result.referral?.completedAt,
                feedback: result.referral?.feedback,
            },
            analysisSnapshot: {
                referralRecommendation: result.analysisSnapshot?.referralRecommendation,
            },
            createdAt: result.createdAt,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            referrals: formattedReferrals,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(totalReferrals / parseInt(limit)),
                count: formattedReferrals.length,
                totalReferrals,
            },
            statistics,
            filters: {
                status,
                specialty,
            },
        }, 'Diagnostic referrals retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic referrals:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get diagnostic referrals: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.validatePatientAccess = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId } = req.body;
    if (!patientId) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Patient ID is required', 400);
    }
    try {
        const Patient = require('../../../models/Patient').default;
        let patientQuery = { _id: patientId };
        if (req.user?.role !== 'super_admin') {
            patientQuery.workplaceId = context.workplaceId;
        }
        const patient = await Patient.findOne(patientQuery)
            .select('firstName lastName mrn workplaceId')
            .populate('workplaceId', 'name');
        if (!patient) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Patient not found or you do not have access to this patient', 404);
        }
        if (req.user?.role === 'super_admin' && patient.workplaceId?.toString() !== context.workplaceId) {
            logger_1.default.info('Super admin cross-workplace patient access', {
                superAdminId: context.userId,
                superAdminWorkplace: context.workplaceId,
                patientId: patient._id,
                patientWorkplace: patient.workplaceId,
            });
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            hasAccess: true,
            patientName: `${patient.firstName} ${patient.lastName}`,
            mrn: patient.mrn,
            workplaceName: patient.workplaceId?.name || 'Unknown',
        }, 'Patient access validated successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to validate patient access:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to validate patient access: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
//# sourceMappingURL=diagnosticController.js.map