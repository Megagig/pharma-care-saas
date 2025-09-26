"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackError = exports.getRecoveryInstructions = exports.createNotFoundError = exports.createPermissionError = exports.createValidationError = exports.isNetworkError = exports.isPermissionError = exports.isValidationError = exports.isClinicalInterventionError = exports.DatabaseError = exports.NetworkError = exports.IntegrationError = exports.BusinessRuleViolationError = exports.OutcomeValidationError = exports.AssignmentError = exports.StrategyValidationError = exports.PermissionDeniedError = exports.DuplicateInterventionError = exports.InterventionNotFoundError = exports.PatientNotFoundError = exports.ValidationError = exports.ClinicalInterventionError = exports.RecoveryAction = exports.ErrorSeverity = exports.ClinicalInterventionErrorType = void 0;
const logger_1 = __importDefault(require("./logger"));
var ClinicalInterventionErrorType;
(function (ClinicalInterventionErrorType) {
    ClinicalInterventionErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ClinicalInterventionErrorType["PATIENT_NOT_FOUND"] = "PATIENT_NOT_FOUND";
    ClinicalInterventionErrorType["INTERVENTION_NOT_FOUND"] = "INTERVENTION_NOT_FOUND";
    ClinicalInterventionErrorType["DUPLICATE_INTERVENTION"] = "DUPLICATE_INTERVENTION";
    ClinicalInterventionErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ClinicalInterventionErrorType["STRATEGY_VALIDATION_ERROR"] = "STRATEGY_VALIDATION_ERROR";
    ClinicalInterventionErrorType["ASSIGNMENT_ERROR"] = "ASSIGNMENT_ERROR";
    ClinicalInterventionErrorType["OUTCOME_VALIDATION_ERROR"] = "OUTCOME_VALIDATION_ERROR";
    ClinicalInterventionErrorType["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ClinicalInterventionErrorType["INTEGRATION_ERROR"] = "INTEGRATION_ERROR";
    ClinicalInterventionErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ClinicalInterventionErrorType["DATABASE_ERROR"] = "DATABASE_ERROR";
    ClinicalInterventionErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ClinicalInterventionErrorType || (exports.ClinicalInterventionErrorType = ClinicalInterventionErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var RecoveryAction;
(function (RecoveryAction) {
    RecoveryAction["RETRY"] = "RETRY";
    RecoveryAction["REFRESH"] = "REFRESH";
    RecoveryAction["CONTACT_SUPPORT"] = "CONTACT_SUPPORT";
    RecoveryAction["CHECK_PERMISSIONS"] = "CHECK_PERMISSIONS";
    RecoveryAction["VALIDATE_INPUT"] = "VALIDATE_INPUT";
    RecoveryAction["CHECK_NETWORK"] = "CHECK_NETWORK";
    RecoveryAction["NONE"] = "NONE";
})(RecoveryAction || (exports.RecoveryAction = RecoveryAction = {}));
class ClinicalInterventionError extends Error {
    constructor(errorType, userMessage, technicalMessage, statusCode = 400, severity = ErrorSeverity.MEDIUM, recoveryAction = RecoveryAction.NONE, details = {}) {
        super(technicalMessage || userMessage);
        this.name = 'ClinicalInterventionError';
        this.errorType = errorType;
        this.statusCode = statusCode;
        this.severity = severity;
        this.recoveryAction = recoveryAction;
        this.details = details;
        this.timestamp = new Date();
        this.userMessage = userMessage;
        this.technicalMessage = technicalMessage || userMessage;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            success: false,
            error: {
                type: this.errorType,
                message: this.userMessage,
                severity: this.severity,
                recoveryAction: this.recoveryAction,
                details: this.details,
                timestamp: this.timestamp.toISOString(),
                ...(process.env.NODE_ENV === 'development' && {
                    technicalMessage: this.technicalMessage,
                    stack: this.stack
                })
            }
        };
    }
    log(userId, endpoint, additionalContext) {
        const logLevel = this.severity === ErrorSeverity.CRITICAL ? 'error' :
            this.severity === ErrorSeverity.HIGH ? 'warn' : 'info';
        logger_1.default[logLevel]('Clinical Intervention Error', {
            errorType: this.errorType,
            userMessage: this.userMessage,
            technicalMessage: this.technicalMessage,
            statusCode: this.statusCode,
            severity: this.severity,
            recoveryAction: this.recoveryAction,
            details: this.details,
            userId,
            endpoint,
            timestamp: this.timestamp,
            ...additionalContext,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
        });
    }
}
exports.ClinicalInterventionError = ClinicalInterventionError;
class ValidationError extends ClinicalInterventionError {
    constructor(message, field, value, details = {}) {
        super(ClinicalInterventionErrorType.VALIDATION_ERROR, message, `Validation failed for field: ${field}`, 400, ErrorSeverity.LOW, RecoveryAction.VALIDATE_INPUT, { field, value, ...details });
    }
}
exports.ValidationError = ValidationError;
class PatientNotFoundError extends ClinicalInterventionError {
    constructor(patientId) {
        super(ClinicalInterventionErrorType.PATIENT_NOT_FOUND, 'The selected patient was not found or you do not have access to their records', `Patient with ID ${patientId} not found`, 404, ErrorSeverity.MEDIUM, RecoveryAction.REFRESH, { patientId });
    }
}
exports.PatientNotFoundError = PatientNotFoundError;
class InterventionNotFoundError extends ClinicalInterventionError {
    constructor(interventionId) {
        super(ClinicalInterventionErrorType.INTERVENTION_NOT_FOUND, 'The requested intervention was not found', `Intervention with ID ${interventionId} not found`, 404, ErrorSeverity.MEDIUM, RecoveryAction.REFRESH, { interventionId });
    }
}
exports.InterventionNotFoundError = InterventionNotFoundError;
class DuplicateInterventionError extends ClinicalInterventionError {
    constructor(patientId, category, existingInterventions) {
        super(ClinicalInterventionErrorType.DUPLICATE_INTERVENTION, 'A similar intervention already exists for this patient and category', `Duplicate intervention detected for patient ${patientId} in category ${category}`, 409, ErrorSeverity.MEDIUM, RecoveryAction.VALIDATE_INPUT, { patientId, category, existingInterventions });
    }
}
exports.DuplicateInterventionError = DuplicateInterventionError;
class PermissionDeniedError extends ClinicalInterventionError {
    constructor(action, requiredRole) {
        super(ClinicalInterventionErrorType.PERMISSION_DENIED, 'You do not have permission to perform this action', `Permission denied for action: ${action}`, 403, ErrorSeverity.HIGH, RecoveryAction.CHECK_PERMISSIONS, { action, requiredRole });
    }
}
exports.PermissionDeniedError = PermissionDeniedError;
class StrategyValidationError extends ClinicalInterventionError {
    constructor(message, strategyIndex, details = {}) {
        super(ClinicalInterventionErrorType.STRATEGY_VALIDATION_ERROR, message, `Strategy validation failed: ${message}`, 400, ErrorSeverity.LOW, RecoveryAction.VALIDATE_INPUT, { strategyIndex, ...details });
    }
}
exports.StrategyValidationError = StrategyValidationError;
class AssignmentError extends ClinicalInterventionError {
    constructor(message, userId, role) {
        super(ClinicalInterventionErrorType.ASSIGNMENT_ERROR, message, `Team assignment failed: ${message}`, 400, ErrorSeverity.MEDIUM, RecoveryAction.CHECK_PERMISSIONS, { userId, role });
    }
}
exports.AssignmentError = AssignmentError;
class OutcomeValidationError extends ClinicalInterventionError {
    constructor(message, details = {}) {
        super(ClinicalInterventionErrorType.OUTCOME_VALIDATION_ERROR, message, `Outcome validation failed: ${message}`, 400, ErrorSeverity.LOW, RecoveryAction.VALIDATE_INPUT, details);
    }
}
exports.OutcomeValidationError = OutcomeValidationError;
class BusinessRuleViolationError extends ClinicalInterventionError {
    constructor(rule, message, details = {}) {
        super(ClinicalInterventionErrorType.BUSINESS_RULE_VIOLATION, message, `Business rule violation: ${rule}`, 400, ErrorSeverity.MEDIUM, RecoveryAction.VALIDATE_INPUT, { rule, ...details });
    }
}
exports.BusinessRuleViolationError = BusinessRuleViolationError;
class IntegrationError extends ClinicalInterventionError {
    constructor(service, message, details = {}) {
        super(ClinicalInterventionErrorType.INTEGRATION_ERROR, `Integration with ${service} failed. Please try again later.`, `Integration error with ${service}: ${message}`, 502, ErrorSeverity.HIGH, RecoveryAction.RETRY, { service, ...details });
    }
}
exports.IntegrationError = IntegrationError;
class NetworkError extends ClinicalInterventionError {
    constructor(message = 'Network connection failed') {
        super(ClinicalInterventionErrorType.NETWORK_ERROR, 'Network connection failed. Please check your internet connection and try again.', message, 503, ErrorSeverity.HIGH, RecoveryAction.CHECK_NETWORK);
    }
}
exports.NetworkError = NetworkError;
class DatabaseError extends ClinicalInterventionError {
    constructor(operation, message, details = {}) {
        super(ClinicalInterventionErrorType.DATABASE_ERROR, 'A database error occurred. Please try again later.', `Database error during ${operation}: ${message}`, 500, ErrorSeverity.CRITICAL, RecoveryAction.RETRY, { operation, ...details });
    }
}
exports.DatabaseError = DatabaseError;
const isClinicalInterventionError = (error) => {
    return error instanceof ClinicalInterventionError;
};
exports.isClinicalInterventionError = isClinicalInterventionError;
const isValidationError = (error) => {
    return error instanceof ValidationError;
};
exports.isValidationError = isValidationError;
const isPermissionError = (error) => {
    return error instanceof PermissionDeniedError;
};
exports.isPermissionError = isPermissionError;
const isNetworkError = (error) => {
    return error instanceof NetworkError;
};
exports.isNetworkError = isNetworkError;
const createValidationError = (field, message, value) => {
    return new ValidationError(message, field, value);
};
exports.createValidationError = createValidationError;
const createPermissionError = (action, requiredRole) => {
    return new PermissionDeniedError(action, requiredRole);
};
exports.createPermissionError = createPermissionError;
const createNotFoundError = (type, id) => {
    return type === 'patient'
        ? new PatientNotFoundError(id)
        : new InterventionNotFoundError(id);
};
exports.createNotFoundError = createNotFoundError;
const getRecoveryInstructions = (error) => {
    switch (error.recoveryAction) {
        case RecoveryAction.RETRY:
            return [
                'Wait a moment and try again',
                'Check your internet connection',
                'If the problem persists, contact support'
            ];
        case RecoveryAction.REFRESH:
            return [
                'Refresh the page and try again',
                'Make sure you have the latest data',
                'Check if the item still exists'
            ];
        case RecoveryAction.VALIDATE_INPUT:
            return [
                'Check your input for errors',
                'Make sure all required fields are filled',
                'Verify the data format is correct'
            ];
        case RecoveryAction.CHECK_PERMISSIONS:
            return [
                'Contact your administrator for access',
                'Make sure you have the required permissions',
                'Try logging out and back in'
            ];
        case RecoveryAction.CHECK_NETWORK:
            return [
                'Check your internet connection',
                'Try refreshing the page',
                'Contact IT support if connection issues persist'
            ];
        case RecoveryAction.CONTACT_SUPPORT:
            return [
                'Contact technical support',
                'Provide the error details and timestamp',
                'Include steps to reproduce the issue'
            ];
        default:
            return [
                'Try the action again',
                'If the problem persists, contact support'
            ];
    }
};
exports.getRecoveryInstructions = getRecoveryInstructions;
const trackError = (error, context = {}) => {
    error.log(context.userId, context.endpoint, context);
    if (process.env.NODE_ENV === 'production') {
    }
};
exports.trackError = trackError;
exports.default = {
    ClinicalInterventionError,
    ValidationError,
    PatientNotFoundError,
    InterventionNotFoundError,
    DuplicateInterventionError,
    PermissionDeniedError,
    StrategyValidationError,
    AssignmentError,
    OutcomeValidationError,
    BusinessRuleViolationError,
    IntegrationError,
    NetworkError,
    DatabaseError,
    isClinicalInterventionError: exports.isClinicalInterventionError,
    isValidationError: exports.isValidationError,
    isPermissionError: exports.isPermissionError,
    isNetworkError: exports.isNetworkError,
    createValidationError: exports.createValidationError,
    createPermissionError: exports.createPermissionError,
    createNotFoundError: exports.createNotFoundError,
    getRecoveryInstructions: exports.getRecoveryInstructions,
    trackError: exports.trackError
};
//# sourceMappingURL=clinicalInterventionErrors.js.map