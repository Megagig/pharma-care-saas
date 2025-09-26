"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACSecurityMonitoringService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const rbacAuditService_1 = require("./rbacAuditService");
class RBACSecurityMonitoringService {
    constructor() {
        this.activeAlerts = new Map();
        this.suspiciousPatterns = new Map();
        this.privilegeEscalationAttempts = [];
        this.RAPID_ROLE_ASSIGNMENT_THRESHOLD = 10;
        this.BULK_OPERATION_THRESHOLD = 50;
        this.PRIVILEGE_ESCALATION_RISK_THRESHOLD = 80;
        this.ADMIN_ROLE_ASSIGNMENT_COOLDOWN = 300000;
    }
    static getInstance() {
        if (!RBACSecurityMonitoringService.instance) {
            RBACSecurityMonitoringService.instance = new RBACSecurityMonitoringService();
        }
        return RBACSecurityMonitoringService.instance;
    }
    async monitorRoleAssignment(assignerId, targetUserId, roleId, roleName, context) {
        const alerts = [];
        let allowed = true;
        if (assignerId.toString() === targetUserId.toString()) {
            const escalationAttempt = await this.detectSelfPrivilegeEscalation(assignerId, roleId, roleName, context);
            if (escalationAttempt.blocked) {
                allowed = false;
                alerts.push(await this.createSecurityAlert('privilege_escalation', 'critical', assignerId, 'Self-privilege escalation attempt detected', escalationAttempt.details, ['block_operation', 'notify_admins', 'require_approval']));
            }
        }
        const rapidAssignmentAlert = await this.detectRapidRoleAssignments(assignerId);
        if (rapidAssignmentAlert) {
            alerts.push(rapidAssignmentAlert);
        }
        if (this.isAdminRole(roleName)) {
            const adminAssignmentAlert = await this.detectUnauthorizedAdminAssignment(assignerId, targetUserId, roleName, context);
            if (adminAssignmentAlert) {
                alerts.push(adminAssignmentAlert);
                if (adminAssignmentAlert.severity === 'critical') {
                    allowed = false;
                }
            }
        }
        for (const alert of alerts) {
            await this.logSecurityAlert(alert);
        }
        return { allowed, alerts };
    }
    async monitorBulkOperation(userId, operationType, itemCount, affectedUsers, context) {
        const alerts = [];
        let allowed = true;
        if (itemCount > this.BULK_OPERATION_THRESHOLD) {
            const hasAdminPermission = await this.verifyAdminPermission(userId, 'bulk_operations');
            if (!hasAdminPermission) {
                allowed = false;
                alerts.push(await this.createSecurityAlert('bulk_suspicious', 'high', userId, `Large bulk operation (${itemCount} items) without proper authorization`, {
                    operationType,
                    itemCount,
                    affectedUserCount: affectedUsers.length,
                    hasAdminPermission
                }, ['block_operation', 'require_admin_approval', 'notify_security_team']));
            }
        }
        const bulkPatternAlert = await this.detectSuspiciousBulkPatterns(userId, operationType, itemCount, affectedUsers);
        if (bulkPatternAlert) {
            alerts.push(bulkPatternAlert);
        }
        for (const alert of alerts) {
            await this.logSecurityAlert(alert);
        }
        return { allowed, alerts };
    }
    async monitorPermissionBypass(userId, attemptedAction, deniedReason, context) {
        const userKey = userId.toString();
        const pattern = this.suspiciousPatterns.get(userKey) || {
            userId,
            patternType: 'permission_bypass',
            occurrences: 0,
            firstSeen: new Date(),
            lastSeen: new Date(),
            riskScore: 0,
            details: { attemptedActions: [] }
        };
        pattern.occurrences++;
        pattern.lastSeen = new Date();
        pattern.details.attemptedActions.push({
            action: attemptedAction,
            reason: deniedReason,
            timestamp: new Date()
        });
        pattern.riskScore = this.calculateBypassRiskScore(pattern);
        this.suspiciousPatterns.set(userKey, pattern);
        if (pattern.occurrences >= 5 && pattern.riskScore >= 60) {
            const alert = await this.createSecurityAlert('permission_bypass', pattern.riskScore >= 80 ? 'high' : 'medium', userId, `Multiple permission bypass attempts detected (${pattern.occurrences} attempts)`, {
                attemptedActions: pattern.details.attemptedActions,
                riskScore: pattern.riskScore,
                timespan: pattern.lastSeen.getTime() - pattern.firstSeen.getTime()
            }, ['monitor_user', 'review_permissions', 'notify_admins']);
            await this.logSecurityAlert(alert);
            return alert;
        }
        return null;
    }
    async detectSelfPrivilegeEscalation(userId, roleId, roleName, context) {
        const user = await User_1.default.findById(userId);
        const role = await Role_1.default.findById(roleId);
        let riskScore = 50;
        let blocked = false;
        const details = {
            targetRole: roleName,
            currentRoles: user?.assignedRoles || [],
            timestamp: new Date()
        };
        if (this.isAdminRole(roleName)) {
            riskScore += 40;
            blocked = true;
            details.escalationType = 'admin_self_assignment';
        }
        if (this.isSuperAdminRole(roleName)) {
            riskScore = 100;
            blocked = true;
            details.escalationType = 'super_admin_self_assignment';
        }
        if (user && await this.hasHigherPrivileges(user, role)) {
            riskScore -= 20;
            details.hasHigherPrivileges = true;
        }
        const attempt = {
            userId,
            attemptType: 'self_escalation',
            timestamp: new Date(),
            details,
            blocked,
            riskScore
        };
        this.privilegeEscalationAttempts.push(attempt);
        await rbacAuditService_1.RBACSecurityAuditService.logPermissionChange({
            userId,
            action: 'PRIVILEGE_ESCALATION_ATTEMPT',
            roleId,
            roleName,
            securityContext: {
                riskScore,
                anomalyDetected: true,
                escalationReason: `Self-privilege escalation to ${roleName}`
            }
        });
        return attempt;
    }
    async detectRapidRoleAssignments(userId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentAssignments = await AuditLog_1.AuditLog.countDocuments({
            userId,
            action: 'ROLE_ASSIGNED',
            timestamp: { $gte: fiveMinutesAgo }
        });
        if (recentAssignments >= this.RAPID_ROLE_ASSIGNMENT_THRESHOLD) {
            return await this.createSecurityAlert('rapid_changes', 'medium', userId, `Rapid role assignments detected (${recentAssignments} in 5 minutes)`, {
                assignmentCount: recentAssignments,
                timeWindow: '5 minutes',
                threshold: this.RAPID_ROLE_ASSIGNMENT_THRESHOLD
            }, ['monitor_user', 'rate_limit', 'notify_admins']);
        }
        return null;
    }
    async detectUnauthorizedAdminAssignment(assignerId, targetUserId, roleName, context) {
        const assigner = await User_1.default.findById(assignerId);
        const hasAdminAssignmentPermission = await this.verifyAdminPermission(assignerId, 'admin_role_assignment');
        if (!hasAdminAssignmentPermission) {
            const severity = this.isSuperAdminRole(roleName) ? 'critical' : 'high';
            return await this.createSecurityAlert('unauthorized_admin', severity, assignerId, `Unauthorized attempt to assign admin role: ${roleName}`, {
                targetUserId,
                roleName,
                assignerRoles: assigner?.assignedRoles || [],
                hasPermission: hasAdminAssignmentPermission
            }, severity === 'critical'
                ? ['block_operation', 'notify_security_team', 'require_super_admin_approval']
                : ['require_admin_approval', 'notify_admins']);
        }
        return null;
    }
    async detectSuspiciousBulkPatterns(userId, operationType, itemCount, affectedUsers) {
        const adminUsers = await User_1.default.find({
            _id: { $in: affectedUsers },
            $or: [
                { role: { $in: ['super_admin', 'owner'] } },
                { assignedRoles: { $exists: true, $ne: [] } }
            ]
        });
        if (adminUsers.length > 0) {
            return await this.createSecurityAlert('bulk_suspicious', 'high', userId, `Bulk operation affecting ${adminUsers.length} admin users`, {
                operationType,
                totalItems: itemCount,
                adminUsersAffected: adminUsers.length,
                adminUserIds: adminUsers.map((u) => u._id)
            }, ['require_admin_approval', 'notify_security_team', 'audit_operation']);
        }
        const hour = new Date().getHours();
        if ((hour < 6 || hour > 22) && itemCount > 20) {
            return await this.createSecurityAlert('bulk_suspicious', 'medium', userId, `Large bulk operation during off-hours (${hour}:00)`, {
                operationType,
                itemCount,
                hour,
                isOffHours: true
            }, ['monitor_operation', 'notify_admins', 'require_justification']);
        }
        return null;
    }
    calculateBypassRiskScore(pattern) {
        let score = pattern.occurrences * 10;
        const highPrivilegeActions = pattern.details.attemptedActions.filter((attempt) => attempt.action.includes('admin') ||
            attempt.action.includes('delete') ||
            attempt.action.includes('modify'));
        score += highPrivilegeActions.length * 15;
        const timespan = pattern.lastSeen.getTime() - pattern.firstSeen.getTime();
        if (timespan < 300000) {
            score += 20;
        }
        return Math.min(score, 100);
    }
    async createSecurityAlert(type, severity, userId, description, details, actions) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            userId,
            timestamp: new Date(),
            description,
            details,
            resolved: false,
            actions
        };
        this.activeAlerts.set(alert.id, alert);
        return alert;
    }
    async logSecurityAlert(alert) {
        await rbacAuditService_1.RBACSecurityAuditService.logPermissionChange({
            userId: alert.userId,
            action: 'SECURITY_POLICY_VIOLATION',
            securityContext: {
                riskScore: this.severityToRiskScore(alert.severity),
                anomalyDetected: true,
                escalationReason: alert.description
            }
        });
    }
    async verifyAdminPermission(userId, permission) {
        const user = await User_1.default.findById(userId);
        if (!user)
            return false;
        if (user.role === 'super_admin')
            return true;
        if (user.role === 'owner' || user.workplaceRole === 'Owner')
            return true;
        return false;
    }
    isAdminRole(roleName) {
        const adminRoles = ['admin', 'administrator', 'owner', 'manager', 'super_admin'];
        return adminRoles.some(role => roleName.toLowerCase().includes(role));
    }
    isSuperAdminRole(roleName) {
        const superAdminRoles = ['super_admin', 'system_admin', 'root'];
        return superAdminRoles.some(role => roleName.toLowerCase().includes(role));
    }
    async hasHigherPrivileges(user, role) {
        if (!role)
            return false;
        if (user.role === 'super_admin')
            return true;
        return false;
    }
    severityToRiskScore(severity) {
        const scoreMap = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'critical': 95
        };
        return scoreMap[severity];
    }
    getActiveAlerts(userId) {
        const alerts = Array.from(this.activeAlerts.values());
        if (userId) {
            return alerts.filter(alert => alert.userId.toString() === userId.toString());
        }
        return alerts.filter(alert => !alert.resolved);
    }
    async resolveAlert(alertId, resolvedBy, resolution) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.resolved = true;
        alert.resolvedBy = resolvedBy;
        alert.resolvedAt = new Date();
        alert.details.resolution = resolution;
        await rbacAuditService_1.RBACSecurityAuditService.logPermissionChange({
            userId: resolvedBy,
            action: 'SECURITY_ALERT_RESOLVED',
            securityContext: {
                riskScore: 10,
                anomalyDetected: false
            }
        });
        return true;
    }
    async getSecurityStatistics(startDate, endDate) {
        const alerts = Array.from(this.activeAlerts.values()).filter(alert => alert.timestamp >= startDate && alert.timestamp <= endDate);
        const alertsBySeverity = alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
        const alertsByType = alerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
        }, {});
        const resolvedAlerts = alerts.filter(alert => alert.resolved);
        const averageResolutionTime = resolvedAlerts.length > 0
            ? resolvedAlerts.reduce((sum, alert) => {
                if (alert.resolvedAt) {
                    return sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime());
                }
                return sum;
            }, 0) / resolvedAlerts.length
            : 0;
        return {
            totalAlerts: alerts.length,
            alertsBySeverity,
            alertsByType,
            privilegeEscalationAttempts: this.privilegeEscalationAttempts.filter(attempt => attempt.timestamp >= startDate && attempt.timestamp <= endDate).length,
            resolvedAlerts: resolvedAlerts.length,
            averageResolutionTime: Math.round(averageResolutionTime / 1000 / 60)
        };
    }
    cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        for (const [alertId, alert] of this.activeAlerts.entries()) {
            if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffDate) {
                this.activeAlerts.delete(alertId);
            }
        }
        for (const [userId, pattern] of this.suspiciousPatterns.entries()) {
            if (pattern.lastSeen < cutoffDate) {
                this.suspiciousPatterns.delete(userId);
            }
        }
        this.privilegeEscalationAttempts = this.privilegeEscalationAttempts.filter(attempt => attempt.timestamp >= cutoffDate);
    }
}
exports.RBACSecurityMonitoringService = RBACSecurityMonitoringService;
exports.default = RBACSecurityMonitoringService;
//# sourceMappingURL=rbacSecurityMonitoringService.js.map