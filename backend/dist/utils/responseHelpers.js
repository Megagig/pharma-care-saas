"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = exports.getRequestContext = exports.respondWithPaginatedResults = exports.respondWithPatient = exports.validateBusinessRules = exports.ensureResourceExists = exports.checkTenantAccess = exports.asyncHandler = exports.patientManagementErrorHandler = exports.createBusinessRuleError = exports.createDuplicateError = exports.createTenantViolationError = exports.createPlanLimitError = exports.createForbiddenError = exports.createValidationError = exports.createNotFoundError = exports.PatientManagementError = exports.createPaginationMeta = exports.sendError = exports.sendSuccess = void 0;
const zod_1 = require("zod");
const sendSuccess = (res, data, message, statusCode = 200, meta) => {
    const response = {
        success: true,
        message: message || 'Operation successful',
        data,
        meta,
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, code, message, statusCode = 400, details) => {
    const response = {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const createPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};
exports.createPaginationMeta = createPaginationMeta;
class PatientManagementError extends Error {
    constructor(message, statusCode = 400, code = 'BAD_REQUEST', details) {
        super(message);
        this.name = 'PatientManagementError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.PatientManagementError = PatientManagementError;
const createNotFoundError = (resource, identifier) => new PatientManagementError(`${resource}${identifier ? ` with ID ${identifier}` : ''} not found`, 404, 'NOT_FOUND');
exports.createNotFoundError = createNotFoundError;
const createValidationError = (message, details) => new PatientManagementError(message, 422, 'VALIDATION_ERROR', details);
exports.createValidationError = createValidationError;
const createForbiddenError = (message = 'Access forbidden') => new PatientManagementError(message, 403, 'FORBIDDEN');
exports.createForbiddenError = createForbiddenError;
const createPlanLimitError = (feature, current, limit) => new PatientManagementError(`${feature} limit exceeded. Current: ${current}, Limit: ${limit}`, 402, 'PLAN_LIMIT_EXCEEDED', { current, limit, feature });
exports.createPlanLimitError = createPlanLimitError;
const createTenantViolationError = () => new PatientManagementError('Access denied: Resource belongs to different pharmacy', 403, 'TENANT_VIOLATION');
exports.createTenantViolationError = createTenantViolationError;
const createDuplicateError = (resource, field) => new PatientManagementError(`${resource} already exists${field ? ` with this ${field}` : ''}`, 409, 'DUPLICATE_RESOURCE');
exports.createDuplicateError = createDuplicateError;
const createBusinessRuleError = (rule) => new PatientManagementError(`Business rule violation: ${rule}`, 400, 'BUSINESS_RULE_VIOLATION');
exports.createBusinessRuleError = createBusinessRuleError;
const patientManagementErrorHandler = (error, req, res, next) => {
    console.error('Patient Management Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        user: req.user?.id,
        timestamp: new Date().toISOString(),
    });
    if (error instanceof PatientManagementError) {
        (0, exports.sendError)(res, error.code, error.message, error.statusCode, error.details);
        return;
    }
    if (error instanceof zod_1.ZodError) {
        const details = error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
        }));
        (0, exports.sendError)(res, 'VALIDATION_ERROR', 'Validation failed', 422, details);
        return;
    }
    if (error.name === 'ValidationError') {
        const mongooseError = error;
        const details = Object.values(mongooseError.errors || {}).map((err) => ({
            field: err.path,
            message: err.message,
        }));
        (0, exports.sendError)(res, 'VALIDATION_ERROR', 'Database validation failed', 422, details);
        return;
    }
    if (error.name === 'CastError') {
        (0, exports.sendError)(res, 'BAD_REQUEST', 'Invalid ID format', 400);
        return;
    }
    if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyValue || {})[0];
        (0, exports.sendError)(res, 'DUPLICATE_RESOURCE', `Resource already exists${duplicateField ? ` with this ${duplicateField}` : ''}`, 409);
        return;
    }
    if (error.name === 'JsonWebTokenError') {
        (0, exports.sendError)(res, 'UNAUTHORIZED', 'Invalid token', 401);
        return;
    }
    if (error.name === 'TokenExpiredError') {
        (0, exports.sendError)(res, 'UNAUTHORIZED', 'Token expired', 401);
        return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
        (0, exports.sendError)(res, 'BAD_REQUEST', 'Invalid JSON format in request body', 400);
        return;
    }
    (0, exports.sendError)(res, 'SERVER_ERROR', 'Internal server error', 500);
};
exports.patientManagementErrorHandler = patientManagementErrorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const checkTenantAccess = (resourceWorkplaceId, userWorkplaceId, isAdmin = false) => {
    if (!isAdmin && resourceWorkplaceId !== userWorkplaceId) {
        throw (0, exports.createTenantViolationError)();
    }
};
exports.checkTenantAccess = checkTenantAccess;
const ensureResourceExists = (resource, name, id) => {
    if (!resource) {
        throw (0, exports.createNotFoundError)(name, id);
    }
    return resource;
};
exports.ensureResourceExists = ensureResourceExists;
exports.validateBusinessRules = {
    validateBloodPressure: (systolic, diastolic) => {
        if (systolic && diastolic && systolic <= diastolic) {
            throw (0, exports.createBusinessRuleError)('Systolic blood pressure must be higher than diastolic');
        }
    },
    validateMedicationDates: (startDate, endDate) => {
        if (startDate && endDate && startDate > endDate) {
            throw (0, exports.createBusinessRuleError)('Medication start date cannot be after end date');
        }
    },
    validateFollowUpDate: (followUpDate) => {
        if (followUpDate && followUpDate <= new Date()) {
            throw (0, exports.createBusinessRuleError)('Follow-up date must be in the future');
        }
    },
    validatePatientAge: (dob, age) => {
        if (dob && age) {
            const calculatedAge = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            if (Math.abs(calculatedAge - age) > 1) {
                throw (0, exports.createBusinessRuleError)('Age does not match date of birth');
            }
        }
    },
};
const respondWithPatient = (res, patient, message) => {
    const cleanPatient = {
        ...patient.toObject(),
        age: patient.getAge?.() || patient.age,
        displayName: patient.getDisplayName?.() || `${patient.firstName} ${patient.lastName}`,
    };
    (0, exports.sendSuccess)(res, { patient: cleanPatient }, message);
};
exports.respondWithPatient = respondWithPatient;
const respondWithPaginatedResults = (res, results, total, page, limit, message) => {
    const meta = (0, exports.createPaginationMeta)(total, page, limit);
    (0, exports.sendSuccess)(res, { results }, message, 200, meta);
};
exports.respondWithPaginatedResults = respondWithPaginatedResults;
const getRequestContext = (req) => ({
    userId: req.user?._id,
    userRole: req.user?.role,
    workplaceId: req.user?.workplaceId?.toString() || '',
    isAdmin: req.isAdmin || false,
    canManage: req.canManage || false,
    timestamp: new Date().toISOString(),
});
exports.getRequestContext = getRequestContext;
const createAuditLog = (action, resourceType, resourceId, context, changes) => ({
    action,
    resourceType,
    resourceId,
    userId: context.userId,
    userRole: context.userRole,
    workplaceId: context.workplaceId,
    changes,
    timestamp: context.timestamp,
});
exports.createAuditLog = createAuditLog;
//# sourceMappingURL=responseHelpers.js.map