import { Response, NextFunction } from 'express';
import { AuthRequest, requireFeature } from '../../../middlewares/auth';
import { requirePermission, requireActiveSubscription } from '../../../middlewares/rbac';
import logger from '../../../utils/logger';

/**
 * Diagnostic Module RBAC Middleware
 * Role-based access control for diagnostic operations
 */

// ===============================
// DIAGNOSTIC PERMISSIONS
// ===============================

/**
 * Require permission to read diagnostic data
 */
export const requireDiagnosticRead = requirePermission('diagnostic:read');

/**
 * Require permission to create diagnostic requests
 */
export const requireDiagnosticCreate = requirePermission('diagnostic:create');

/**
 * Require permission to process diagnostic requests (AI analysis)
 */
export const requireDiagnosticProcess = requirePermission('diagnostic:process');

/**
 * Require permission to review diagnostic results
 */
export const requireDiagnosticReview = requirePermission('diagnostic:review');

/**
 * Require permission to approve/reject diagnostic results
 */
export const requireDiagnosticApprove = requirePermission('diagnostic:approve');

/**
 * Require permission to create interventions from diagnostic results
 */
export const requireDiagnosticIntervention = requirePermission('diagnostic:intervention');

/**
 * Require permission to cancel diagnostic requests
 */
export const requireDiagnosticCancel = requirePermission('diagnostic:cancel');

/**
 * Require permission to retry failed diagnostic requests
 */
export const requireDiagnosticRetry = requirePermission('diagnostic:retry');

/**
 * Require permission to view diagnostic analytics
 */
export const requireDiagnosticAnalytics = requirePermission('diagnostic:analytics');

// ===============================
// FEATURE REQUIREMENTS
// ===============================

/**
 * Require AI diagnostics feature to be enabled
 */
export const requireAIDiagnosticsFeature = requireFeature('ai_diagnostics');

/**
 * Require lab integration feature to be enabled
 */
export const requireLabIntegrationFeature = requireFeature('lab_integration');

/**
 * Require drug interaction checking feature to be enabled
 */
export const requireDrugInteractionFeature = requireFeature('drug_interactions');

/**
 * Require diagnostic analytics feature to be enabled
 */
export const requireDiagnosticAnalyticsFeature = requireFeature('diagnostic_analytics');

// ===============================
// ROLE-BASED RESTRICTIONS
// ===============================

/**
 * Ensure only pharmacists can create diagnostic requests
 */
export const requirePharmacistRole = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    // Super admin bypasses role checks
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Check if user is a pharmacist
    const allowedRoles = ['pharmacist', 'senior_pharmacist', 'chief_pharmacist'];
    const allowedWorkplaceRoles = ['pharmacist', 'senior_pharmacist', 'pharmacy_manager', 'owner'];

    const hasSystemRole = allowedRoles.includes(req.user.role);
    const hasWorkplaceRole = req.user.workplaceRole && allowedWorkplaceRoles.includes(req.user.workplaceRole);

    if (!hasSystemRole && !hasWorkplaceRole) {
        res.status(403).json({
            success: false,
            message: 'Only pharmacists can perform diagnostic operations',
            requiredRoles: allowedRoles,
            requiredWorkplaceRoles: allowedWorkplaceRoles,
            userRole: req.user.role,
            userWorkplaceRole: req.user.workplaceRole,
        });
        return;
    }

    next();
};

/**
 * Ensure only senior pharmacists can approve diagnostic results
 */
export const requireSeniorPharmacistRole = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    // Super admin bypasses role checks
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Check if user is a senior pharmacist or higher
    const allowedRoles = ['senior_pharmacist', 'chief_pharmacist'];
    const allowedWorkplaceRoles = ['senior_pharmacist', 'pharmacy_manager', 'owner'];

    const hasSystemRole = allowedRoles.includes(req.user.role);
    const hasWorkplaceRole = req.user.workplaceRole && allowedWorkplaceRoles.includes(req.user.workplaceRole);

    if (!hasSystemRole && !hasWorkplaceRole) {
        res.status(403).json({
            success: false,
            message: 'Only senior pharmacists can approve diagnostic results',
            requiredRoles: allowedRoles,
            requiredWorkplaceRoles: allowedWorkplaceRoles,
            userRole: req.user.role,
            userWorkplaceRole: req.user.workplaceRole,
        });
        return;
    }

    next();
};

// ===============================
// USAGE LIMITS AND QUOTAS
// ===============================

/**
 * Check diagnostic request limits based on subscription plan
 */
