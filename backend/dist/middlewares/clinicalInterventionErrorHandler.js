"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = exports.rateLimitErrorHandler = exports.asyncErrorHandler = exports.errorLoggingMiddleware = exports.clinicalInterventionErrorHandler = void 0;
const clinicalInterventionErrors_1 = require("../utils/clinicalInterventionErrors");
const logger_1 = __importDefault(require("../utils/logger"));
const clinicalInterventionErrorHandler = (error, req, res, next) => {
    const context = {
        userId: req.user?.id,
        workplaceId: req.user?.workplaceId,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] || generateRequestId()
    };
    if ((0, clinicalInterventionErrors_1.isClinicalInterventionError)(error)) {
        handleClinicalInterventionError(error, req, res, context);
        return;
    }
    const convertedError = convertToClinicalInterventionError(error);
    handleClinicalInterventionError(convertedError, req, res, context);
};
exports.clinicalInterventionErrorHandler = clinicalInterventionErrorHandler;
const handleClinicalInterventionError = (error, req, res, context) => {
    (0, clinicalInterventionErrors_1.trackError)(error, context);
    error.log(context.userId, context.endpoint, {
        workplaceId: context.workplaceId,
        method: context.method,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        requestId: context.requestId
    });
    const errorResponse = {
        ...error.toJSON(),
        requestId: context.requestId,
        timestamp: context.timestamp.toISOString()
    };
    if (error.recoveryAction !== clinicalInterventionErrors_1.RecoveryAction.NONE) {
        errorResponse.error.recoveryInstructions = getRecoveryInstructions(error.recoveryAction);
    }
    if (error.statusCode === 429) {
        const retryAfter = getRetryAfterSeconds(error);
        res.set('Retry-After', retryAfter.toString());
        errorResponse.error.retryAfter = retryAfter;
    }
    res.status(error.statusCode).json(errorResponse);
};
const convertToClinicalInterventionError = (error) => {
    if (error.name === 'ValidationError') {
        const mongooseError = error;
        const validationErrors = Object.values(mongooseError.errors).map((err) => ({
            field: err.path,
            message: err.message,
            value: err.value
        }));
        return new clinicalInterventionErrors_1.ClinicalInterventionError('VALIDATION_ERROR', 'Validation failed. Please check your input.', `Mongoose validation error: ${error.message}`, 400, clinicalInterventionErrors_1.ErrorSeverity.LOW, clinicalInterventionErrors_1.RecoveryAction.VALIDATE_INPUT, { validationErrors });
    }
    if (error.name === 'CastError') {
        const castError = error;
        return new clinicalInterventionErrors_1.ClinicalInterventionError('VALIDATION_ERROR', 'Invalid ID format provided.', `Invalid ObjectId: ${castError.value}`, 400, clinicalInterventionErrors_1.ErrorSeverity.LOW, clinicalInterventionErrors_1.RecoveryAction.VALIDATE_INPUT, { field: castError.path, value: castError.value });
    }
    if (error.code === 11000) {
        const duplicateError = error;
        const field = Object.keys(duplicateError.keyValue || {})[0] || 'unknown';
        return new clinicalInterventionErrors_1.ClinicalInterventionError('DUPLICATE_INTERVENTION', 'A record with this information already exists.', `Duplicate key error: ${error.message}`, 409, clinicalInterventionErrors_1.ErrorSeverity.MEDIUM, clinicalInterventionErrors_1.RecoveryAction.VALIDATE_INPUT, { field, value: duplicateError.keyValue?.[field] });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return new clinicalInterventionErrors_1.ClinicalInterventionError('PERMISSION_DENIED', 'Authentication failed. Please log in again.', `JWT error: ${error.message}`, 401, clinicalInterventionErrors_1.ErrorSeverity.HIGH, clinicalInterventionErrors_1.RecoveryAction.CHECK_PERMISSIONS);
    }
    if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        return new clinicalInterventionErrors_1.ClinicalInterventionError('NETWORK_ERROR', 'Network timeout occurred. Please try again.', `Network error: ${error.message}`, 503, clinicalInterventionErrors_1.ErrorSeverity.HIGH, clinicalInterventionErrors_1.RecoveryAction.RETRY);
    }
    if (error.message.includes('MongoError') || error.message.includes('connection')) {
        return new clinicalInterventionErrors_1.ClinicalInterventionError('DATABASE_ERROR', 'Database connection issue. Please try again later.', `Database error: ${error.message}`, 503, clinicalInterventionErrors_1.ErrorSeverity.CRITICAL, clinicalInterventionErrors_1.RecoveryAction.RETRY);
    }
    return new clinicalInterventionErrors_1.ClinicalInterventionError('UNKNOWN_ERROR', 'An unexpected error occurred. Please try again.', error.message, 500, clinicalInterventionErrors_1.ErrorSeverity.HIGH, clinicalInterventionErrors_1.RecoveryAction.CONTACT_SUPPORT, { originalError: error.name });
};
const getRecoveryInstructions = (action) => {
    switch (action) {
        case clinicalInterventionErrors_1.RecoveryAction.RETRY:
            return [
                'Wait a moment and try again',
                'Check your internet connection',
                'If the problem persists, contact support'
            ];
        case clinicalInterventionErrors_1.RecoveryAction.REFRESH:
            return [
                'Refresh the page and try again',
                'Make sure you have the latest data',
                'Check if the item still exists'
            ];
        case clinicalInterventionErrors_1.RecoveryAction.VALIDATE_INPUT:
            return [
                'Check your input for errors',
                'Make sure all required fields are filled',
                'Verify the data format is correct'
            ];
        case clinicalInterventionErrors_1.RecoveryAction.CHECK_PERMISSIONS:
            return [
                'Contact your administrator for access',
                'Make sure you have the required permissions',
                'Try logging out and back in'
            ];
        case clinicalInterventionErrors_1.RecoveryAction.CHECK_NETWORK:
            return [
                'Check your internet connection',
                'Try refreshing the page',
                'Contact IT support if connection issues persist'
            ];
        case clinicalInterventionErrors_1.RecoveryAction.CONTACT_SUPPORT:
            return [
                'Contact technical support',
                'Provide the error details and request ID',
                'Include steps to reproduce the issue'
            ];
        default:
            return [
                'Try the action again',
                'If the problem persists, contact support'
            ];
    }
};
const getRetryAfterSeconds = (error) => {
    let retryAfter = 60;
    switch (error.severity) {
        case clinicalInterventionErrors_1.ErrorSeverity.LOW:
            retryAfter = 30;
            break;
        case clinicalInterventionErrors_1.ErrorSeverity.MEDIUM:
            retryAfter = 60;
            break;
        case clinicalInterventionErrors_1.ErrorSeverity.HIGH:
            retryAfter = 120;
            break;
        case clinicalInterventionErrors_1.ErrorSeverity.CRITICAL:
            retryAfter = 300;
            break;
    }
    return retryAfter;
};
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
const errorLoggingMiddleware = (req, res, next) => {
    if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = generateRequestId();
    }
    logger_1.default.info('Request started', {
        requestId: req.headers['x-request-id'],
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        workplaceId: req.user?.workplaceId,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
    });
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.default.info('Request completed', {
            requestId: req.headers['x-request-id'],
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id,
            workplaceId: req.user?.workplaceId
        });
    });
    next();
};
exports.errorLoggingMiddleware = errorLoggingMiddleware;
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncErrorHandler = asyncErrorHandler;
const rateLimitErrorHandler = (req, res, next, options) => {
    const error = new clinicalInterventionErrors_1.ClinicalInterventionError('NETWORK_ERROR', 'Too many requests. Please slow down and try again later.', 'Rate limit exceeded', 429, clinicalInterventionErrors_1.ErrorSeverity.MEDIUM, clinicalInterventionErrors_1.RecoveryAction.RETRY, {
        windowMs: options.windowMs,
        maxRequests: options.max,
        retryAfter: Math.ceil(options.windowMs / 1000)
    });
    (0, exports.clinicalInterventionErrorHandler)(error, req, res, next);
};
exports.rateLimitErrorHandler = rateLimitErrorHandler;
const formatValidationErrors = (errors) => {
    return errors.map(error => ({
        field: error.path || error.param || error.field,
        message: error.msg || error.message,
        value: error.value,
        code: error.code || 'VALIDATION_ERROR'
    }));
};
exports.formatValidationErrors = formatValidationErrors;
exports.default = {
    clinicalInterventionErrorHandler: exports.clinicalInterventionErrorHandler,
    errorLoggingMiddleware: exports.errorLoggingMiddleware,
    asyncErrorHandler: exports.asyncErrorHandler,
    rateLimitErrorHandler: exports.rateLimitErrorHandler,
    formatValidationErrors: exports.formatValidationErrors
};
//# sourceMappingURL=clinicalInterventionErrorHandler.js.map