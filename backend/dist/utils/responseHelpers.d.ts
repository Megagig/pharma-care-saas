import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'DUPLICATE_RESOURCE' | 'PLAN_LIMIT_EXCEEDED' | 'TENANT_VIOLATION' | 'BUSINESS_RULE_VIOLATION' | 'SERVER_ERROR' | 'BAD_REQUEST' | 'SERVICE_UNAVAILABLE' | 'USER_FETCH_ERROR' | 'INVALID_USER_ID' | 'USER_NOT_FOUND' | 'USER_DETAIL_ERROR' | 'INVALID_ROLE_ID' | 'ROLE_NOT_FOUND' | 'ROLE_ALREADY_ASSIGNED' | 'ROLE_UPDATE_ERROR' | 'REASON_REQUIRED' | 'USER_ALREADY_SUSPENDED' | 'SUSPEND_ERROR' | 'USER_NOT_SUSPENDED' | 'REACTIVATE_ERROR' | 'INVALID_USER_IDS' | 'BULK_ASSIGN_ERROR' | 'IMPERSONATION_FORBIDDEN' | 'IMPERSONATION_ERROR' | 'STATISTICS_ERROR' | 'SEARCH_ERROR' | 'SUBSCRIPTION_ANALYTICS_ERROR' | 'PHARMACY_USAGE_ERROR' | 'CLINICAL_OUTCOMES_ERROR' | 'INVALID_FORMAT' | 'EXPORT_ERROR' | 'SCHEDULE_ERROR' | 'AUDIT_LOGS_ERROR' | 'AUDIT_SUMMARY_ERROR' | 'COMPLIANCE_REPORT_ERROR' | 'AUDIT_LOG_NOT_FOUND' | 'AUDIT_REVIEW_ERROR' | 'FLAGGED_LOGS_ERROR' | 'FEATURE_FLAGS_ERROR' | 'INVALID_FLAG_ID' | 'FLAG_NOT_FOUND' | 'INVALID_TARGETING_RULES' | 'TARGETING_UPDATE_ERROR' | 'USAGE_METRICS_ERROR' | 'FLAG_TOGGLE_ERROR' | 'NOTIFICATION_SETTINGS_ERROR' | 'NOTIFICATION_SETTINGS_UPDATE_ERROR' | 'NOTIFICATION_RULES_ERROR' | 'NOTIFICATION_SEND_ERROR' | 'NOTIFICATION_TEMPLATES_ERROR' | 'NOTIFICATION_HISTORY_ERROR' | 'NOTIFICATION_TEST_ERROR' | 'NOTIFICATION_STATS_ERROR' | 'OVERVIEW_ERROR' | 'RECENT_ACTIVITY_ERROR' | 'SYSTEM_HEALTH_ERROR' | 'SECURITY_SETTINGS_ERROR' | 'SECURITY_SETTINGS_UPDATE_ERROR' | 'ACTIVE_SESSIONS_ERROR' | 'SESSION_TERMINATION_ERROR' | 'SECURITY_LOGS_ERROR' | 'SECURITY_ALERTS_ERROR' | 'MFA_ENFORCEMENT_ERROR' | 'PASSWORD_POLICY_ERROR' | 'IMPACT_ANALYSIS_ERROR' | 'INVALID_FLAG_IDS' | 'INVALID_UPDATES' | 'BULK_UPDATE_ERROR' | 'ROLLOUT_STATUS_ERROR' | 'CHANNELS_ERROR' | 'CHANNEL_UPDATE_ERROR' | 'RULES_ERROR' | 'RULE_CREATE_ERROR' | 'RULE_NOT_FOUND' | 'RULE_UPDATE_ERROR' | 'RULE_DELETE_ERROR' | 'RULE_TOGGLE_ERROR' | 'TEMPLATES_ERROR' | 'TEMPLATE_CREATE_ERROR' | 'TEMPLATE_NOT_FOUND' | 'TEMPLATE_UPDATE_ERROR' | 'TEMPLATE_DELETE_ERROR' | 'HISTORY_ERROR' | 'TEST_NOTIFICATION_ERROR' | 'METRICS_ERROR' | 'HEALTH_CHECK_ERROR' | 'ACTIVITIES_ERROR' | 'PERFORMANCE_ERROR' | 'REFRESH_ERROR' | 'INVALID_PASSWORD_POLICY' | 'PASSWORD_POLICY_UPDATE_ERROR' | 'SESSIONS_ERROR' | 'INVALID_SESSION_ID' | 'SESSION_NOT_FOUND' | 'USER_ALREADY_LOCKED' | 'ACCOUNT_LOCK_ERROR' | 'USER_NOT_LOCKED' | 'ACCOUNT_UNLOCK_ERROR' | 'SECURITY_DASHBOARD_ERROR' | 'TICKET_CREATION_ERROR' | 'TICKETS_FETCH_ERROR' | 'TICKET_NOT_FOUND' | 'TICKET_FETCH_ERROR' | 'TICKET_ASSIGNMENT_ERROR' | 'TICKET_UPDATE_ERROR' | 'TICKET_ESCALATION_ERROR' | 'COMMENT_CREATION_ERROR' | 'COMMENTS_FETCH_ERROR' | 'ARTICLE_CREATION_ERROR' | 'ARTICLES_FETCH_ERROR' | 'ANALYTICS_ERROR';
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: ErrorCode;
        message: string;
        details?: any;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
        nextCursor?: string | null;
    };
    timestamp: string;
}
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, meta?: ApiResponse["meta"]) => void;
export declare const sendError: (res: Response, code: ErrorCode, message: string, statusCode?: number, details?: any) => void;
export declare const createPaginationMeta: (total: number, page: number, limit: number) => ApiResponse["meta"];
export declare class PatientManagementError extends Error {
    statusCode: number;
    code: ErrorCode;
    details?: any;
    constructor(message: string, statusCode?: number, code?: ErrorCode, details?: any);
}
export declare const createNotFoundError: (resource: string, identifier?: string) => PatientManagementError;
export declare const createValidationError: (message: string, details?: any) => PatientManagementError;
export declare const createForbiddenError: (message?: string) => PatientManagementError;
export declare const createPlanLimitError: (feature: string, current: number, limit: number) => PatientManagementError;
export declare const createTenantViolationError: () => PatientManagementError;
export declare const createDuplicateError: (resource: string, field?: string) => PatientManagementError;
export declare const createBusinessRuleError: (rule: string) => PatientManagementError;
export declare const patientManagementErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const checkTenantAccess: (resourceWorkplaceId: string, userWorkplaceId: string, isAdmin?: boolean, isSuperAdmin?: boolean) => void;
export declare const checkTenantAccessWithRequest: (resourceWorkplaceId: string, userWorkplaceId: string, isAdmin: boolean, req: AuthRequest) => void;
export declare const ensureResourceExists: <T>(resource: T | null, name: string, id?: string) => T;
export declare const validateBusinessRules: {
    validateBloodPressure: (systolic?: number, diastolic?: number) => void;
    validateMedicationDates: (startDate?: Date, endDate?: Date) => void;
    validateFollowUpDate: (followUpDate?: Date) => void;
    validatePatientAge: (dob?: Date, age?: number) => void;
};
export declare const respondWithPatient: (res: Response, patient: any, message?: string) => void;
export declare const respondWithPaginatedResults: <T>(res: Response, results: T[], total: number, page: number, limit: number, message?: string) => void;
export declare const isSuperAdmin: (req: AuthRequest) => boolean;
export declare const getRequestContext: (req: AuthRequest) => {
    userId: any;
    userRole: "pharmacist" | "pharmacy_team" | "pharmacy_outlet" | "intern_pharmacist" | "super_admin" | "owner";
    workplaceId: string;
    isAdmin: any;
    isSuperAdmin: boolean;
    canManage: any;
    timestamp: string;
};
export declare const createAuditLog: (action: string, resourceType: string, resourceId: string, context: ReturnType<typeof getRequestContext>, changes?: any) => {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: any;
    userRole: "pharmacist" | "pharmacy_team" | "pharmacy_outlet" | "intern_pharmacist" | "super_admin" | "owner";
    workplaceId: string;
    changes: any;
    timestamp: string;
};
//# sourceMappingURL=responseHelpers.d.ts.map