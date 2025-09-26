"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const workspaceContext_1 = require("../middlewares/workspaceContext");
const clinicalInterventionErrorHandler_1 = require("../middlewares/clinicalInterventionErrorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(workspaceContext_1.loadWorkspaceContext);
router.use(clinicalInterventionErrorHandler_1.errorLoggingMiddleware);
router.post('/', (0, clinicalInterventionErrorHandler_1.asyncErrorHandler)(async (req, res) => {
    try {
        const errorReport = req.body;
        if (!errorReport.id || !errorReport.error || !errorReport.timestamp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id, error, timestamp'
            });
        }
        const enhancedReport = {
            ...errorReport,
            serverTimestamp: new Date().toISOString(),
            serverUserId: req.user?.id,
            serverWorkplaceId: req.user?.workplaceId,
            serverUserRole: req.user?.role,
            serverRequestId: req.headers['x-request-id'],
            serverIpAddress: req.ip,
            serverUserAgent: req.get('User-Agent')
        };
        logger_1.default.error('Client Error Report Received', {
            reportId: errorReport.id,
            errorType: errorReport.error.type,
            errorMessage: errorReport.error.message,
            severity: errorReport.error.severity,
            userId: req.user?.id,
            workplaceId: req.user?.workplaceId,
            userDescription: errorReport.userDescription,
            context: errorReport.context,
            systemInfo: errorReport.systemInfo,
            breadcrumbs: errorReport.breadcrumbs?.length || 0,
            timestamp: errorReport.timestamp,
            serverTimestamp: enhancedReport.serverTimestamp
        });
        res.status(201).json({
            success: true,
            message: 'Error report received successfully',
            reportId: errorReport.id,
            timestamp: enhancedReport.serverTimestamp
        });
    }
    catch (error) {
        logger_1.default.error('Failed to process error report', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            requestBody: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Failed to process error report',
            timestamp: new Date().toISOString()
        });
    }
}));
router.get('/stats', (0, clinicalInterventionErrorHandler_1.asyncErrorHandler)(async (req, res) => {
    try {
        if (req.user?.role !== 'Admin' && req.user?.role !== 'SuperAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to view error statistics'
            });
        }
        const stats = {
            totalReports: 0,
            reportsLast24Hours: 0,
            reportsLast7Days: 0,
            reportsLast30Days: 0,
            errorsByType: {},
            errorsBySeverity: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            topErrors: [],
            affectedUsers: 0,
            resolvedReports: 0,
            pendingReports: 0
        };
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get error statistics', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve error statistics',
            timestamp: new Date().toISOString()
        });
    }
}));
router.post('/batch', (0, clinicalInterventionErrorHandler_1.asyncErrorHandler)(async (req, res) => {
    try {
        const errorReports = req.body.reports;
        if (!Array.isArray(errorReports) || errorReports.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request: reports array is required'
            });
        }
        if (errorReports.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Too many reports in batch (maximum 50 allowed)'
            });
        }
        const processedReports = [];
        const failedReports = [];
        for (const report of errorReports) {
            try {
                if (!report.id || !report.error || !report.timestamp) {
                    failedReports.push({
                        reportId: report.id || 'unknown',
                        error: 'Missing required fields'
                    });
                    continue;
                }
                const enhancedReport = {
                    ...report,
                    serverTimestamp: new Date().toISOString(),
                    serverUserId: req.user?.id,
                    serverWorkplaceId: req.user?.workplaceId,
                    serverUserRole: req.user?.role,
                    serverRequestId: req.headers['x-request-id'],
                    serverIpAddress: req.ip,
                    serverUserAgent: req.get('User-Agent')
                };
                logger_1.default.error('Batch Client Error Report', {
                    reportId: report.id,
                    errorType: report.error.type,
                    errorMessage: report.error.message,
                    severity: report.error.severity,
                    userId: req.user?.id,
                    workplaceId: req.user?.workplaceId,
                    timestamp: report.timestamp,
                    serverTimestamp: enhancedReport.serverTimestamp
                });
                processedReports.push({
                    reportId: report.id,
                    status: 'processed',
                    timestamp: enhancedReport.serverTimestamp
                });
            }
            catch (reportError) {
                failedReports.push({
                    reportId: report.id || 'unknown',
                    error: reportError.message
                });
            }
        }
        res.status(201).json({
            success: true,
            message: `Processed ${processedReports.length} error reports`,
            processedReports,
            failedReports,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Failed to process batch error reports', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            reportsCount: req.body.reports?.length || 0
        });
        res.status(500).json({
            success: false,
            message: 'Failed to process batch error reports',
            timestamp: new Date().toISOString()
        });
    }
}));
router.use(clinicalInterventionErrorHandler_1.clinicalInterventionErrorHandler);
exports.default = router;
//# sourceMappingURL=errorReportingRoutes.js.map