"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditHighRiskOperation = exports.auditBulkOperation = exports.auditPatientCommunicationAccess = exports.logCommunicationEvent = exports.auditNotification = exports.auditSearch = exports.auditFile = exports.auditConversation = exports.auditMessage = exports.logCommunicationAuditTrail = exports.captureCommunicationAuditData = void 0;
const communicationAuditService_1 = __importDefault(require("../services/communicationAuditService"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const captureCommunicationAuditData = (action, targetType) => {
    return (req, res, next) => {
        req.communicationAuditData = {
            action,
            targetType,
            startTime: Date.now(),
            details: {
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query,
                body: req.method !== 'GET' ? req.body : undefined,
            },
        };
        next();
    };
};
exports.captureCommunicationAuditData = captureCommunicationAuditData;
const logCommunicationAuditTrail = async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (req.communicationAuditData && req.user) {
            const duration = Date.now() - req.communicationAuditData.startTime;
            const success = res.statusCode >= 200 && res.statusCode < 400;
            let targetId;
            if (body?.data?._id) {
                targetId = new mongoose_1.default.Types.ObjectId(body.data._id);
            }
            else if (req.params.id) {
                targetId = new mongoose_1.default.Types.ObjectId(req.params.id);
            }
            else if (body?._id) {
                targetId = new mongoose_1.default.Types.ObjectId(body._id);
            }
            else {
                targetId = new mongoose_1.default.Types.ObjectId();
            }
            const context = communicationAuditService_1.default.createAuditContext(req);
            const auditDetails = {
                ...req.communicationAuditData.details,
                responseStatus: res.statusCode,
                success,
                duration,
            };
            const conversationId = req.params.id || req.body.conversationId || body?.data?.conversationId;
            const patientId = req.params.patientId || req.body.patientId || body?.data?.patientId;
            if (conversationId) {
                auditDetails.conversationId = new mongoose_1.default.Types.ObjectId(conversationId);
            }
            if (patientId) {
                auditDetails.patientId = new mongoose_1.default.Types.ObjectId(patientId);
            }
            auditDetails.metadata = extractActionMetadata(req, body);
            communicationAuditService_1.default.createAuditLog(context, {
                action: req.communicationAuditData.action,
                targetId,
                targetType: req.communicationAuditData.targetType,
                details: auditDetails,
                success,
                errorMessage: success ? undefined : body?.message || 'Operation failed',
                duration,
            }).catch(error => {
                logger_1.default.error('Failed to create communication audit log', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    action: req.communicationAuditData?.action,
                    userId: req.user?._id,
                    service: 'communication-audit-middleware',
                });
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.logCommunicationAuditTrail = logCommunicationAuditTrail;
function extractActionMetadata(req, responseBody) {
    const metadata = {};
    switch (req.communicationAuditData?.action) {
        case 'message_sent':
            metadata.messageType = req.body?.content?.type || 'text';
            metadata.hasAttachments = Boolean(req.body?.content?.attachments?.length);
            metadata.mentionCount = req.body?.mentions?.length || 0;
            metadata.priority = req.body?.priority || 'normal';
            metadata.threadId = req.body?.threadId;
            metadata.parentMessageId = req.body?.parentMessageId;
            break;
        case 'conversation_created':
            metadata.conversationType = req.body?.type;
            metadata.participantCount = req.body?.participants?.length || 0;
            metadata.priority = req.body?.priority || 'normal';
            metadata.tags = req.body?.tags || [];
            break;
        case 'participant_added':
            metadata.addedUserId = req.body?.userId;
            metadata.role = req.body?.role;
            break;
        case 'participant_removed':
            metadata.removedUserId = req.params?.userId;
            break;
        case 'file_uploaded':
            if (req.files && Array.isArray(req.files)) {
                metadata.fileCount = req.files.length;
                metadata.totalSize = req.files.reduce((sum, file) => sum + (file.size || 0), 0);
                metadata.fileTypes = req.files.map((file) => file.mimetype);
            }
            break;
        case 'conversation_search':
        case 'message_search':
            metadata.searchQuery = req.query?.q;
            metadata.filters = {
                type: req.query?.type,
                priority: req.query?.priority,
                dateFrom: req.query?.dateFrom,
                dateTo: req.query?.dateTo,
            };
            metadata.resultCount = responseBody?.data?.length || 0;
            break;
        case 'conversation_exported':
            metadata.exportFormat = req.query?.format || 'json';
            metadata.messageCount = responseBody?.messageCount || 0;
            break;
        default:
            if (responseBody?.data) {
                metadata.responseDataType = Array.isArray(responseBody.data) ? 'array' : 'object';
                metadata.responseCount = Array.isArray(responseBody.data) ? responseBody.data.length : 1;
            }
            break;
    }
    return metadata;
}
const auditMessage = (action) => {
    return [
        (0, exports.captureCommunicationAuditData)(action, 'message'),
        exports.logCommunicationAuditTrail,
    ];
};
exports.auditMessage = auditMessage;
const auditConversation = (action) => {
    return [
        (0, exports.captureCommunicationAuditData)(action, 'conversation'),
        exports.logCommunicationAuditTrail,
    ];
};
exports.auditConversation = auditConversation;
const auditFile = (action) => {
    return [
        (0, exports.captureCommunicationAuditData)(action, 'file'),
        exports.logCommunicationAuditTrail,
    ];
};
exports.auditFile = auditFile;
const auditSearch = (action) => {
    return [
        (0, exports.captureCommunicationAuditData)(action, 'conversation'),
        exports.logCommunicationAuditTrail,
    ];
};
exports.auditSearch = auditSearch;
const auditNotification = (action) => {
    return [
        (0, exports.captureCommunicationAuditData)(action, 'notification'),
        exports.logCommunicationAuditTrail,
    ];
};
exports.auditNotification = auditNotification;
const logCommunicationEvent = async (req, action, targetId, targetType, details = {}) => {
    if (!req.user) {
        logger_1.default.warn('Cannot create communication audit log: No user in request');
        return;
    }
    try {
        const context = communicationAuditService_1.default.createAuditContext(req);
        await communicationAuditService_1.default.createAuditLog(context, {
            action: action,
            targetId: new mongoose_1.default.Types.ObjectId(targetId),
            targetType,
            details,
            success: true,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to create manual communication audit log', {
            error: error instanceof Error ? error.message : 'Unknown error',
            action,
            targetId,
            targetType,
            userId: req.user._id,
            service: 'communication-audit-middleware',
        });
    }
};
exports.logCommunicationEvent = logCommunicationEvent;
const auditPatientCommunicationAccess = async (req, res, next) => {
    try {
        const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
        if (req.user && patientId) {
            await (0, exports.logCommunicationEvent)(req, 'patient_communication_accessed', patientId, 'user', {
                patientId: new mongoose_1.default.Types.ObjectId(patientId),
                accessType: 'communication_review',
                method: req.method,
                url: req.originalUrl,
                metadata: {
                    timestamp: new Date(),
                    accessReason: 'patient_communication_management',
                },
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to audit patient communication access', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            patientId: req.params.patientId,
            service: 'communication-audit-middleware',
        });
    }
    next();
};
exports.auditPatientCommunicationAccess = auditPatientCommunicationAccess;
const auditBulkOperation = (action) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            if (req.user && req.body?.ids && Array.isArray(req.body.ids)) {
                const context = communicationAuditService_1.default.createAuditContext(req);
                const targetIds = req.body.ids.map((id) => new mongoose_1.default.Types.ObjectId(id));
                communicationAuditService_1.default.logBulkOperation(context, `bulk_${action}`, targetIds, 'message', {
                    metadata: {
                        bulkAction: action,
                        targetCount: targetIds.length,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        responseStatus: res.statusCode,
                    },
                }).catch(error => {
                    logger_1.default.error('Failed to create bulk operation audit log', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        action,
                        targetCount: targetIds.length,
                        userId: req.user?._id,
                        service: 'communication-audit-middleware',
                    });
                });
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditBulkOperation = auditBulkOperation;
const auditHighRiskOperation = (action, riskLevel = 'high') => {
    return async (req, res, next) => {
        try {
            if (req.user) {
                const context = communicationAuditService_1.default.createAuditContext(req);
                const targetId = req.params.id || req.body.id || new mongoose_1.default.Types.ObjectId();
                await communicationAuditService_1.default.createAuditLog(context, {
                    action: action,
                    targetId: new mongoose_1.default.Types.ObjectId(targetId),
                    targetType: 'conversation',
                    details: {
                        metadata: {
                            riskLevel,
                            operationType: 'high_risk',
                            requestDetails: {
                                method: req.method,
                                url: req.originalUrl,
                                params: req.params,
                                query: req.query,
                            },
                        },
                    },
                    success: true,
                });
                logger_1.default.warn('High-risk communication operation attempted', {
                    action,
                    riskLevel,
                    userId: req.user._id,
                    targetId,
                    ipAddress: req.ip,
                    service: 'communication-audit-middleware',
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to audit high-risk operation', {
                error: error instanceof Error ? error.message : 'Unknown error',
                action,
                riskLevel,
                userId: req.user?._id,
                service: 'communication-audit-middleware',
            });
        }
        next();
    };
};
exports.auditHighRiskOperation = auditHighRiskOperation;
exports.default = {
    captureCommunicationAuditData: exports.captureCommunicationAuditData,
    logCommunicationAuditTrail: exports.logCommunicationAuditTrail,
    auditMessage: exports.auditMessage,
    auditConversation: exports.auditConversation,
    auditFile: exports.auditFile,
    auditSearch: exports.auditSearch,
    auditNotification: exports.auditNotification,
    logCommunicationEvent: exports.logCommunicationEvent,
    auditPatientCommunicationAccess: exports.auditPatientCommunicationAccess,
    auditBulkOperation: exports.auditBulkOperation,
    auditHighRiskOperation: exports.auditHighRiskOperation,
};
//# sourceMappingURL=communicationAuditMiddleware.js.map