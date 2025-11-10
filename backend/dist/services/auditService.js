"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuditService {
    static async createAuditLog(data, req) {
        try {
            const auditData = {
                action: data.action,
                userId: new mongoose_1.default.Types.ObjectId(data.userId),
                details: data.details,
                riskLevel: data.riskLevel || AuditService.calculateRiskLevel(data.action, data.details),
                complianceCategory: data.complianceCategory,
                changedFields: data.changedFields,
                oldValues: data.oldValues,
                newValues: data.newValues,
                timestamp: new Date()
            };
            if (data.interventionId) {
                auditData.interventionId = new mongoose_1.default.Types.ObjectId(data.interventionId);
            }
            if (data.workspaceId) {
                auditData.workspaceId = new mongoose_1.default.Types.ObjectId(data.workspaceId);
            }
            if (req) {
                auditData.ipAddress = AuditService.getClientIP(req);
                auditData.userAgent = req.get('User-Agent');
                auditData.sessionId = req.sessionID || req.get('X-Session-ID');
            }
            const auditLog = new AuditLog_1.AuditLog(auditData);
            await auditLog.save();
            return auditLog;
        }
        catch (error) {
            logger_1.default.error('Error creating audit log:', error);
            throw new Error('Failed to create audit log');
        }
    }
    static async getAuditLogs(options = {}) {
        try {
            const { page = 1, limit = 20, startDate, endDate, riskLevel, userId, action, interventionId, complianceCategory } = options;
            const query = {};
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) {
                    query.timestamp.$gte = new Date(startDate);
                }
                if (endDate) {
                    query.timestamp.$lte = new Date(endDate);
                }
            }
            if (riskLevel)
                query.riskLevel = riskLevel;
            if (userId)
                query.userId = new mongoose_1.default.Types.ObjectId(userId);
            if (action)
                query.action = action;
            if (interventionId)
                query.interventionId = new mongoose_1.default.Types.ObjectId(interventionId);
            if (complianceCategory)
                query.complianceCategory = complianceCategory;
            const skip = (page - 1) * limit;
            const [logs, total] = await Promise.all([
                AuditLog_1.AuditLog.find(query)
                    .populate('userId', 'firstName lastName email')
                    .populate('interventionId', 'interventionNumber')
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                AuditLog_1.AuditLog.countDocuments(query)
            ]);
            const summary = await AuditService.calculateSummary(query);
            return {
                logs,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
                summary
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching audit logs:', error);
            throw new Error('Failed to fetch audit logs');
        }
    }
    static async getInterventionAuditLogs(interventionId, options = {}) {
        return AuditService.getAuditLogs({
            ...options,
            interventionId
        });
    }
    static async calculateSummary(query = {}) {
        try {
            const [totalActions, uniqueUsers, riskActivities, lastActivity] = await Promise.all([
                AuditLog_1.AuditLog.countDocuments(query),
                AuditLog_1.AuditLog.distinct('userId', query).then(users => users.length),
                AuditLog_1.AuditLog.countDocuments({ ...query, riskLevel: { $in: ['high', 'critical'] } }),
                AuditLog_1.AuditLog.findOne(query, 'timestamp').sort({ timestamp: -1 }).lean()
            ]);
            return {
                totalActions,
                uniqueUsers,
                riskActivities,
                lastActivity: lastActivity?.timestamp || null
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating audit summary:', error);
            return {
                totalActions: 0,
                uniqueUsers: 0,
                riskActivities: 0,
                lastActivity: null
            };
        }
    }
    static async exportAuditLogs(options) {
        try {
            const { format, ...queryOptions } = options;
            const result = await AuditService.getAuditLogs({
                ...queryOptions,
                limit: 10000
            });
            if (format === 'csv') {
                return AuditService.convertToCSV(result.logs);
            }
            else {
                return JSON.stringify(result.logs, null, 2);
            }
        }
        catch (error) {
            logger_1.default.error('Error exporting audit logs:', error);
            throw new Error('Failed to export audit logs');
        }
    }
    static convertToCSV(logs) {
        if (logs.length === 0) {
            return 'No data available';
        }
        const headers = [
            'Timestamp',
            'Action',
            'User',
            'User Email',
            'Risk Level',
            'Compliance Category',
            'Intervention ID',
            'Changed Fields',
            'IP Address',
            'Details'
        ];
        const rows = logs.map(log => [
            log.timestamp,
            log.action,
            log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown',
            log.userId?.email || 'Unknown',
            log.riskLevel,
            log.complianceCategory,
            log.interventionId?.interventionNumber || '',
            log.changedFields?.join(', ') || '',
            log.ipAddress || '',
            JSON.stringify(log.details).replace(/"/g, '""')
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        return csvContent;
    }
    static calculateRiskLevel(action, details) {
        const criticalActions = [
            'INTERVENTION_DELETED',
            'PATIENT_DATA_ACCESSED',
            'PERMISSION_CHANGED',
            'SYSTEM_BACKUP',
            'DATA_MIGRATION'
        ];
        const highRiskActions = [
            'MEDICATION_CHANGED',
            'DOSAGE_MODIFIED',
            'CONTRAINDICATION_FLAGGED',
            'INTERVENTION_ESCALATED'
        ];
        const mediumRiskActions = [
            'INTERVENTION_UPDATED',
            'INTERVENTION_REJECTED',
            'ALLERGY_UPDATED',
            'RISK_ASSESSMENT_UPDATED'
        ];
        if (criticalActions.includes(action)) {
            return 'critical';
        }
        if (highRiskActions.includes(action)) {
            return 'high';
        }
        if (mediumRiskActions.includes(action)) {
            return 'medium';
        }
        if (details.priority === 'critical' || details.riskLevel === 'high') {
            return 'high';
        }
        if (details.priority === 'high' || details.riskLevel === 'medium') {
            return 'medium';
        }
        return 'low';
    }
    static getClientIP(req) {
        return (req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            req.get('X-Forwarded-For') ||
            req.get('X-Real-IP') ||
            'unknown');
    }
    static async cleanupOldLogs(daysToKeep = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await AuditLog_1.AuditLog.deleteMany({
                timestamp: { $lt: cutoffDate }
            });
            logger_1.default.info(`Cleaned up ${result.deletedCount} old audit logs`);
            return result.deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old audit logs:', error);
            throw new Error('Failed to cleanup old audit logs');
        }
    }
    static async getComplianceReport(options) {
        try {
            const query = {
                timestamp: {
                    $gte: new Date(options.startDate),
                    $lte: new Date(options.endDate)
                }
            };
            if (options.interventionIds && options.interventionIds.length > 0) {
                query.interventionId = {
                    $in: options.interventionIds.map(id => new mongoose_1.default.Types.ObjectId(id))
                };
            }
            const [totalInterventions, auditedActions, riskActivities, complianceByCategory] = await Promise.all([
                AuditLog_1.AuditLog.distinct('interventionId', query).then(ids => ids.length),
                AuditLog_1.AuditLog.countDocuments(query),
                AuditLog_1.AuditLog.countDocuments({ ...query, riskLevel: { $in: ['high', 'critical'] } }),
                AuditLog_1.AuditLog.aggregate([
                    { $match: query },
                    { $group: { _id: '$complianceCategory', count: { $sum: 1 } } }
                ])
            ]);
            const complianceScore = totalInterventions > 0
                ? Math.max(0, 100 - (riskActivities / auditedActions) * 100)
                : 100;
            return {
                summary: {
                    totalInterventions,
                    auditedActions,
                    complianceScore: Math.round(complianceScore),
                    riskActivities
                },
                complianceByCategory: complianceByCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };
        }
        catch (error) {
            logger_1.default.error('Error generating compliance report:', error);
            throw new Error('Failed to generate compliance report');
        }
    }
    static createAuditContext(req) {
        return {
            userId: req.user?.id || 'unknown',
            ipAddress: AuditService.getClientIP(req),
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID || req.get('X-Session-ID'),
            workspaceId: req.user?.workplaceId || req.workspace?._id
        };
    }
    static async logActivity(context, data) {
        const auditData = {
            action: data.action || 'UNKNOWN_ACTION',
            userId: context.userId,
            details: data.details || {},
            complianceCategory: data.complianceCategory || 'general',
            riskLevel: data.riskLevel,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            patientId: data.patientId,
            changedFields: data.changedFields,
            oldValues: data.oldValues,
            newValues: data.newValues,
            workspaceId: context.workspaceId
        };
        return AuditService.createAuditLog(auditData, {
            ip: context.ipAddress || 'system',
            connection: {},
            socket: {},
            get: (header) => header === 'User-Agent' ? context.userAgent : undefined,
            sessionID: context.sessionId
        });
    }
    static async logMTRActivity(context, action, session, oldValues, newValues) {
        const auditData = {
            action,
            userId: context.userId,
            details: {
                sessionId: session._id || session.id,
                sessionType: session.sessionType,
                patientId: session.patientId,
                pharmacistId: session.pharmacistId,
                status: session.status,
                timestamp: new Date()
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: AuditService.calculateRiskLevel(action, { sessionType: session.sessionType }),
            resourceType: 'MTRSession',
            resourceId: session._id || session.id,
            patientId: session.patientId,
            oldValues,
            newValues,
            workspaceId: context.workspaceId
        };
        return AuditService.createAuditLog(auditData, {
            ip: context.ipAddress,
            get: (header) => header === 'User-Agent' ? context.userAgent : undefined,
            sessionID: context.sessionId
        });
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
//# sourceMappingURL=auditService.js.map