export const checkDiagnosticLimits = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !(req as any).workspaceContext || !(req as any).workspaceContext.workspace || !(req as any).workspaceContext.plan) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }

        // Super admin bypasses limits
        if (req.user.role === 'super_admin') {
            return next();
        }

        const { workspace, plan } = (req as any).workspaceContext;

        // Check if subscription is active
        if (!(req as any).workspaceContext.isSubscriptionActive) {
            // Allow trial users with limits
            if (workspace.subscriptionStatus === 'trial' && !(req as any).workspaceContext.isTrialExpired) {
                // Trial users get limited diagnostic requests
                const trialLimit = 10; // 10 diagnostic requests per trial

                // Import DiagnosticRequest model to check usage
                const DiagnosticRequest = require('../models/DiagnosticRequest').default;
                const currentUsage = await DiagnosticRequest.countDocuments({
                    workplaceId: workspace._id,
                    isDeleted: false,
                });

                if (currentUsage >= trialLimit) {
                    res.status(402).json({
                        success: false,
                        message: 'Trial diagnostic request limit reached',
                        currentUsage,
                        limit: trialLimit,
                        upgradeRequired: true,
                    });
                    return;
                }
            } else {
                res.status(402).json({
                    success: false,
                    message: 'Active subscription required for diagnostic features',
                    upgradeRequired: true,
                });
                return;
            }
        }

        // Check plan-specific limits
        if (plan?.limits?.diagnosticRequests) {
            const limit = plan.limits.diagnosticRequests;

            // Get current month usage
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const DiagnosticRequest = require('../models/DiagnosticRequest').default;
            const monthlyUsage = await DiagnosticRequest.countDocuments({
                workplaceId: workspace._id,
                createdAt: { $gte: startOfMonth },
                isDeleted: false,
            });

            if (monthlyUsage >= limit) {
                res.status(402).json({
                    success: false,
                    message: 'Monthly diagnostic request limit reached',
                    currentUsage: monthlyUsage,
                    limit,
                    upgradeRequired: true,
                });
                return;
            }

            // Add usage info to request for logging
            req.diagnosticUsage = {
                current: monthlyUsage,
                limit,
                remaining: limit - monthlyUsage,
            };
        }

        next();
    } catch (error) {
        logger.error('Error checking diagnostic limits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic limits',
        });
    }
};

/**
 * Check AI processing limits (token usage, API calls)
 */
export const checkAIProcessingLimits = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !(req as any).workspaceContext || !(req as any).workspaceContext.workspace || !(req as any).workspaceContext.plan) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }

        // Super admin bypasses limits
        if (req.user.role === 'super_admin') {
            return next();
        }

        const { workspace, plan } = (req as any).workspaceContext;

        // Check AI token limits
        if (plan?.limits?.aiTokens) {
            const tokenLimit = plan.limits.aiTokens;

            // Get current month AI usage
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const DiagnosticResult = require('../models/DiagnosticResult').default;
            const monthlyTokenUsage = await DiagnosticResult.aggregate([
                {
                    $match: {
                        workplaceId: workspace._id,
                        createdAt: { $gte: startOfMonth },
                        isDeleted: false,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalTokens: { $sum: '$aiMetadata.tokenUsage.totalTokens' },
                    },
                },
            ]);

            const currentTokenUsage = monthlyTokenUsage[0]?.totalTokens || 0;

            if (currentTokenUsage >= tokenLimit) {
                res.status(402).json({
                    success: false,
                    message: 'Monthly AI token limit reached',
                    currentUsage: currentTokenUsage,
                    limit: tokenLimit,
                    upgradeRequired: true,
                });
                return;
            }

            // Add token usage info to request
            req.aiUsage = {
                tokens: {
                    current: currentTokenUsage,
                    limit: tokenLimit,
                    remaining: tokenLimit - currentTokenUsage,
                },
            };
        }

        next();
    } catch (error) {
        logger.error('Error checking AI processing limits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check AI processing limits',
        });
    }
};

// ===============================
// RESOURCE ACCESS CONTROL
// ===============================

/**
 * Ensure user can only access diagnostic requests from their workplace
 */
export const checkDiagnosticAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !(req as any).workspaceContext || !(req as any).workspaceContext.workspace) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }

        // Super admin can access all resources
        if (req.user.role === 'super_admin') {
            return next();
        }

        const { id } = req.params;
        if (!id) {
            return next(); // No specific resource to check
        }

        // Check if diagnostic request belongs to user's workplace
        const DiagnosticRequest = require('../models/DiagnosticRequest').default;
        const request = await DiagnosticRequest.findOne({
            _id: id,
            workplaceId: (req as any).workspaceContext.workspace._id,
            isDeleted: false,
        });

        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic request not found or access denied',
            });
            return;
        }

        // Add request to req object for use in controller
        req.diagnosticRequest = request;
        next();
    } catch (error) {
        logger.error('Error checking diagnostic access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic access',
        });
    }
};

