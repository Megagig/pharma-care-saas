import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import { getAuditLogs } from '../middlewares/auditLogging';
import logger from '../utils/logger';

/**
 * Audit Controller for system audit logs and reporting
 */
export class AuditController {
    /**
     * Get audit logs with filtering and pagination
     */
    async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const {
                userId,
                workspaceId,
                category,
                severity,
                startDate,
                endDate,
                suspicious,
                page = 1,
                limit = 50,
            } = req.query;

            // Validate permissions - only super admins or workspace owners can view audit logs
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view audit logs',
                });
                return;
            }

            const filters: any = {};

            if (userId) filters.userId = userId as string;
            if (workspaceId) filters.workspaceId = workspaceId as string;
            if (category) filters.category = category as string;
            if (severity) filters.severity = severity as string;
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (suspicious !== undefined) filters.suspicious = suspicious === 'true';

            // Calculate pagination
            const pageNum = parseInt(page as string, 10);
            const limitNum = Math.min(parseInt(limit as string, 10), 1000); // Max 1000 per request
            const skip = (pageNum - 1) * limitNum;

            // Get all matching logs first
            const allLogs = getAuditLogs(filters);
            const total = allLogs.length;

            // Apply pagination
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

        } catch (error: any) {
            logger.error('Error fetching audit logs', {
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

    /**
     * Get audit statistics and summary
     */
    async getAuditSummary(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { workspaceId, days = 7 } = req.query;

            // Validate permissions
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view audit summary',
                });
                return;
            }

            const daysNum = parseInt(days as string, 10);
            const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

            const filters: any = {
                startDate,
            };

            if (workspaceId) {
                filters.workspaceId = workspaceId as string;
            }

            const logs = getAuditLogs(filters);

            // Calculate statistics
            const summary = {
                totalLogs: logs.length,
                timeRange: {
                    days: daysNum,
                    startDate,
                    endDate: new Date(),
                },
                byCategory: {} as Record<string, number>,
                bySeverity: {} as Record<string, number>,
                byAction: {} as Record<string, number>,
                uniqueUsers: new Set<string>(),
                uniqueIPs: new Set<string>(),
                suspiciousActivities: 0,
                highRiskActivities: 0,
                errorCount: 0,
                topUsers: {} as Record<string, number>,
                topIPs: {} as Record<string, number>,
                recentHighRisk: [] as any[],
            };

            // Process logs
            logs.forEach(log => {
                // Category stats
                summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;

                // Severity stats
                summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;

                // Action stats
                summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;

                // Unique users and IPs
                if (log.userId) summary.uniqueUsers.add(log.userId.toString());
                summary.uniqueIPs.add(log.ipAddress);

                // Risk and suspicious activities
                if (log.suspicious) summary.suspiciousActivities++;
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

                // Error count
                if (log.errorMessage || (log.statusCode && log.statusCode >= 400)) {
                    summary.errorCount++;
                }

                // Top users
                if (log.userId) {
                    const userKey = log.userEmail || log.userId.toString();
                    summary.topUsers[userKey] = (summary.topUsers[userKey] || 0) + 1;
                }

                // Top IPs
                summary.topIPs[log.ipAddress] = (summary.topIPs[log.ipAddress] || 0) + 1;
            });

            // Convert sets to counts
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

        } catch (error: any) {
            logger.error('Error generating audit summary', {
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

    /**
     * Get security alerts and suspicious activities
     */
    async getSecurityAlerts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { workspaceId, days = 1 } = req.query;

            // Validate permissions - only super admins or workspace owners
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view security alerts',
                });
                return;
            }

            const daysNum = parseInt(days as string, 10);
            const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

            const filters: any = {
                startDate,
                suspicious: true,
            };

            if (workspaceId) {
                filters.workspaceId = workspaceId as string;
            }

            const suspiciousLogs = getAuditLogs(filters);

            // Also get high-severity events
            const highSeverityFilters = {
                ...filters,
                suspicious: undefined,
                severity: 'high',
            };
            const highSeverityLogs = getAuditLogs(highSeverityFilters);

            const criticalSeverityFilters = {
                ...filters,
                suspicious: undefined,
                severity: 'critical',
            };
            const criticalSeverityLogs = getAuditLogs(criticalSeverityFilters);

            // Combine and deduplicate
            const allAlerts = [...suspiciousLogs, ...highSeverityLogs, ...criticalSeverityLogs];
            const uniqueAlerts = allAlerts.filter((alert, index, self) =>
                index === self.findIndex(a => a._id?.toString() === alert._id?.toString())
            );

            // Sort by severity and timestamp
            uniqueAlerts.sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                if (severityDiff !== 0) return severityDiff;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });

            // Analyze patterns
            const patterns = this.analyzeSecurityPatterns(uniqueAlerts);

            res.json({
                success: true,
                data: {
                    alerts: uniqueAlerts.slice(0, 100), // Limit to 100 most recent
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

        } catch (error: any) {
            logger.error('Error fetching security alerts', {
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

    /**
     * Export audit logs
     */
    async exportAuditLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const {
                workspaceId,
                format = 'json',
                startDate,
                endDate,
                category,
                severity,
            } = req.query;

            // Validate permissions
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to export audit logs',
                });
                return;
            }

            const filters: any = {};

            if (workspaceId) filters.workspaceId = workspaceId as string;
            if (category) filters.category = category as string;
            if (severity) filters.severity = severity as string;
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);

            const logs = getAuditLogs(filters);

            // Generate filename
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

        } catch (error: any) {
            logger.error('Error exporting audit logs', {
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

    /**
     * Helper methods
     */
    private calculateOverallRiskScore(logs: any[]): number {
        if (logs.length === 0) return 0;

        const totalRiskScore = logs.reduce((sum, log) => sum + (log.riskScore || 0), 0);
        return Math.round((totalRiskScore / logs.length) * 10) / 10;
    }

    private calculateComplianceScore(summary: any): number {
        let score = 100;

        // Deduct points for high error rate
        const errorRate = parseFloat(summary.errorRate || '0');
        if (errorRate > 10) score -= 20;
        else if (errorRate > 5) score -= 10;
        else if (errorRate > 2) score -= 5;

        // Deduct points for suspicious activities
        const suspiciousRate = summary.totalLogs > 0 ? (summary.suspiciousActivities / summary.totalLogs) * 100 : 0;
        if (suspiciousRate > 5) score -= 15;
        else if (suspiciousRate > 2) score -= 10;
        else if (suspiciousRate > 1) score -= 5;

        // Deduct points for high-risk activities
        const highRiskRate = summary.totalLogs > 0 ? (summary.highRiskActivities / summary.totalLogs) * 100 : 0;
        if (highRiskRate > 10) score -= 15;
        else if (highRiskRate > 5) score -= 10;
        else if (highRiskRate > 2) score -= 5;

        return Math.max(0, Math.min(100, score));
    }

    private analyzeSecurityPatterns(alerts: any[]): any {
        const patterns = {
            repeatedFailures: {} as Record<string, number>,
            suspiciousIPs: {} as Record<string, number>,
            unusualActivity: [] as any[],
            recommendations: [] as string[],
        };

        // Analyze repeated failures by user
        alerts.forEach(alert => {
            if (alert.errorMessage && alert.userEmail) {
                patterns.repeatedFailures[alert.userEmail] = (patterns.repeatedFailures[alert.userEmail] || 0) + 1;
            }

            // Track suspicious IPs
            if (alert.suspicious) {
                patterns.suspiciousIPs[alert.ipAddress] = (patterns.suspiciousIPs[alert.ipAddress] || 0) + 1;
            }
        });

        // Generate recommendations
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

    private convertToCSV(logs: any[]): string {
        if (logs.length === 0) return '';

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
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
                return String(value);
            });
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }
}

export const auditController = new AuditController();