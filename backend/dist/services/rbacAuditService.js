"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACSecurityMonitor = exports.RBACSecurityAuditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const auditService_1 = require("./auditService");
class RBACSecurityMonitor {
    constructor() {
        this.suspiciousPatterns = new Map();
        this.bulkOperations = new Map();
    }
    static getInstance() {
        if (!RBACSecurityMonitor.instance) {
            RBACSecurityMonitor.instance = new RBACSecurityMonitor();
        }
        return RBACSecurityMonitor.instance;
    }
    calculateRiskScore(action, userId, context) {
        let riskScore = 0;
        const actionRiskScores = {
            'ROLE_CREATED': 30,
            'ROLE_UPDATED': 25,
            'ROLE_DELETED': 40,
            'ROLE_ASSIGNED': 20,
            'ROLE_REVOKED': 25,
            'ADMIN_ROLE_ASSIGNMENT': 80,
            'SUPER_ADMIN_ACCESS': 90,
            'PRIVILEGE_ESCALATION_ATTEMPT': 95,
            'BULK_ROLE_ASSIGNMENT': 50,
            'ROLE_HIERARCHY_MODIFIED': 60,
            'PERMISSION_GRANTED': 15,
            'PERMISSION_REVOKED': 20,
            'UNAUTHORIZED_ACCESS_ATTEMPT': 85
        };
        riskScore = actionRiskScores[action] || 10;
        if (context.targetRole?.includes('admin') || context.targetRole?.includes('super')) {
            riskScore += 30;
        }
        if (context.bulkCount && context.bulkCount > 10) {
            riskScore += Math.min(context.bulkCount * 2, 40);
        }
        const userKey = userId.toString();
        const recentCount = this.suspiciousPatterns.get(userKey) || 0;
        if (recentCount > 5) {
            riskScore += 25;
        }
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            riskScore += 15;
        }
        if (context.hierarchyLevel && context.hierarchyLevel > 3) {
            riskScore += 20;
        }
        return Math.min(riskScore, 100);
    }
    detectAnomalies(action, userId, context) {
        const userKey = userId.toString();
        const currentCount = this.suspiciousPatterns.get(userKey) || 0;
        this.suspiciousPatterns.set(userKey, currentCount + 1);
        setTimeout(() => {
            this.suspiciousPatterns.delete(userKey);
        }, 3600000);
        if (currentCount > 10 && action.includes('ROLE_ASSIGNED')) {
            return {
                detected: true,
                reason: 'Rapid role assignment pattern detected'
            };
        }
        if (action === 'ADMIN_ROLE_ASSIGNMENT' && context.targetUserId?.toString() === userId.toString()) {
            return {
                detected: true,
                reason: 'Self-privilege escalation attempt'
            };
        }
        if (context.bulkCount > 50 && !context.hasAdminPermission) {
            return {
                detected: true,
                reason: 'Large bulk operation without admin permission'
            };
        }
        if (action === 'ROLE_HIERARCHY_MODIFIED' && context.hierarchyLevel > 5) {
            return {
                detected: true,
                reason: 'Deep hierarchy modification detected'
            };
        }
        return { detected: false };
    }
    startBulkOperation(operationType, totalItems) {
        const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.bulkOperations.set(operationId, {
            operationId,
            operationType,
            totalItems,
            successCount: 0,
            failureCount: 0,
            startTime: new Date(),
            errors: []
        });
        return operationId;
    }
    updateBulkOperation(operationId, success, error) {
        const operation = this.bulkOperations.get(operationId);
        if (!operation)
            return;
        if (success) {
            operation.successCount++;
        }
        else {
            operation.failureCount++;
            if (error) {
                operation.errors?.push({
                    ...error,
                    timestamp: new Date()
                });
            }
        }
    }
    completeBulkOperation(operationId) {
        const operation = this.bulkOperations.get(operationId);
        if (!operation)
            return null;
        operation.endTime = new Date();
        this.bulkOperations.delete(operationId);
        return operation;
    }
}
exports.RBACSecurityMonitor = RBACSecurityMonitor;
class RBACSecurityAuditService extends auditService_1.AuditService {
    static async logPermissionChange(change, req) {
        const securityMonitor = RBACSecurityAuditService.securityMonitor;
        const riskScore = securityMonitor.calculateRiskScore(change.action, change.userId, {
            targetRole: change.roleName,
            bulkCount: 1,
            hierarchyLevel: change.hierarchyLevel,
            targetUserId: change.targetUserId
        });
        const anomalyResult = securityMonitor.detectAnomalies(change.action, change.userId, {
            targetUserId: change.targetUserId,
            hierarchyLevel: change.hierarchyLevel
        });
        const securityContext = {
            riskScore,
            anomalyDetected: anomalyResult.detected,
            escalationReason: anomalyResult.reason,
            previousPermissions: change.securityContext?.previousPermissions,
            newPermissions: change.securityContext?.newPermissions,
            ...change.securityContext
        };
        const auditData = {
            action: change.action,
            userId: change.userId.toString(),
            details: {
                roleId: change.roleId,
                roleName: change.roleName,
                permissionAction: change.permissionAction,
                permissionSource: change.permissionSource,
                targetUserId: change.targetUserId,
                hierarchyLevel: change.hierarchyLevel,
                securityContext
            },
            complianceCategory: 'rbac_management',
            riskLevel: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            oldValues: change.oldValues,
            newValues: change.newValues
        };
        const auditLog = await RBACSecurityAuditService.createAuditLog(auditData, req);
        await AuditLog_1.AuditLog.findByIdAndUpdate(auditLog._id, {
            $set: {
                roleId: change.roleId,
                roleName: change.roleName,
                targetUserId: change.targetUserId,
                permissionAction: change.permissionAction,
                permissionSource: change.permissionSource,
                hierarchyLevel: change.hierarchyLevel,
                securityContext
            }
        });
        if (riskScore >= 80 || anomalyResult.detected) {
            await RBACSecurityAuditService.triggerSecurityAlert(auditLog, securityContext);
        }
        return auditLog;
    }
    static async logBulkOperation(operationType, userId, items, req) {
        const securityMonitor = RBACSecurityAuditService.securityMonitor;
        const operationId = securityMonitor.startBulkOperation(operationType, items.length);
        items.forEach(item => {
            securityMonitor.updateBulkOperation(operationId, item.success, item.error ? { itemId: item.id, error: item.error } : undefined);
        });
        const operation = securityMonitor.completeBulkOperation(operationId);
        if (!operation) {
            throw new Error('Failed to complete bulk operation tracking');
        }
        const riskScore = securityMonitor.calculateRiskScore('BULK_ROLE_ASSIGNMENT', userId, {
            bulkCount: items.length,
            hasAdminPermission: true
        });
        const auditData = {
            action: 'BULK_ROLE_ASSIGNMENT',
            userId: userId.toString(),
            details: {
                operationType,
                totalItems: operation.totalItems,
                successCount: operation.successCount,
                failureCount: operation.failureCount,
                duration: operation.endTime ?
                    operation.endTime.getTime() - operation.startTime.getTime() : 0,
                errors: operation.errors
            },
            complianceCategory: 'rbac_management',
            riskLevel: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium'
        };
        const auditLog = await RBACSecurityAuditService.createAuditLog(auditData, req);
        await AuditLog_1.AuditLog.findByIdAndUpdate(auditLog._id, {
            $set: {
                bulkOperationId: operationId,
                securityContext: {
                    riskScore,
                    anomalyDetected: riskScore >= 80
                }
            }
        });
        return { operationId, auditLog };
    }
    static async logRoleHierarchyChange(userId, roleId, roleName, action, oldHierarchy, newHierarchy, req) {
        return RBACSecurityAuditService.logPermissionChange({
            userId,
            action,
            roleId,
            roleName,
            hierarchyLevel: newHierarchy.level,
            oldValues: { hierarchy: oldHierarchy },
            newValues: { hierarchy: newHierarchy },
            securityContext: {
                riskScore: 0,
                anomalyDetected: false,
                previousPermissions: oldHierarchy.permissions,
                newPermissions: newHierarchy.permissions
            }
        }, req);
    }
    static async logPermissionCheck(userId, permissionAction, allowed, source, context, req) {
        const action = allowed ? 'PERMISSION_CHECKED' : 'PERMISSION_DENIED';
        const auditData = {
            action,
            userId: userId.toString(),
            details: {
                permissionAction,
                allowed,
                source,
                reason: context.reason,
                roleId: context.roleId,
                roleName: context.roleName,
                requiredPermissions: context.requiredPermissions
            },
            complianceCategory: 'access_control',
            riskLevel: allowed ? 'low' : 'medium'
        };
        const auditLog = await RBACSecurityAuditService.createAuditLog(auditData, req);
        await AuditLog_1.AuditLog.findByIdAndUpdate(auditLog._id, {
            $set: {
                permissionAction,
                permissionSource: source,
                roleId: context.roleId
            }
        });
        return auditLog;
    }
    static async getRBACSecuritySummary(startDate, endDate, workspaceId) {
        const query = {
            timestamp: { $gte: startDate, $lte: endDate },
            complianceCategory: { $in: ['rbac_management', 'security_monitoring', 'access_control'] }
        };
        if (workspaceId) {
            query.workspaceId = workspaceId;
        }
        const [totalRBACOperations, highRiskOperations, anomalousOperations, privilegeEscalations, bulkOperations, permissionDenials, roleOperations, recentAlerts] = await Promise.all([
            AuditLog_1.AuditLog.countDocuments(query),
            AuditLog_1.AuditLog.countDocuments({ ...query, riskLevel: { $in: ['high', 'critical'] } }),
            AuditLog_1.AuditLog.countDocuments({ ...query, 'securityContext.anomalyDetected': true }),
            AuditLog_1.AuditLog.countDocuments({ ...query, action: 'PRIVILEGE_ESCALATION_ATTEMPT' }),
            AuditLog_1.AuditLog.countDocuments({ ...query, bulkOperationId: { $exists: true } }),
            AuditLog_1.AuditLog.countDocuments({ ...query, action: 'PERMISSION_DENIED' }),
            AuditLog_1.AuditLog.aggregate([
                { $match: { ...query, action: { $regex: '^ROLE_' } } },
                { $group: { _id: '$action', count: { $sum: 1 } } }
            ]),
            AuditLog_1.AuditLog.find({
                ...query,
                'securityContext.anomalyDetected': true,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('userId', 'firstName lastName email')
        ]);
        return {
            summary: {
                totalRBACOperations,
                highRiskOperations,
                anomalousOperations,
                privilegeEscalations,
                bulkOperations,
                permissionDenials,
                securityScore: Math.max(0, 100 - (highRiskOperations / Math.max(totalRBACOperations, 1)) * 100)
            },
            roleOperations: roleOperations.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            recentAlerts: recentAlerts.map(alert => ({
                id: alert._id,
                action: alert.action,
                timestamp: alert.timestamp,
                user: alert.userId,
                riskScore: alert.securityContext?.riskScore,
                reason: alert.securityContext?.escalationReason
            }))
        };
    }
    static async triggerSecurityAlert(auditLog, securityContext) {
        console.warn('RBAC Security Alert:', {
            auditLogId: auditLog._id,
            action: auditLog.action,
            userId: auditLog.userId,
            riskScore: securityContext.riskScore,
            anomalyDetected: securityContext.anomalyDetected,
            escalationReason: securityContext.escalationReason,
            timestamp: auditLog.timestamp
        });
    }
    static async exportRBACLogs(options) {
        const query = {
            timestamp: { $gte: options.startDate, $lte: options.endDate },
            complianceCategory: { $in: ['rbac_management', 'security_monitoring', 'access_control'] }
        };
        if (options.riskLevelFilter?.length) {
            query.riskLevel = { $in: options.riskLevelFilter };
        }
        if (options.actionFilter?.length) {
            query.action = { $in: options.actionFilter };
        }
        const logs = await AuditLog_1.AuditLog.find(query)
            .populate('userId', 'firstName lastName email')
            .populate('targetUserId', 'firstName lastName email')
            .populate('roleId', 'name displayName')
            .sort({ timestamp: -1 })
            .lean();
        if (options.format === 'csv') {
            return RBACSecurityAuditService.convertRBACLogsToCSV(logs, options.includeSecurityContext);
        }
        else {
            return JSON.stringify(logs, null, 2);
        }
    }
    static convertRBACLogsToCSV(logs, includeSecurityContext = false) {
        if (logs.length === 0) {
            return 'No RBAC audit data available';
        }
        const baseHeaders = [
            'Timestamp',
            'Action',
            'User',
            'User Email',
            'Target User',
            'Role Name',
            'Permission Action',
            'Permission Source',
            'Risk Level',
            'IP Address',
            'Bulk Operation ID'
        ];
        const securityHeaders = [
            'Risk Score',
            'Anomaly Detected',
            'Escalation Reason',
            'Previous Permissions',
            'New Permissions'
        ];
        const headers = includeSecurityContext ? [...baseHeaders, ...securityHeaders] : baseHeaders;
        const rows = logs.map(log => {
            const baseRow = [
                log.timestamp,
                log.action,
                log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown',
                log.userId?.email || 'Unknown',
                log.targetUserId ? `${log.targetUserId.firstName} ${log.targetUserId.lastName}` : '',
                log.roleName || '',
                log.permissionAction || '',
                log.permissionSource || '',
                log.riskLevel,
                log.ipAddress || '',
                log.bulkOperationId || ''
            ];
            if (includeSecurityContext) {
                const securityRow = [
                    log.securityContext?.riskScore || 0,
                    log.securityContext?.anomalyDetected || false,
                    log.securityContext?.escalationReason || '',
                    log.securityContext?.previousPermissions?.join('; ') || '',
                    log.securityContext?.newPermissions?.join('; ') || ''
                ];
                return [...baseRow, ...securityRow];
            }
            return baseRow;
        });
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        return csvContent;
    }
}
exports.RBACSecurityAuditService = RBACSecurityAuditService;
RBACSecurityAuditService.securityMonitor = RBACSecurityMonitor.getInstance();
exports.default = RBACSecurityAuditService;
//# sourceMappingURL=rbacAuditService.js.map