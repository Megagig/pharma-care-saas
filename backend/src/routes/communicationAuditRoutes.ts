import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { auth } from '../middlewares/auth';
import rbac from '../middlewares/rbac';
import communicationAuditController from '../controllers/communicationAuditController';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array(),
        });
        return;
    }
    next();
};

/**
 * @route   GET /api/communication/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin, Pharmacist, Doctor)
 */
router.get(
    '/logs',
    auth,
    rbac(['admin', 'pharmacist', 'doctor']),
    [
        query('userId').optional().isMongoId(),
        query('action').optional().isString().trim(),
        query('targetType').optional().isIn(['conversation', 'message', 'user', 'file', 'notification']),
        query('conversationId').optional().isMongoId(),
        query('patientId').optional().isMongoId(),
        query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
        query('complianceCategory').optional().isString().trim(),
        query('success').optional().isBoolean(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    communicationAuditController.getAuditLogs
);

/**
 * @route   GET /api/communication/audit/conversations/:conversationId/logs
 * @desc    Get audit logs for a specific conversation
 * @access  Private (Admin, Pharmacist, Doctor)
 */
router.get(
    '/conversations/:conversationId/logs',
    auth,
    rbac(['admin', 'pharmacist', 'doctor']),
    [
        param('conversationId').isMongoId(),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.getConversationAuditLogs
);

/**
 * @route   GET /api/communication/audit/high-risk
 * @desc    Get high-risk activities
 * @access  Private (Admin, Pharmacist)
 */
router.get(
    '/high-risk',
    auth,
    rbac(['admin', 'pharmacist']),
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.getHighRiskActivities
);

/**
 * @route   GET /api/communication/audit/compliance-report
 * @desc    Generate compliance report
 * @access  Private (Admin, Pharmacist)
 */
router.get(
    '/compliance-report',
    auth,
    rbac(['admin', 'pharmacist']),
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.generateComplianceReport
);

/**
 * @route   GET /api/communication/audit/export
 * @desc    Export audit logs
 * @access  Private (Admin, Pharmacist)
 */
router.get(
    '/export',
    auth,
    rbac(['admin', 'pharmacist']),
    [
        query('format').optional().isIn(['csv', 'json']),
        query('userId').optional().isMongoId(),
        query('action').optional().isString().trim(),
        query('targetType').optional().isIn(['conversation', 'message', 'user', 'file', 'notification']),
        query('conversationId').optional().isMongoId(),
        query('patientId').optional().isMongoId(),
        query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
        query('complianceCategory').optional().isString().trim(),
        query('success').optional().isBoolean(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.exportAuditLogs
);

/**
 * @route   GET /api/communication/audit/users/:userId/activity
 * @desc    Get user activity summary
 * @access  Private (Admin, Pharmacist, Doctor - own data or admin access)
 */
router.get(
    '/users/:userId/activity',
    auth,
    rbac(['admin', 'pharmacist', 'doctor']),
    [
        param('userId').isMongoId(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.getUserActivitySummary
);

/**
 * @route   GET /api/communication/audit/statistics
 * @desc    Get audit statistics
 * @access  Private (Admin, Pharmacist)
 */
router.get(
    '/statistics',
    auth,
    rbac(['admin', 'pharmacist']),
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    handleValidationErrors,
    communicationAuditController.getAuditStatistics
);

/**
 * @route   GET /api/communication/audit/search
 * @desc    Search audit logs
 * @access  Private (Admin, Pharmacist, Doctor)
 */
router.get(
    '/search',
    auth,
    rbac(['admin', 'pharmacist', 'doctor']),
    [
        query('q').isString().trim().isLength({ min: 2, max: 100 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    communicationAuditController.searchAuditLogs
);

/**
 * @route   GET /api/communication/audit/health
 * @desc    Health check for communication audit module
 * @access  Private (Admin)
 */
router.get(
    '/health',
    auth,
    rbac(['admin']),
    (req, res) => {
        res.json({
            status: 'OK',
            module: 'communication-audit',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            features: {
                auditLogging: true,
                complianceReporting: true,
                riskAssessment: true,
                dataExport: true,
                realTimeMonitoring: true,
            },
        });
    }
);

export default router;