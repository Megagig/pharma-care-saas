import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import UnifiedAuditService from '../services/unifiedAuditService';
import logger from '../utils/logger';

/**
 * Unified Audit Middleware
 * Automatically logs important activities across the application
 */

// Define which routes should be audited
const auditableRoutes = [
    // Authentication routes
    { pattern: /^\/api\/auth\/login$/, method: 'POST', activityType: 'authentication', action: 'USER_LOGIN' },
    { pattern: /^\/api\/auth\/logout$/, method: 'POST', activityType: 'authentication', action: 'USER_LOGOUT' },
    { pattern: /^\/api\/auth\/register$/, method: 'POST', activityType: 'user_management', action: 'USER_REGISTERED' },

    // User management routes
    { pattern: /^\/api\/admin\/users\/.*\/approve$/, method: 'PUT', activityType: 'user_management', action: 'USER_APPROVED' },
    { pattern: /^\/api\/admin\/users\/.*\/reject$/, method: 'PUT', activityType: 'user_management', action: 'USER_REJECTED' },
    { pattern: /^\/api\/admin\/users\/.*\/suspend$/, method: 'PUT', activityType: 'user_management', action: 'USER_SUSPENDED' },
    { pattern: /^\/api\/admin\/users\/.*\/reactivate$/, method: 'PUT', activityType: 'user_management', action: 'USER_REACTIVATED' },
    { pattern: /^\/api\/admin\/users\/[^\/]+$/, method: 'DELETE', activityType: 'user_management', action: 'USER_DELETED' },

    // Patient management routes
    { pattern: /^\/api\/patients$/, method: 'POST', activityType: 'patient_management', action: 'PATIENT_CREATED' },
    { pattern: /^\/api\/patients\/[^\/]+$/, method: 'PUT', activityType: 'patient_management', action: 'PATIENT_UPDATED' },
    { pattern: /^\/api\/patients\/[^\/]+$/, method: 'DELETE', activityType: 'patient_management', action: 'PATIENT_DELETED' },
    { pattern: /^\/api\/patients\/[^\/]+$/, method: 'GET', activityType: 'patient_management', action: 'PATIENT_VIEWED' },

    // Medication management routes
    { pattern: /^\/api\/medications$/, method: 'POST', activityType: 'medication_management', action: 'MEDICATION_PRESCRIBED' },
    { pattern: /^\/api\/medications\/[^\/]+$/, method: 'PUT', activityType: 'medication_management', action: 'MEDICATION_UPDATED' },
    { pattern: /^\/api\/medications\/[^\/]+$/, method: 'DELETE', activityType: 'medication_management', action: 'MEDICATION_DELETED' },

    // MTR session routes
    { pattern: /^\/api\/mtr\/sessions$/, method: 'POST', activityType: 'mtr_session', action: 'MTR_SESSION_CREATED' },
    { pattern: /^\/api\/mtr\/sessions\/.*\/complete$/, method: 'PUT', activityType: 'mtr_session', action: 'MTR_SESSION_COMPLETED' },

    // Clinical intervention routes
    { pattern: /^\/api\/clinical-interventions$/, method: 'POST', activityType: 'clinical_intervention', action: 'INTERVENTION_CREATED' },
    { pattern: /^\/api\/clinical-interventions\/.*\/resolve$/, method: 'PUT', activityType: 'clinical_intervention', action: 'INTERVENTION_RESOLVED' },

    // Workspace management routes
    { pattern: /^\/api\/workspace\/team\/invites$/, method: 'POST', activityType: 'workspace_management', action: 'TEAM_MEMBER_INVITED' },
    { pattern: /^\/api\/workspace\/team\/members\/.*\/role$/, method: 'PUT', activityType: 'workspace_management', action: 'TEAM_MEMBER_ROLE_CHANGED' },
    { pattern: /^\/api\/workspace\/team\/members\/[^\/]+$/, method: 'DELETE', activityType: 'workspace_management', action: 'TEAM_MEMBER_REMOVED' },

    // System configuration routes
    { pattern: /^\/api\/admin\/settings/, method: 'PUT', activityType: 'system_configuration', action: 'SYSTEM_SETTINGS_CHANGED' },

    // Data export routes
    { pattern: /^\/api\/.*\/export$/, method: 'GET', activityType: 'data_export', action: 'DATA_EXPORTED' },

    // Report generation routes
    { pattern: /^\/api\/reports/, method: 'GET', activityType: 'report_generation', action: 'REPORT_GENERATED' },

    // Communication routes
    { pattern: /^\/api\/communication\/conversations$/, method: 'POST', activityType: 'communication', action: 'CONVERSATION_CREATED' },
    { pattern: /^\/api\/communication\/messages$/, method: 'POST', activityType: 'communication', action: 'MESSAGE_SENT' },

    // AI Diagnostics routes
    { pattern: /^\/api\/diagnostics\/analyze$/, method: 'POST', activityType: 'diagnostic_ai', action: 'AI_DIAGNOSTIC_RUN' },

    // Subscription management routes
    { pattern: /^\/api\/subscriptions$/, method: 'POST', activityType: 'subscription_management', action: 'SUBSCRIPTION_CREATED' },
    { pattern: /^\/api\/subscriptions\/.*\/cancel$/, method: 'PUT', activityType: 'subscription_management', action: 'SUBSCRIPTION_CANCELLED' },
];

