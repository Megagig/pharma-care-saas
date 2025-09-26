"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middlewares/auth");
const rbac_1 = __importDefault(require("../middlewares/rbac"));
const communicationAuditController_1 = __importDefault(require("../controllers/communicationAuditController"));
const router = express_1.default.Router();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.get('/', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist', 'doctor'), [
    (0, express_validator_1.query)('userId').optional().isMongoId(),
    (0, express_validator_1.query)('action').optional().isString().trim(),
    (0, express_validator_1.query)('targetType')
        .optional()
        .isIn(['conversation', 'message', 'user', 'file', 'notification']),
    (0, express_validator_1.query)('conversationId').optional().isMongoId(),
    (0, express_validator_1.query)('patientId').optional().isMongoId(),
    (0, express_validator_1.query)('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
    (0, express_validator_1.query)('complianceCategory').optional().isString().trim(),
    (0, express_validator_1.query)('success').optional().isBoolean(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, communicationAuditController_1.default.getAuditLogs);
router.get('/empty', (req, res) => {
    res.json({
        success: true,
        message: 'Audit logs retrieved successfully (empty for testing)',
        data: [],
        pagination: {
            total: 0,
            page: 1,
            limit: 50,
            pages: 0,
            hasNext: false,
            hasPrev: false,
        },
    });
});
router.get('/conversation/:conversationId', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist', 'doctor'), [
    (0, express_validator_1.param)('conversationId').isMongoId(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.getConversationAuditLogs);
router.get('/high-risk', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist'), [
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.getHighRiskActivities);
router.get('/compliance-report', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist'), [
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.generateComplianceReport);
router.get('/export', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist'), [
    (0, express_validator_1.query)('format').optional().isIn(['csv', 'json']),
    (0, express_validator_1.query)('userId').optional().isMongoId(),
    (0, express_validator_1.query)('action').optional().isString().trim(),
    (0, express_validator_1.query)('targetType')
        .optional()
        .isIn(['conversation', 'message', 'user', 'file', 'notification']),
    (0, express_validator_1.query)('conversationId').optional().isMongoId(),
    (0, express_validator_1.query)('patientId').optional().isMongoId(),
    (0, express_validator_1.query)('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
    (0, express_validator_1.query)('complianceCategory').optional().isString().trim(),
    (0, express_validator_1.query)('success').optional().isBoolean(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.exportAuditLogs);
router.get('/users/:userId/activity', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist', 'doctor'), [
    (0, express_validator_1.param)('userId').isMongoId(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.getUserActivitySummary);
router.get('/statistics', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist'), [
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], handleValidationErrors, communicationAuditController_1.default.getAuditStatistics);
router.get('/search', auth_1.auth, rbac_1.default.requireRole('admin', 'pharmacist', 'doctor'), [
    (0, express_validator_1.query)('q').isString().trim().isLength({ min: 2, max: 100 }),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, communicationAuditController_1.default.searchAuditLogs);
router.get('/health', (req, res) => {
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
});
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Audit routes are working',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=communicationAuditRoutes.js.map