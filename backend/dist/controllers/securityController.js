"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityController = exports.SecurityController = void 0;
const securityMonitoringService_1 = require("../services/securityMonitoringService");
const logger_1 = __importDefault(require("../utils/logger"));
class SecurityController {
    async getSecurityThreats(req, res) {
        try {
            const { type, severity, resolved, userId, workspaceId, page = 1, limit = 50, } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view security threats',
                });
                return;
            }
            const filters = {};
            if (type)
                filters.type = type;
            if (severity)
                filters.severity = severity;
            if (resolved !== undefined)
                filters.resolved = resolved === 'true';
            if (userId)
                filters.userId = userId;
            if (workspaceId)
                filters.workspaceId = workspaceId;
            const pageNum = parseInt(page, 10);
            const limitNum = Math.min(parseInt(limit, 10), 1000);
            const allThreats = securityMonitoringService_1.securityMonitoringService.getSecurityThreats(filters);
            const total = allThreats.length;
            const skip = (pageNum - 1) * limitNum;
            const threats = allThreats.slice(skip, skip + limitNum);
            res.json({
                success: true,
                data: {
                    threats,
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
            logger_1.default.error('Error fetching security threats', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'security-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch security threats',
            });
        }
    }
    async getSecurityDashboard(req, res) {
        try {
            const { workspaceId, days = 7 } = req.query;
            if (req.user?.role !== 'super_admin' && workspaceId !== req.workspace?._id?.toString()) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to view security dashboard',
                });
                return;
            }
            const daysNum = parseInt(days, 10);
            const filters = {};
            if (workspaceId) {
                filters.workspaceId = workspaceId;
            }
            const allThreats = securityMonitoringService_1.securityMonitoringService.getSecurityThreats(filters);
            const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
            const recentThreats = allThreats.filter(threat => threat.timestamp >= cutoff);
            const dashboard = {
                summary: {
                    totalThreats: recentThreats.length,
                    resolvedThreats: recentThreats.filter(t => t.resolved).length,
                    activeThreats: recentThreats.filter(t => !t.resolved).length,
                    criticalThreats: recentThreats.filter(t => t.severity === 'critical').length,
                    highThreats: recentThreats.filter(t => t.severity === 'high').length,
                    timeRange: {
                        days: daysNum,
                        startDate: cutoff,
                        endDate: new Date(),
                    },
                },
                threatsByType: {},
                threatsBySeverity: {},
                threatsOverTime: [],
                topThreatenedUsers: [],
                topThreatenedIPs: [],
                recentThreats: recentThreats.slice(0, 10),
            };
            recentThreats.forEach(threat => {
                dashboard.threatsByType[threat.type] = (dashboard.threatsByType[threat.type] || 0) + 1;
                dashboard.threatsBySeverity[threat.severity] = (dashboard.threatsBySeverity[threat.severity] || 0) + 1;
            });
            const dailyThreats = new Map();
            for (let i = 0; i < daysNum; i++) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateKey = date.toISOString().split('T')[0];
                if (dateKey) {
                    dailyThreats.set(dateKey, 0);
                }
            }
            recentThreats.forEach(threat => {
                const dateKey = threat.timestamp.toISOString().split('T')[0];
                if (dateKey && dailyThreats.has(dateKey)) {
                    dailyThreats.set(dateKey, dailyThreats.get(dateKey) + 1);
                }
            });
            dashboard.threatsOverTime = Array.from(dailyThreats.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
            const userThreatCounts = new Map();
            recentThreats.forEach(threat => {
                if (threat.userId) {
                    const userId = threat.userId.toString();
                    userThreatCounts.set(userId, (userThreatCounts.get(userId) || 0) + 1);
                }
            });
            dashboard.topThreatenedUsers = Array.from(userThreatCounts.entries())
                .map(([userId, count]) => ({ userId, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            const ipThreatCounts = new Map();
            recentThreats.forEach(threat => {
                ipThreatCounts.set(threat.ipAddress, (ipThreatCounts.get(threat.ipAddress) || 0) + 1);
            });
            dashboard.topThreatenedIPs = Array.from(ipThreatCounts.entries())
                .map(([ip, count]) => ({ ip, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            res.json({
                success: true,
                data: dashboard,
            });
        }
        catch (error) {
            logger_1.default.error('Error generating security dashboard', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'security-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate security dashboard',
            });
        }
    }
    async resolveThreat(req, res) {
        try {
            const { threatId } = req.params;
            const { notes } = req.body;
            if (req.user?.role !== 'super_admin') {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Only super administrators can resolve security threats',
                });
                return;
            }
            const resolved = await securityMonitoringService_1.securityMonitoringService.resolveThreat(threatId || '', req.user.email, notes);
            if (!resolved) {
                res.status(404).json({
                    success: false,
                    code: 'THREAT_NOT_FOUND',
                    message: 'Security threat not found',
                });
                return;
            }
            res.json({
                success: true,
                message: 'Security threat resolved successfully',
                data: {
                    threatId,
                    resolvedBy: req.user.email,
                    resolvedAt: new Date(),
                    notes,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error resolving security threat', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                threatId: req.params.threatId,
                service: 'security-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to resolve security threat',
            });
        }
    }
    async getUserSecurityStatus(req, res) {
        try {
            const { userId } = req.params;
            if (req.user?.role !== 'super_admin' && req.user?._id.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You can only view your own security status',
                });
                return;
            }
            const suspiciousScore = securityMonitoringService_1.securityMonitoringService.getUserSuspiciousScore(userId || '');
            const userThreats = securityMonitoringService_1.securityMonitoringService.getSecurityThreats({
                userId: userId || '',
                limit: 10,
            });
            const status = {
                userId,
                suspiciousScore,
                riskLevel: suspiciousScore > 8 ? 'high' : suspiciousScore > 5 ? 'medium' : 'low',
                recentThreats: userThreats.length,
                activeThreats: userThreats.filter(t => !t.resolved).length,
                lastThreatAt: userThreats.length > 0 ? userThreats[0]?.timestamp : null,
                recommendations: this.generateSecurityRecommendations(suspiciousScore, userThreats),
            };
            res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting user security status', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                targetUserId: req.params.userId,
                service: 'security-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get user security status',
            });
        }
    }
    async getBlockedIPs(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Only super administrators can view blocked IPs',
                });
                return;
            }
            const blockingThreats = securityMonitoringService_1.securityMonitoringService.getSecurityThreats({
                type: 'brute_force',
            }).filter(threat => threat.actions.includes('block_ip'));
            const blockedIPs = blockingThreats.map(threat => ({
                ip: threat.ipAddress,
                blockedAt: threat.timestamp,
                reason: threat.description,
                threatId: threat.id,
                resolved: threat.resolved,
            }));
            res.json({
                success: true,
                data: {
                    blockedIPs,
                    total: blockedIPs.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting blocked IPs', {
                error: error?.message || 'Unknown error',
                userId: req.user?._id,
                service: 'security-controller',
            });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get blocked IPs',
            });
        }
    }
    generateSecurityRecommendations(suspiciousScore, threats) {
        const recommendations = [];
        if (suspiciousScore > 8) {
            recommendations.push('Your account has been flagged for high-risk activity. Please contact support immediately.');
        }
        else if (suspiciousScore > 5) {
            recommendations.push('Your account is under monitoring due to suspicious activity. Please review your recent actions.');
        }
        if (threats.some(t => t.type === 'brute_force')) {
            recommendations.push('Multiple failed login attempts detected. Consider enabling two-factor authentication.');
        }
        if (threats.some(t => t.type === 'permission_escalation')) {
            recommendations.push('Unauthorized access attempts detected. Review your account permissions.');
        }
        if (threats.some(t => t.type === 'data_exfiltration')) {
            recommendations.push('Unusual data access patterns detected. Review your data export activities.');
        }
        if (threats.some(t => t.type === 'session_hijacking')) {
            recommendations.push('Multiple concurrent sessions detected. Log out from unused devices.');
        }
        if (recommendations.length === 0) {
            recommendations.push('Your account security status is good. Continue following security best practices.');
        }
        return recommendations;
    }
}
exports.SecurityController = SecurityController;
exports.securityController = new SecurityController();
//# sourceMappingURL=securityController.js.map