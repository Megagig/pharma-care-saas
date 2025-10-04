"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const auth_1 = require("../middlewares/auth");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const rbac_1 = require("../middlewares/rbac");
const reportsRBAC_1 = __importDefault(require("../middlewares/reportsRBAC"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const reportsController_1 = require("../controllers/reportsController");
const router = express_1.default.Router();
const reportRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many report requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const validateReportType = (req, res, next) => {
    const { reportType } = req.params;
    const validReportTypes = [
        'patient-outcomes',
        'pharmacist-interventions',
        'therapy-effectiveness',
        'quality-improvement',
        'regulatory-compliance',
        'cost-effectiveness',
        'trend-forecasting',
        'operational-efficiency',
        'medication-inventory',
        'patient-demographics',
        'adverse-events'
    ];
    if (!reportType || !validReportTypes.includes(reportType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid report type specified',
            validTypes: validReportTypes
        });
    }
    next();
};
const validateDateRange = (req, res, next) => {
    const { startDate, endDate } = req.query;
    if (startDate && !(0, moment_1.default)(startDate).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid start date format. Use YYYY-MM-DD format.'
        });
    }
    if (endDate && !(0, moment_1.default)(endDate).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid end date format. Use YYYY-MM-DD format.'
        });
    }
    if (startDate && endDate && (0, moment_1.default)(startDate).isAfter((0, moment_1.default)(endDate))) {
        return res.status(400).json({
            success: false,
            message: 'Start date cannot be after end date.'
        });
    }
    next();
};
const validateObjectIds = (req, res, next) => {
    const { patientId, pharmacistId } = req.query;
    if (patientId && !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid patient ID format.'
        });
    }
    if (pharmacistId && !mongoose_1.default.Types.ObjectId.isValid(pharmacistId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid pharmacist ID format.'
        });
    }
    next();
};
router.use(auth_1.auth);
router.use(auth_1.requireLicense);
router.use(reportRateLimit);
router.use(auditMiddleware_1.auditTimer);
router.get('/types', (0, rbac_1.requirePermission)('view_reports', { useDynamicRBAC: true }), (0, auditMiddleware_1.auditMTRActivity)('VIEW_AVAILABLE_REPORTS'), reportsController_1.getAvailableReports);
router.get('/summary', (0, rbac_1.requirePermission)('view_reports', { useDynamicRBAC: true }), validateDateRange, reportsRBAC_1.default.enforceWorkspaceIsolation, (0, auditMiddleware_1.auditMTRActivity)('VIEW_REPORT_SUMMARY'), reportsController_1.getReportSummary);
router.get('/:reportType', validateReportType, validateDateRange, validateObjectIds, reportsRBAC_1.default.requireReportAccess(), reportsRBAC_1.default.validateDataAccess, reportsRBAC_1.default.enforceWorkspaceIsolation, (0, auditMiddleware_1.auditMTRActivity)('GENERATE_REPORT'), reportsController_1.getUnifiedReportData);
const reportCache = new Map();
const cacheMiddleware = (ttlMinutes = 15) => {
    return (req, res, next) => {
        const cacheKey = `${req.originalUrl}-${JSON.stringify(req.query)}`;
        const cached = reportCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return res.json({
                ...cached.data,
                cached: true,
                cacheTimestamp: new Date(cached.timestamp)
            });
        }
        const originalJson = res.json;
        res.json = function (data) {
            if (res.statusCode === 200) {
                reportCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    ttl: ttlMinutes * 60 * 1000
                });
                if (reportCache.size > 100) {
                    const oldestKey = reportCache.keys().next().value;
                    reportCache.delete(oldestKey);
                }
            }
            return originalJson.call(this, data);
        };
        next();
    };
};
router.post('/export', (0, rbac_1.requirePermission)('export_reports', { useDynamicRBAC: true }), reportsRBAC_1.default.enforceWorkspaceIsolation, (0, auditMiddleware_1.auditMTRActivity)('QUEUE_REPORT_EXPORT'), reportsController_1.queueReportExport);
router.get('/export/:jobId/status', (0, rbac_1.requirePermission)('export_reports', { useDynamicRBAC: true }), reportsController_1.getExportJobStatus);
router.get('/performance/stats', (0, rbac_1.requirePermission)('view_system_stats', { useDynamicRBAC: true }), reportsController_1.getPerformanceStats);
router.get('/summary', cacheMiddleware(15));
router.get('/:reportType', cacheMiddleware(10));
router.use((error, req, res, next) => {
    console.error('Reports API Error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.message
        });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            details: error.message
        });
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
exports.default = router;
//# sourceMappingURL=reportsRoutes.js.map