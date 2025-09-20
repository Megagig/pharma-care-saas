"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationAuditService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CommunicationAuditLog_1 = __importDefault(require("../models/CommunicationAuditLog"));
const logger_1 = __importDefault(require("../utils/logger"));
class CommunicationAuditService {
    static async createAuditLog(context, data) {
        try {
            const auditLog = new CommunicationAuditLog_1.default({
                action: data.action,
                userId: context.userId,
                targetId: data.targetId,
                targetType: data.targetType,
                details: data.details,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                sessionId: context.sessionId,
                workplaceId: context.workplaceId,
                success: data.success !== false,
                errorMessage: data.errorMessage,
                duration: data.duration,
            });
            auditLog.setRiskLevel();
            await auditLog.save();
            logger_1.default.info('Communication audit log created', {
                auditId: auditLog._id,
                action: auditLog.action,
                userId: context.userId,
                targetType: data.targetType,
                riskLevel: auditLog.riskLevel,
                service: 'communication-audit',
            });
            return auditLog;
        }
        catch (error) {
            logger_1.default.error('Failed to create communication audit log', {
                error: error instanceof Error ? error.message : 'Unknown error',
                action: data.action,
                userId: context.userId,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async logMessageSent(context, messageId, conversationId, details) {
        return this.createAuditLog(context, {
            action: 'message_sent',
            targetId: messageId,
            targetType: 'message',
            details: {
                conversationId,
                patientId: details.patientId,
                metadata: {
                    messageType: details.messageType,
                    hasAttachments: details.hasAttachments || false,
                    mentionCount: details.mentionCount || 0,
                    priority: details.priority || 'normal',
                },
            },
        });
    }
    static async logMessageRead(context, messageId, conversationId, patientId) {
        return this.createAuditLog(context, {
            action: 'message_read',
            targetId: messageId,
            targetType: 'message',
            details: {
                conversationId,
                patientId,
                metadata: {
                    readAt: new Date(),
                },
            },
        });
    }
    static async logConversationCreated(context, conversationId, details) {
        return this.createAuditLog(context, {
            action: 'conversation_created',
            targetId: conversationId,
            targetType: 'conversation',
            details: {
                conversationId,
                patientId: details.patientId,
                metadata: {
                    conversationType: details.conversationType,
                    participantCount: details.participantCount,
                    priority: details.priority || 'normal',
                },
            },
        });
    }
    static async logParticipantAdded(context, conversationId, addedUserId, details) {
        return this.createAuditLog(context, {
            action: 'participant_added',
            targetId: conversationId,
            targetType: 'conversation',
            details: {
                conversationId,
                patientId: details.patientId,
                participantIds: [addedUserId],
                metadata: {
                    addedUserId: addedUserId.toString(),
                    role: details.role,
                },
            },
        });
    }
    static async logFileUploaded(context, fileId, conversationId, details) {
        return this.createAuditLog(context, {
            action: 'file_uploaded',
            targetId: conversationId,
            targetType: 'file',
            details: {
                conversationId,
                patientId: details.patientId,
                fileId,
                fileName: details.fileName,
                metadata: {
                    fileSize: details.fileSize,
                    mimeType: details.mimeType,
                },
            },
        });
    }
    static async logConversationExported(context, conversationId, details) {
        return this.createAuditLog(context, {
            action: 'conversation_exported',
            targetId: conversationId,
            targetType: 'conversation',
            details: {
                conversationId,
                patientId: details.patientId,
                metadata: {
                    exportFormat: details.exportFormat,
                    messageCount: details.messageCount,
                    dateRange: details.dateRange,
                    exportedAt: new Date(),
                },
            },
        });
    }
    static async getAuditLogs(workplaceId, filters = {}) {
        try {
            const { userId, action, targetType, conversationId, patientId, riskLevel, complianceCategory, success, startDate, endDate, limit = 50, offset = 0, } = filters;
            const query = { workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId) };
            if (userId)
                query.userId = new mongoose_1.default.Types.ObjectId(userId);
            if (action)
                query.action = action;
            if (targetType)
                query.targetType = targetType;
            if (conversationId)
                query['details.conversationId'] = new mongoose_1.default.Types.ObjectId(conversationId);
            if (patientId)
                query['details.patientId'] = new mongoose_1.default.Types.ObjectId(patientId);
            if (riskLevel)
                query.riskLevel = riskLevel;
            if (complianceCategory)
                query.complianceCategory = complianceCategory;
            if (success !== undefined)
                query.success = success;
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate)
                    query.timestamp.$gte = startDate;
                if (endDate)
                    query.timestamp.$lte = endDate;
            }
            const [logs, total] = await Promise.all([
                CommunicationAuditLog_1.default.find(query)
                    .populate('userId', 'firstName lastName role email')
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .skip(offset)
                    .lean(),
                CommunicationAuditLog_1.default.countDocuments(query),
            ]);
            const page = Math.floor(offset / limit) + 1;
            const pages = Math.ceil(total / limit);
            return {
                logs,
                total,
                page,
                limit,
                pages,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get communication audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                workplaceId,
                filters,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async getConversationAuditLogs(conversationId, workplaceId, options = {}) {
        try {
            const query = {
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                'details.conversationId': new mongoose_1.default.Types.ObjectId(conversationId),
            };
            if (options.startDate || options.endDate) {
                query.timestamp = {};
                if (options.startDate)
                    query.timestamp.$gte = options.startDate;
                if (options.endDate)
                    query.timestamp.$lte = options.endDate;
            }
            return await CommunicationAuditLog_1.default.find(query)
                .populate('userId', 'firstName lastName role')
                .sort({ timestamp: -1 })
                .limit(options.limit || 100);
        }
        catch (error) {
            logger_1.default.error('Failed to get conversation audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                conversationId,
                workplaceId,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async getHighRiskActivities(workplaceId, timeRange) {
        try {
            return await CommunicationAuditLog_1.default.find({
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                riskLevel: { $in: ['high', 'critical'] },
                timestamp: {
                    $gte: timeRange.start,
                    $lte: timeRange.end,
                },
            })
                .populate('userId', 'firstName lastName role')
                .sort({ timestamp: -1 });
        }
        catch (error) {
            logger_1.default.error('Failed to get high-risk activities', {
                error: error instanceof Error ? error.message : 'Unknown error',
                workplaceId,
                timeRange,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async generateComplianceReport(workplaceId, dateRange) {
        try {
            return await CommunicationAuditLog_1.default.aggregate([
                {
                    $match: {
                        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                        timestamp: {
                            $gte: dateRange.start,
                            $lte: dateRange.end,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            complianceCategory: '$complianceCategory',
                            riskLevel: '$riskLevel',
                            success: '$success',
                        },
                        count: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        actions: { $addToSet: '$action' },
                    },
                },
                {
                    $sort: { '_id.riskLevel': -1, count: -1 },
                },
            ]);
        }
        catch (error) {
            logger_1.default.error('Failed to generate compliance report', {
                error: error instanceof Error ? error.message : 'Unknown error',
                workplaceId,
                dateRange,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async exportAuditLogs(workplaceId, filters, format = 'csv') {
        try {
            const result = await this.getAuditLogs(workplaceId, {
                ...filters,
                limit: 10000,
            });
            if (format === 'csv') {
                return this.convertToCSV(result.logs);
            }
            else {
                return JSON.stringify(result.logs, null, 2);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to export audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                workplaceId,
                filters,
                format,
                service: 'communication-audit',
            });
            throw error;
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
            'Target Type',
            'Target ID',
            'Risk Level',
            'Compliance Category',
            'Success',
            'Conversation ID',
            'Patient ID',
            'IP Address',
            'Duration (ms)',
            'Details',
        ];
        const rows = logs.map(log => [
            log.timestamp,
            log.action,
            log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown',
            log.userId?.email || 'Unknown',
            log.targetType,
            log.targetId,
            log.riskLevel,
            log.complianceCategory,
            log.success ? 'Yes' : 'No',
            log.details?.conversationId || '',
            log.details?.patientId || '',
            log.ipAddress,
            log.duration || '',
            log.getFormattedDetails ? log.getFormattedDetails() : JSON.stringify(log.details).replace(/"/g, '""'),
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field}"`).join(',')),
        ].join('\n');
        return csvContent;
    }
    static createAuditContext(req) {
        return {
            userId: req.user._id,
            workplaceId: req.user.workplaceId,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            sessionId: req.sessionID || req.get('X-Session-ID'),
        };
    }
    static async getUserActivitySummary(userId, workplaceId, dateRange) {
        try {
            return await CommunicationAuditLog_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                        timestamp: {
                            $gte: dateRange.start,
                            $lte: dateRange.end,
                        },
                    },
                },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 },
                        lastActivity: { $max: '$timestamp' },
                        successRate: {
                            $avg: { $cond: ['$success', 1, 0] },
                        },
                    },
                },
                {
                    $sort: { count: -1 },
                },
            ]);
        }
        catch (error) {
            logger_1.default.error('Failed to get user activity summary', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                workplaceId,
                dateRange,
                service: 'communication-audit',
            });
            throw error;
        }
    }
    static async logBulkOperation(context, action, targetIds, targetType, details) {
        if (targetIds.length === 0) {
            throw new Error('No target IDs provided for bulk operation');
        }
        return this.createAuditLog(context, {
            action: action,
            targetId: targetIds[0],
            targetType,
            details: {
                ...details,
                metadata: {
                    ...details.metadata,
                    bulkOperation: true,
                    targetCount: targetIds.length,
                    allTargetIds: targetIds.map(id => id.toString()),
                },
            },
        });
    }
    static async cleanupOldLogs(daysToKeep = 2555) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await CommunicationAuditLog_1.default.deleteMany({
                timestamp: { $lt: cutoffDate },
            });
            logger_1.default.info(`Cleaned up ${result.deletedCount} old communication audit logs`, {
                cutoffDate,
                deletedCount: result.deletedCount,
                service: 'communication-audit',
            });
            return result.deletedCount;
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup old communication audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                daysToKeep,
                service: 'communication-audit',
            });
            throw error;
        }
    }
}
exports.CommunicationAuditService = CommunicationAuditService;
exports.default = CommunicationAuditService;
//# sourceMappingURL=communicationAuditService.js.map