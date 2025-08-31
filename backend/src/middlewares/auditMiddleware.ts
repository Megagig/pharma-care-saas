import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AuditService from '../services/auditService';
import { AuthRequest } from './auth';

/**
 * Audit Middleware
 * Automatically logs MTR activities for compliance tracking
 */

interface AuditableRequest extends AuthRequest {
    auditData?: {
        action?: string;
        resourceType?: string;
        resourceId?: string;
        patientId?: string;
        reviewId?: string;
        oldValues?: any;
        newValues?: any;
        details?: any;
        complianceCategory?: string;
        riskLevel?: string;
    };
    startTime?: number;
}

/**
 * Middleware to capture request start time for duration tracking
 */
export const auditTimer = (req: AuditableRequest, res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    next();
};

/**
 * Middleware to automatically log MTR activities
 */
export const auditLogger = (options: {
    action?: string;
    resourceType?: string;
    complianceCategory?: string;
    riskLevel?: string;
    skipSuccessLog?: boolean;
} = {}) => {
    return async (req: AuditableRequest, res: Response, next: NextFunction) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        let responseData: any;
        let statusCode: number;

        // Override res.json to capture response data
        res.json = function (data: any) {
            responseData = data;
            statusCode = res.statusCode;
            return originalJson.call(this, data);
        };

        // Store original res.status to capture status code
        const originalStatus = res.status;
        res.status = function (code: number) {
            statusCode = code;
            return originalStatus.call(this, code);
        };

        // Continue with the request
        next();

        // Log after response is sent
        res.on('finish', async () => {
            try {
                // Skip logging if user is not authenticated
                if (!req.user) return;

                const context = AuditService.createAuditContext(req);
                const duration = req.startTime ? Date.now() - req.startTime : undefined;

                // Determine action from request or options
                const action = req.auditData?.action ||
                    options.action ||
                    generateActionFromRequest(req);

                // Determine resource type
                const resourceType = req.auditData?.resourceType ||
                    options.resourceType ||
                    determineResourceType(req.path);

                // Skip logging for certain actions if specified
                if (options.skipSuccessLog && statusCode >= 200 && statusCode < 300) {
                    return;
                }

                // Prepare audit data
                const resourceIdStr = req.auditData?.resourceId ||
                    req.params.id ||
                    req.params.patientId ||
                    req.params.reviewId ||
                    context.userId.toString();

                const complianceCategory = req.auditData?.complianceCategory || options.complianceCategory;
                const riskLevel = req.auditData?.riskLevel || options.riskLevel;

                const auditData = {
                    action,
                    resourceType: resourceType as any,
                    resourceId: new mongoose.Types.ObjectId(resourceIdStr),
                    patientId: req.auditData?.patientId ? new mongoose.Types.ObjectId(req.auditData.patientId) :
                        req.params.patientId ? new mongoose.Types.ObjectId(req.params.patientId) : undefined,
                    reviewId: req.auditData?.reviewId ? new mongoose.Types.ObjectId(req.auditData.reviewId) :
                        req.params.id ? new mongoose.Types.ObjectId(req.params.id) : undefined,
                    oldValues: req.auditData?.oldValues,
                    newValues: req.auditData?.newValues,
                    details: {
                        ...req.auditData?.details,
                        requestBody: sanitizeRequestBody(req.body),
                        queryParams: req.query,
                        statusCode,
                        success: statusCode >= 200 && statusCode < 300,
                    },
                    errorMessage: statusCode >= 400 ? getErrorMessage(responseData) : undefined,
                    duration,
                    complianceCategory: complianceCategory as 'clinical_documentation' | 'patient_safety' | 'data_access' | 'system_security' | 'workflow_compliance' | undefined,
                    riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical' | undefined,
                };

                // Log the activity
                await AuditService.logActivity(context, auditData);
            } catch (error) {
                console.error('Failed to log audit activity:', error);
                // Don't throw error to avoid breaking the main request flow
            }
        });
    };
};

/**
 * Middleware specifically for MTR session activities
 */
export const auditMTRActivity = (action: string) => {
    return auditLogger({
        action,
        resourceType: 'MedicationTherapyReview',
        complianceCategory: 'clinical_documentation',
    });
};

/**
 * Middleware for patient data access
 */
