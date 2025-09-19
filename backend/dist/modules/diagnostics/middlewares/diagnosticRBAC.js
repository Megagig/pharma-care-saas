"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticAnalyticsMiddleware = exports.diagnosticApproveMiddleware = exports.diagnosticReviewMiddleware = exports.diagnosticProcessMiddleware = exports.diagnosticCreateMiddleware = exports.validatePatientConsent = exports.checkDiagnosticResultAccess = exports.checkDiagnosticAccess = exports.checkAIProcessingLimits = exports.checkDiagnosticLimits = exports.requireSeniorPharmacistRole = exports.requirePharmacistRole = exports.requireDiagnosticAnalyticsFeature = exports.requireDrugInteractionFeature = exports.requireLabIntegrationFeature = exports.requireAIDiagnosticsFeature = exports.requireDiagnosticAnalytics = exports.requireDiagnosticRetry = exports.requireDiagnosticCancel = exports.requireDiagnosticIntervention = exports.requireDiagnosticApprove = exports.requireDiagnosticReview = exports.requireDiagnosticProcess = exports.requireDiagnosticCreate = exports.requireDiagnosticRead = void 0;
const auth_1 = require("../../../middlewares/auth");
const rbac_1 = require("../../../middlewares/rbac");
const logger_1 = __importDefault(require("../../../utils/logger"));
exports.requireDiagnosticRead = (0, rbac_1.requirePermission)('diagnostic:read');
exports.requireDiagnosticCreate = (0, rbac_1.requirePermission)('diagnostic:create');
exports.requireDiagnosticProcess = (0, rbac_1.requirePermission)('diagnostic:process');
exports.requireDiagnosticReview = (0, rbac_1.requirePermission)('diagnostic:review');
exports.requireDiagnosticApprove = (0, rbac_1.requirePermission)('diagnostic:approve');
exports.requireDiagnosticIntervention = (0, rbac_1.requirePermission)('diagnostic:intervention');
exports.requireDiagnosticCancel = (0, rbac_1.requirePermission)('diagnostic:cancel');
exports.requireDiagnosticRetry = (0, rbac_1.requirePermission)('diagnostic:retry');
exports.requireDiagnosticAnalytics = (0, rbac_1.requirePermission)('diagnostic:analytics');
exports.requireAIDiagnosticsFeature = (0, auth_1.requireFeature)('ai_diagnostics');
exports.requireLabIntegrationFeature = (0, auth_1.requireFeature)('lab_integration');
exports.requireDrugInteractionFeature = (0, auth_1.requireFeature)('drug_interactions');
exports.requireDiagnosticAnalyticsFeature = (0, auth_1.requireFeature)('diagnostic_analytics');
const requirePharmacistRole = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    if (req.user.role === 'super_admin') {
        return next();
    }
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
exports.requirePharmacistRole = requirePharmacistRole;
const requireSeniorPharmacistRole = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    if (req.user.role === 'super_admin') {
        return next();
    }
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
exports.requireSeniorPharmacistRole = requireSeniorPharmacistRole;
const checkDiagnosticLimits = async (req, res, next) => {
    try {
        if (!req.user || !req.workspaceContext || !req.workspaceContext.workspace || !req.workspaceContext.plan) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const { workspace, plan } = req.workspaceContext;
        if (!req.workspaceContext.isSubscriptionActive) {
            if (workspace.subscriptionStatus === 'trial' && !req.workspaceContext.isTrialExpired) {
                const trialLimit = 10;
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
            }
            else {
                res.status(402).json({
                    success: false,
                    message: 'Active subscription required for diagnostic features',
                    upgradeRequired: true,
                });
                return;
            }
        }
        if (plan?.limits?.diagnosticRequests) {
            const limit = plan.limits.diagnosticRequests;
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
            req.diagnosticUsage = {
                current: monthlyUsage,
                limit,
                remaining: limit - monthlyUsage,
            };
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking diagnostic limits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic limits',
        });
    }
};
exports.checkDiagnosticLimits = checkDiagnosticLimits;
const checkAIProcessingLimits = async (req, res, next) => {
    try {
        if (!req.user || !req.workspaceContext || !req.workspaceContext.workspace || !req.workspaceContext.plan) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const { workspace, plan } = req.workspaceContext;
        if (plan?.limits?.aiTokens) {
            const tokenLimit = plan.limits.aiTokens;
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
            req.aiUsage = {
                tokens: {
                    current: currentTokenUsage,
                    limit: tokenLimit,
                    remaining: tokenLimit - currentTokenUsage,
                },
            };
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking AI processing limits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check AI processing limits',
        });
    }
};
exports.checkAIProcessingLimits = checkAIProcessingLimits;
const checkDiagnosticAccess = async (req, res, next) => {
    try {
        if (!req.user || !req.workspaceContext || !req.workspaceContext.workspace) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const { id } = req.params;
        if (!id) {
            return next();
        }
        const DiagnosticRequest = require('../models/DiagnosticRequest').default;
        const request = await DiagnosticRequest.findOne({
            _id: id,
            workplaceId: req.workspaceContext.workspace._id,
            isDeleted: false,
        });
        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic request not found or access denied',
            });
            return;
        }
        req.diagnosticRequest = request;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking diagnostic access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic access',
        });
    }
};
exports.checkDiagnosticAccess = checkDiagnosticAccess;
const checkDiagnosticResultAccess = async (req, res, next) => {
    try {
        if (!req.user || !req.workspaceContext || !req.workspaceContext.workspace) {
            res.status(401).json({
                success: false,
                message: 'Authentication and workspace context required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const { id } = req.params;
        if (!id) {
            return next();
        }
        const DiagnosticResult = require('../models/DiagnosticResult').default;
        const result = await DiagnosticResult.findOne({
            _id: id,
            workplaceId: req.workspaceContext.workspace._id,
            isDeleted: false,
        });
        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic result not found or access denied',
            });
            return;
        }
        req.diagnosticResult = result;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking diagnostic result access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check diagnostic result access',
        });
    }
};
exports.checkDiagnosticResultAccess = checkDiagnosticResultAccess;
const validatePatientConsent = (req, res, next) => {
    const { consentObtained, consentTimestamp } = req.body;
    if (!consentObtained) {
        res.status(400).json({
            success: false,
            message: 'Patient consent is required for AI diagnostic processing',
            code: 'CONSENT_REQUIRED',
        });
        return;
    }
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
exports.validatePatientConsent = validatePatientConsent;
exports.diagnosticCreateMiddleware = [
    rbac_1.requireActiveSubscription,
    exports.requireAIDiagnosticsFeature,
    exports.requirePharmacistRole,
    exports.requireDiagnosticCreate,
    exports.checkDiagnosticLimits,
    exports.validatePatientConsent,
];
exports.diagnosticProcessMiddleware = [
    rbac_1.requireActiveSubscription,
    exports.requireAIDiagnosticsFeature,
    exports.requirePharmacistRole,
    exports.requireDiagnosticProcess,
    exports.checkAIProcessingLimits,
    exports.checkDiagnosticAccess,
];
exports.diagnosticReviewMiddleware = [
    rbac_1.requireActiveSubscription,
    exports.requireAIDiagnosticsFeature,
    exports.requireSeniorPharmacistRole,
    exports.requireDiagnosticReview,
    exports.checkDiagnosticResultAccess,
];
exports.diagnosticApproveMiddleware = [
    rbac_1.requireActiveSubscription,
    exports.requireAIDiagnosticsFeature,
    exports.requireSeniorPharmacistRole,
    exports.requireDiagnosticApprove,
    exports.checkDiagnosticResultAccess,
];
exports.diagnosticAnalyticsMiddleware = [
    rbac_1.requireActiveSubscription,
    exports.requireDiagnosticAnalyticsFeature,
    exports.requireSeniorPharmacistRole,
    exports.requireDiagnosticAnalytics,
];
exports.default = {
    requireDiagnosticRead: exports.requireDiagnosticRead,
    requireDiagnosticCreate: exports.requireDiagnosticCreate,
    requireDiagnosticProcess: exports.requireDiagnosticProcess,
    requireDiagnosticReview: exports.requireDiagnosticReview,
    requireDiagnosticApprove: exports.requireDiagnosticApprove,
    requireDiagnosticIntervention: exports.requireDiagnosticIntervention,
    requireDiagnosticCancel: exports.requireDiagnosticCancel,
    requireDiagnosticRetry: exports.requireDiagnosticRetry,
    requireDiagnosticAnalytics: exports.requireDiagnosticAnalytics,
    requireAIDiagnosticsFeature: exports.requireAIDiagnosticsFeature,
    requireLabIntegrationFeature: exports.requireLabIntegrationFeature,
    requireDrugInteractionFeature: exports.requireDrugInteractionFeature,
    requireDiagnosticAnalyticsFeature: exports.requireDiagnosticAnalyticsFeature,
    requirePharmacistRole: exports.requirePharmacistRole,
    requireSeniorPharmacistRole: exports.requireSeniorPharmacistRole,
    checkDiagnosticLimits: exports.checkDiagnosticLimits,
    checkAIProcessingLimits: exports.checkAIProcessingLimits,
    checkDiagnosticAccess: exports.checkDiagnosticAccess,
    checkDiagnosticResultAccess: exports.checkDiagnosticResultAccess,
    validatePatientConsent: exports.validatePatientConsent,
    diagnosticCreateMiddleware: exports.diagnosticCreateMiddleware,
    diagnosticProcessMiddleware: exports.diagnosticProcessMiddleware,
    diagnosticReviewMiddleware: exports.diagnosticReviewMiddleware,
    diagnosticApproveMiddleware: exports.diagnosticApproveMiddleware,
    diagnosticAnalyticsMiddleware: exports.diagnosticAnalyticsMiddleware,
};
//# sourceMappingURL=diagnosticRBAC.js.map