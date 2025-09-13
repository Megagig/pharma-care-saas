"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiagnosticAnalytics = exports.getReviewWorkflowStatus = exports.createInterventionFromResult = exports.getPendingReviews = exports.rejectDiagnosticResult = exports.approveDiagnosticResult = exports.getDiagnosticDashboard = exports.getPatientDiagnosticHistory = exports.cancelDiagnosticRequest = exports.retryDiagnosticRequest = exports.getDiagnosticRequest = exports.createDiagnosticRequest = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const diagnosticService_1 = require("../services/diagnosticService");
const pharmacistReviewService_1 = require("../services/pharmacistReviewService");
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const diagnosticService = new diagnosticService_1.DiagnosticService();
const pharmacistReviewService = new pharmacistReviewService_1.PharmacistReviewService();
exports.createDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId, inputSnapshot, priority = 'routine', consentObtained, } = req.body;
    if (!consentObtained) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Patient consent is required for AI diagnostic processing', 400);
    }
    try {
        const diagnosticRequest = await diagnosticService.createDiagnosticRequest({
            patientId,
            pharmacistId: context.userId,
            workplaceId: context.workplaceId,
            locationId: context.locationId,
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
        console.log('Diagnostic request created:', (0, responseHelpers_1.createAuditLog)('CREATE_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', diagnosticRequest._id.toString(), context, {
            patientId,
            priority,
            symptomsCount: inputSnapshot.symptoms.subjective.length,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            request: diagnosticRequest,
            message: 'Diagnostic request created successfully. Processing will begin shortly.',
        }, 'Diagnostic request created successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to create diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to create diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
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
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.retryDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
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
        console.log('Diagnostic request retried:', (0, responseHelpers_1.createAuditLog)('RETRY_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', id, context, {
            retryCount: request.retryCount + 1,
            previousStatus: request.status,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            request: result.request,
            result: result.result,
            processingTime: result.processingTime,
        }, 'Diagnostic request retried successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to retry diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to retry diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.cancelDiagnosticRequest = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
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
        await diagnosticService.cancelDiagnosticRequest(id, context.userId);
        console.log('Diagnostic request cancelled:', (0, responseHelpers_1.createAuditLog)('CANCEL_DIAGNOSTIC_REQUEST', 'DiagnosticRequest', id, context, {
            previousStatus: request.status,
        }));
        (0, responseHelpers_1.sendSuccess)(res, null, 'Diagnostic request cancelled successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to cancel diagnostic request:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to cancel diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getPatientDiagnosticHistory = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    try {
        const history = await diagnosticService.getPatientDiagnosticHistory(patientId, context.workplaceId, parsedPage, parsedLimit);
        (0, responseHelpers_1.respondWithPaginatedResults)(res, history.requests, history.total, history.page, parsedLimit, `Found ${history.total} diagnostic requests for patient`);
    }
    catch (error) {
        logger_1.default.error('Failed to get patient diagnostic history:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get patient diagnostic history: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticDashboard = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const [totalRequests, pendingRequests, processingRequests, completedRequests, failedRequests, pendingReviews, recentRequests,] = await Promise.all([
            DiagnosticRequest_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: 'pending',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: 'processing',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: 'completed',
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: 'failed',
                isDeleted: false,
            }),
            DiagnosticResult_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                pharmacistReview: { $exists: false },
                isDeleted: false,
            }),
            DiagnosticRequest_1.default.find({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            })
                .populate('patientId', 'firstName lastName')
                .populate('pharmacistId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);
        const dashboardData = {
            statistics: {
                total: totalRequests,
                pending: pendingRequests,
                processing: processingRequests,
                completed: completedRequests,
                failed: failedRequests,
                pendingReviews,
            },
            recentRequests,
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
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get diagnostic dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.approveDiagnosticResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { modifications, reviewNotes, clinicalJustification } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const result = await pharmacistReviewService.submitReviewDecision(id, {
            status: modifications ? 'modified' : 'approved',
            modifications,
            reviewNotes,
            clinicalJustification,
            reviewedBy: context.userId,
            workplaceId: context.workplaceId,
        });
        console.log('Diagnostic result approved:', (0, responseHelpers_1.createAuditLog)('APPROVE_DIAGNOSTIC_RESULT', 'DiagnosticResult', id, context, {
            hasModifications: !!modifications,
            confidenceScore: result.aiMetadata.confidenceScore,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            result,
            approved: true,
            modified: !!modifications,
        }, 'Diagnostic result approved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to approve diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to approve diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.rejectDiagnosticResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason, reviewNotes, clinicalJustification } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
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
        console.log('Diagnostic result rejected:', (0, responseHelpers_1.createAuditLog)('REJECT_DIAGNOSTIC_RESULT', 'DiagnosticResult', id, context, {
            rejectionReason: rejectionReason.substring(0, 100),
            confidenceScore: result.aiMetadata.confidenceScore,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            result,
            rejected: true,
        }, 'Diagnostic result rejected successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to reject diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to reject diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
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
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get pending reviews: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.createInterventionFromResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const interventionData = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const intervention = await pharmacistReviewService.createInterventionFromResult(id, interventionData, context.userId, context.workplaceId);
        console.log('Intervention created from diagnostic result:', (0, responseHelpers_1.createAuditLog)('CREATE_INTERVENTION_FROM_DIAGNOSTIC', 'ClinicalIntervention', intervention._id.toString(), context, {
            diagnosticResultId: id,
            interventionType: interventionData.type,
            priority: interventionData.priority,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            intervention,
        }, 'Clinical intervention created successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to create intervention from diagnostic result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to create intervention: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
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
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get review workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDiagnosticAnalytics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { from, to } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    try {
        const analytics = await pharmacistReviewService.getReviewAnalytics(context.workplaceId, { from: fromDate, to: toDate });
        (0, responseHelpers_1.sendSuccess)(res, {
            analytics,
            dateRange: { from: fromDate, to: toDate },
        }, 'Diagnostic analytics retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic analytics:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get diagnostic analytics: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
//# sourceMappingURL=diagnosticController.js.map