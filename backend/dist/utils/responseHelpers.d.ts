import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'DUPLICATE_RESOURCE' | 'PLAN_LIMIT_EXCEEDED' | 'TENANT_VIOLATION' | 'BUSINESS_RULE_VIOLATION' | 'SERVER_ERROR' | 'BAD_REQUEST' | 'SERVICE_UNAVAILABLE';
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
export declare const checkTenantAccessWithRequest: (resourceWorkplaceId: string, userWorkplaceId: string, isAdmin: boolean | undefined, req: AuthRequest) => void;
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
    userRole: "pharmacist" | "pharmacy_team" | "pharmacy_outlet" | "intern_pharmacist" | "super_admin" | "owner" | undefined;
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
    userRole: "pharmacist" | "pharmacy_team" | "pharmacy_outlet" | "intern_pharmacist" | "super_admin" | "owner" | undefined;
    workplaceId: string;
    changes: any;
    timestamp: string;
};
//# sourceMappingURL=responseHelpers.d.ts.map