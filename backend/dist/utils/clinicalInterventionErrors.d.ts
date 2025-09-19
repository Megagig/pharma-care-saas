export declare enum ClinicalInterventionErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    PATIENT_NOT_FOUND = "PATIENT_NOT_FOUND",
    INTERVENTION_NOT_FOUND = "INTERVENTION_NOT_FOUND",
    DUPLICATE_INTERVENTION = "DUPLICATE_INTERVENTION",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    STRATEGY_VALIDATION_ERROR = "STRATEGY_VALIDATION_ERROR",
    ASSIGNMENT_ERROR = "ASSIGNMENT_ERROR",
    OUTCOME_VALIDATION_ERROR = "OUTCOME_VALIDATION_ERROR",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INTEGRATION_ERROR = "INTEGRATION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RecoveryAction {
    RETRY = "RETRY",
    REFRESH = "REFRESH",
    CONTACT_SUPPORT = "CONTACT_SUPPORT",
    CHECK_PERMISSIONS = "CHECK_PERMISSIONS",
    VALIDATE_INPUT = "VALIDATE_INPUT",
    CHECK_NETWORK = "CHECK_NETWORK",
    NONE = "NONE"
}
export declare class ClinicalInterventionError extends Error {
    readonly errorType: ClinicalInterventionErrorType;
    readonly statusCode: number;
    readonly severity: ErrorSeverity;
    readonly recoveryAction: RecoveryAction;
    readonly details: Record<string, any>;
    readonly timestamp: Date;
    readonly userMessage: string;
    readonly technicalMessage: string;
    constructor(errorType: ClinicalInterventionErrorType, userMessage: string, technicalMessage?: string, statusCode?: number, severity?: ErrorSeverity, recoveryAction?: RecoveryAction, details?: Record<string, any>);
    toJSON(): {
        success: boolean;
        error: {
            technicalMessage?: string | undefined;
            stack?: string | undefined;
            type: ClinicalInterventionErrorType;
            message: string;
            severity: ErrorSeverity;
            recoveryAction: RecoveryAction;
            details: Record<string, any>;
            timestamp: string;
        };
    };
    log(userId?: string, endpoint?: string, additionalContext?: Record<string, any>): void;
}
export declare class ValidationError extends ClinicalInterventionError {
    constructor(message: string, field?: string, value?: any, details?: Record<string, any>);
}
export declare class PatientNotFoundError extends ClinicalInterventionError {
    constructor(patientId: string);
}
export declare class InterventionNotFoundError extends ClinicalInterventionError {
    constructor(interventionId: string);
}
export declare class DuplicateInterventionError extends ClinicalInterventionError {
    constructor(patientId: string, category: string, existingInterventions: string[]);
}
export declare class PermissionDeniedError extends ClinicalInterventionError {
    constructor(action: string, requiredRole?: string);
}
export declare class StrategyValidationError extends ClinicalInterventionError {
    constructor(message: string, strategyIndex?: number, details?: Record<string, any>);
}
export declare class AssignmentError extends ClinicalInterventionError {
    constructor(message: string, userId?: string, role?: string);
}
export declare class OutcomeValidationError extends ClinicalInterventionError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class BusinessRuleViolationError extends ClinicalInterventionError {
    constructor(rule: string, message: string, details?: Record<string, any>);
}
export declare class IntegrationError extends ClinicalInterventionError {
    constructor(service: string, message: string, details?: Record<string, any>);
}
export declare class NetworkError extends ClinicalInterventionError {
    constructor(message?: string);
}
export declare class DatabaseError extends ClinicalInterventionError {
    constructor(operation: string, message: string, details?: Record<string, any>);
}
export declare const isClinicalInterventionError: (error: any) => error is ClinicalInterventionError;
export declare const isValidationError: (error: any) => error is ValidationError;
export declare const isPermissionError: (error: any) => error is PermissionDeniedError;
export declare const isNetworkError: (error: any) => error is NetworkError;
export declare const createValidationError: (field: string, message: string, value?: any) => ValidationError;
export declare const createPermissionError: (action: string, requiredRole?: string) => PermissionDeniedError;
export declare const createNotFoundError: (type: "patient" | "intervention", id: string) => PatientNotFoundError | InterventionNotFoundError;
export declare const getRecoveryInstructions: (error: ClinicalInterventionError) => string[];
export declare const trackError: (error: ClinicalInterventionError, context?: Record<string, any>) => void;
declare const _default: {
    ClinicalInterventionError: typeof ClinicalInterventionError;
    ValidationError: typeof ValidationError;
    PatientNotFoundError: typeof PatientNotFoundError;
    InterventionNotFoundError: typeof InterventionNotFoundError;
    DuplicateInterventionError: typeof DuplicateInterventionError;
    PermissionDeniedError: typeof PermissionDeniedError;
    StrategyValidationError: typeof StrategyValidationError;
    AssignmentError: typeof AssignmentError;
    OutcomeValidationError: typeof OutcomeValidationError;
    BusinessRuleViolationError: typeof BusinessRuleViolationError;
    IntegrationError: typeof IntegrationError;
    NetworkError: typeof NetworkError;
    DatabaseError: typeof DatabaseError;
    isClinicalInterventionError: (error: any) => error is ClinicalInterventionError;
    isValidationError: (error: any) => error is ValidationError;
    isPermissionError: (error: any) => error is PermissionDeniedError;
    isNetworkError: (error: any) => error is NetworkError;
    createValidationError: (field: string, message: string, value?: any) => ValidationError;
    createPermissionError: (action: string, requiredRole?: string) => PermissionDeniedError;
    createNotFoundError: (type: "patient" | "intervention", id: string) => PatientNotFoundError | InterventionNotFoundError;
    getRecoveryInstructions: (error: ClinicalInterventionError) => string[];
    trackError: (error: ClinicalInterventionError, context?: Record<string, any>) => void;
};
export default _default;
//# sourceMappingURL=clinicalInterventionErrors.d.ts.map