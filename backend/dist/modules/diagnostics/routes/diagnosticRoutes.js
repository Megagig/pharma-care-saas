"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const diagnosticController_1 = require("../controllers/diagnosticController");
const auth_1 = require("../../../middlewares/auth");
const authWithWorkspace_1 = require("../../../middlewares/authWithWorkspace");
const diagnosticRBAC_1 = require("../middlewares/diagnosticRBAC");
const diagnosticValidators_1 = require("../validators/diagnosticValidators");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(authWithWorkspace_1.authWithWorkspace);
router.post('/', ...diagnosticRBAC_1.diagnosticCreateMiddleware, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.createDiagnosticRequestSchema, 'body'), diagnosticController_1.createDiagnosticRequest);
router.get('/dashboard', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticRead, diagnosticController_1.getDiagnosticDashboard);
router.get('/pending-reviews', ...diagnosticRBAC_1.diagnosticReviewMiddleware, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.pendingReviewsQuerySchema, 'query'), diagnosticController_1.getPendingReviews);
router.get('/review-workflow-status', ...diagnosticRBAC_1.diagnosticReviewMiddleware, diagnosticController_1.getReviewWorkflowStatus);
router.get('/analytics', ...diagnosticRBAC_1.diagnosticAnalyticsMiddleware, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.analyticsQuerySchema, 'query'), diagnosticController_1.getDiagnosticAnalytics);
router.get('/cases/all', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticRead, diagnosticController_1.getAllDiagnosticCases);
router.get('/referrals', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticRead, diagnosticController_1.getDiagnosticReferrals);
router.get('/history/:patientId', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticRead, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.patientHistoryParamsSchema, 'params'), (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticQuerySchema, 'query'), diagnosticController_1.getPatientDiagnosticHistory);
router.get('/:id', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticRead, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), diagnosticRBAC_1.checkDiagnosticAccess, diagnosticController_1.getDiagnosticRequest);
router.post('/:id/retry', ...diagnosticRBAC_1.diagnosticProcessMiddleware, diagnosticRBAC_1.requireDiagnosticRetry, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), diagnosticController_1.retryDiagnosticRequest);
router.delete('/:id', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticCancel, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), diagnosticRBAC_1.checkDiagnosticAccess, diagnosticController_1.cancelDiagnosticRequest);
router.post('/:id/approve', ...diagnosticRBAC_1.diagnosticApproveMiddleware, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.approveResultSchema, 'body'), diagnosticController_1.approveDiagnosticResult);
router.post('/:id/reject', ...diagnosticRBAC_1.diagnosticApproveMiddleware, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.rejectResultSchema, 'body'), diagnosticController_1.rejectDiagnosticResult);
router.post('/:id/create-intervention', diagnosticRBAC_1.requirePharmacistRole, diagnosticRBAC_1.requireDiagnosticIntervention, (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.diagnosticParamsSchema, 'params'), (0, diagnosticValidators_1.validateRequest)(diagnosticValidators_1.createInterventionSchema, 'body'), diagnosticRBAC_1.checkDiagnosticResultAccess, diagnosticController_1.createInterventionFromResult);
router.use((error, req, res, next) => {
    console.error('Diagnostic API Error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    if (error.message.includes('consent')) {
        return res.status(400).json({
            success: false,
            message: 'Patient consent validation failed',
            code: 'CONSENT_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('AI service')) {
        return res.status(502).json({
            success: false,
            message: 'AI service temporarily unavailable',
            code: 'AI_SERVICE_ERROR',
            details: 'Please try again later or contact support if the issue persists',
        });
    }
    if (error.message.includes('processing timeout')) {
        return res.status(504).json({
            success: false,
            message: 'Diagnostic processing timeout',
            code: 'PROCESSING_TIMEOUT',
            details: 'The diagnostic analysis is taking longer than expected. You can retry the request.',
        });
    }
    if (error.message.includes('retry')) {
        return res.status(400).json({
            success: false,
            message: 'Retry operation failed',
            code: 'RETRY_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('review')) {
        return res.status(400).json({
            success: false,
            message: 'Review operation failed',
            code: 'REVIEW_ERROR',
            details: error.message,
        });
    }
    if (error.message.includes('intervention')) {
        return res.status(400).json({
            success: false,
            message: 'Intervention creation failed',
            code: 'INTERVENTION_ERROR',
            details: error.message,
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            message: 'Data validation failed',
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map((err) => err.message),
        });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID',
            details: 'The provided ID is not in the correct format',
        });
    }
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate resource',
            code: 'DUPLICATE_ERROR',
            details: 'A resource with this identifier already exists',
        });
    }
    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_ERROR',
            details: 'Too many requests. Please try again later.',
        });
    }
    if (error.status === 402) {
        return res.status(402).json({
            success: false,
            message: 'Subscription required',
            code: 'SUBSCRIPTION_ERROR',
            details: error.message,
            upgradeRequired: true,
        });
    }
    return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error,
        }),
    });
});
exports.default = router;
//# sourceMappingURL=diagnosticRoutes.js.map