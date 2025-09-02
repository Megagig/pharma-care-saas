"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MTRAuditLog_1 = __importDefault(require("../models/MTRAuditLog"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuditService {
    static async logActivity(context, auditData) {
        try {
            const complianceCategory = auditData.complianceCategory || this.determineComplianceCategory(auditData.action);
            const riskLevel = auditData.riskLevel || this.determineRiskLevel(auditData.action, auditData.resourceType);
            const auditLog = new MTRAuditLog_1.default({
                workplaceId: context.workplaceId,
                action: auditData.action,
                resourceType: auditData.resourceType,
                resourceId: auditData.resourceId,
                userId: context.userId,
                userRole: context.userRole,
                sessionId: context.sessionId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                requestMethod: context.requestMethod,
                requestUrl: context.requestUrl,
                oldValues: auditData.oldValues,
                newValues: auditData.newValues,
                changedFields: auditData.changedFields,
                patientId: auditData.patientId,
                reviewId: auditData.reviewId,
                complianceCategory,
                riskLevel,
                details: auditData.details,
                errorMessage: auditData.errorMessage,
                duration: auditData.duration,
                timestamp: new Date(),
                createdBy: context.userId,
            });
            await auditLog.save();
            logger_1.default.info('MTR Audit Log Created', {
                auditId: auditLog._id,
                action: auditData.action,
                resourceType: auditData.resourceType,
                resourceId: auditData.resourceId,
                userId: context.userId,
                workplaceId: context.workplaceId,
                riskLevel,
                complianceCategory,
                service: 'mtr-audit',
            });
            if (riskLevel === 'critical' || riskLevel === 'high') {
                await this.triggerSecurityAlert(auditLog);
            }
            return auditLog;
        }
        catch (error) {
            logger_1.default.error('Failed to create audit log', {
                error: error?.message || 'Unknown error',
                context,
                auditData,
                service: 'mtr-audit',
            });
            throw error;
        }
    }
    static async logMTRActivity(context, action, session, oldValues, newValues) {
        const changedFields = oldValues && newValues ? this.getChangedFields(oldValues, newValues) : undefined;
        return this.logActivity(context, {
            action,
            resourceType: 'MedicationTherapyReview',
            resourceId: session._id,
            patientId: session.patientId,
            reviewId: session._id,
            oldValues,
            newValues,
            changedFields,
            details: {
                reviewNumber: session.reviewNumber,
                status: session.status,
                priority: session.priority,
                reviewType: session.reviewType,
                completionPercentage: session.getCompletionPercentage?.() || 0,
            },
            complianceCategory: 'clinical_documentation',
        });
    }
    static async logPatientAccess(context, patientId, accessType, details = {}) {
        return this.logActivity(context, {
            action: `ACCESS_PATIENT_${accessType.toUpperCase()}`,
            resourceType: 'Patient',
            resourceId: patientId,
            patientId,
            details: {
                accessType,
                ...details,
            },
            complianceCategory: 'data_access',
            riskLevel: accessType === 'delete' ? 'high' : 'medium',
        });
    }
    static async logAuthEvent(context, action, details = {}) {
        if (!context.userId || !context.workplaceId) {
            logger_1.default.warn('Incomplete context for auth event', { action, context });
            return null;
        }
        return this.logActivity(context, {
            action,
            resourceType: 'User',
            resourceId: context.userId,
            details: {
                ...details,
                timestamp: new Date(),
            },
            complianceCategory: 'system_security',
            riskLevel: action === 'FAILED_LOGIN' ? 'medium' : 'low',
        });
    }
    static async getAuditLogs(workplaceId, filters = {}, options = {}) {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 50, 1000);
        const query = { workplaceId };
        if (filters.userId)
            query.userId = filters.userId;
        if (filters.action)
            query.action = filters.action;
        if (filters.resourceType)
            query.resourceType = filters.resourceType;
        if (filters.complianceCategory)
            query.complianceCategory = filters.complianceCategory;
        if (filters.riskLevel)
            query.riskLevel = filters.riskLevel;
        if (filters.patientId)
            query.patientId = filters.patientId;
        if (filters.reviewId)
            query.reviewId = filters.reviewId;
        if (filters.ipAddress)
            query.ipAddress = filters.ipAddress;
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate)
                query.timestamp.$gte = filters.startDate;
            if (filters.endDate)
                query.timestamp.$lte = filters.endDate;
        }
        const total = await MTRAuditLog_1.default.countDocuments(query);
        const baseQuery = MTRAuditLog_1.default.find(query)
            .populate('userId', 'firstName lastName email role')
            .populate('patientId', 'firstName lastName mrn')
            .populate('reviewId', 'reviewNumber status');
        const sortBy = options.sort || '-timestamp';
        baseQuery.sort(sortBy);
        if (page && limit) {
            const skip = (page - 1) * limit;
            baseQuery.skip(skip).limit(limit);
        }
        const logs = await baseQuery;
        return { logs, total };
    }
    static async exportAuditData(workplaceId, options) {
        const { logs } = await this.getAuditLogs(workplaceId, options.filters || {}, {
            limit: 10000,
            sort: '-timestamp',
        });
        const exportData = logs.map(log => {
            const baseData = {
                timestamp: log.timestamp,
                action: log.action,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                userId: log.userId,
                userRole: log.userRole,
                complianceCategory: log.complianceCategory,
                riskLevel: log.riskLevel,
                ipAddress: log.ipAddress,
                patientId: log.patientId,
                reviewId: log.reviewId,
            };
            if (options.includeDetails) {
                return {
                    ...baseData,
                    details: log.details,
                    changedFields: log.changedFields,
                    errorMessage: log.errorMessage,
                    duration: log.duration,
                };
            }
            return baseData;
        });
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `mtr_audit_export_${dateStr}.${options.format}`;
        switch (options.format) {
            case 'json':
                return {
                    data: JSON.stringify(exportData, null, 2),
                    filename,
                    contentType: 'application/json',
                };
            case 'csv':
                const csvData = this.convertToCSV(exportData);
                return {
                    data: csvData,
                    filename,
                    contentType: 'text/csv',
                };
            case 'pdf':
                return {
                    data: {
                        title: 'MTR Audit Trail Report',
                        generatedAt: new Date(),
                        dateRange: options.dateRange,
                        filters: options.filters,
                        logs: exportData,
                        summary: await this.getAuditSummary(workplaceId, options.dateRange),
                    },
                    filename,
                    contentType: 'application/pdf',
                };
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    static async getAuditSummary(workplaceId, dateRange) {
        const matchStage = { workplaceId };
        if (dateRange) {
            matchStage.timestamp = {
                $gte: dateRange.start,
                $lte: dateRange.end,
            };
        }
        const stats = await MTRAuditLog_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalLogs: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    errorCount: {
                        $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalLogs: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    errorCount: 1,
                    errorRate: {
                        $cond: [
                            { $gt: ['$totalLogs', 0] },
                            { $multiply: [{ $divide: ['$errorCount', '$totalLogs'] }, 100] },
                            0,
                        ],
                    },
                },
            },
        ]);
        const summary = stats[0] || {
            totalLogs: 0,
            uniqueUserCount: 0,
            errorCount: 0,
            errorRate: 0,
        };
        const highRiskCount = await MTRAuditLog_1.default.countDocuments({
            workplaceId,
            riskLevel: { $in: ['high', 'critical'] },
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        const suspiciousCount = await MTRAuditLog_1.default.countDocuments({
            workplaceId,
            errorMessage: { $ne: null },
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        return {
            ...summary,
            highRiskActivitiesCount: highRiskCount,
            suspiciousActivitiesCount: suspiciousCount,
            complianceScore: this.calculateComplianceScore(summary),
        };
    }
    static async getComplianceReport(workplaceId, dateRange) {
        const summary = await this.getAuditSummary(workplaceId, dateRange);
        const highRiskActivities = await MTRAuditLog_1.default.find({
            workplaceId,
            riskLevel: { $in: ['high', 'critical'] },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: -1 })
            .limit(10);
        const suspiciousActivities = await MTRAuditLog_1.default.aggregate([
            {
                $match: {
                    workplaceId,
                    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            },
            {
                $group: {
                    _id: '$userId',
                    actionCount: { $sum: 1 },
                    errorCount: {
                        $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                    },
                },
            },
            {
                $match: {
                    $or: [
                        { actionCount: { $gt: 50 } },
                        { errorCount: { $gt: 5 } },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $project: {
                    userId: '$_id',
                    actionCount: 1,
                    errorCount: 1,
                    errorRate: {
                        $multiply: [{ $divide: ['$errorCount', '$actionCount'] }, 100],
                    },
                    user: { $arrayElemAt: ['$user', 0] },
                },
            },
            { $sort: { errorRate: -1 } },
            { $limit: 10 },
        ]);
        const complianceMetrics = await MTRAuditLog_1.default.aggregate([
            {
                $match: {
                    workplaceId,
                    timestamp: { $gte: dateRange.start, $lte: dateRange.end },
                },
            },
            {
                $group: {
                    _id: '$complianceCategory',
                    count: { $sum: 1 },
                    riskDistribution: { $push: '$riskLevel' },
                    errorCount: {
                        $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                    },
                },
            },
        ]);
        return {
            summary,
            complianceMetrics,
            highRiskActivities: highRiskActivities.slice(0, 10),
            suspiciousActivities: suspiciousActivities.slice(0, 10),
            recommendations: this.generateComplianceRecommendations(summary, complianceMetrics),
        };
    }
    static determineComplianceCategory(action) {
        if (action.includes('MTR') || action.includes('PROBLEM') || action.includes('INTERVENTION')) {
            return 'clinical_documentation';
        }
        if (action.includes('PATIENT') || action.includes('ACCESS')) {
            return 'data_access';
        }
        if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('FAILED')) {
            return 'system_security';
        }
        if (action.includes('WORKFLOW') || action.includes('STEP')) {
            return 'workflow_compliance';
        }
        return 'clinical_documentation';
    }
    static determineRiskLevel(action, resourceType) {
        if (action.includes('DELETE') || action.includes('FAILED_LOGIN')) {
            return 'critical';
        }
        if (action.includes('EXPORT') || action.includes('BULK') || resourceType === 'Patient') {
            return 'high';
        }
        if (action.includes('UPDATE') || action.includes('CREATE')) {
            return 'medium';
        }
        return 'low';
    }
    static getChangedFields(oldValues, newValues) {
        const changedFields = [];
        if (!oldValues || !newValues)
            return changedFields;
        const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
        for (const key of allKeys) {
            if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                changedFields.push(key);
            }
        }
        return changedFields;
    }
    static convertToCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined)
                    return '';
                if (typeof value === 'object')
                    return JSON.stringify(value);
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }
    static calculateComplianceScore(stats) {
        const baseScore = 100;
        const errorPenalty = Math.min(stats.errorRate * 2, 50);
        const riskPenalty = stats.riskDistribution?.filter((r) => r === 'critical').length * 5;
        return Math.max(0, baseScore - errorPenalty - riskPenalty);
    }
    static generateComplianceRecommendations(summary, metrics) {
        const recommendations = [];
        if (summary.errorRate > 5) {
            recommendations.push('High error rate detected. Review system processes and user training.');
        }
        if (summary.highRiskActivitiesCount > 10) {
            recommendations.push('Elevated high-risk activities. Consider implementing additional security measures.');
        }
        if (summary.suspiciousActivitiesCount > 0) {
            recommendations.push('Suspicious activities detected. Investigate user access patterns.');
        }
        const clinicalMetric = metrics.find(m => m._id === 'clinical_documentation');
        if (clinicalMetric && clinicalMetric.errorCount > clinicalMetric.count * 0.1) {
            recommendations.push('High error rate in clinical documentation. Review MTR workflow training.');
        }
        if (recommendations.length === 0) {
            recommendations.push('Compliance metrics are within acceptable ranges. Continue monitoring.');
        }
        return recommendations;
    }
    static async triggerSecurityAlert(auditLog) {
        logger_1.default.warn('High-risk activity detected', {
            auditId: auditLog._id,
            action: auditLog.action,
            userId: auditLog.userId,
            workplaceId: auditLog.workplaceId,
            riskLevel: auditLog.riskLevel,
            service: 'mtr-security',
        });
    }
    static createAuditContext(req) {
        return {
            userId: req.user?.id || req.user?._id,
            workplaceId: req.user?.workplaceId || req.workplace?.id,
            userRole: req.user?.role || 'unknown',
            sessionId: req.sessionID,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestMethod: req.method,
            requestUrl: req.originalUrl,
        };
    }
}
exports.default = AuditService;
//# sourceMappingURL=auditService.js.map