export const auditPatientAccess = (action: string) => {
    return auditLogger({
        action,
        resourceType: 'Patient',
        complianceCategory: 'data_access',
        riskLevel: 'medium',
    });
};

/**
 * Middleware for high-risk activities
 */
export const auditHighRiskActivity = (action: string, resourceType: string) => {
    return auditLogger({
        action,
        resourceType,
        riskLevel: 'high',
        complianceCategory: 'system_security',
    });
};

/**
 * Helper function to set audit data on request
 */
export const setAuditData = (
    req: AuditableRequest,
    data: Partial<AuditableRequest['auditData']>
) => {
    req.auditData = { ...req.auditData, ...data };
};

/**
 * Helper functions
 */
function generateActionFromRequest(req: Request): string {
    const method = req.method;
    const path = req.path;

    // MTR-specific actions
    if (path.includes('/mtr')) {
        if (method === 'POST' && path.endsWith('/mtr')) return 'CREATE_MTR_SESSION';
        if (method === 'PUT' && path.includes('/mtr/')) return 'UPDATE_MTR_SESSION';
        if (method === 'DELETE' && path.includes('/mtr/')) return 'DELETE_MTR_SESSION';
        if (method === 'GET' && path.includes('/mtr/')) return 'VIEW_MTR_SESSION';
        if (path.includes('/problems')) {
            if (method === 'POST') return 'CREATE_MTR_PROBLEM';
            if (method === 'PUT') return 'UPDATE_MTR_PROBLEM';
            if (method === 'DELETE') return 'DELETE_MTR_PROBLEM';
            return 'VIEW_MTR_PROBLEMS';
        }
        if (path.includes('/interventions')) {
            if (method === 'POST') return 'CREATE_MTR_INTERVENTION';
            if (method === 'PUT') return 'UPDATE_MTR_INTERVENTION';
            if (method === 'DELETE') return 'DELETE_MTR_INTERVENTION';
            return 'VIEW_MTR_INTERVENTIONS';
        }
        if (path.includes('/followups')) {
            if (method === 'POST') return 'CREATE_MTR_FOLLOWUP';
            if (method === 'PUT') return 'UPDATE_MTR_FOLLOWUP';
            if (method === 'DELETE') return 'DELETE_MTR_FOLLOWUP';
            return 'VIEW_MTR_FOLLOWUPS';
        }
    }

    // Patient-specific actions
    if (path.includes('/patients')) {
        if (method === 'POST') return 'CREATE_PATIENT';
        if (method === 'PUT') return 'UPDATE_PATIENT';
        if (method === 'DELETE') return 'DELETE_PATIENT';
        return 'VIEW_PATIENT';
    }

    // Auth actions
    if (path.includes('/auth')) {
        if (path.includes('/login')) return 'LOGIN';
        if (path.includes('/logout')) return 'LOGOUT';
        if (path.includes('/register')) return 'REGISTER';
    }

    // Audit actions
    if (path.includes('/audit')) {
        if (path.includes('/export')) return 'EXPORT_AUDIT_DATA';
        if (path.includes('/compliance-report')) return 'ACCESS_COMPLIANCE_REPORT';
        return 'VIEW_AUDIT_LOGS';
    }

    // Generic actions
    return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function determineResourceType(path: string): string {
    if (path.includes('/mtr')) return 'MedicationTherapyReview';
    if (path.includes('/patients')) return 'Patient';
    if (path.includes('/users')) return 'User';
    if (path.includes('/audit')) return 'User'; // Audit actions are user-related
    return 'User'; // Default fallback
}

function sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    // Limit size to prevent large payloads in audit logs
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 5000) {
        return { _truncated: true, _originalSize: jsonString.length };
    }

    return sanitized;
}

function getErrorMessage(responseData: any): string | undefined {
    if (!responseData) return undefined;

    if (typeof responseData === 'string') return responseData;
    if (responseData.message) return responseData.message;
    if (responseData.error) return responseData.error;
    if (responseData.errors && Array.isArray(responseData.errors)) {
        return responseData.errors.join(', ');
    }

    return 'Unknown error';
}

export default {
    auditTimer,
    auditLogger,
    auditMTRActivity,
    auditPatientAccess,
    auditHighRiskActivity,
    setAuditData,
};