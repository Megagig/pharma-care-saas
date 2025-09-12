import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
import { Types } from 'mongoose';
import logger from '../../../utils/logger';
import {
    sendSuccess,
    sendError,
    respondWithPaginatedResults,
    asyncHandler,
    ensureResourceExists,
    checkTenantAccess,
    getRequestContext,
    createAuditLog,
} from '../../../utils/responseHelpers';

// Import services
import { DiagnosticService } from '../services/diagnosticService';
import { PharmacistReviewService } from '../services/pharmacistReviewService';

// Import models
import DiagnosticRequest from '../models/DiagnosticRequest';
import DiagnosticResult from '../models/DiagnosticResult';

const diagnosticService = new DiagnosticService();
const pharmacistReviewService = new PharmacistReviewService();

/**
 * Diagnostic Controller
 * Handles all diagnostic-related API endpoints
 */

// ===============================
// DIAGNOSTIC REQUEST OPERATIONS
// ===============================

/**
 * POST /api/diagnostics
 * Create new diagnostic request
 */
export const createDiagnosticRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const {
            patientId,
            inputSnapshot,
            priority = 'routine',
            consentObtained,
        } = req.body;

        // Validate consent
        if (!consentObtained) {
            return sendError(
                res,
                'BAD_REQUEST',
                'Patient consent is required for AI diagnostic processing',
                400
            );
        }

        try {
            // Create diagnostic request
            const diagnosticRequest = await diagnosticService.createDiagnosticRequest({
                patientId,
                pharmacistId: context.userId,
                workplaceId: context.workplaceId,
                locationId: context.locationId,
                inputSnapshot,
                priority,
                consentObtained,
            });

            // Start processing asynchronously (don't await)
            diagnosticService
                .processDiagnosticRequest(diagnosticRequest._id.toString())
                .catch((error) => {
                    logger.error('Async diagnostic processing failed:', {
                        requestId: diagnosticRequest._id,
                        error: error.message,
                    });
                });

            // Create audit log
            console.log(
                'Diagnostic request created:',
                createAuditLog(
                    'CREATE_DIAGNOSTIC_REQUEST',
                    'DiagnosticRequest',
                    diagnosticRequest._id.toString(),
                    context,
                    {
                        patientId,
                        priority,
                        symptomsCount: inputSnapshot.symptoms.subjective.length,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    request: diagnosticRequest,
                    message: 'Diagnostic request created successfully. Processing will begin shortly.',
                },
                'Diagnostic request created successfully',
                201
            );
        } catch (error) {
            logger.error('Failed to create diagnostic request:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to create diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/diagnostics/:id
 * Get diagnostic request and result with polling support
 */
export const getDiagnosticRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const context = getRequestContext(req);

        try {
            // Get diagnostic request
            const request = await diagnosticService.getDiagnosticRequest(
                id,
                context.workplaceId
            );

            if (!request) {
                return sendError(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
            }

            // Check tenant access
            checkTenantAccess(
                request.workplaceId.toString(),
                context.workplaceId,
                context.isAdmin
            );

            // Get diagnostic result if available
            let result = null;
            if (request.status === 'completed') {
                result = await diagnosticService.getDiagnosticResult(
                    id,
                    context.workplaceId
                );
            }

            // Prepare response data
            const responseData = {
                request,
                result,
                status: request.status,
                processingTime: request.processingDuration,
                isActive: ['pending', 'processing'].includes(request.status),
                canRetry: request.status === 'failed' && request.retryCount < 3,
            };

            sendSuccess(
                res,
                responseData,
                'Diagnostic request retrieved successfully'
            );
        } catch (error) {
            logger.error('Failed to get diagnostic request:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/diagnostics/:id/retry
 * Retry failed diagnostic request
 */
export const retryDiagnosticRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const context = getRequestContext(req);

        try {
            // Get diagnostic request to verify ownership
            const request = await DiagnosticRequest.findOne({
                _id: id,
                workplaceId: new Types.ObjectId(context.workplaceId),
                isDeleted: false,
            });

            if (!request) {
                return sendError(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
            }

            // Check if retry is allowed
            if (!request.canRetry()) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'Request cannot be retried (maximum attempts exceeded or invalid status)',
                    400
                );
            }

            // Retry processing
            const result = await diagnosticService.retryDiagnosticRequest(id);

            // Create audit log
            console.log(
                'Diagnostic request retried:',
                createAuditLog(
                    'RETRY_DIAGNOSTIC_REQUEST',
                    'DiagnosticRequest',
                    id,
                    context,
                    {
                        retryCount: request.retryCount + 1,
                        previousStatus: request.status,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    request: result.request,
                    result: result.result,
                    processingTime: result.processingTime,
                },
                'Diagnostic request retried successfully'
            );
        } catch (error) {
            logger.error('Failed to retry diagnostic request:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to retry diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * DELETE /api/diagnostics/:id
 * Cancel diagnostic request
 */
export const cancelDiagnosticRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const context = getRequestContext(req);

        try {
            // Get diagnostic request to verify ownership
            const request = await DiagnosticRequest.findOne({
                _id: id,
                workplaceId: new Types.ObjectId(context.workplaceId),
                isDeleted: false,
            });

            if (!request) {
                return sendError(res, 'NOT_FOUND', 'Diagnostic request not found', 404);
            }

            // Check if cancellation is allowed
            if (!['pending', 'processing'].includes(request.status)) {
                return sendError(
                    res,
                    'BAD_REQUEST',
                    'Can only cancel pending or processing requests',
                    400
                );
            }

            // Cancel the request
            await diagnosticService.cancelDiagnosticRequest(id, context.userId);

            // Create audit log
            console.log(
                'Diagnostic request cancelled:',
                createAuditLog(
                    'CANCEL_DIAGNOSTIC_REQUEST',
                    'DiagnosticRequest',
                    id,
                    context,
                    {
                        previousStatus: request.status,
                    }
                )
            );

            sendSuccess(res, null, 'Diagnostic request cancelled successfully');
        } catch (error) {
            logger.error('Failed to cancel diagnostic request:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to cancel diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

// ===============================
// DIAGNOSTIC HISTORY OPERATIONS
// ===============================

/**
 * GET /api/diagnostics/history/:patientId
 * Get patient diagnostic history with pagination
 */
export const getPatientDiagnosticHistory = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { patientId } = req.params;
        const { page = 1, limit = 20 } = req.query as any;
        const context = getRequestContext(req);

        // Parse pagination parameters
        const parsedPage = Math.max(1, parseInt(page as string) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit as string) || 20));

        try {
            // Get patient diagnostic history
            const history = await diagnosticService.getPatientDiagnosticHistory(
                patientId,
                context.workplaceId,
                parsedPage,
                parsedLimit
            );

            respondWithPaginatedResults(
                res,
                history.requests,
                history.total,
                history.page,
                parsedLimit,
                `Found ${history.total} diagnostic requests for patient`
            );
        } catch (error) {
            logger.error('Failed to get patient diagnostic history:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get patient diagnostic history: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/diagnostics/dashboard
 * Get diagnostic dashboard data
 */
export const getDiagnosticDashboard = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);

        try {
            // Get dashboard statistics
            const [
                totalRequests,
                pendingRequests,
                processingRequests,
                completedRequests,
                failedRequests,
                pendingReviews,
                recentRequests,
            ] = await Promise.all([
                DiagnosticRequest.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    isDeleted: false,
                }),
                DiagnosticRequest.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    status: 'pending',
                    isDeleted: false,
                }),
                DiagnosticRequest.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    status: 'processing',
                    isDeleted: false,
                }),
                DiagnosticRequest.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    status: 'completed',
                    isDeleted: false,
                }),
                DiagnosticRequest.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    status: 'failed',
                    isDeleted: false,
                }),
                DiagnosticResult.countDocuments({
                    workplaceId: new Types.ObjectId(context.workplaceId),
                    pharmacistReview: { $exists: false },
                    isDeleted: false,
                }),
                DiagnosticRequest.find({
                    workplaceId: new Types.ObjectId(context.workplaceId),
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
                    hasStuckProcessing: processingRequests > 0, // Could add time-based logic here
                },
            };

            sendSuccess(
                res,
                dashboardData,
                'Diagnostic dashboard data retrieved successfully'
            );
        } catch (error) {
            logger.error('Failed to get diagnostic dashboard:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get diagnostic dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

// ===============================
// PHARMACIST REVIEW OPERATIONS
// ===============================

/**
 * POST /api/diagnostics/:id/approve
 * Approve diagnostic result
 */
export const approveDiagnosticResult = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { modifications, reviewNotes, clinicalJustification } = req.body;
        const context = getRequestContext(req);

        try {
            // Submit review decision
            const result = await pharmacistReviewService.submitReviewDecision(id, {
                status: modifications ? 'modified' : 'approved',
                modifications,
                reviewNotes,
                clinicalJustification,
                reviewedBy: context.userId,
                workplaceId: context.workplaceId,
            });

            // Create audit log
            console.log(
                'Diagnostic result approved:',
                createAuditLog(
                    'APPROVE_DIAGNOSTIC_RESULT',
                    'DiagnosticResult',
                    id,
                    context,
                    {
                        hasModifications: !!modifications,
                        confidenceScore: result.aiMetadata.confidenceScore,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    result,
                    approved: true,
                    modified: !!modifications,
                },
                'Diagnostic result approved successfully'
            );
        } catch (error) {
            logger.error('Failed to approve diagnostic result:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to approve diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/diagnostics/:id/reject
 * Reject diagnostic result
 */
export const rejectDiagnosticResult = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { rejectionReason, reviewNotes, clinicalJustification } = req.body;
        const context = getRequestContext(req);

        // Validate rejection reason
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            return sendError(
                res,
                'BAD_REQUEST',
                'Rejection reason is required',
                400
            );
        }

        try {
            // Submit review decision
            const result = await pharmacistReviewService.submitReviewDecision(id, {
                status: 'rejected',
                rejectionReason,
                reviewNotes,
                clinicalJustification,
                reviewedBy: context.userId,
                workplaceId: context.workplaceId,
            });

            // Create audit log
            console.log(
                'Diagnostic result rejected:',
                createAuditLog(
                    'REJECT_DIAGNOSTIC_RESULT',
                    'DiagnosticResult',
                    id,
                    context,
                    {
                        rejectionReason: rejectionReason.substring(0, 100), // Truncate for logging
                        confidenceScore: result.aiMetadata.confidenceScore,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    result,
                    rejected: true,
                },
                'Diagnostic result rejected successfully'
            );
        } catch (error) {
            logger.error('Failed to reject diagnostic result:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to reject diagnostic result: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/diagnostics/pending-reviews
 * Get pending diagnostic results for review
 */
export const getPendingReviews = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const {
            page = 1,
            limit = 20,
            priority,
            confidenceMin,
            confidenceMax,
            hasRedFlags,
            orderBy = 'oldest',
        } = req.query as any;
        const context = getRequestContext(req);

        // Parse pagination parameters
        const parsedPage = Math.max(1, parseInt(page as string) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit as string) || 20));

        // Build filters
        const filters: any = {};
        if (priority) filters.priority = priority;
        if (confidenceMin !== undefined || confidenceMax !== undefined) {
            filters.confidenceRange = {
                min: parseFloat(confidenceMin) || 0,
                max: parseFloat(confidenceMax) || 1,
            };
        }
        if (hasRedFlags !== undefined) {
            filters.hasRedFlags = hasRedFlags === 'true';
        }
        if (orderBy) filters.orderBy = orderBy;

        try {
            // Get pending reviews
            const reviews = await pharmacistReviewService.getPendingReviews(
                context.workplaceId,
                parsedPage,
                parsedLimit,
                filters
            );

            respondWithPaginatedResults(
                res,
                reviews.results,
                reviews.total,
                reviews.page,
                parsedLimit,
                `Found ${reviews.total} pending reviews`
            );
        } catch (error) {
            logger.error('Failed to get pending reviews:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get pending reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * POST /api/diagnostics/:id/create-intervention
 * Create clinical intervention from approved diagnostic result
 */
export const createInterventionFromResult = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const interventionData = req.body;
        const context = getRequestContext(req);

        try {
            // Create intervention
            const intervention = await pharmacistReviewService.createInterventionFromResult(
                id,
                interventionData,
                context.userId,
                context.workplaceId
            );

            // Create audit log
            console.log(
                'Intervention created from diagnostic result:',
                createAuditLog(
                    'CREATE_INTERVENTION_FROM_DIAGNOSTIC',
                    'ClinicalIntervention',
                    intervention._id.toString(),
                    context,
                    {
                        diagnosticResultId: id,
                        interventionType: interventionData.type,
                        priority: interventionData.priority,
                    }
                )
            );

            sendSuccess(
                res,
                {
                    intervention,
                },
                'Clinical intervention created successfully',
                201
            );
        } catch (error) {
            logger.error('Failed to create intervention from diagnostic result:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to create intervention: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/diagnostics/review-workflow-status
 * Get review workflow status for workplace
 */
export const getReviewWorkflowStatus = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);

        try {
            // Get workflow status
            const status = await pharmacistReviewService.getReviewWorkflowStatus(
                context.workplaceId
            );

            sendSuccess(
                res,
                status,
                'Review workflow status retrieved successfully'
            );
        } catch (error) {
            logger.error('Failed to get review workflow status:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get review workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/diagnostics/analytics
 * Get diagnostic analytics for workplace
 */
export const getDiagnosticAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { from, to } = req.query as any;
        const context = getRequestContext(req);

        // Default to last 30 days if no date range provided
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();

        try {
            // Get analytics
            const analytics = await pharmacistReviewService.getReviewAnalytics(
                context.workplaceId,
                { from: fromDate, to: toDate }
            );

            sendSuccess(
                res,
                {
                    analytics,
                    dateRange: { from: fromDate, to: toDate },
                },
                'Diagnostic analytics retrieved successfully'
            );
        } catch (error) {
            logger.error('Failed to get diagnostic analytics:', error);
            sendError(
                res,
                'INTERNAL_ERROR',
                `Failed to get diagnostic analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
                500
            );
        }
    }
);