/**
 * Determine if route should be audited
 */
function shouldAuditRoute(path: string, method: string): any {
    return auditableRoutes.find(
        (route) => route.pattern.test(path) && route.method === method
    );
}

/**
 * Extract entity information from request
 */
function extractEntityInfo(req: Request, route: any): any {
    const pathParts = req.path.split('/');
    const entityIdMatch = req.path.match(/\/([a-f0-9]{24})\/?/);

    if (entityIdMatch && entityIdMatch[1]) {
        let entityType = 'Unknown';

        if (req.path.includes('/patients')) entityType = 'Patient';
        else if (req.path.includes('/users')) entityType = 'User';
        else if (req.path.includes('/medications')) entityType = 'Medication';
        else if (req.path.includes('/mtr')) entityType = 'MTRSession';
        else if (req.path.includes('/clinical-interventions')) entityType = 'ClinicalIntervention';
        else if (req.path.includes('/conversations')) entityType = 'Conversation';
        else if (req.path.includes('/messages')) entityType = 'Message';

        return {
            entityType,
            entityId: entityIdMatch[1],
            entityName: req.body?.name || req.body?.title || `${entityType} ${entityIdMatch[1].substring(0, 8)}`,
        };
    }

    return null;
}

/**
 * Generate human-readable description
 */
