"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceConversationTypeRestrictions = exports.requireFileAccess = exports.validateParticipantRoles = exports.requirePatientAccess = exports.requireMessageAccess = exports.requireConversationAccess = void 0;
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const Patient_1 = __importDefault(require("../models/Patient"));
const auditLogging_1 = require("./auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const getUserCommunicationPermissions = (userRole, workplaceRole, isConversationParticipant = false, isMessageSender = false) => {
    const basePermissions = {
        canCreateConversation: false,
        canViewConversation: false,
        canUpdateConversation: false,
        canDeleteConversation: false,
        canSendMessage: false,
        canEditMessage: false,
        canDeleteMessage: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canAccessPatientData: false,
        canViewAuditLogs: false,
        canManageFiles: false,
        canCreateThreads: false,
        canSearchMessages: false,
    };
    if (userRole === 'super_admin') {
        return Object.keys(basePermissions).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
    }
    switch (userRole) {
        case 'pharmacist':
        case 'doctor':
            return {
                ...basePermissions,
                canCreateConversation: true,
                canViewConversation: isConversationParticipant,
                canUpdateConversation: isConversationParticipant &&
                    ['pharmacist', 'doctor'].includes(userRole),
                canSendMessage: isConversationParticipant,
                canEditMessage: isMessageSender,
                canDeleteMessage: isMessageSender || userRole === 'pharmacist',
                canAddParticipant: isConversationParticipant &&
                    ['pharmacist', 'doctor'].includes(userRole),
                canRemoveParticipant: isConversationParticipant && userRole === 'pharmacist',
                canAccessPatientData: true,
                canViewAuditLogs: userRole === 'pharmacist',
                canManageFiles: isConversationParticipant,
                canCreateThreads: isConversationParticipant,
                canSearchMessages: true,
            };
        case 'pharmacy_team':
        case 'intern_pharmacist':
            return {
                ...basePermissions,
                canCreateConversation: workplaceRole === 'admin' || workplaceRole === 'manager',
                canViewConversation: isConversationParticipant,
                canSendMessage: isConversationParticipant,
                canEditMessage: isMessageSender,
                canDeleteMessage: isMessageSender,
                canAccessPatientData: workplaceRole === 'admin' || workplaceRole === 'manager',
                canManageFiles: isConversationParticipant,
                canCreateThreads: isConversationParticipant,
                canSearchMessages: isConversationParticipant,
            };
        case 'patient':
            return {
                ...basePermissions,
                canCreateConversation: true,
                canViewConversation: isConversationParticipant,
                canSendMessage: isConversationParticipant,
                canEditMessage: isMessageSender,
                canManageFiles: isConversationParticipant,
                canSearchMessages: isConversationParticipant,
            };
        default:
            return basePermissions;
    }
};
const requireConversationAccess = (action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const conversationId = req.params.id || req.params.conversationId;
            if (!conversationId) {
                res.status(400).json({
                    success: false,
                    message: 'Conversation ID is required',
                });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId: req.user.workplaceId,
            });
            if (!conversation) {
                await auditLogging_1.auditOperations.unauthorizedAccess(req, 'Conversation', conversationId, 'Conversation not found');
                res.status(404).json({
                    success: false,
                    message: 'Conversation not found',
                });
                return;
            }
            const isParticipant = conversation.participants.some((p) => p.userId.toString() === req.user._id.toString() && !p.leftAt);
            const permissions = getUserCommunicationPermissions(req.user.role, req.user.workplaceRole, isParticipant);
            if (!permissions[action]) {
                await auditLogging_1.auditOperations.permissionDenied(req, action.toString(), `Permission denied: ${action} on conversation`);
                res.status(403).json({
                    success: false,
                    message: `Permission denied: ${action}`,
                    requiredPermission: action,
                    userRole: req.user.role,
                    isParticipant,
                });
                return;
            }
            req.conversation = conversation;
            req.isConversationParticipant = isParticipant;
            next();
        }
        catch (error) {
            logger_1.default.error('Error checking conversation access:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
};
exports.requireConversationAccess = requireConversationAccess;
const requireMessageAccess = (action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const messageId = req.params.id || req.params.messageId;
            if (!messageId) {
                res.status(400).json({
                    success: false,
                    message: 'Message ID is required',
                });
                return;
            }
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId: req.user.workplaceId,
            });
            if (!message) {
                await auditLogging_1.auditOperations.unauthorizedAccess(req, 'Message', messageId, 'Message not found');
                res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
                return;
            }
            const conversation = await Conversation_1.default.findById(message.conversationId);
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: 'Associated conversation not found',
                });
                return;
            }
            const isParticipant = conversation.participants.some((p) => p.userId.toString() === req.user._id.toString() && !p.leftAt);
            const isMessageSender = message.senderId.toString() === req.user._id.toString();
            const permissions = getUserCommunicationPermissions(req.user.role, req.user.workplaceRole, isParticipant, isMessageSender);
            if (!permissions[action]) {
                await auditLogging_1.auditOperations.permissionDenied(req, action.toString(), `Permission denied: ${action} on message`);
                res.status(403).json({
                    success: false,
                    message: `Permission denied: ${action}`,
                    requiredPermission: action,
                    userRole: req.user.role,
                    isParticipant,
                    isMessageSender,
                });
                return;
            }
            req.message = message;
            req.conversation = conversation;
            req.isMessageSender = isMessageSender;
            next();
        }
        catch (error) {
            logger_1.default.error('Error checking message access:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
};
exports.requireMessageAccess = requireMessageAccess;
const requirePatientAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        const patientId = req.params.patientId;
        if (!patientId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID is required',
            });
            return;
        }
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: req.user.workplaceId,
        });
        if (!patient) {
            await auditLogging_1.auditOperations.unauthorizedAccess(req, 'Patient', patientId, 'Patient not found');
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }
        const permissions = getUserCommunicationPermissions(req.user.role, req.user.workplaceRole);
        if (!permissions.canAccessPatientData) {
            await auditLogging_1.auditOperations.permissionDenied(req, 'canAccessPatientData', 'Permission denied: Cannot access patient data');
            res.status(403).json({
                success: false,
                message: 'Permission denied: Cannot access patient data',
                userRole: req.user.role,
            });
            return;
        }
        req.patient = patient;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.requirePatientAccess = requirePatientAccess;
