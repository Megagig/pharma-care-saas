import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../middlewares/auth';

/**
 * Enhanced Error Handler and Response Formatters
 * Provides consistent error handling and response formatting for Patient Management API
 */

// Error code types
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DUPLICATE_RESOURCE'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'TENANT_VIOLATION'
  | 'BUSINESS_RULE_VIOLATION'
  | 'SERVER_ERROR'
  | 'BAD_REQUEST';

// Standard API response interface
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

// Success response formatter
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message: message || 'Operation successful',
    data,
    meta,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// Error response formatter
export const sendError = (
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode: number = 400,
  details?: any
): void => {
  const response: ApiResponse = {
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

// Pagination helper
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): ApiResponse['meta'] => {
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

// Custom error class for Patient Management
export class PatientManagementError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 400,
    code: ErrorCode = 'BAD_REQUEST',
    details?: any
  ) {
    super(message);
    this.name = 'PatientManagementError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error creators
export const createNotFoundError = (resource: string, identifier?: string) =>
  new PatientManagementError(
    `${resource}${identifier ? ` with ID ${identifier}` : ''} not found`,
    404,
    'NOT_FOUND'
  );

export const createValidationError = (message: string, details?: any) =>
  new PatientManagementError(message, 422, 'VALIDATION_ERROR', details);

export const createForbiddenError = (message: string = 'Access forbidden') =>
  new PatientManagementError(message, 403, 'FORBIDDEN');

export const createPlanLimitError = (
  feature: string,
  current: number,
  limit: number
) =>
  new PatientManagementError(
    `${feature} limit exceeded. Current: ${current}, Limit: ${limit}`,
    402,
    'PLAN_LIMIT_EXCEEDED',
    { current, limit, feature }
  );

export const createTenantViolationError = () =>
  new PatientManagementError(
    'Access denied: Resource belongs to different pharmacy',
    403,
    'TENANT_VIOLATION'
  );

export const createDuplicateError = (resource: string, field?: string) =>
  new PatientManagementError(
    `${resource} already exists${field ? ` with this ${field}` : ''}`,
    409,
    'DUPLICATE_RESOURCE'
  );

export const createBusinessRuleError = (rule: string) =>
  new PatientManagementError(
    `Business rule violation: ${rule}`,
    400,
    'BUSINESS_RULE_VIOLATION'
  );

// Enhanced error handler middleware
export const patientManagementErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Patient Management Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: (req as AuthRequest).user?.id,
    timestamp: new Date().toISOString(),
  });

  // Handle PatientManagementError
  if (error instanceof PatientManagementError) {
    sendError(res, error.code, error.message, error.statusCode, error.details);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    sendError(res, 'VALIDATION_ERROR', 'Validation failed', 422, details);
    return;
  }

  // Handle Mongoose errors
  if (error.name === 'ValidationError') {
    const mongooseError = error as any;
    const details = Object.values(mongooseError.errors || {}).map(
      (err: any) => ({
        field: err.path,
        message: err.message,
      })
    );

    sendError(
      res,
      'VALIDATION_ERROR',
      'Database validation failed',
      422,
      details
    );
    return;
  }

  if (error.name === 'CastError') {
    sendError(res, 'BAD_REQUEST', 'Invalid ID format', 400);
    return;
  }

  if ((error as any).code === 11000) {
    const duplicateField = Object.keys((error as any).keyValue || {})[0];
    sendError(
      res,
      'DUPLICATE_RESOURCE',
      `Resource already exists${
        duplicateField ? ` with this ${duplicateField}` : ''
      }`,
      409
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'UNAUTHORIZED', 'Token expired', 401);
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 'BAD_REQUEST', 'Invalid JSON format in request body', 400);
    return;
  }

  // Generic server error
  sendError(res, 'SERVER_ERROR', 'Internal server error', 500);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Tenant access checker helper
export const checkTenantAccess = (
  resourcePharmacyId: string,
  userPharmacyId: string,
  isAdmin: boolean = false
): void => {
  if (!isAdmin && resourcePharmacyId !== userPharmacyId) {
    throw createTenantViolationError();
  }
};

// Resource existence checker
export const ensureResourceExists = <T>(
  resource: T | null,
  name: string,
  id?: string
): T => {
  if (!resource) {
    throw createNotFoundError(name, id);
  }
  return resource;
};

// Business rule validators
export const validateBusinessRules = {
  // Ensure BP readings are valid
  validateBloodPressure: (systolic?: number, diastolic?: number) => {
    if (systolic && diastolic && systolic <= diastolic) {
      throw createBusinessRuleError(
        'Systolic blood pressure must be higher than diastolic'
      );
    }
  },

  // Ensure medication dates are logical
  validateMedicationDates: (startDate?: Date, endDate?: Date) => {
    if (startDate && endDate && startDate > endDate) {
      throw createBusinessRuleError(
        'Medication start date cannot be after end date'
      );
    }
  },

  // Ensure follow-up date is in future
  validateFollowUpDate: (followUpDate?: Date) => {
    if (followUpDate && followUpDate <= new Date()) {
      throw createBusinessRuleError('Follow-up date must be in the future');
    }
  },

  // Ensure patient age/DOB consistency
  validatePatientAge: (dob?: Date, age?: number) => {
    if (dob && age) {
      const calculatedAge = Math.floor(
        (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );
      if (Math.abs(calculatedAge - age) > 1) {
        throw createBusinessRuleError('Age does not match date of birth');
      }
    }
  },
};

// Response helpers
export const respondWithPatient = (
  res: Response,
  patient: any,
  message?: string
) => {
  // Remove sensitive fields and add computed properties
  const cleanPatient = {
    ...patient.toObject(),
    age: patient.getAge?.() || patient.age,
    displayName:
      patient.getDisplayName?.() || `${patient.firstName} ${patient.lastName}`,
  };

  sendSuccess(res, { patient: cleanPatient }, message);
};

export const respondWithPaginatedResults = <T>(
  res: Response,
  results: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) => {
  const meta = createPaginationMeta(total, page, limit);
  sendSuccess(res, { results }, message, 200, meta);
};

// Request context helpers
export const getRequestContext = (req: AuthRequest) => ({
  userId: req.user?._id,
  userRole: req.user?.role,
  pharmacyId: req.user?.pharmacyId?.toString() || '',
  isAdmin: (req as any).isAdmin || false,
  canManage: (req as any).canManage || false,
  timestamp: new Date().toISOString(),
});

// Audit log helper
export const createAuditLog = (
  action: string,
  resourceType: string,
  resourceId: string,
  context: ReturnType<typeof getRequestContext>,
  changes?: any
) => ({
  action,
  resourceType,
  resourceId,
  userId: context.userId,
  userRole: context.userRole,
  pharmacyId: context.pharmacyId,
  changes,
  timestamp: context.timestamp,
});
