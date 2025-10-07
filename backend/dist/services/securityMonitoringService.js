"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupSecurityMonitoring = exports.securityMonitoringService = void 0;
const auditLogging_1 = require("../middlewares/auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const securityThreats = [];
const securityAlerts = [];
const blockedIPs = new Set();
const suspiciousUsers = new Map();
const SECURITY_CONFIG = {
    MAX_FAILED_LOGINS: 5,
    FAILED_LOGIN_WINDOW: 15 * 60 * 1000,
    MAX_REQUESTS_PER_MINUTE: 100,
    MAX_INVITATIONS_PER_HOUR: 10,
    HIGH_RISK_SCORE_THRESHOLD: 8,
    CRITICAL_RISK_SCORE_THRESHOLD: 9,
    MAX_CONCURRENT_SESSIONS: 5,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    MAX_USERS_PER_IP: 10,
    ALERT_COOLDOWN: 60 * 60 * 1000,
};
class SecurityMonitoringService {
    constructor() {
        this.alertCooldowns = new Map();
    }
    static getInstance() {
        if (!SecurityMonitoringService.instance) {
            SecurityMonitoringService.instance = new SecurityMonitoringService();
        }
        return SecurityMonitoringService.instance;
    }
    async analyzeSecurityEvent(req, eventType, eventData) {
        try {
            const threats = [];
            switch (eventType) {
                case 'login_failed':
                    threats.push(...await this.detectBruteForceAttack(req, eventData));
                    break;
                case 'permission_denied':
                    threats.push(...await this.detectPermissionEscalation(req, eventData));
                    break;
                case 'invitation_created':
                    threats.push(...await this.detectInvitationSpam(req, eventData));
                    break;
                case 'data_access':
                    threats.push(...await this.detectDataExfiltration(req, eventData));
                    break;
                case 'session_created':
                    threats.push(...await this.detectSessionAnomalies(req, eventData));
                    break;
                default:
                    threats.push(...await this.detectSuspiciousActivity(req, eventData));
            }
            for (const threat of threats) {
                await this.processThreat(threat);
            }
        }
        catch (error) {
            logger_1.default.error('Error analyzing security event', {
                error: error?.message || 'Unknown error',
                eventType,
                userId: req.user?._id,
                service: 'security-monitoring',
            });
        }
    }
    async detectBruteForceAttack(req, eventData) {
        const threats = [];
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const recentFailures = (0, auditLogging_1.getAuditLogs)({
            startDate: new Date(Date.now() - SECURITY_CONFIG.FAILED_LOGIN_WINDOW),
            category: 'authentication',
        }).filter(log => log.ipAddress === ipAddress &&
            log.action === 'USER_LOGIN_FAILED');
        if (recentFailures.length >= SECURITY_CONFIG.MAX_FAILED_LOGINS) {
            threats.push({
                id: `brute_force_${ipAddress}_${Date.now()}`,
                type: 'brute_force',
                severity: 'high',
                ipAddress,
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Brute force attack detected: ${recentFailures.length} failed login attempts in ${SECURITY_CONFIG.FAILED_LOGIN_WINDOW / 60000} minutes`,
                evidence: {
                    failedAttempts: recentFailures.length,
                    timeWindow: SECURITY_CONFIG.FAILED_LOGIN_WINDOW,
                    targetEmails: [...new Set(recentFailures.map(f => f.details?.email).filter(Boolean))],
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['block_ip', 'alert_admins'],
            });
        }
        return threats;
    }
    async detectPermissionEscalation(req, eventData) {
        const threats = [];
        if (!req.user)
            return threats;
        const recentDenials = (0, auditLogging_1.getAuditLogs)({
            userId: req.user._id.toString(),
            startDate: new Date(Date.now() - 60 * 60 * 1000),
            category: 'authorization',
        }).filter(log => log.action === 'PERMISSION_DENIED');
        if (recentDenials.length > 10) {
            threats.push({
                id: `permission_escalation_${req.user._id}_${Date.now()}`,
                type: 'permission_escalation',
                severity: 'medium',
                userId: req.user._id,
                workspaceId: req.workspace?._id,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Potential permission escalation: ${recentDenials.length} permission denied events in the last hour`,
                evidence: {
                    denialCount: recentDenials.length,
                    attemptedPermissions: [...new Set(recentDenials.map(d => d.details?.requiredPermission).filter(Boolean))],
                    userRole: req.user.role,
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['monitor_user', 'alert_workspace_owner'],
            });
        }
        return threats;
    }
    async detectInvitationSpam(req, eventData) {
        const threats = [];
        if (!req.user)
            return threats;
        const recentInvitations = (0, auditLogging_1.getAuditLogs)({
            userId: req.user._id.toString(),
            startDate: new Date(Date.now() - 60 * 60 * 1000),
            category: 'invitation',
        }).filter(log => log.action === 'INVITATION_CREATED');
        if (recentInvitations.length > SECURITY_CONFIG.MAX_INVITATIONS_PER_HOUR) {
            threats.push({
                id: `invitation_spam_${req.user._id}_${Date.now()}`,
                type: 'invitation_spam',
                severity: 'medium',
                userId: req.user._id,
                workspaceId: req.workspace?._id,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Invitation spam detected: ${recentInvitations.length} invitations created in the last hour`,
                evidence: {
                    invitationCount: recentInvitations.length,
                    invitedEmails: recentInvitations.map(i => i.details?.inviteeEmail).filter(Boolean),
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['rate_limit_user', 'alert_admins'],
            });
        }
        return threats;
    }
    async detectDataExfiltration(req, eventData) {
        const threats = [];
        if (!req.user)
            return threats;
        const recentAccess = (0, auditLogging_1.getAuditLogs)({
            userId: req.user._id.toString(),
            startDate: new Date(Date.now() - 60 * 60 * 1000),
            category: 'data_access',
        });
        const exportEvents = recentAccess.filter(log => log.action.includes('EXPORT'));
        const bulkAccess = recentAccess.filter(log => log.action.includes('BULK'));
        if (exportEvents.length > 5 || bulkAccess.length > 10) {
            threats.push({
                id: `data_exfiltration_${req.user._id}_${Date.now()}`,
                type: 'data_exfiltration',
                severity: 'high',
                userId: req.user._id,
                workspaceId: req.workspace?._id,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Potential data exfiltration: Unusual data access patterns detected`,
                evidence: {
                    exportEvents: exportEvents.length,
                    bulkAccess: bulkAccess.length,
                    totalAccess: recentAccess.length,
                    accessedResources: [...new Set(recentAccess.map(a => a.resourceType).filter(Boolean))],
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['monitor_user', 'alert_admins', 'require_mfa'],
            });
        }
        return threats;
    }
    async detectSessionAnomalies(req, eventData) {
        const threats = [];
        if (!req.user)
            return threats;
        const activeSessions = await Session_1.default.countDocuments({
            userId: req.user._id,
            isActive: true,
        });
        if (activeSessions > SECURITY_CONFIG.MAX_CONCURRENT_SESSIONS) {
            threats.push({
                id: `session_anomaly_${req.user._id}_${Date.now()}`,
                type: 'session_hijacking',
                severity: 'medium',
                userId: req.user._id,
                workspaceId: req.workspace?._id,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Suspicious session activity: ${activeSessions} concurrent sessions detected`,
                evidence: {
                    activeSessionCount: activeSessions,
                    maxAllowed: SECURITY_CONFIG.MAX_CONCURRENT_SESSIONS,
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['terminate_old_sessions', 'alert_user'],
            });
        }
        return threats;
    }
    async detectSuspiciousActivity(req, eventData) {
        const threats = [];
        const ipAddress = req.ip || 'unknown';
        const usersFromIP = (0, auditLogging_1.getAuditLogs)({
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }).filter(log => log.ipAddress === ipAddress);
        const uniqueUsers = new Set(usersFromIP.map(log => log.userId?.toString()).filter(Boolean));
        if (uniqueUsers.size > SECURITY_CONFIG.MAX_USERS_PER_IP) {
            threats.push({
                id: `suspicious_ip_${ipAddress}_${Date.now()}`,
                type: 'suspicious_activity',
                severity: 'medium',
                ipAddress,
                userAgent: req.get('User-Agent') || 'unknown',
                description: `Suspicious IP activity: ${uniqueUsers.size} different users from same IP in 24 hours`,
                evidence: {
                    uniqueUserCount: uniqueUsers.size,
                    maxAllowed: SECURITY_CONFIG.MAX_USERS_PER_IP,
                    userIds: Array.from(uniqueUsers),
                },
                timestamp: new Date(),
                resolved: false,
                actions: ['monitor_ip', 'alert_admins'],
            });
        }
        return threats;
    }
    async processThreat(threat) {
        try {
            securityThreats.push(threat);
            logger_1.default.warn('Security threat detected', {
                threatId: threat.id,
                type: threat.type,
                severity: threat.severity,
                userId: threat.userId,
                workspaceId: threat.workspaceId,
                ipAddress: threat.ipAddress,
                description: threat.description,
                service: 'security-monitoring',
            });
            await (0, auditLogging_1.createAuditLog)({
                action: `SECURITY_THREAT_${threat.type.toUpperCase()}`,
                category: 'security',
                severity: threat.severity === 'critical' ? 'critical' : 'high',
                userId: threat.userId,
                workspaceId: threat.workspaceId,
                ipAddress: threat.ipAddress,
                userAgent: threat.userAgent,
                requestMethod: 'SYSTEM',
                requestUrl: '/security/threat-detection',
                details: {
                    threatId: threat.id,
                    threatType: threat.type,
                    evidence: threat.evidence,
                    actions: threat.actions,
                },
                suspicious: true,
                riskScore: threat.severity === 'critical' ? 10 : threat.severity === 'high' ? 8 : 6,
            });
            await this.executeThreatResponse(threat);
            await this.sendSecurityAlerts(threat);
        }
        catch (error) {
            logger_1.default.error('Error processing security threat', {
                error: error?.message || 'Unknown error',
                threatId: threat.id,
                service: 'security-monitoring',
            });
        }
    }
    async executeThreatResponse(threat) {
        for (const action of threat.actions) {
            try {
                switch (action) {
                    case 'block_ip':
                        blockedIPs.add(threat.ipAddress);
                        logger_1.default.info(`IP blocked: ${threat.ipAddress}`, { threatId: threat.id });
                        break;
                    case 'rate_limit_user':
                        if (threat.userId) {
                            suspiciousUsers.set(threat.userId.toString(), {
                                score: 10,
                                lastActivity: new Date(),
                            });
                        }
                        break;
                    case 'terminate_old_sessions':
                        if (threat.userId) {
                            await Session_1.default.updateMany({
                                userId: threat.userId,
                                isActive: true,
                                createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                            }, { isActive: false });
                        }
                        break;
                    case 'monitor_user':
                        if (threat.userId) {
                            suspiciousUsers.set(threat.userId.toString(), {
                                score: 7,
                                lastActivity: new Date(),
                            });
                        }
                        break;
                    case 'monitor_ip':
                        logger_1.default.info(`IP added to monitoring: ${threat.ipAddress}`, { threatId: threat.id });
                        break;
                    default:
                        logger_1.default.warn(`Unknown threat response action: ${action}`, { threatId: threat.id });
                }
            }
            catch (error) {
                logger_1.default.error(`Error executing threat response action: ${action}`, {
                    error: error?.message || 'Unknown error',
                    threatId: threat.id,
                });
            }
        }
    }
    async sendSecurityAlerts(threat) {
        const alertKey = `${threat.type}_${threat.ipAddress}`;
        const lastAlert = this.alertCooldowns.get(alertKey);
        if (lastAlert && Date.now() - lastAlert.getTime() < SECURITY_CONFIG.ALERT_COOLDOWN) {
            return;
        }
        this.alertCooldowns.set(alertKey, new Date());
        const alerts = [];
        if (threat.severity === 'critical' || threat.severity === 'high') {
            alerts.push({
                id: `alert_${threat.id}_email`,
                threatId: threat.id,
                type: 'email',
                recipient: 'security@PharmacyCopilot.com',
                message: `SECURITY ALERT: ${threat.description}`,
                sent: false,
            });
            alerts.push({
                id: `alert_${threat.id}_webhook`,
                threatId: threat.id,
                type: 'webhook',
                message: JSON.stringify({
                    threat,
                    timestamp: new Date().toISOString(),
                    source: 'PharmacyCopilot-security-monitoring',
                }),
                sent: false,
            });
        }
        if (threat.workspaceId) {
            try {
                const workspace = await Workplace_1.default.findById(threat.workspaceId).populate('ownerId');
                if (workspace && workspace.ownerId) {
                    alerts.push({
                        id: `alert_${threat.id}_workspace_owner`,
                        threatId: threat.id,
                        type: 'email',
                        recipient: workspace.ownerId.email,
                        message: `Security alert for your workspace: ${threat.description}`,
                        sent: false,
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Error getting workspace owner for alert', {
                    error: error?.message || 'Unknown error',
                    workspaceId: threat.workspaceId,
                });
            }
        }
        securityAlerts.push(...alerts);
        for (const alert of alerts) {
            await this.sendAlert(alert);
        }
    }
    async sendAlert(alert) {
        try {
            switch (alert.type) {
                case 'email':
                    logger_1.default.info(`Security alert email would be sent to: ${alert.recipient}`, {
                        alertId: alert.id,
                        message: alert.message,
                    });
                    alert.sent = true;
                    alert.sentAt = new Date();
                    break;
                case 'webhook':
                    logger_1.default.info('Security alert webhook would be sent', {
                        alertId: alert.id,
                        message: alert.message,
                    });
                    alert.sent = true;
                    alert.sentAt = new Date();
                    break;
                case 'log':
                    logger_1.default.warn('Security Alert', {
                        alertId: alert.id,
                        message: alert.message,
                    });
                    alert.sent = true;
                    alert.sentAt = new Date();
                    break;
                default:
                    logger_1.default.warn(`Unknown alert type: ${alert.type}`, { alertId: alert.id });
            }
        }
        catch (error) {
            alert.error = error?.message || 'Unknown error';
            logger_1.default.error('Error sending security alert', {
                error: error?.message || 'Unknown error',
                alertId: alert.id,
                alertType: alert.type,
            });
        }
    }
    isIPBlocked(ipAddress) {
        return blockedIPs.has(ipAddress);
    }
    getUserSuspiciousScore(userId) {
        const suspiciousData = suspiciousUsers.get(userId);
        if (!suspiciousData)
            return 0;
        const hoursSinceLastActivity = (Date.now() - suspiciousData.lastActivity.getTime()) / (60 * 60 * 1000);
        const decayedScore = Math.max(0, suspiciousData.score - hoursSinceLastActivity * 0.5);
        if (decayedScore <= 0) {
            suspiciousUsers.delete(userId);
            return 0;
        }
        return decayedScore;
    }
    getSecurityThreats(filters = {}) {
        let threats = [...securityThreats];
        if (filters.type) {
            threats = threats.filter(t => t.type === filters.type);
        }
        if (filters.severity) {
            threats = threats.filter(t => t.severity === filters.severity);
        }
        if (filters.resolved !== undefined) {
            threats = threats.filter(t => t.resolved === filters.resolved);
        }
        if (filters.userId) {
            threats = threats.filter(t => t.userId?.toString() === filters.userId);
        }
        if (filters.workspaceId) {
            threats = threats.filter(t => t.workspaceId?.toString() === filters.workspaceId);
        }
        threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (filters.limit) {
            threats = threats.slice(0, filters.limit);
        }
        return threats;
    }
    async resolveThreat(threatId, resolvedBy, notes) {
        const threat = securityThreats.find(t => t.id === threatId);
        if (!threat)
            return false;
        threat.resolved = true;
        await (0, auditLogging_1.createAuditLog)({
            action: 'SECURITY_THREAT_RESOLVED',
            category: 'security',
            severity: 'low',
            requestMethod: 'SYSTEM',
            requestUrl: '/security/resolve-threat',
            ipAddress: 'system',
            userAgent: 'security-monitoring-service',
            details: {
                threatId,
                threatType: threat.type,
                resolvedBy,
                notes,
            },
        });
        logger_1.default.info('Security threat resolved', {
            threatId,
            resolvedBy,
            notes,
            service: 'security-monitoring',
        });
        return true;
    }
    async validateUserSession(userId, sessionId) {
        try {
            const user = await User_1.default.findById(userId).populate('workplaceId');
            if (!user)
                return false;
            const session = await Session_1.default.findOne({
                userId,
                _id: sessionId,
                isActive: true,
            });
            if (!session)
                return false;
            const recentPermissionChanges = (0, auditLogging_1.getAuditLogs)({
                userId: userId.toString(),
                startDate: session.createdAt,
                category: 'authorization',
            }).filter(log => log.action.includes('PERMISSION') ||
                log.action.includes('ROLE_CHANGE'));
            if (recentPermissionChanges.length > 0) {
                await Session_1.default.findByIdAndUpdate(sessionId, { isActive: false });
                await (0, auditLogging_1.createAuditLog)({
                    action: 'SESSION_INVALIDATED_PERMISSION_CHANGE',
                    category: 'security',
                    severity: 'medium',
                    userId,
                    requestMethod: 'SYSTEM',
                    requestUrl: '/security/validate-session',
                    ipAddress: 'system',
                    userAgent: 'security-monitoring-service',
                    details: {
                        sessionId,
                        permissionChanges: recentPermissionChanges.length,
                        reason: 'User permissions changed since session creation',
                    },
                });
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Error validating user session', {
                error: error?.message || 'Unknown error',
                userId,
                sessionId,
                service: 'security-monitoring',
            });
            return false;
        }
    }
    cleanup() {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const initialThreatsLength = securityThreats.length;
        for (let i = securityThreats.length - 1; i >= 0; i--) {
            const threat = securityThreats[i];
            if (threat && threat.timestamp < cutoff) {
                securityThreats.splice(i, 1);
            }
        }
        const initialAlertsLength = securityAlerts.length;
        for (let i = securityAlerts.length - 1; i >= 0; i--) {
            const alert = securityAlerts[i];
            if (alert && alert.sentAt && alert.sentAt < cutoff) {
                securityAlerts.splice(i, 1);
            }
        }
        for (const [userId, data] of suspiciousUsers.entries()) {
            if (data.lastActivity < cutoff) {
                suspiciousUsers.delete(userId);
            }
        }
        logger_1.default.info('Security monitoring cleanup completed', {
            threatsRemoved: initialThreatsLength - securityThreats.length,
            alertsRemoved: initialAlertsLength - securityAlerts.length,
            service: 'security-monitoring',
        });
    }
}
exports.securityMonitoringService = SecurityMonitoringService.getInstance();
let securityCleanupInterval = null;
if (process.env.NODE_ENV === 'production') {
    securityCleanupInterval = setInterval(() => {
        exports.securityMonitoringService.cleanup();
    }, 60 * 60 * 1000);
}
const cleanupSecurityMonitoring = () => {
    if (securityCleanupInterval) {
        clearInterval(securityCleanupInterval);
        securityCleanupInterval = null;
    }
};
exports.cleanupSecurityMonitoring = cleanupSecurityMonitoring;
exports.default = exports.securityMonitoringService;
//# sourceMappingURL=securityMonitoringService.js.map