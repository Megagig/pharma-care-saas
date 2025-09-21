"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityPolicyEnforcer = exports.SecurityPolicyEnforcer = exports.COMMUNICATION_SECURITY_CONFIG = void 0;
exports.COMMUNICATION_SECURITY_CONFIG = {
    rateLimiting: {
        message: {
            windowMs: 60 * 1000,
            limits: {
                pharmacist: 100,
                doctor: 100,
                patient: 30,
                pharmacy_team: 60,
                intern_pharmacist: 60,
                default: 20,
            },
        },
        conversation: {
            windowMs: 15 * 60 * 1000,
            limits: {
                pharmacist: 20,
                doctor: 20,
                patient: 5,
                pharmacy_team: 10,
                intern_pharmacist: 10,
                default: 3,
            },
        },
        fileUpload: {
            windowMs: 10 * 60 * 1000,
            limits: {
                pharmacist: 50,
                doctor: 50,
                patient: 20,
                pharmacy_team: 30,
                intern_pharmacist: 30,
                default: 10,
            },
        },
        search: {
            windowMs: 5 * 60 * 1000,
            limits: {
                pharmacist: 100,
                doctor: 100,
                patient: 30,
                pharmacy_team: 60,
                intern_pharmacist: 60,
                default: 20,
            },
        },
        burstProtection: {
            windowMs: 10 * 1000,
            limits: {
                patient: 3,
                default: 5,
            },
        },
    },
    sessionManagement: {
        maxConcurrentSessions: 5,
        sessionTimeout: 24 * 60 * 60 * 1000,
        inactivityTimeout: 2 * 60 * 60 * 1000,
        maxFailedAttempts: 5,
        lockoutDuration: 15 * 60 * 1000,
        deviceFingerprintRequired: true,
    },
    fileUpload: {
        maxFileSize: 10 * 1024 * 1024,
        maxTotalSize: 50 * 1024 * 1024,
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        dangerousExtensions: [
            '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
            '.js', '.vbs', '.jar', '.app', '.deb', '.pkg',
        ],
    },
    contentSecurity: {
        maxMessageLength: 10000,
        maxTitleLength: 200,
        maxSearchLength: 100,
        maxFilenameLength: 255,
        allowedEmojis: [
            '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🤔',
            '✅', '❌', '⚠️', '🚨', '📋', '💊', '🩺', '📊',
        ],
        allowedMessageTags: [
            'b', 'i', 'u', 'strong', 'em', 'br', 'p',
            'ul', 'ol', 'li', 'code', 'pre',
        ],
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
        keyRotationInterval: 30 * 24 * 60 * 60 * 1000,
    },
    auditLogging: {
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000,
        sensitiveActions: [
            'message_sent',
            'message_read',
            'message_edited',
            'message_deleted',
            'conversation_created',
            'participant_added',
            'participant_removed',
            'file_uploaded',
            'file_downloaded',
        ],
        highRiskActions: [
            'message_deleted',
            'conversation_archived',
            'participant_removed',
            'file_deleted',
            'bulk_operation',
            'admin_access',
        ],
        exportFormats: ['json', 'csv', 'pdf'],
    },
    rbac: {
        roleHierarchy: {
            super_admin: {
                permissions: ['*'],
            },
            pharmacist: {
                permissions: [
                    'conversation.create',
                    'conversation.view',
                    'conversation.update',
                    'conversation.moderate',
                    'message.send',
                    'message.edit',
                    'message.delete',
                    'message.moderate',
                    'participant.add',
                    'participant.remove',
                    'file.upload',
                    'file.download',
                    'file.manage',
                    'patient.access',
                    'audit.view',
                    'search.advanced',
                    'thread.create',
                    'thread.manage',
                ],
            },
            doctor: {
                permissions: [
                    'conversation.create',
                    'conversation.view',
                    'conversation.update',
                    'message.send',
                    'message.edit',
                    'message.delete',
                    'participant.add',
                    'file.upload',
                    'file.download',
                    'file.manage',
                    'patient.access',
                    'search.advanced',
                    'thread.create',
                ],
            },
            pharmacy_team: {
                permissions: [
                    'conversation.view',
                    'message.send',
                    'message.edit',
                    'file.upload',
                    'file.download',
                    'search.basic',
                    'thread.create',
                ],
            },
            intern_pharmacist: {
                permissions: [
                    'conversation.view',
                    'message.send',
                    'message.edit',
                    'file.upload',
                    'file.download',
                    'search.basic',
                    'thread.create',
                ],
            },
            patient: {
                permissions: [
                    'conversation.create',
                    'conversation.view',
                    'message.send',
                    'message.edit',
                    'file.upload',
                    'search.basic',
                ],
            },
        },
        conversationTypeRestrictions: {
            patient_query: {
                requiredRoles: ['patient', 'pharmacist', 'doctor'],
                maxParticipants: 10,
                minParticipants: 2,
            },
            clinical_consultation: {
                requiredRoles: ['pharmacist', 'doctor'],
                maxParticipants: 20,
                minParticipants: 2,
            },
            direct: {
                requiredRoles: [],
                maxParticipants: 2,
                minParticipants: 2,
            },
            group: {
                requiredRoles: [],
                maxParticipants: 50,
                minParticipants: 3,
            },
        },
    },
};
class SecurityPolicyEnforcer {
    constructor(config = exports.COMMUNICATION_SECURITY_CONFIG) {
        this.config = config;
    }
    hasPermission(userRole, action) {
        const roleConfig = this.config.rbac.roleHierarchy[userRole];
        if (!roleConfig)
            return false;
        if (roleConfig.permissions.includes('*'))
            return true;
        if (roleConfig.permissions.includes(action))
            return true;
        if (roleConfig.inherits) {
            for (const inheritedRole of roleConfig.inherits) {
                if (this.hasPermission(inheritedRole, action))
                    return true;
            }
        }
        return false;
    }
    getRateLimit(userRole, actionType) {
        const limits = this.config.rateLimiting[actionType].limits;
        return limits[userRole] || limits.default;
    }
    validateConversationType(type, participants) {
        const restrictions = this.config.rbac.conversationTypeRestrictions[type];
        if (!restrictions) {
            return { valid: false, reason: 'Invalid conversation type' };
        }
        if (participants.length < restrictions.minParticipants) {
            return {
                valid: false,
                reason: `Minimum ${restrictions.minParticipants} participants required`
            };
        }
        if (participants.length > restrictions.maxParticipants) {
            return {
                valid: false,
                reason: `Maximum ${restrictions.maxParticipants} participants allowed`
            };
        }
        if (restrictions.requiredRoles.length > 0) {
            const participantRoles = participants.map(p => p.role);
            const hasRequiredRoles = restrictions.requiredRoles.every(role => participantRoles.includes(role));
            if (!hasRequiredRoles) {
                return {
                    valid: false,
                    reason: `Required roles: ${restrictions.requiredRoles.join(', ')}`
                };
            }
        }
        return { valid: true };
    }
    isFileTypeAllowed(mimeType, filename) {
        if (!this.config.fileUpload.allowedMimeTypes.includes(mimeType)) {
            return false;
        }
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        if (this.config.fileUpload.dangerousExtensions.includes(extension)) {
            return false;
        }
        return true;
    }
    requiresAuditLogging(action) {
        return this.config.auditLogging.sensitiveActions.includes(action) ||
            this.config.auditLogging.highRiskActions.includes(action);
    }
    isHighRiskAction(action) {
        return this.config.auditLogging.highRiskActions.includes(action);
    }
}
exports.SecurityPolicyEnforcer = SecurityPolicyEnforcer;
exports.securityPolicyEnforcer = new SecurityPolicyEnforcer();
exports.default = {
    COMMUNICATION_SECURITY_CONFIG: exports.COMMUNICATION_SECURITY_CONFIG,
    SecurityPolicyEnforcer,
    securityPolicyEnforcer: exports.securityPolicyEnforcer,
};
//# sourceMappingURL=communicationSecurity.js.map