function generateDescription(user: any, action: string, entityInfo: any, req: Request): string {
    const userName = user ? `${user.firstName} ${user.lastName}` : 'System';

    const actionDescriptions: Record<string, string> = {
        USER_LOGIN: `${userName} logged in`,
        USER_LOGOUT: `${userName} logged out`,
        USER_REGISTERED: `${userName} registered a new account`,
        USER_APPROVED: `${userName} approved a user account`,
        USER_REJECTED: `${userName} rejected a user account`,
        USER_SUSPENDED: `${userName} suspended a user account`,
        USER_REACTIVATED: `${userName} reactivated a user account`,
        USER_DELETED: `${userName} deleted a user account`,
        PATIENT_CREATED: `${userName} created a new patient record`,
        PATIENT_UPDATED: `${userName} updated a patient record`,
        PATIENT_DELETED: `${userName} deleted a patient record`,
        PATIENT_VIEWED: `${userName} viewed a patient record`,
        MEDICATION_PRESCRIBED: `${userName} prescribed a medication`,
        MEDICATION_UPDATED: `${userName} updated a medication`,
        MEDICATION_DELETED: `${userName} deleted a medication`,
        MTR_SESSION_CREATED: `${userName} created an MTR session`,
        MTR_SESSION_COMPLETED: `${userName} completed an MTR session`,
        INTERVENTION_CREATED: `${userName} created a clinical intervention`,
        INTERVENTION_RESOLVED: `${userName} resolved a clinical intervention`,
        TEAM_MEMBER_INVITED: `${userName} invited a team member`,
        TEAM_MEMBER_ROLE_CHANGED: `${userName} changed a team member's role`,
        TEAM_MEMBER_REMOVED: `${userName} removed a team member`,
        SYSTEM_SETTINGS_CHANGED: `${userName} changed system settings`,
        DATA_EXPORTED: `${userName} exported data`,
        REPORT_GENERATED: `${userName} generated a report`,
        CONVERSATION_CREATED: `${userName} created a conversation`,
        MESSAGE_SENT: `${userName} sent a message`,
        AI_DIAGNOSTIC_RUN: `${userName} ran AI diagnostic analysis`,
        SUBSCRIPTION_CREATED: `${userName} created a subscription`,
        SUBSCRIPTION_CANCELLED: `${userName} cancelled a subscription`,
    };

    let description = actionDescriptions[action] || `${userName} performed ${action}`;

    if (entityInfo) {
        description += ` for ${entityInfo.entityName}`;
    }

    return description;
}

/**
 * Calculate compliance category based on activity type
 */
function getComplianceCategory(activityType: string, action: string): string | undefined {
    if (
        activityType === 'patient_management' ||
        activityType === 'medication_management' ||
        activityType === 'mtr_session' ||
        activityType === 'clinical_intervention' ||
        action === 'PATIENT_VIEWED'
    ) {
        return 'HIPAA';
    }

    if (activityType === 'payment_transaction' || activityType === 'subscription_management') {
        return 'PCI_DSS';
    }

    if (activityType === 'data_export' || action.includes('DELETED')) {
        return 'GDPR';
    }

    return 'GENERAL';
}

/**
 * Unified Audit Logging Middleware
 */
export const unifiedAuditMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // Skip audit trail routes to prevent circular logging
    if (req.path.startsWith('/api/super-admin/audit-trail')) {
        return next();
    }

    // Check if route should be audited
    const auditConfig = shouldAuditRoute(req.path, req.method);

    if (!auditConfig) {
        return next();
    }

    // Store original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data: any): Response {
        // Restore original send
        res.send = originalSend;

        // Log the activity asynchronously (don't block response)
        setImmediate(async () => {
            try {
                const user = req.user;

                // Skip if no user (for public routes)
                if (!user) {
                    return;
                }

                const entityInfo = extractEntityInfo(req, auditConfig);
                const description = generateDescription(user, auditConfig.action, entityInfo, req);
                const complianceCategory = getComplianceCategory(auditConfig.activityType, auditConfig.action);

                const auditData: any = {
                    userId: user._id,
                    workplaceId: user.workplaceId,
                    activityType: auditConfig.activityType,
                    action: auditConfig.action,
                    description,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    complianceCategory,
                    metadata: {
                        requestBody: sanitizeRequestBody(req.body),
                        query: req.query,
                    },
                };

                // Add target entity if available
                if (entityInfo) {
                    auditData.targetEntity = entityInfo;
                }

                // Add error information if request failed
                if (res.statusCode >= 400) {
                    auditData.errorMessage = `Request failed with status ${res.statusCode}`;
                    auditData.riskLevel = 'medium';
                }

                await UnifiedAuditService.logActivity(auditData, req);
            } catch (error) {
                logger.error('Error logging audit activity:', error);
                // Don't throw - audit logging should not break application flow
            }
        });

        // Send original response
        return originalSend.call(this, data);
    };

    next();
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
        'password',
        'passwordHash',
        'resetToken',
        'verificationToken',
        'accessToken',
        'refreshToken',
        'cardNumber',
        'cvv',
        'pin',
    ];

    sensitiveFields.forEach((field) => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
}

export default unifiedAuditMiddleware;
