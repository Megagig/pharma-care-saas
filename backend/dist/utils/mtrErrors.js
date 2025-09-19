"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMTRErrorRecovery = exports.getMTRErrorSeverity = exports.MTRErrorSeverity = exports.isMTRBusinessLogicError = exports.isMTRAuthorizationError = exports.isMTRValidationError = exports.isMTRError = exports.createMTRBusinessLogicError = exports.createMTRAuthorizationError = exports.createMTRValidationError = exports.MTRAuditError = exports.MTRRateLimitError = exports.MTRExternalServiceError = exports.MTRDatabaseError = exports.MTRConflictError = exports.MTRNotFoundError = exports.MTRBusinessLogicError = exports.MTRAuthenticationError = exports.MTRAuthorizationError = exports.MTRValidationError = exports.MTRError = void 0;
class MTRError extends Error {
    constructor(message, statusCode = 500, errorType = 'MTRError', details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.details = details;
        this.timestamp = new Date();
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            errorType: this.errorType,
            details: this.details,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
        };
    }
}
exports.MTRError = MTRError;
class MTRValidationError extends MTRError {
    constructor(message, details) {
        super(message, 400, 'MTRValidationError', details);
    }
}
exports.MTRValidationError = MTRValidationError;
class MTRAuthorizationError extends MTRError {
    constructor(message, details) {
        super(message, 403, 'MTRAuthorizationError', details);
    }
}
exports.MTRAuthorizationError = MTRAuthorizationError;
class MTRAuthenticationError extends MTRError {
    constructor(message, details) {
        super(message, 401, 'MTRAuthenticationError', details);
    }
}
exports.MTRAuthenticationError = MTRAuthenticationError;
class MTRBusinessLogicError extends MTRError {
    constructor(message, details) {
        super(message, 422, 'MTRBusinessLogicError', details);
    }
}
exports.MTRBusinessLogicError = MTRBusinessLogicError;
class MTRNotFoundError extends MTRError {
    constructor(message, resourceType, resourceId) {
        const details = [];
        if (resourceType) {
            details.push({
                field: 'resourceType',
                message: `${resourceType} not found`,
                value: resourceType
            });
        }
        if (resourceId) {
            details.push({
                field: 'resourceId',
                message: 'Resource ID not found',
                value: resourceId
            });
        }
        super(message, 404, 'MTRNotFoundError', details);
    }
}
exports.MTRNotFoundError = MTRNotFoundError;
class MTRConflictError extends MTRError {
    constructor(message, details) {
        super(message, 409, 'MTRConflictError', details);
    }
}
exports.MTRConflictError = MTRConflictError;
class MTRDatabaseError extends MTRError {
    constructor(message, operation, details) {
        const errorDetails = details || [];
        if (operation) {
            errorDetails.push({
                field: 'operation',
                message: `Database operation failed: ${operation}`,
                value: operation
            });
        }
        super(message, 500, 'MTRDatabaseError', errorDetails);
    }
}
exports.MTRDatabaseError = MTRDatabaseError;
class MTRExternalServiceError extends MTRError {
    constructor(message, service, details) {
        const errorDetails = details || [];
        if (service) {
            errorDetails.push({
                field: 'service',
                message: `External service error: ${service}`,
                value: service
            });
        }
        super(message, 502, 'MTRExternalServiceError', errorDetails);
    }
}
exports.MTRExternalServiceError = MTRExternalServiceError;
class MTRRateLimitError extends MTRError {
    constructor(message, limit, windowMs) {
        const details = [];
        if (limit) {
            details.push({
                field: 'limit',
                message: `Rate limit exceeded: ${limit} requests`,
                value: limit
            });
        }
        if (windowMs) {
            details.push({
                field: 'windowMs',
                message: `Rate limit window: ${windowMs}ms`,
                value: windowMs
            });
        }
        super(message, 429, 'MTRRateLimitError', details);
    }
}
exports.MTRRateLimitError = MTRRateLimitError;
class MTRAuditError extends MTRError {
    constructor(message, auditAction, details) {
        const errorDetails = details || [];
        if (auditAction) {
            errorDetails.push({
                field: 'auditAction',
                message: `Audit logging failed for action: ${auditAction}`,
                value: auditAction
            });
        }
        super(message, 500, 'MTRAuditError', errorDetails);
    }
}
exports.MTRAuditError = MTRAuditError;
const createMTRValidationError = (field, message, value) => {
    return new MTRValidationError('Validation failed', [{
            field,
            message,
            value
        }]);
};
exports.createMTRValidationError = createMTRValidationError;
const createMTRAuthorizationError = (action, resource) => {
    const message = resource
        ? `Insufficient permissions to ${action} ${resource}`
        : `Insufficient permissions to ${action}`;
    return new MTRAuthorizationError(message, [{
            field: 'action',
            message: `Action not authorized: ${action}`,
            value: action
        }]);
};
exports.createMTRAuthorizationError = createMTRAuthorizationError;
const createMTRBusinessLogicError = (rule, context) => {
    const message = context
        ? `Business rule violation: ${rule} in ${context}`
        : `Business rule violation: ${rule}`;
    return new MTRBusinessLogicError(message, [{
            field: 'businessRule',
            message: `Rule violated: ${rule}`,
            value: rule
        }]);
};
exports.createMTRBusinessLogicError = createMTRBusinessLogicError;
const isMTRError = (error) => {
    return error instanceof MTRError;
};
exports.isMTRError = isMTRError;
const isMTRValidationError = (error) => {
    return error instanceof MTRValidationError;
};
exports.isMTRValidationError = isMTRValidationError;
const isMTRAuthorizationError = (error) => {
    return error instanceof MTRAuthorizationError;
};
exports.isMTRAuthorizationError = isMTRAuthorizationError;
const isMTRBusinessLogicError = (error) => {
    return error instanceof MTRBusinessLogicError;
};
exports.isMTRBusinessLogicError = isMTRBusinessLogicError;
var MTRErrorSeverity;
(function (MTRErrorSeverity) {
    MTRErrorSeverity["LOW"] = "low";
    MTRErrorSeverity["MEDIUM"] = "medium";
    MTRErrorSeverity["HIGH"] = "high";
    MTRErrorSeverity["CRITICAL"] = "critical";
})(MTRErrorSeverity || (exports.MTRErrorSeverity = MTRErrorSeverity = {}));
const getMTRErrorSeverity = (error) => {
    if (error.statusCode >= 500) {
        return MTRErrorSeverity.CRITICAL;
    }
    if (error instanceof MTRAuthorizationError || error instanceof MTRAuthenticationError) {
        return MTRErrorSeverity.HIGH;
    }
    if (error instanceof MTRBusinessLogicError) {
        return MTRErrorSeverity.MEDIUM;
    }
    return MTRErrorSeverity.LOW;
};
exports.getMTRErrorSeverity = getMTRErrorSeverity;
const getMTRErrorRecovery = (error) => {
    const suggestions = [];
    if (error instanceof MTRValidationError) {
        suggestions.push('Check input data format and required fields');
        suggestions.push('Verify all medication details are complete');
        suggestions.push('Ensure dates are in valid format');
    }
    if (error instanceof MTRAuthorizationError) {
        suggestions.push('Verify your pharmacist credentials');
        suggestions.push('Check your license status');
        suggestions.push('Contact your administrator for access');
    }
    if (error instanceof MTRBusinessLogicError) {
        suggestions.push('Review MTR workflow requirements');
        suggestions.push('Complete previous steps before proceeding');
        suggestions.push('Verify therapy plan links to identified problems');
    }
    if (error instanceof MTRDatabaseError) {
        suggestions.push('Try the operation again');
        suggestions.push('Check your network connection');
        suggestions.push('Contact support if the issue persists');
    }
    return suggestions;
};
exports.getMTRErrorRecovery = getMTRErrorRecovery;
//# sourceMappingURL=mtrErrors.js.map