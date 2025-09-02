"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const auditLogging_1 = require("../middlewares/auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
class AuditController {
    async getAuditLogs(req, res) {
        try {
            const { userId, workspaceId, category, severity, startDate, endDate, suspicious, page = 1, limit = 50, } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view audit logs',
                });
                return;
            }
            const filters = {};
            if (userId)
                filters.userId = userId;
            if (workspaceId)
                filters.workspaceId = workspaceId;
            if (category)
                filters.category = category;
            if (severity)
                filters.severity = severity;
            if (startDate)
                filters.startDate = new Date(startDate);
            if (endDate)
                filters.endDate = new Date(endDate);
            if (suspicious !== undefined)
                filters.suspicious = suspicious === 'true';
            const pageNum = parseInt(page, 10);
            const limitNum = Math.min(parseInt(limit, 10), 1000);
            const skip = (pageNum - 1) * limitNum;
            const allLogs = (0, auditLogging_1.getAuditLogs)(filters);
            const total = allLogs.length;
            const logs = allLogs.slice(skip, skip + limitNum);
            res.json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching audit logs', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'audit-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch audit logs',
            });
        }
    }
    async getAuditSummary(req, res) {
        try {
            const { workspaceId, days = 7 } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view audit summary',
                });
                return;
            }
            const daysNum = parseInt(days, 10);
            const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
            const filters = {
                startDate,
            };
            if (workspaceId) {
                filters.workspaceId = workspaceId;
            }
            const logs = (0, auditLogging_1.getAuditLogs)(filters);
            const summary = {
                totalLogs: logs.length,
                timeRange: {
                    days: daysNum,
                    startDate,
                    endDate: new Date(),
                },
                byCategory: {},
                bySeverity: {},
                byAction: {},
                uniqueUsers: new Set(),
                uniqueIPs: new Set(),
                suspiciousActivities: 0,
                highRiskActivities: 0,
                errorCount: 0,
                topUsers: {},
                topIPs: {},
                recentHighRisk: [],
            };
            logs.forEach(log => {
                summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;
                summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;
                summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
                if (log.userId)
                    summary.uniqueUsers.add(log.userId.toString());
                summary.uniqueIPs.add(log.ipAddress);
                if (log.suspicious)
                    summary.suspiciousActivities++;
                if (log.severity === 'high' || log.severity === 'critical') {
                    summary.highRiskActivities++;
                    if (summary.recentHighRisk.length < 10) {
                        summary.recentHighRisk.push({
                            timestamp: log.timestamp,
                            action: log.action,
                            category: log.category,
                            severity: log.severity,
                            userId: log.userId,
                            userEmail: log.userEmail,
                            ipAddress: log.ipAddress,
                            details: log.details,
                        });
                    }
                }
                if (log.errorMessage || (log.statusCode && log.statusCode >= 400)) {
                    summary.errorCount++;
                }
                if (log.userId) {
                    const userKey = log.userEmail || log.userId.toString();
                    summary.topUsers[userKey] = (summary.topUsers[userKey] || 0) + 1;
                }
                summary.topIPs[log.ipAddress] = (summary.topIPs[log.ipAddress] || 0) + 1;
            });
            const finalSummary = {
                ...summary,
                uniqueUsers: summary.uniqueUsers.size,
                uniqueIPs: summary.uniqueIPs.size,
                topUsers: Object.entries(summary.topUsers)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([user, count]) => ({ user, count })),
                topIPs: Object.entries(summary.topIPs)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([ip, count]) => ({ ip, count })),
                errorRate: summary.totalLogs > 0 ? (summary.errorCount / summary.totalLogs * 100).toFixed(2) : '0',
                riskScore: this.calculateOverallRiskScore(logs),
                complianceScore: this.calculateComplianceScore(summary),
            };
            res.json({
                success: true,
                data: finalSummary,
            });
        }
        catch (error) {
            logger_1.default.error('Error generating audit summary', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'audit-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate audit summary',
            });
        }
    }
    async getSecurityAlerts(req, res) {
        try {
            const { workspaceId, days = 1 } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view security alerts',
                });
                return;
            }
            const daysNum = parseInt(days, 10);
            const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
            const filters = {
                startDate,
                suspicious: true,
            };
            if (workspaceId) {
                filters.workspaceId = workspaceId;
            }
            const suspiciousLogs = (0, auditLogging_1.getAuditLogs)(filters);
            const highSeverityFilters = {
                ...filters,
                suspicious: undefined,
                severity: 'high',
            };
            const highSeverityLogs = (0, auditLogging_1.getAuditLogs)(highSeverityFilters);
            const criticalSeverityFilters = {
                ...filters,
                suspicious: undefined,
                severity: 'critical',
            };
            const criticalSeverityLogs = (0, auditLogging_1.getAuditLogs)(criticalSeverityFilters);
            const allAlerts = [...suspiciousLogs, ...highSeverityLogs, ...criticalSeverityLogs];
            const uniqueAlerts = allAlerts.filter((alert, index, self) => index === self.findIndex(a => a._id?.toString() === alert._id?.toString()));
            uniqueAlerts.sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                if (severityDiff !== 0)
                    return severityDiff;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
            const patterns = this.analyzeSecurityPatterns(uniqueAlerts);
            res.json({
                success: true,
                data: {
                    alerts: uniqueAlerts.slice(0, 100),
                    summary: {
                        total: uniqueAlerts.length,
                        critical: criticalSeverityLogs.length,
                        high: highSeverityLogs.length,
                        suspicious: suspiciousLogs.length,
                        timeRange: {
                            days: daysNum,
                            startDate,
                            endDate: new Date(),
                        },
                    },
                    patterns,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching security alerts', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'audit-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch security alerts',
            });
        }
    }
    async exportAuditLogs(req, res) {
        try {
            const { workspaceId, format = 'json', startDate, endDate, category, severity, } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to export audit logs',
                });
                return;
            }
            const filters = {};
            if (workspaceId)
                filters.workspaceId = workspaceId;
            if (category)
                filters.category = category;
            if (severity)
                filters.severity = severity;
            if (startDate)
                filters.startDate = new Date(startDate);
            if (endDate)
                filters.endDate = new Date(endDate);
            const logs = (0, auditLogging_1.getAuditLogs)(filters);
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `audit_logs_${dateStr}.${format}`;
            switch (format) {
                case 'json':
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    res.json({
                        exportInfo: {
                            generatedAt: new Date(),
                            totalRecords: logs.length,
                            filters,
                            exportedBy: req.user?.email,
                        },
                        logs,
                    });
                    break;
                case 'csv':
                    const csvData = this.convertToCSV(logs);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    res.send(csvData);
                    break;
                default:
                    res.status(400).json({
                        success: false,
                        code: 'INVALID_FORMAT',
                        message: 'Supported formats: json, csv',
                    });
            }
        }
        catch (error) {
            logger_1.default.error('Error exporting audit logs', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'audit-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to export audit logs',
            });
        }
    }
    calculateOverallRiskScore(logs) {
        if (logs.length === 0)
            return 0;
        const totalRiskScore = logs.reduce((sum, log) => sum + (log.riskScore || 0), 0);
        return Math.round((totalRiskScore / logs.length) * 10) / 10;
    }
    calculateComplianceScore(summary) {
        let score = 100;
        const errorRate = parseFloat(summary.errorRate || '0');
        if (errorRate > 10)
            score -= 20;
        else if (errorRate > 5)
            score -= 10;
        else if (errorRate > 2)
            score -= 5;
        const suspiciousRate = summary.totalLogs > 0 ? (summary.suspiciousActivities / summary.totalLogs) * 100 : 0;
        if (suspiciousRate > 5)
            score -= 15;
        else if (suspiciousRate > 2)
            score -= 10;
        else if (suspiciousRate > 1)
            score -= 5;
        const highRiskRate = summary.totalLogs > 0 ? (summary.highRiskActivities / summary.totalLogs) * 100 : 0;
        if (highRiskRate > 10)
            score -= 15;
        else if (highRiskRate > 5)
            score -= 10;
        else if (highRiskRate > 2)
            score -= 5;
        return Math.max(0, Math.min(100, score));
    }
    analyzeSecurityPatterns(alerts) {
        const patterns = {
            repeatedFailures: {},
            suspiciousIPs: {},
            unusualActivity: [],
            recommendations: [],
        };
        alerts.forEach(alert => {
            if (alert.errorMessage && alert.userEmail) {
                patterns.repeatedFailures[alert.userEmail] = (patterns.repeatedFailures[alert.userEmail] || 0) + 1;
            }
            if (alert.suspicious) {
                patterns.suspiciousIPs[alert.ipAddress] = (patterns.suspiciousIPs[alert.ipAddress] || 0) + 1;
            }
        });
        const highFailureUsers = Object.entries(patterns.repeatedFailures)
            .filter(([, count]) => count > 5)
            .map(([user]) => user);
        if (highFailureUsers.length > 0) {
            patterns.recommendations.push(`Review accounts with repeated failures: ${highFailureUsers.join(', ')}`);
        }
        const suspiciousIPList = Object.entries(patterns.suspiciousIPs)
            .filter(([, count]) => count > 10)
            .map(([ip]) => ip);
        if (suspiciousIPList.length > 0) {
            patterns.recommendations.push(`Consider blocking suspicious IPs: ${suspiciousIPList.join(', ')}`);
        }
        if (alerts.length > 50) {
            patterns.recommendations.push('High volume of security alerts detected. Review security policies.');
        }
        return patterns;
    }
    convertToCSV(logs) {
        if (logs.length === 0)
            return '';
        const headers = [
            'timestamp',
            'action',
            'category',
            'severity',
            'userEmail',
            'userRole',
            'ipAddress',
            'requestMethod',
            'requestUrl',
            'resourceType',
            'statusCode',
            'errorMessage',
            'suspicious',
            'riskScore',
        ];
        const csvRows = [headers.join(',')];
        logs.forEach(log => {
            const row = headers.map(header => {
                let value = log[header];
                if (value === null || value === undefined)
                    return '';
                if (typeof value === 'object')
                    return JSON.stringify(value);
                if (typeof value === 'string' && value.includes(','))
                    return `"${value.replace(/"/g, '""')}"`;
                return String(value);
            });
            csvRows.push(row.join(','));
        });
        return csvRows.join('\n');
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();
//# sourceMappingURL=auditController.js.map