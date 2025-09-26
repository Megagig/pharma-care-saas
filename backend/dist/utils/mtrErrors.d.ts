export interface MTRErrorDetails {
    field?: string;
    message: string;
    value?: any;
    location?: string;
    code?: string;
}
export declare class MTRError extends Error {
    statusCode: number;
    errorType: string;
    details?: MTRErrorDetails[];
    timestamp: Date;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, errorType?: string, details?: MTRErrorDetails[]);
    toJSON(): {
        stack?: string | undefined;
        name: string;
        message: string;
        statusCode: number;
        errorType: string;
        details: MTRErrorDetails[] | undefined;
        timestamp: Date;
    };
}
export declare class MTRValidationError extends MTRError {
    constructor(message: string, details?: MTRErrorDetails[]);
}
export declare class MTRAuthorizationError extends MTRError {
    constructor(message: string, details?: MTRErrorDetails[]);
}
export declare class MTRAuthenticationError extends MTRError {
    constructor(message: string, details?: MTRErrorDetails[]);
}
export declare class MTRBusinessLogicError extends MTRError {
    constructor(message: string, details?: MTRErrorDetails[]);
}
export declare class MTRNotFoundError extends MTRError {
    constructor(message: string, resourceType?: string, resourceId?: string);
}
export declare class MTRConflictError extends MTRError {
    constructor(message: string, details?: MTRErrorDetails[]);
}
export declare class MTRDatabaseError extends MTRError {
    constructor(message: string, operation?: string, details?: MTRErrorDetails[]);
}
export declare class MTRExternalServiceError extends MTRError {
    constructor(message: string, service?: string, details?: MTRErrorDetails[]);
}
export declare class MTRRateLimitError extends MTRError {
    constructor(message: string, limit?: number, windowMs?: number);
}
export declare class MTRAuditError extends MTRError {
    constructor(message: string, auditAction?: string, details?: MTRErrorDetails[]);
}
export declare const createMTRValidationError: (field: string, message: string, value?: any) => MTRValidationError;
export declare const createMTRAuthorizationError: (action: string, resource?: string) => MTRAuthorizationError;
export declare const createMTRBusinessLogicError: (rule: string, context?: string) => MTRBusinessLogicError;
export declare const isMTRError: (error: any) => error is MTRError;
export declare const isMTRValidationError: (error: any) => error is MTRValidationError;
export declare const isMTRAuthorizationError: (error: any) => error is MTRAuthorizationError;
export declare const isMTRBusinessLogicError: (error: any) => error is MTRBusinessLogicError;
export declare enum MTRErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare const getMTRErrorSeverity: (error: MTRError) => MTRErrorSeverity;
export declare const getMTRErrorRecovery: (error: MTRError) => string[];
//# sourceMappingURL=mtrErrors.d.ts.map