"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplianceViolations = exports.getOrderAuditTrail = exports.generateComplianceReport = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const manualLabAuditService_1 = __importDefault(require("../services/manualLabAuditService"));
const auditService_1 = __importDefault(require("../../../services/auditService"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const logger_1 = __importDefault(require("../../../utils/logger"));
exports.generateComplianceReport = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { reportType = 'monthly', startDate, endDate, format = 'json' } = req.query;
    try {
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate)
            };
        }
        else {
            const now = new Date();
            dateRange = {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            };
        }
        const auditStats = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), {
            startDate: dateRange.start,
            endDate: dateRange.end,
            action: 'MANUAL_LAB_'
        }, { limit: 10000 });
        const operationCounts = {
            totalOrders: 0,
            totalResults: 0,
            pdfAccesses: 0,
            statusChanges: 0,
            tokenResolutions: 0
        };
        auditStats.logs.forEach(log => {
            if (log.action.includes('ORDER_CREATED'))
                operationCounts.totalOrders++;
            if (log.action.includes('RESULTS_ENTERED'))
                operationCounts.totalResults++;
            if (log.action.includes('PDF_ACCESSED'))
                operationCounts.pdfAccesses++;
            if (log.action.includes('STATUS_CHANGED'))
                operationCounts.statusChanges++;
            if (log.action.includes('TOKEN_RESOLVED'))
                operationCounts.tokenResolutions++;
        });
        const report = await manualLabAuditService_1.default.generateComplianceReport({
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            reportType: reportType,
            dateRange,
            totalOrders: operationCounts.totalOrders,
            totalResults: operationCounts.totalResults,
            pdfAccesses: operationCounts.pdfAccesses,
            complianceViolations: auditStats.logs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length,
            securityIncidents: auditStats.logs.filter(log => log.action.includes('SUSPICIOUS') || log.action.includes('VIOLATION')).length
        });
        if (format === 'csv') {
            const csvData = formatReportAsCSV(report);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="manual_lab_compliance_report_${Date.now()}.csv"`);
            res.send(csvData);
            return;
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            report,
            auditSummary: {
                totalAuditLogs: auditStats.total,
                dateRange,
                operationCounts
            }
        }, 'Compliance report generated successfully');
        logger_1.default.info('Manual lab compliance report generated', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            reportType,
            dateRange,
            totalLogs: auditStats.total,
            service: 'manual-lab-compliance'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate compliance report', {
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-compliance'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate compliance report', 500);
    }
});
exports.getOrderAuditTrail = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const { logs } = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), {
            action: 'MANUAL_LAB_'
        }, { limit: 1000, sort: 'timestamp' });
        const orderLogs = logs.filter(log => log.details?.orderId === orderId.toUpperCase());
        const auditTrail = {
            orderId: orderId.toUpperCase(),
            totalEvents: orderLogs.length,
            timeline: orderLogs.map(log => ({
                timestamp: log.timestamp,
                action: log.action,
                userId: log.userId,
                userRole: log.userRole,
                riskLevel: log.riskLevel,
                complianceCategory: log.complianceCategory,
                details: log.details,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent
            })),
            summary: {
                orderCreated: orderLogs.some(log => log.action.includes('ORDER_CREATED')),
                resultsEntered: orderLogs.some(log => log.action.includes('RESULTS_ENTERED')),
                pdfAccessed: orderLogs.filter(log => log.action.includes('PDF_ACCESSED')).length,
                statusChanges: orderLogs.filter(log => log.action.includes('STATUS_CHANGED')).length,
                complianceViolations: orderLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length
            }
        };
        (0, responseHelpers_1.sendSuccess)(res, { auditTrail }, 'Order audit trail retrieved successfully');
        logger_1.default.info('Order audit trail retrieved', {
            orderId,
            eventCount: orderLogs.length,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-compliance'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve order audit trail', {
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-compliance'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve audit trail', 500);
    }
});
exports.getComplianceViolations = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { page = 1, limit = 50, severity, startDate, endDate } = req.query;
    try {
        const filters = {
            action: 'MANUAL_LAB_',
            riskLevel: severity || { $in: ['high', 'critical'] }
        };
        if (startDate && endDate) {
            filters.startDate = new Date(startDate);
            filters.endDate = new Date(endDate);
        }
        const { logs, total } = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), filters, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: '-timestamp'
        });
        const violations = logs.map(log => ({
            id: log._id,
            timestamp: log.timestamp,
            action: log.action,
            riskLevel: log.riskLevel,
            complianceCategory: log.complianceCategory,
            userId: log.userId,
            userRole: log.userRole,
            details: log.details,
            errorMessage: log.errorMessage,
            ipAddress: log.ipAddress,
            severity: log.riskLevel === 'critical' ? 'critical' :
                log.riskLevel === 'high' ? 'high' : 'medium'
        }));
        const violationStats = {
            total,
            critical: violations.filter(v => v.severity === 'critical').length,
            high: violations.filter(v => v.severity === 'high').length,
            medium: violations.filter(v => v.severity === 'medium').length,
            categories: violations.reduce((acc, v) => {
                acc[v.complianceCategory] = (acc[v.complianceCategory] || 0) + 1;
                return acc;
            }, {})
        };
        (0, responseHelpers_1.sendSuccess)(res, {
            violations,
            statistics: violationStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, 'Compliance violations retrieved successfully');
        logger_1.default.info('Compliance violations retrieved', {
            total,
            page,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-compliance'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve compliance violations', {
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-compliance'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve compliance violations', 500);
    }
});
function formatReportAsCSV(report) {
    const headers = [
        'Timestamp',
        'Report Type',
        'Total Orders',
        'Total Results',
        'PDF Accesses',
        'Compliance Score',
        'Risk Score',
        'Violations Count'
    ];
    const rows = [
        headers.join(','),
        [
            report.generatedAt,
            report.reportType,
            report.summary.totalOrders,
            report.summary.totalResults,
            report.summary.pdfAccesses,
            report.summary.complianceScore,
            report.summary.riskScore,
            report.violations.length
        ].join(',')
    ];
    if (report.violations.length > 0) {
        rows.push('');
        rows.push('Violations:');
        rows.push('Timestamp,Action,Risk Level,Details');
        report.violations.forEach((violation) => {
            rows.push([
                violation.timestamp,
                violation.action,
                violation.riskLevel,
                JSON.stringify(violation.details).replace(/,/g, ';')
            ].join(','));
        });
    }
    return rows.join('\n');
}
exports.default = {
    generateComplianceReport: exports.generateComplianceReport,
    getOrderAuditTrail: exports.getOrderAuditTrail,
    getComplianceViolations: exports.getComplianceViolations
};
//# sourceMappingURL=manualLabComplianceController.js.map