"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.auditOperations = exports.auditMiddleware = exports.createAuditLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogs = [];
const MAX_MEMORY_LOGS = 10000;
setInterval(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialLength = auditLogs.length;
    for (let i = auditLogs.length - 1; i >= 0; i--) {
        const log = auditLogs[i];
        if (log && log.timestamp < cutoff) {
            auditLogs.splice(i, 1);
        }
    }
    if (auditLogs.length > MAX_MEMORY_LOGS) {
        auditLogs.splice(0, auditLogs.length - MAX_MEMORY_LOGS);
    }
    if (initialLength !== auditLogs.length) {
        logger_1.default.info(`Cleaned up ${initialLength - auditLogs.length} old audit logs`);
    }
}, 60 * 60 * 1000);
const createAuditLog = async (logData) => {
    try {
        const auditLog = {
            _id: new mongoose_1.default.Types.ObjectId(),
            timestamp: new Date(),
            action: logData.action || 'UNKNOWN_ACTION',
            category: logData.category || 'system',
            severity: logData.severity || 'low',
            userId: logData.userId,
            userEmail: logData.userEmail,
            userRole: logData.userRole,
            workspaceId: logData.workspaceId,
            ipAddress: logData.ipAddress || 'unknown',
            userAgent: logData.userAgent || 'unknown',
            requestMethod: logData.requestMethod || 'unknown',
            requestUrl: logData.requestUrl || 'unknown',
            requestId: logData.requestId,
            sessionId: logData.sessionId,
            resourceType: logData.resourceType,
            resourceId: logData.resourceId,
            resourceName: logData.resourceName,
            oldValues: logData.oldValues,
            newValues: logData.newValues,
            changedFields: logData.changedFields,
            details: logData.details || {},
            errorMessage: logData.errorMessage,
            statusCode: logData.statusCode,
            duration: logData.duration,
            suspicious: logData.suspicious || false,
            riskScore: logData.riskScore || calculateRiskScore(logData),
            complianceRelevant: logData.complianceRelevant || isComplianceRelevant(logData),
            retentionPeriod: logData.retentionPeriod || getRetentionPeriod(logData.category),
        };
        auditLogs.push(auditLog);
        logger_1.default.info('System Audit Log', {
            auditId: auditLog._id,
            action: auditLog.action,
            category: auditLog.category,
            severity: auditLog.severity,
            userId: auditLog.userId,
            workspaceId: auditLog.workspaceId,
            ipAddress: auditLog.ipAddress,
            resourceType: auditLog.resourceType,
            resourceId: auditLog.resourceId,
            suspicious: auditLog.suspicious,
            riskScore: auditLog.riskScore,
            service: 'system-audit',
        });
        if (auditLog.severity === 'critical' || auditLog.severity === 'high') {
            await triggerSecurityAlert(auditLog);
        }
        if (auditLog.suspicious || (auditLog.riskScore && auditLog.riskScore > 7)) {
            await detectSuspiciousActivity(auditLog);
        }
    }
    catch (error) {
        logger_1.default.error('Failed to create audit log', {
            error: error?.message || 'Unknown error',
            logData,
            service: 'system-audit',
        });
    }
};
exports.createAuditLog = createAuditLog;
const auditMiddleware = (options) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        const originalSend = res.send;
        let responseBody;
        if (options.includeResponseBody) {
            res.send = function (body) {
                responseBody = body;
                return originalSend.call(this, body);
            };
        }
        res.on('finish', async () => {
            const duration = Date.now() - startTime;
            await (0, exports.createAuditLog)({
                action: options.action,
                category: options.category,
                severity: options.severity || determineSeverity(res.statusCode, options.category),
                userId: req.user?._id,
                userEmail: req.user?.email,
                userRole: req.user?.role,
                workspaceId: req.workspace?._id,
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                requestId: req.get('X-Request-ID'),
                sessionId: req.sessionID,
                resourceType: options.resourceType,
                resourceId: req.params.id ? new mongoose_1.default.Types.ObjectId(req.params.id) : undefined,
                details: {
                    requestBody: options.includeRequestBody ? req.body : undefined,
                    responseBody: options.includeResponseBody ? responseBody : undefined,
                    query: req.query,
                    params: req.params,
                },
                statusCode: res.statusCode,
                duration,
                suspicious: detectSuspiciousRequest(req, res),
            });
        });
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
exports.auditOperations = {
    login: async (req, user, success) => {
        await (0, exports.createAuditLog)({
            action: success ? 'USER_LOGIN_SUCCESS' : 'USER_LOGIN_FAILED',
            category: 'authentication',
            severity: success ? 'low' : 'medium',
            userId: success ? user?._id : undefined,
            userEmail: user?.email || req.body?.email,
            userRole: user?.role,
            workspaceId: user?.workspaceId,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            details: {
                loginMethod: req.body?.loginMethod || 'email',
                rememberMe: req.body?.rememberMe,
                errorMessage: success ? undefined : 'Invalid credentials',
            },
            errorMessage: success ? undefined : 'Login failed',
            suspicious: !success,
        });
    },
    logout: async (req) => {
        await (0, exports.createAuditLog)({
            action: 'USER_LOGOUT',
            category: 'authentication',
            severity: 'low',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            details: {
                sessionDuration: req.sessionID ? 'unknown' : undefined,
            },
        });
    },
    invitationCreated: async (req, invitation) => {
        await (0, exports.createAuditLog)({
            action: 'INVITATION_CREATED',
            category: 'invitation',
            severity: 'medium',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType: 'Invitation',
            resourceId: invitation._id,
            details: {
                inviteeEmail: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
                workspaceName: req.workspace?.name,
            },
        });
    },
    invitationAccepted: async (req, invitation, newUser) => {
        await (0, exports.createAuditLog)({
            action: 'INVITATION_ACCEPTED',
            category: 'invitation',
            severity: 'medium',
            userId: newUser?._id,
            userEmail: newUser?.email,
            userRole: newUser?.role,
            workspaceId: invitation.workspaceId,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType: 'Invitation',
            resourceId: invitation._id,
            details: {
                invitationCode: invitation.code,
                invitedBy: invitation.invitedBy,
                role: invitation.role,
                newUserCreated: !req.user,
            },
        });
    },
    subscriptionChanged: async (req, oldSubscription, newSubscription) => {
        const changedFields = getChangedFields(oldSubscription, newSubscription);
        await (0, exports.createAuditLog)({
            action: 'SUBSCRIPTION_CHANGED',
            category: 'subscription',
            severity: 'high',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType: 'Subscription',
            resourceId: newSubscription._id,
            oldValues: oldSubscription,
            newValues: newSubscription,
            changedFields,
            details: {
                oldPlan: oldSubscription?.planId,
                newPlan: newSubscription?.planId,
                oldStatus: oldSubscription?.status,
                newStatus: newSubscription?.status,
                changeType: determineSubscriptionChangeType(oldSubscription, newSubscription),
            },
        });
    },
    permissionDenied: async (req, requiredPermission, reason) => {
        await (0, exports.createAuditLog)({
            action: 'PERMISSION_DENIED',
            category: 'authorization',
            severity: 'medium',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            details: {
                requiredPermission,
                reason,
                userPermissions: req.user?.permissions || [],
            },
            suspicious: true,
            errorMessage: `Access denied: ${reason}`,
        });
    },
    dataAccess: async (req, resourceType, resourceId, action) => {
        await (0, exports.createAuditLog)({
            action: `DATA_${action.toUpperCase()}`,
            category: 'data_access',
            severity: action === 'DELETE' ? 'high' : 'low',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType,
            resourceId: new mongoose_1.default.Types.ObjectId(resourceId),
            details: {
                accessType: action,
                resourceType,
            },
        });
    },
    noteAccess: async (req, noteId, action, details) => {
        await (0, exports.createAuditLog)({
            action: `CLINICAL_NOTE_${action.toUpperCase()}`,
            category: 'data_access',
            severity: details?.isConfidential ? 'high' : 'medium',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(noteId),
            details: {
                ...details,
                timestamp: new Date().toISOString(),
            },
            complianceRelevant: true,
        });
    },
    unauthorizedAccess: async (req, resourceType, resourceId, reason) => {
        await (0, exports.createAuditLog)({
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            category: 'security',
            severity: 'high',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType,
            resourceId: new mongoose_1.default.Types.ObjectId(resourceId),
            details: {
                reason,
                attemptedAction: `${req.method} ${req.originalUrl}`,
                timestamp: new Date().toISOString(),
            },
            errorMessage: reason,
            suspicious: true,
            complianceRelevant: true,
        });
    },
    confidentialDataAccess: async (req, resourceType, resourceId, action, details) => {
        await (0, exports.createAuditLog)({
            action: `CONFIDENTIAL_${action.toUpperCase()}`,
            category: 'data_access',
            severity: 'critical',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType,
            resourceId: new mongoose_1.default.Types.ObjectId(resourceId),
            details: {
                ...details,
                confidentialityLevel: 'high',
                accessJustification: details?.justification || 'Clinical care',
                timestamp: new Date().toISOString(),
            },
            complianceRelevant: true,
        });
    },
    bulkOperation: async (req, action, resourceType, resourceIds, details) => {
        await (0, exports.createAuditLog)({
            action: `BULK_${action.toUpperCase()}`,
            category: 'data_access',
            severity: 'high',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType,
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                ...details,
                resourceIds,
                resourceCount: resourceIds.length,
                bulkOperation: true,
                timestamp: new Date().toISOString(),
            },
            complianceRelevant: true,
        });
    },
    dataExport: async (req, exportType, recordCount, details) => {
        await (0, exports.createAuditLog)({
            action: 'DATA_EXPORT',
            category: 'data_access',
            severity: 'high',
            userId: req.user?._id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            workspaceId: req.workspace?._id,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            resourceType: 'ClinicalNote',
            details: {
                ...details,
                exportType,
                recordCount,
                exportFormat: details?.format || 'unknown',
                filters: details?.filters || {},
                timestamp: new Date().toISOString(),
            },
            complianceRelevant: true,
        });
    },
};
function calculateRiskScore(logData) {
    let score = 0;
    const categoryScores = {
        authentication: 3,
        authorization: 4,
        invitation: 2,
        subscription: 5,
        workspace: 4,
        user_management: 6,
        security: 8,
        data_access: 3,
        system: 1,
    };
    score += categoryScores[logData.category || 'system'];
    const severityMultipliers = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
    };
    score *= severityMultipliers[logData.severity || 'low'];
    if (logData.errorMessage || (logData.statusCode && logData.statusCode >= 400)) {
        score += 2;
    }
    if (logData.suspicious) {
        score += 3;
    }
    return Math.min(score, 10);
}
function isComplianceRelevant(logData) {
    const complianceCategories = ['authentication', 'authorization', 'data_access', 'user_management'];
    return complianceCategories.includes(logData.category || 'system') ||
        Boolean(logData.severity && ['high', 'critical'].includes(logData.severity));
}
function getRetentionPeriod(category) {
    const retentionPeriods = {
        authentication: 90,
        authorization: 90,
        invitation: 365,
        subscription: 2555,
        workspace: 365,
        user_management: 365,
        security: 2555,
        data_access: 365,
        system: 30,
    };
    return retentionPeriods[category || 'system'];
}
function determineSeverity(statusCode, category) {
    if (statusCode >= 500)
        return 'high';
    if (statusCode >= 400)
        return 'medium';
    if (category === 'security' || category === 'subscription')
        return 'medium';
    return 'low';
}
function detectSuspiciousRequest(req, res) {
    const suspiciousPatterns = [
        res.statusCode === 401 || res.statusCode === 403,
        req.originalUrl.includes('admin') && req.user?.role !== 'super_admin',
        req.method === 'DELETE' && !req.user,
        req.get('User-Agent')?.includes('bot') || req.get('User-Agent')?.includes('crawler'),
    ];
    return suspiciousPatterns.some(pattern => pattern);
}
function getChangedFields(oldObj, newObj) {
    if (!oldObj || !newObj)
        return [];
    const changes = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    for (const key of allKeys) {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes.push(key);
        }
    }
    return changes;
}
function determineSubscriptionChangeType(oldSub, newSub) {
    if (!oldSub)
        return 'created';
    if (oldSub.status !== newSub.status)
        return 'status_change';
    if (oldSub.planId !== newSub.planId)
        return 'plan_change';
    return 'updated';
}
async function triggerSecurityAlert(auditLog) {
    logger_1.default.warn('High-severity security event detected', {
        auditId: auditLog._id,
        action: auditLog.action,
        category: auditLog.category,
        severity: auditLog.severity,
        userId: auditLog.userId,
        workspaceId: auditLog.workspaceId,
        ipAddress: auditLog.ipAddress,
        riskScore: auditLog.riskScore,
        service: 'security-alert',
    });
}
async function detectSuspiciousActivity(auditLog) {
    const recentLogs = auditLogs.filter(log => log.timestamp > new Date(Date.now() - 60 * 60 * 1000) &&
        (log.userId?.toString() === auditLog.userId?.toString() || log.ipAddress === auditLog.ipAddress));
    const failedAttempts = recentLogs.filter(log => log.errorMessage && log.category === 'authentication').length;
    if (failedAttempts > 5) {
        logger_1.default.warn('Suspicious activity: Multiple failed authentication attempts', {
            userId: auditLog.userId,
            ipAddress: auditLog.ipAddress,
            failedAttempts,
            service: 'suspicious-activity',
        });
    }
    if (recentLogs.length > 100) {
        logger_1.default.warn('Suspicious activity: High-frequency requests', {
            userId: auditLog.userId,
            ipAddress: auditLog.ipAddress,
            requestCount: recentLogs.length,
            service: 'suspicious-activity',
        });
    }
}
const getAuditLogs = (filters) => {
    let filteredLogs = [...auditLogs];
    if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId?.toString() === filters.userId);
    }
    if (filters.workspaceId) {
        filteredLogs = filteredLogs.filter(log => log.workspaceId?.toString() === filters.workspaceId);
    }
    if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }
    if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
    }
    if (filters.suspicious !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.suspicious === filters.suspicious);
    }
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
    }
    return filteredLogs;
};
exports.getAuditLogs = getAuditLogs;
exports.default = {
    createAuditLog: exports.createAuditLog,
    auditMiddleware: exports.auditMiddleware,
    auditOperations: exports.auditOperations,
    getAuditLogs: exports.getAuditLogs,
};
//# sourceMappingURL=auditLogging.js.map