/**
 * Ensure user can only access diagnostic results from their workplace
 */
export const checkDiagnosticResultAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || !(req as any).workspaceContext || !(req as any).workspaceContext.workspace) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }

        // Super admin can access all resources
        if (req.user.role === 'super_admin') {
            return next();
        }

        const { id } = req.params;
        if (!id) {
            return next(); // No specific resource to check
        }

        // Check if diagnostic result belongs to user's workplace
        const DiagnosticResult = require('../models/DiagnosticResult').default;
        const result = await DiagnosticResult.findOne({
            _id: id,
            workplaceId: (req as any).workspaceContext.workspace._id,
            isDeleted: false,
        });

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic result not found or access denied',
            });
            return;
        }

        // Add result to req object for use in controller
        req.diagnosticResult = result;
        next();
    } catch (error) {
        logger.error('Error checking diagnostic result access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic result access',
        });
    }
};

// ===============================
// CONSENT AND COMPLIANCE
// ===============================

/**
 * Validate patient consent for AI processing
 */
export const validatePatientConsent = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const { consentObtained, consentTimestamp } = req.body;

    if (!consentObtained) {
        res.status(400).json({
            success: false,
            message: 'Patient consent is required for AI diagnostic processing',
            code: 'CONSENT_REQUIRED',
        });
        return;
    }

    // Validate consent timestamp if provided
    if (consentTimestamp) {
        const timestamp = new Date(consentTimestamp);
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        if (timestamp < twentyFourHoursAgo || timestamp > now) {
            res.status(400).json({
                success: false,
                message: 'Consent timestamp must be within the last 24 hours',
                code: 'INVALID_CONSENT_TIMESTAMP',
            });
            return;
        }
    }

    next();
};

// ===============================
// COMBINED MIDDLEWARE CHAINS
// ===============================

/**
 * Complete middleware chain for creating diagnostic requests
 */
export const diagnosticCreateMiddleware = [
    requireActiveSubscription,
    requireAIDiagnosticsFeature,
    requirePharmacistRole,
    requireDiagnosticCreate,
    checkDiagnosticLimits,
    validatePatientConsent,
];

/**
 * Complete middleware chain for processing diagnostic requests
 */
export const diagnosticProcessMiddleware = [
    requireActiveSubscription,
    requireAIDiagnosticsFeature,
    requirePharmacistRole,
    requireDiagnosticProcess,
    checkAIProcessingLimits,
    checkDiagnosticAccess,
];

/**
 * Complete middleware chain for reviewing diagnostic results
 */
export const diagnosticReviewMiddleware = [
    requireActiveSubscription,
    requireAIDiagnosticsFeature,
    requireSeniorPharmacistRole,
    requireDiagnosticReview,
    checkDiagnosticResultAccess,
];

/**
 * Complete middleware chain for approving diagnostic results
 */
export const diagnosticApproveMiddleware = [
    requireActiveSubscription,
    requireAIDiagnosticsFeature,
    requireSeniorPharmacistRole,
    requireDiagnosticApprove,
    checkDiagnosticResultAccess,
];

/**
 * Complete middleware chain for diagnostic analytics
 */
export const diagnosticAnalyticsMiddleware = [
    requireActiveSubscription,
    requireDiagnosticAnalyticsFeature,
    requireSeniorPharmacistRole,
    requireDiagnosticAnalytics,
];

// Extend AuthRequest interface to include diagnostic-specific properties
declare global {
    namespace Express {
        interface Request {
            diagnosticUsage?: {
                current: number;
                limit: number;
                remaining: number;
            };
            aiUsage?: {
                tokens: {
                    current: number;
                    limit: number;
                    remaining: number;
                };
            };
            diagnosticRequest?: any;
            diagnosticResult?: any;
        }
    }
}

export default {
    requireDiagnosticRead,
    requireDiagnosticCreate,
    requireDiagnosticProcess,
    requireDiagnosticReview,
    requireDiagnosticApprove,
    requireDiagnosticIntervention,
    requireDiagnosticCancel,
    requireDiagnosticRetry,
    requireDiagnosticAnalytics,
    requireAIDiagnosticsFeature,
    requireLabIntegrationFeature,
    requireDrugInteractionFeature,
    requireDiagnosticAnalyticsFeature,
    requirePharmacistRole,
    requireSeniorPharmacistRole,
    checkDiagnosticLimits,
    checkAIProcessingLimits,
    checkDiagnosticAccess,
    checkDiagnosticResultAccess,
    validatePatientConsent,
    diagnosticCreateMiddleware,
    diagnosticProcessMiddleware,
    diagnosticReviewMiddleware,
    diagnosticApproveMiddleware,
    diagnosticAnalyticsMiddleware,
};