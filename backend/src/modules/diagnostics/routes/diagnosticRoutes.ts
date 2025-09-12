import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { auth, requireFeature, requireLicense } from '../../../middlewares/auth';
import { auditLogger } from '../../../middlewares/auditMiddleware';
import diagnosticController from '../controllers/diagnosticController';
import {
    validateDiagnosticRequest,
    validatePharmacistReview,
    validateInteractionCheck,
    formatValidationErrors
} from '../utils/validators';

const router = Router();

// Rate limiting for AI API calls (more restrictive)
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 10, // 10 requests per 15 minutes in production
    message: {
        success: false,
        message: 'Too many AI diagnostic requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for general diagnostic endpoints
const diagnosticRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 200 : 100, // 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many diagnostic requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation middleware
const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
    const { error } = schema(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formatValidationErrors(error)
        });
    }
    next();
};

/**
 * @route POST /api/diagnostics
 * @desc Create new diagnostic request with AI analysis
 * @access Private (requires license and clinical_decision_support feature)
 */
router.post(
    '/',
    aiRateLimit,
    auth,
    requireLicense,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'CREATE_DIAGNOSTIC_REQUEST',
        resourceType: 'DiagnosticRequest',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'medium'
    }),
    validateRequest(validateDiagnosticRequest),
    diagnosticController.createRequest
);

/**
 * @route GET /api/diagnostics/:requestId
 * @desc Get diagnostic result by request ID
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
    '/:requestId',
    diagnosticRateLimit,
    auth,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'VIEW_DIAGNOSTIC_RESULT',
        resourceType: 'DiagnosticResult',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    diagnosticController.getResult
);

/**
 * @route GET /api/diagnostics/requests/:requestId
 * @desc Get diagnostic request by ID
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
    '/requests/:requestId',
    diagnosticRateLimit,
    auth,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'VIEW_DIAGNOSTIC_REQUEST',
        resourceType: 'DiagnosticRequest',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    diagnosticController.getRequest
);

/**
 * @route GET /api/diagnostics/history
 * @desc Get diagnostic history with optional patient filter
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
    '/history',
    diagnosticRateLimit,
    auth,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'VIEW_DIAGNOSTIC_HISTORY',
        resourceType: 'DiagnosticRequest',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    diagnosticController.getHistory
);

/**
 * @route POST /api/diagnostics/results/:resultId/approve
 * @desc Approve diagnostic result
 * @access Private (requires license)
 */
router.post(
    '/results/:resultId/approve',
    diagnosticRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'APPROVE_DIAGNOSTIC_RESULT',
        resourceType: 'DiagnosticResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    diagnosticController.approveResult
);

/**
 * @route POST /api/diagnostics/results/:resultId/modify
 * @desc Modify diagnostic result
 * @access Private (requires license)
 */
router.post(
    '/results/:resultId/modify',
    diagnosticRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'MODIFY_DIAGNOSTIC_RESULT',
        resourceType: 'DiagnosticResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    validateRequest(validatePharmacistReview),
    diagnosticController.modifyResult
);

/**
 * @route POST /api/diagnostics/results/:resultId/reject
 * @desc Reject diagnostic result
 * @access Private (requires license)
 */
router.post(
    '/results/:resultId/reject',
    diagnosticRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'REJECT_DIAGNOSTIC_RESULT',
        resourceType: 'DiagnosticResult',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'high'
    }),
    validateRequest(validatePharmacistReview),
    diagnosticController.rejectResult
);

/**
 * @route POST /api/diagnostics/requests/:requestId/cancel
 * @desc Cancel diagnostic request
 * @access Private (requires license)
 */
router.post(
    '/requests/:requestId/cancel',
    diagnosticRateLimit,
    auth,
    requireLicense,
    auditLogger({
        action: 'CANCEL_DIAGNOSTIC_REQUEST',
        resourceType: 'DiagnosticRequest',
        complianceCategory: 'clinical_documentation',
        riskLevel: 'medium'
    }),
    diagnosticController.cancelRequest
);

/**
 * @route GET /api/diagnostics/requests/:requestId/status
 * @desc Get processing status of diagnostic request
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
    '/requests/:requestId/status',
    diagnosticRateLimit,
    auth,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'CHECK_DIAGNOSTIC_STATUS',
        resourceType: 'DiagnosticRequest',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    diagnosticController.getStatus
);

/**
 * @route GET /api/diagnostics/analytics
 * @desc Get diagnostic analytics
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
    '/analytics',
    diagnosticRateLimit,
    auth,
    requireFeature('clinical_decision_support'),
    auditLogger({
        action: 'VIEW_DIAGNOSTIC_ANALYTICS',
        resourceType: 'DiagnosticAnalytics',
        complianceCategory: 'data_access',
        riskLevel: 'low'
    }),
    diagnosticController.getAnalytics
);

export default router;