const validateParticipantRoles = (req, res, next) => {
    try {
        const { participants } = req.body;
        logger_1.default.info('Validating participant roles', {
            participantsCount: participants?.length,
            participants: JSON.stringify(participants),
            service: 'communication-rbac',
        });
        if (!participants || !Array.isArray(participants)) {
            res.status(400).json({
                success: false,
                message: 'Participants array is required',
            });
            return;
        }
        const roles = participants.map((p) => p.role || 'patient');
        logger_1.default.info('Extracted roles from participants', {
            roles: JSON.stringify(roles),
            service: 'communication-rbac',
        });
        const healthcareProviderRoles = [
            'pharmacist',
            'doctor',
            'pharmacy_team',
            'pharmacy_outlet',
            'nurse',
            'admin'
        ];
        const hasHealthcareProvider = roles.some((role) => healthcareProviderRoles.includes(role));
        const hasPatient = roles.includes('patient');
        logger_1.default.info('Role validation check', {
            hasHealthcareProvider,
            hasPatient,
            roles: JSON.stringify(roles),
            service: 'communication-rbac',
        });
        if (hasPatient && !hasHealthcareProvider) {
            res.status(400).json({
                success: false,
                message: 'Patient conversations must include at least one healthcare provider',
            });
            return;
        }
        if (participants.length > 10) {
            res.status(400).json({
                success: false,
                message: 'Maximum 10 participants allowed per conversation',
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating participant roles:', error);
        res.status(500).json({
            success: false,
            message: 'Participant validation failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.validateParticipantRoles = validateParticipantRoles;
const requireFileAccess = (action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const conversationId = req.body.conversationId || req.params.conversationId;
            if (conversationId) {
                const conversation = await Conversation_1.default.findOne({
                    _id: conversationId,
                    workplaceId: req.user.workplaceId,
                });
                if (!conversation) {
                    res.status(404).json({
                        success: false,
                        message: 'Conversation not found',
                    });
                    return;
                }
                const isParticipant = conversation.participants.some((p) => p.userId.toString() === req.user._id.toString() && !p.leftAt);
                if (!isParticipant) {
                    await auditLogging_1.auditOperations.permissionDenied(req, `canManageFiles`, `Permission denied: Cannot manage files (${action})`);
                    res.status(403).json({
                        success: false,
                        message: 'Permission denied: Not a conversation participant',
                    });
                    return;
                }
            }
            const permissions = getUserCommunicationPermissions(req.user.role, req.user.workplaceRole, true);
            if (!permissions.canManageFiles) {
                await auditLogging_1.auditOperations.permissionDenied(req, `canManageFiles`, `Permission denied: Cannot manage files (${action})`);
                res.status(403).json({
                    success: false,
                    message: 'Permission denied: Cannot manage files',
                    userRole: req.user.role,
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Error checking file access:', error);
            res.status(500).json({
                success: false,
                message: 'File permission check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
};
exports.requireFileAccess = requireFileAccess;
const enforceConversationTypeRestrictions = (req, res, next) => {
    try {
        const { type, participants } = req.body;
        if (!type) {
            res.status(400).json({
                success: false,
                message: 'Conversation type is required',
            });
            return;
        }
        switch (type) {
            case 'patient_query':
                const patientCount = participants.filter((p) => p.role === 'patient').length;
                const providerCount = participants.filter((p) => ['pharmacist', 'doctor'].includes(p.role)).length;
                if (patientCount !== 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Patient query conversations must have exactly one patient',
                    });
                    return;
                }
                if (providerCount === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Patient query conversations must have at least one healthcare provider',
                    });
                    return;
                }
                break;
            case 'clinical_consultation':
                const hasPharmacist = participants.some((p) => p.role === 'pharmacist');
                const hasDoctor = participants.some((p) => p.role === 'doctor');
                if (!hasPharmacist || !hasDoctor) {
                    res.status(400).json({
                        success: false,
                        message: 'Clinical consultations must include both pharmacist and doctor',
                    });
                    return;
                }
                break;
            case 'direct':
                const creatorId = req.user?._id?.toString();
                const creatorInParticipants = participants.some((p) => {
                    const participantId = typeof p === 'string' ? p : p.userId;
                    return participantId === creatorId;
                });
                if (creatorInParticipants && participants.length !== 2) {
                    res.status(400).json({
                        success: false,
                        message: 'Direct conversations must have exactly 2 participants (you + 1 other person)',
                    });
                    return;
                }
                if (!creatorInParticipants && participants.length !== 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Direct conversations must have exactly 1 other participant (you will be added automatically)',
                    });
                    return;
                }
                break;
            case 'group':
                const groupCreatorInParticipants = participants.some((p) => {
                    const participantId = typeof p === 'string' ? p : p.userId;
                    return participantId === creatorId;
                });
                const minParticipants = groupCreatorInParticipants ? 3 : 2;
                if (participants.length < minParticipants) {
                    res.status(400).json({
                        success: false,
                        message: groupCreatorInParticipants
                            ? 'Group conversations must have at least 3 participants (including you)'
                            : 'Group conversations must have at least 2 other participants (you will be added automatically)',
                    });
                    return;
                }
                break;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error enforcing conversation type restrictions:', error);
        res.status(500).json({
            success: false,
            message: 'Conversation type validation failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.enforceConversationTypeRestrictions = enforceConversationTypeRestrictions;
exports.default = {
    requireConversationAccess: exports.requireConversationAccess,
    requireMessageAccess: exports.requireMessageAccess,
    requirePatientAccess: exports.requirePatientAccess,
    validateParticipantRoles: exports.validateParticipantRoles,
    requireFileAccess: exports.requireFileAccess,
    enforceConversationTypeRestrictions: exports.enforceConversationTypeRestrictions,
    getUserCommunicationPermissions,
};
//# sourceMappingURL=communicationRBAC.js.map