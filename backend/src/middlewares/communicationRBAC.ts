import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Patient from '../models/Patient';
import { auditOperations } from './auditLogging';
import logger from '../utils/logger';

/**
 * Enhanced RBAC middleware specifically for Communication Hub
 */

interface CommunicationPermissions {
    canCreateConversation: boolean;
    canViewConversation: boolean;
    canUpdateConversation: boolean;
    canDeleteConversation: boolean;
    canSendMessage: boolean;
    canEditMessage: boolean;
    canDeleteMessage: boolean;
    canAddParticipant: boolean;
    canRemoveParticipant: boolean;
    canAccessPatientData: boolean;
    canViewAuditLogs: boolean;
    canManageFiles: boolean;
    canCreateThreads: boolean;
    canSearchMessages: boolean;
}

/**
 * Get user permissions based on role and context
 */
const getUserCommunicationPermissions = (
    userRole: string,
    workplaceRole?: string,
    isConversationParticipant = false,
    isMessageSender = false
): CommunicationPermissions => {
    const basePermissions: CommunicationPermissions = {
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

    // Super admin has all permissions
    if (userRole === 'super_admin') {
        return Object.keys(basePermissions).reduce((acc, key) => {
            acc[key as keyof CommunicationPermissions] = true;
            return acc;
        }, {} as CommunicationPermissions);
    }

    // Role-based permissions
    switch (userRole) {
        case 'pharmacist':
        case 'doctor':
            return {
                ...basePermissions,
                canCreateConversation: true,
                canViewConversation: isConversationParticipant,
                canUpdateConversation: isConversationParticipant && ['pharmacist', 'doctor'].includes(userRole),
                canSendMessage: isConversationParticipant,
                canEditMessage: isMessageSender,
                canDeleteMessage: isMessageSender || userRole === 'pharmacist', // Pharmacists can moderate
                canAddParticipant: isConversationParticipant && ['pharmacist', 'doctor'].includes(userRole),
                canRemoveParticipant: isConversationParticipant && userRole === 'pharmacist', // Only pharmacists can remove
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
                canCreateConversation: true, // Patients can initiate queries
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

/**
 * Middleware to check conversation access permissions
 */
export const requireConversationAccess = (action: keyof CommunicationPermissions) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

            // Get conversation and check if user is participant
            const conversation = await Conversation.findOne({
                _id: conversationId,
                workplaceId: req.user.workplaceId,
            });

            if (!conversation) {
                await auditOperations.accessDenied(req, 'conversation_not_found', conversationId);
                res.status(404).json({
                    success: false,
                    message: 'Conversation not found',
                });
                return;
            }

            const isParticipant = conversation.participants.some(
                p => p.userId.toString() === req.user!._id.toString() && !p.leftAt
            );

            const permissions = getUserCommunicationPermissions(
                req.user.role,
                req.user.workplaceRole,
                isParticipant
            );

            if (!permissions[action]) {
                await auditOperations.accessDenied(req, action, conversationId);
                res.status(403).json({
                    success: false,
                    message: `Permission denied: ${action}`,
                    requiredPermission: action,
                    userRole: req.user.role,
                    isParticipant,
                });
                return;
            }

            // Store conversation in request for use by controller
            (req as any).conversation = conversation;
            (req as any).isConversationParticipant = isParticipant;

            next();
        } catch (error) {
            logger.error('Error checking conversation access:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};

/**
 * Middleware to check message access permissions
 */
export const requireMessageAccess = (action: keyof CommunicationPermissions) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

            // Get message and conversation
            const message = await Message.findOne({
                _id: messageId,
                workplaceId: req.user.workplaceId,
            });

            if (!message) {
                await auditOperations.accessDenied(req, 'message_not_found', messageId);
                res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
                return;
            }

            const conversation = await Conversation.findById(message.conversationId);
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: 'Associated conversation not found',
                });
                return;
            }

            const isParticipant = conversation.participants.some(
                p => p.userId.toString() === req.user!._id.toString() && !p.leftAt
            );

            const isMessageSender = message.senderId.toString() === req.user._id.toString();

            const permissions = getUserCommunicationPermissions(
                req.user.role,
                req.user.workplaceRole,
                isParticipant,
                isMessageSender
            );

            if (!permissions[action]) {
                await auditOperations.accessDenied(req, action, messageId);
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

            // Store message and conversation in request
            (req as any).message = message;
            (req as any).conversation = conversation;
            (req as any).isMessageSender = isMessageSender;

            next();
        } catch (error) {
            logger.error('Error checking message access:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};

/**
 * Middleware to check patient data access permissions
 */
export const requirePatientAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        // Check if patient exists and user has access
        const patient = await Patient.findOne({
            _id: patientId,
            workplaceId: req.user.workplaceId,
        });

        if (!patient) {
            await auditOperations.accessDenied(req, 'patient_not_found', patientId);
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }

        const permissions = getUserCommunicationPermissions(
            req.user.role,
            req.user.workplaceRole
        );

        if (!permissions.canAccessPatientData) {
            await auditOperations.accessDenied(req, 'patient_access_denied', patientId);
            res.status(403).json({
                success: false,
                message: 'Permission denied: Cannot access patient data',
                userRole: req.user.role,
            });
            return;
        }

        // Store patient in request
        (req as any).patient = patient;

        next();
    } catch (error) {
        logger.error('Error checking patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};

/**
 * Middleware to validate conversation participant roles
 */
export const validateParticipantRoles = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            res.status(400).json({
                success: false,
                message: 'Participants array is required',
            });
            return;
        }

        // Validate role combinations
        const roles = participants.map((p: any) => p.role || 'patient');
        const hasPharmacist = roles.includes('pharmacist');
        const hasDoctor = roles.includes('doctor');
        const hasPatient = roles.includes('patient');

        // Business rules for role combinations
        if (hasPatient && !hasPharmacist && !hasDoctor) {
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
    } catch (error) {
        logger.error('Error validating participant roles:', error);
        res.status(500).json({
            success: false,
            message: 'Participant validation failed',
        });
    }
};

/**
 * Middleware to check file access permissions
 */
export const requireFileAccess = (action: 'upload' | 'download' | 'delete') => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
                // Check conversation access for file operations
                const conversation = await Conversation.findOne({
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

                const isParticipant = conversation.participants.some(
                    p => p.userId.toString() === req.user!._id.toString() && !p.leftAt
                );

                if (!isParticipant) {
                    await auditOperations.accessDenied(req, `file_${action}_denied`, conversationId);
                    res.status(403).json({
                        success: false,
                        message: 'Permission denied: Not a conversation participant',
                    });
                    return;
                }
            }

            const permissions = getUserCommunicationPermissions(
                req.user.role,
                req.user.workplaceRole,
                true // Assume participant if we got here
            );

            if (!permissions.canManageFiles) {
                await auditOperations.accessDenied(req, `file_${action}_denied`, conversationId);
                res.status(403).json({
                    success: false,
                    message: 'Permission denied: Cannot manage files',
                    userRole: req.user.role,
                });
                return;
            }

            next();
        } catch (error) {
            logger.error('Error checking file access:', error);
            res.status(500).json({
                success: false,
                message: 'File permission check failed',
            });
        }
    };
};

/**
 * Middleware to enforce conversation type restrictions
 */
export const enforceConversationTypeRestrictions = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const { type, participants } = req.body;

        if (!type) {
            res.status(400).json({
                success: false,
                message: 'Conversation type is required',
            });
            return;
        }

        // Enforce restrictions based on conversation type
        switch (type) {
            case 'patient_query':
                // Must have exactly one patient and at least one healthcare provider
                const patientCount = participants.filter((p: any) => p.role === 'patient').length;
                const providerCount = participants.filter((p: any) =>
                    ['pharmacist', 'doctor'].includes(p.role)
                ).length;

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
                // Must have at least one pharmacist and one doctor
                const hasPharmacist = participants.some((p: any) => p.role === 'pharmacist');
                const hasDoctor = participants.some((p: any) => p.role === 'doctor');

                if (!hasPharmacist || !hasDoctor) {
                    res.status(400).json({
                        success: false,
                        message: 'Clinical consultations must include both pharmacist and doctor',
                    });
                    return;
                }
                break;

            case 'direct':
                // Must have exactly 2 participants
                if (participants.length !== 2) {
                    res.status(400).json({
                        success: false,
                        message: 'Direct conversations must have exactly 2 participants',
                    });
                    return;
                }
                break;

            case 'group':
                // Must have at least 3 participants
                if (participants.length < 3) {
                    res.status(400).json({
                        success: false,
                        message: 'Group conversations must have at least 3 participants',
                    });
                    return;
                }
                break;
        }

        next();
    } catch (error) {
        logger.error('Error enforcing conversation type restrictions:', error);
        res.status(500).json({
            success: false,
            message: 'Conversation type validation failed',
        });
    }
};

export default {
    requireConversationAccess,
    requireMessageAccess,
    requirePatientAccess,
    validateParticipantRoles,
    requireFileAccess,
    enforceConversationTypeRestrictions,
    getUserCommunicationPermissions,
};