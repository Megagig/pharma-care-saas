"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.ConflictError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ManualLabError = void 0;
class ManualLabError extends Error {
    constructor(message, code, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ManualLabError';
    }
}
exports.ManualLabError = ManualLabError;
class ValidationError extends ManualLabError {
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR', 400, { field });
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ManualLabError {
    constructor(resource, id) {
        super(`${resource} not found${id ? `: ${id}` : ''}`, 'NOT_FOUND', 404);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ManualLabError {
    constructor(message = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED', 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ConflictError extends ManualLabError {
    constructor(message) {
        super(message, 'CONFLICT', 409);
    }
}
exports.ConflictError = ConflictError;
class ExternalServiceError extends ManualLabError {
    constructor(service, message) {
        super(`${service} service error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    }
}
exports.ExternalServiceError = ExternalServiceError;
//# sourceMappingURL=index.js.map