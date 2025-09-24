export interface SecurityConfig {
    rateLimiting: {
        message: {
            windowMs: number;
            limits: {
                pharmacist: number;
                doctor: number;
                patient: number;
                pharmacy_team: number;
                intern_pharmacist: number;
                default: number;
            };
        };
        conversation: {
            windowMs: number;
            limits: {
                pharmacist: number;
                doctor: number;
                patient: number;
                pharmacy_team: number;
                intern_pharmacist: number;
                default: number;
            };
        };
        fileUpload: {
            windowMs: number;
            limits: {
                pharmacist: number;
                doctor: number;
                patient: number;
                pharmacy_team: number;
                intern_pharmacist: number;
                default: number;
            };
        };
        search: {
            windowMs: number;
            limits: {
                pharmacist: number;
                doctor: number;
                patient: number;
                pharmacy_team: number;
                intern_pharmacist: number;
                default: number;
            };
        };
        burstProtection: {
            windowMs: number;
            limits: {
                patient: number;
                default: number;
            };
        };
    };
    sessionManagement: {
        maxConcurrentSessions: number;
        sessionTimeout: number;
        inactivityTimeout: number;
        maxFailedAttempts: number;
        lockoutDuration: number;
        deviceFingerprintRequired: boolean;
    };
    fileUpload: {
        maxFileSize: number;
        maxTotalSize: number;
        allowedMimeTypes: string[];
        dangerousExtensions: string[];
    };
    contentSecurity: {
        maxMessageLength: number;
        maxTitleLength: number;
        maxSearchLength: number;
        maxFilenameLength: number;
        allowedEmojis: string[];
        allowedMessageTags: string[];
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
        keyRotationInterval: number;
    };
    auditLogging: {
        retentionPeriod: number;
        sensitiveActions: string[];
        highRiskActions: string[];
        exportFormats: string[];
    };
    rbac: {
        roleHierarchy: {
            [role: string]: {
                permissions: string[];
                inherits?: string[];
            };
        };
        conversationTypeRestrictions: {
            [type: string]: {
                requiredRoles: string[];
                maxParticipants: number;
                minParticipants: number;
            };
        };
    };
}
export declare const COMMUNICATION_SECURITY_CONFIG: SecurityConfig;
export declare class SecurityPolicyEnforcer {
    private config;
    constructor(config?: SecurityConfig);
    hasPermission(userRole: string, action: string): boolean;
    getRateLimit(userRole: string, actionType: keyof SecurityConfig['rateLimiting']): number;
    validateConversationType(type: string, participants: Array<{
        role: string;
    }>): {
        valid: boolean;
        reason?: string;
    };
    isFileTypeAllowed(mimeType: string, filename: string): boolean;
    requiresAuditLogging(action: string): boolean;
    isHighRiskAction(action: string): boolean;
}
export declare const securityPolicyEnforcer: SecurityPolicyEnforcer;
declare const _default: {
    COMMUNICATION_SECURITY_CONFIG: SecurityConfig;
    SecurityPolicyEnforcer: typeof SecurityPolicyEnforcer;
    securityPolicyEnforcer: SecurityPolicyEnforcer;
};
export default _default;
//# sourceMappingURL=communicationSecurity.d.ts.map