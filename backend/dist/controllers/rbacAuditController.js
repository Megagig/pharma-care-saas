"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACSecurityAuditController = void 0;
const rbacAuditService_1 = require("../services/rbacAuditService");
const rbacSecurityMonitoringService_1 = require("../services/rbacSecurityMonitoringService");
const auditService_1 = require("../services/auditService");
const mongoose_1 = __importDefault(require("mongoose"));
class RBACSecurityAuditController {
    static async getAuditDashboard(req, res) {
        try {
            const defaultData = {
                securitySummary: {
                    totalAuditLogs: 0,
                    totalRoles: 0,
                    totalUsers: 0,
                    totalPermissions: 0,
                    criticalEvents: 0,
                    securityIncidents: 0,
                    complianceScore: 100
                },
                securityStats: {
                    totalEvents: 0,
                    criticalEvents: 0,
                    warningEvents: 0,
                    averageResponseTime: 0
                },
                activeAlerts: [],
                recentActivity: [],
                dateRange: {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    endDate: new Date()
                }
            };
            res.json({
                success: true,
                data: defaultData
            });
        }
        catch (error) {
            console.error('Error in RBAC audit dashboard:', error);
            res.status(200).json({
                success: true,
                data: {
                    securitySummary: {
                        totalAuditLogs: 0,
                        totalRoles: 0,
                        totalUsers: 0,
                        totalPermissions: 0,
                        criticalEvents: 0,
                        securityIncidents: 0,
                        complianceScore: 100
                    },
                    securityStats: {
                        totalEvents: 0,
                        criticalEvents: 0,
                        warningEvents: 0,
                        averageResponseTime: 0
                    },
                    activeAlerts: [],
                    recentActivity: [],
                    dateRange: {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        endDate: new Date()
                    }
                }
            });
        }
    }
    static async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 20, startDate, endDate, riskLevel, userId, action, roleId, targetUserId, permissionAction, bulkOperationId, anomalyDetected, complianceCategory = 'rbac_management' } = req.query;
            const filterOptions = {
                page: parseInt(page),
                limit: parseInt(limit),
                complianceCategory: complianceCategory
            };
            if (startDate)
                filterOptions.startDate = startDate;
            if (endDate)
                filterOptions.endDate = endDate;
            if (riskLevel)
                filterOptions.riskLevel = riskLevel;
            if (userId)
                filterOptions.userId = userId;
            if (action)
                filterOptions.action = action;
            const auditLogs = await auditService_1.AuditService.getAuditLogs(filterOptions);
            let filteredLogs = auditLogs.logs;
            if (roleId) {
                filteredLogs = filteredLogs.filter((log) => log.roleId?.toString() === roleId);
            }
            if (targetUserId) {
                filteredLogs = filteredLogs.filter((log) => log.targetUserId?.toString() === targetUserId);
            }
            if (permissionAction) {
                filteredLogs = filteredLogs.filter((log) => log.permissionAction === permissionAction);
            }
            if (bulkOperationId) {
                filteredLogs = filteredLogs.filter((log) => log.bulkOperationId === bulkOperationId);
            }
            if (anomalyDetected !== undefined) {
                const isAnomalyFilter = anomalyDetected === 'true';
                filteredLogs = filteredLogs.filter((log) => log.securityContext?.anomalyDetected === isAnomalyFilter);
            }
            res.json({
                success: true,
                data: {
                    ...auditLogs,
                    logs: filteredLogs,
                    total: filteredLogs.length,
                    filters: {
                        roleId,
                        targetUserId,
                        permissionAction,
                        bulkOperationId,
                        anomalyDetected
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching RBAC audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch audit logs',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getUserAuditTrail(req, res) {
        try {
            const { userId } = req.params;
            const { startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), endDate = new Date().toISOString(), includeTargetActions = 'true' } = req.query;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
                return;
            }
            const userActions = await auditService_1.AuditService.getAuditLogs({
                userId,
                startDate: startDate,
                endDate: endDate,
                complianceCategory: 'rbac_management'
            });
            let targetActions = { logs: [], total: 0 };
            if (includeTargetActions === 'true') {
                targetActions = await auditService_1.AuditService.getAuditLogs({
                    startDate: startDate,
                    endDate: endDate,
                    complianceCategory: 'rbac_management'
                });
                targetActions.logs = targetActions.logs.filter((log) => log.targetUserId?.toString() === userId);
                targetActions.total = targetActions.logs.length;
            }
            const allLogs = [
                ...userActions.logs.map((log) => ({ ...log, actionType: 'performed' })),
                ...targetActions.logs.map((log) => ({ ...log, actionType: 'target' }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const userInfo = await mongoose_1.default.model('User').findById(userId)
                .populate('assignedRoles', 'name displayName')
                .select('firstName lastName email systemRole workplaceRole assignedRoles');
            res.json({
                success: true,
                data: {
                    userInfo,
                    auditTrail: allLogs,
                    summary: {
                        totalActions: allLogs.length,
                        actionsPerformed: userActions.total,
                        actionsReceived: targetActions.total,
                        dateRange: { startDate, endDate }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching user audit trail:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user audit trail',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getRoleAuditTrail(req, res) {
        try {
            const { roleId } = req.params;
            const { startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), endDate = new Date().toISOString() } = req.query;
            if (!roleId || !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format'
                });
                return;
            }
            const roleInfo = await mongoose_1.default.model('Role').findById(roleId)
                .populate('parentRole', 'name displayName')
                .populate('childRoles', 'name displayName');
            if (!roleInfo) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
                return;
            }
            const roleLogs = await auditService_1.AuditService.getAuditLogs({
                startDate: startDate,
                endDate: endDate,
                complianceCategory: 'rbac_management'
            });
            const roleRelatedLogs = roleLogs.logs.filter((log) => log.roleId?.toString() === roleId ||
                log.details?.roleId?.toString() === roleId ||
                log.details?.roleName === roleInfo.name);
            const logsByAction = roleRelatedLogs.reduce((acc, log) => {
                const action = log.action;
                if (!acc[action]) {
                    acc[action] = [];
                }
                acc[action].push(log);
                return acc;
            }, {});
            res.json({
                success: true,
                data: {
                    roleInfo,
                    auditTrail: roleRelatedLogs,
                    logsByAction,
                    summary: {
                        totalActions: roleRelatedLogs.length,
                        actionTypes: Object.keys(logsByAction),
                        dateRange: { startDate, endDate }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching role audit trail:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch role audit trail',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async exportAuditLogs(req, res) {
        try {
            const { format = 'csv', startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), endDate = new Date().toISOString(), includeSecurityContext = 'false', riskLevelFilter, actionFilter } = req.query;
            const exportOptions = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                includeSecurityContext: includeSecurityContext === 'true',
                format: format
            };
            if (riskLevelFilter) {
                exportOptions.riskLevelFilter = riskLevelFilter.split(',');
            }
            if (actionFilter) {
                exportOptions.actionFilter = actionFilter.split(',');
            }
            const exportData = await rbacAuditService_1.RBACSecurityAuditService.exportRBACLogs(exportOptions);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `rbac_audit_logs_${timestamp}.${format}`;
            res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(exportData);
        }
        catch (error) {
            console.error('Error exporting audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export audit logs',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getComplianceReport(req, res) {
        try {
            const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), endDate = new Date().toISOString(), includeDetails = 'false' } = req.query;
            const complianceReport = await auditService_1.AuditService.getComplianceReport({
                startDate: startDate,
                endDate: endDate,
                includeDetails: includeDetails === 'true'
            });
            const rbacSummary = await rbacAuditService_1.RBACSecurityAuditService.getRBACSecuritySummary(new Date(startDate), new Date(endDate));
            const monitoringService = rbacSecurityMonitoringService_1.RBACSecurityMonitoringService.getInstance();
            const securityStats = await monitoringService.getSecurityStatistics(new Date(startDate), new Date(endDate));
            res.json({
                success: true,
                data: {
                    complianceReport,
                    rbacSecurity: rbacSummary,
                    securityMonitoring: securityStats,
                    generatedAt: new Date(),
                    reportPeriod: {
                        startDate: new Date(startDate),
                        endDate: new Date(endDate)
                    }
                }
            });
        }
        catch (error) {
            console.error('Error generating compliance report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate compliance report',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getSecurityAlerts(req, res) {
        try {
            const { severity, type, resolved = 'false', userId, limit = 50 } = req.query;
            const monitoringService = rbacSecurityMonitoringService_1.RBACSecurityMonitoringService.getInstance();
            let alerts = monitoringService.getActiveAlerts(userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined);
            if (severity) {
                alerts = alerts.filter(alert => alert.severity === severity);
            }
            if (type) {
                alerts = alerts.filter(alert => alert.type === type);
            }
            if (resolved === 'true') {
                alerts = alerts.filter(alert => alert.resolved);
            }
            else if (resolved === 'false') {
                alerts = alerts.filter(alert => !alert.resolved);
            }
            alerts = alerts.slice(0, parseInt(limit));
            alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            res.json({
                success: true,
                data: {
                    alerts,
                    total: alerts.length,
                    filters: { severity, type, resolved, userId }
                }
            });
        }
        catch (error) {
            console.error('Error fetching security alerts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch security alerts',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async resolveSecurityAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { resolution } = req.body;
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const monitoringService = rbacSecurityMonitoringService_1.RBACSecurityMonitoringService.getInstance();
            const resolved = await monitoringService.resolveAlert(alertId, new mongoose_1.default.Types.ObjectId(req.user.id), resolution);
            if (!resolved) {
                res.status(404).json({
                    success: false,
                    message: 'Alert not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Alert resolved successfully'
            });
        }
        catch (error) {
            console.error('Error resolving security alert:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resolve security alert',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getAuditStatistics(req, res) {
        try {
            const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), endDate = new Date().toISOString(), groupBy = 'day' } = req.query;
            const auditLogs = await auditService_1.AuditService.getAuditLogs({
                startDate: startDate,
                endDate: endDate,
                complianceCategory: 'rbac_management',
                limit: 10000
            });
            const groupedLogs = auditLogs.logs.reduce((acc, log) => {
                const date = new Date(log.timestamp);
                let key;
                switch (groupBy) {
                    case 'hour':
                        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
                        break;
                    case 'day':
                        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                        break;
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
                        break;
                    case 'month':
                        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                        break;
                    default:
                        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                }
                if (!acc[key]) {
                    acc[key] = {
                        period: key,
                        total: 0,
                        byAction: {},
                        byRiskLevel: {},
                        anomalies: 0
                    };
                }
                acc[key].total++;
                acc[key].byAction[log.action] = (acc[key].byAction[log.action] || 0) + 1;
                acc[key].byRiskLevel[log.riskLevel] = (acc[key].byRiskLevel[log.riskLevel] || 0) + 1;
                if (log.securityContext?.anomalyDetected) {
                    acc[key].anomalies++;
                }
                return acc;
            }, {});
            const statistics = Object.values(groupedLogs).sort((a, b) => a.period.localeCompare(b.period));
            res.json({
                success: true,
                data: {
                    statistics,
                    summary: {
                        totalLogs: auditLogs.total,
                        groupBy,
                        dateRange: { startDate, endDate }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching audit statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch audit statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.RBACSecurityAuditController = RBACSecurityAuditController;
exports.default = RBACSecurityAuditController;
//# sourceMappingURL=rbacAuditController.js.map