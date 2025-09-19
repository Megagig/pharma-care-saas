"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupAuditLogs = exports.getAuditStatistics = exports.getComplianceReport = exports.exportAuditData = exports.getInterventionAuditTrail = exports.getAllAuditTrail = void 0;
const auditService_1 = require("../services/auditService");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const getAllAuditTrail = async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, riskLevel, userId, action, complianceCategory } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            startDate: startDate,
            endDate: endDate,
            riskLevel: riskLevel,
            userId: userId,
            action: action,
            complianceCategory: complianceCategory
        };
        const result = await auditService_1.AuditService.getAuditLogs(options);
        await (0, auditMiddleware_1.createManualAuditLog)(req, 'AUDIT_TRAIL_ACCESSED', {
            filters: options,
            resultCount: result.logs.length
        }, {
            complianceCategory: 'regulatory_compliance',
            riskLevel: 'low'
        });
        res.json({
            success: true,
            message: 'Audit trail retrieved successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error getting audit trail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit trail',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllAuditTrail = getAllAuditTrail;
const getInterventionAuditTrail = async (req, res) => {
    try {
        const { interventionId } = req.params;
        if (!interventionId) {
            return res.status(400).json({
                success: false,
                message: 'Intervention ID is required'
            });
        }
        const { page = 1, limit = 20, startDate, endDate, riskLevel, action } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            startDate: startDate,
            endDate: endDate,
            riskLevel: riskLevel,
            action: action
        };
        const result = await auditService_1.AuditService.getInterventionAuditLogs(interventionId, options);
        await (0, auditMiddleware_1.createManualAuditLog)(req, 'INTERVENTION_AUDIT_ACCESSED', {
            interventionId,
            filters: options,
            resultCount: result.logs.length
        }, {
            interventionId,
            complianceCategory: 'regulatory_compliance',
            riskLevel: 'low'
        });
        return res.json({
            success: true,
            message: 'Intervention audit trail retrieved successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error getting intervention audit trail:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve intervention audit trail',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getInterventionAuditTrail = getInterventionAuditTrail;
const exportAuditData = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate, riskLevel, userId, action, interventionIds, includeDetails = 'true' } = req.query;
        const interventionIdsArray = interventionIds
            ? interventionIds.split(',')
            : undefined;
        const options = {
            format: format,
            startDate: startDate,
            endDate: endDate,
            riskLevel: riskLevel,
            userId: userId,
            action: action,
            interventionId: interventionIdsArray?.[0]
        };
        const exportData = await auditService_1.AuditService.exportAuditLogs(options);
        await (0, auditMiddleware_1.createManualAuditLog)(req, 'EXPORT_PERFORMED', {
            exportType: 'audit_data',
            format,
            filters: options,
            dataSize: exportData.length
        }, {
            complianceCategory: 'data_integrity',
            riskLevel: 'medium'
        });
        const filename = `audit_export_${new Date().toISOString().split('T')[0]}.${format}`;
        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
    }
    catch (error) {
        console.error('Error exporting audit data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export audit data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.exportAuditData = exportAuditData;
const getComplianceReport = async (req, res) => {
    try {
        const { startDate, endDate, includeDetails = 'false', interventionIds } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const interventionIdsArray = interventionIds
            ? interventionIds.split(',')
            : undefined;
        const options = {
            startDate: startDate,
            endDate: endDate,
            includeDetails: includeDetails === 'true',
            interventionIds: interventionIdsArray
        };
        const report = await auditService_1.AuditService.getComplianceReport(options);
        await (0, auditMiddleware_1.createManualAuditLog)(req, 'REPORT_GENERATED', {
            reportType: 'compliance',
            dateRange: { startDate, endDate },
            interventionCount: interventionIdsArray?.length || 'all'
        }, {
            complianceCategory: 'regulatory_compliance',
            riskLevel: 'low'
        });
        return res.json({
            success: true,
            message: 'Compliance report generated successfully',
            data: report
        });
    }
    catch (error) {
        console.error('Error generating compliance report:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate compliance report',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getComplianceReport = getComplianceReport;
const getAuditStatistics = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const dateFilter = {};
        if (startDate)
            dateFilter.$gte = new Date(startDate);
        if (endDate)
            dateFilter.$lte = new Date(endDate);
        const matchStage = {};
        if (Object.keys(dateFilter).length > 0) {
            matchStage.timestamp = dateFilter;
        }
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupBy === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                            date: '$timestamp'
                        }
                    },
                    totalActions: { $sum: 1 },
                    riskActivities: {
                        $sum: {
                            $cond: [
                                { $in: ['$riskLevel', ['high', 'critical']] },
                                1,
                                0
                            ]
                        }
                    },
                    uniqueUsers: { $addToSet: '$userId' },
                    actionTypes: { $addToSet: '$action' }
                }
            },
            {
                $project: {
                    date: '$_id',
                    totalActions: 1,
                    riskActivities: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    actionTypes: { $size: '$actionTypes' }
                }
            },
            { $sort: { date: 1 } }
        ];
        const statistics = await auditService_1.AuditService.getAuditLogs({ limit: 1 });
        res.json({
            success: true,
            message: 'Audit statistics retrieved successfully',
            data: {
                summary: statistics.summary,
                timeline: []
            }
        });
    }
    catch (error) {
        console.error('Error getting audit statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAuditStatistics = getAuditStatistics;
const cleanupAuditLogs = async (req, res) => {
    try {
        const { daysToKeep = 365 } = req.body;
        if (req.user?.role !== 'super_admin' && req.user?.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to perform cleanup'
            });
        }
        const deletedCount = await auditService_1.AuditService.cleanupOldLogs(parseInt(daysToKeep));
        await (0, auditMiddleware_1.createManualAuditLog)(req, 'AUDIT_CLEANUP_PERFORMED', {
            daysToKeep,
            deletedCount
        }, {
            complianceCategory: 'system_security',
            riskLevel: 'high'
        });
        return res.json({
            success: true,
            message: `Successfully cleaned up ${deletedCount} old audit logs`,
            data: { deletedCount }
        });
    }
    catch (error) {
        console.error('Error cleaning up audit logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cleanup audit logs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.cleanupAuditLogs = cleanupAuditLogs;
//# sourceMappingURL=auditController.js.map