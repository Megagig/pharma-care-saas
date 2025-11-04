import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import PatientUser, { IPatientUser } from '../models/PatientUser';
import Workplace from '../models/Workplace';

export interface PatientAuthRequest extends Request {
  patient?: {
    _id: string;
    email: string;
    workplaceId: string;
    firstName: string;
    lastName: string;
    status: string;
    patientId?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    isAccountLocked: boolean;
  };
  patientUser?: IPatientUser;
  workplaceId?: string;
  workplace?: {
    _id: string;
    name: string;
    isActive: boolean;
    status: string;
  };
}

/**
 * Enhanced authentication middleware for patient portal
 * Validates patient JWT tokens and performs comprehensive status checks
 * Includes account status validation and workspace context
 */
export const patientAuth = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from httpOnly cookie or Authorization header
    const token = 
      req.cookies.patientAccessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
        code: 'NO_TOKEN',
        requiresAuth: true,
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      patientUserId: string;
      workspaceId: string;
      email: string;
      type: string;
    };

    // Validate token type
    if (decoded.type !== 'patient') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type. Patient authentication required.',
        code: 'INVALID_TOKEN_TYPE',
      });
      return;
    }

    // Get patient from database with populated fields
    const patient = await PatientUser.findById(decoded.patientUserId)
      .select('-passwordHash -refreshTokens -verificationToken -resetToken')
      .populate('patientId', 'firstName lastName dateOfBirth')
      .lean();

    if (!patient) {
      res.status(401).json({
        success: false,
        message: 'Patient account not found. Please register or contact support.',
        code: 'PATIENT_NOT_FOUND',
      });
      return;
    }

    // Check if account is locked due to failed login attempts
    if (patient.lockUntil && patient.lockUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((patient.lockUntil.getTime() - Date.now()) / (1000 * 60));
      res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockUntil: patient.lockUntil,
        minutesRemaining: lockTimeRemaining,
      });
      return;
    }

    // Enhanced account status checks
    switch (patient.status) {
      case 'pending':
        // Check if email verification is required
        if (!patient.emailVerified) {
          res.status(403).json({
            success: false,
            message: 'Please verify your email address before accessing the patient portal.',
            code: 'EMAIL_VERIFICATION_REQUIRED',
            status: patient.status,
            requiresAction: 'email_verification',
            email: patient.email,
          });
          return;
        }
        
        // Account is pending approval from workspace admin
        res.status(403).json({
          success: false,
          message: 'Your account is pending approval from the pharmacy administrator. You will be notified once approved.',
          code: 'ACCOUNT_PENDING_APPROVAL',
          status: patient.status,
          requiresAction: 'admin_approval',
        });
        return;

      case 'suspended':
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact the pharmacy for assistance.',
          code: 'ACCOUNT_SUSPENDED',
          status: patient.status,
          requiresAction: 'contact_support',
        });
        return;

      case 'inactive':
        res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact the pharmacy to reactivate your account.',
          code: 'ACCOUNT_INACTIVE',
          status: patient.status,
          requiresAction: 'account_reactivation',
        });
        return;

      case 'active':
        // Account is active, continue with additional checks
        break;

      default:
        res.status(403).json({
          success: false,
          message: 'Account status is invalid. Please contact support.',
          code: 'INVALID_ACCOUNT_STATUS',
          status: patient.status,
        });
        return;
    }

    // Check if patient account is marked as inactive
    if (!patient.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account access has been disabled. Please contact the pharmacy.',
        code: 'ACCOUNT_DISABLED',
        requiresAction: 'contact_support',
      });
      return;
    }

    // Validate workspace context
    const workspaceId = patient.workplaceId.toString();
    
    // Verify workspace exists and is active
    const workplace = await Workplace.findById(workspaceId)
      .select('name isActive status subscriptionStatus')
      .lean();

    if (!workplace) {
      res.status(403).json({
        success: false,
        message: 'Associated pharmacy not found. Please contact support.',
        code: 'WORKPLACE_NOT_FOUND',
        requiresAction: 'contact_support',
      });
      return;
    }

    if (workplace.subscriptionStatus !== 'active' && workplace.subscriptionStatus !== 'trial') {
      res.status(403).json({
        success: false,
        message: 'The associated pharmacy is currently inactive. Please contact them directly.',
        code: 'WORKPLACE_INACTIVE',
        workplaceStatus: workplace.subscriptionStatus,
        requiresAction: 'contact_pharmacy',
      });
      return;
    }

    // Check workspace context matches token
    if (decoded.workspaceId !== workspaceId) {
      res.status(403).json({
        success: false,
        message: 'Workspace context mismatch. Please log in again.',
        code: 'WORKSPACE_MISMATCH',
        requiresAuth: true,
      });
      return;
    }

    // Attach comprehensive patient info to request
    req.patient = {
      _id: patient._id.toString(),
      email: patient.email,
      workplaceId: workspaceId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      status: patient.status,
      patientId: patient.patientId?.toString(),
      emailVerified: patient.emailVerified,
      phoneVerified: patient.phoneVerified,
      isAccountLocked: !!(patient.lockUntil && patient.lockUntil > new Date()),
    };

    req.patientUser = patient as IPatientUser;
    req.workplaceId = workspaceId;
    req.workplace = {
      _id: workplace._id.toString(),
      name: workplace.name,
      isActive: workplace.subscriptionStatus === 'active' || workplace.subscriptionStatus === 'trial',
      status: workplace.subscriptionStatus,
    };

    // Update last login time (async, don't wait)
    PatientUser.updateOne(
      { _id: patient._id },
      { 
        lastLoginAt: new Date(),
        $unset: { loginAttempts: 1, lockUntil: 1 } // Reset failed attempts on successful auth
      }
    ).exec().catch(err => {
      console.error('Failed to update patient last login:', err);
    });

    next();
  } catch (error: any) {
    // Handle JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
        code: 'INVALID_TOKEN',
        requiresAuth: true,
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true,
        requiresAuth: true,
      });
      return;
    }

    if (error.name === 'NotBeforeError') {
      res.status(401).json({
        success: false,
        message: 'Authentication token is not yet valid.',
        code: 'TOKEN_NOT_ACTIVE',
      });
      return;
    }

    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Patient auth middleware error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error. Please try again.',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional patient authentication
 * Allows requests to proceed even without authentication
 * Sets patient info if valid token is provided
 */
export const patientAuthOptional = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = 
      req.cookies.patientAccessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // No token, but that's okay for optional auth
      next();
      return;
    }

    // Try to validate token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      patientUserId: string;
      workspaceId: string;
      email: string;
      type: string;
    };

    if (decoded.type === 'patient') {
      const patient = await PatientUser.findById(decoded.patientUserId)
        .select('-passwordHash -refreshTokens -verificationToken -resetToken')
        .populate('patientId', 'firstName lastName')
        .lean();

      // Only set patient info if account is active and not locked
      if (patient && 
          patient.status === 'active' && 
          patient.isActive &&
          (!patient.lockUntil || patient.lockUntil <= new Date())) {
        
        req.patient = {
          _id: patient._id.toString(),
          email: patient.email,
          workplaceId: patient.workplaceId.toString(),
          firstName: patient.firstName,
          lastName: patient.lastName,
          status: patient.status,
          patientId: patient.patientId?.toString(),
          emailVerified: patient.emailVerified,
          phoneVerified: patient.phoneVerified,
          isAccountLocked: false,
        };

        req.patientUser = patient as IPatientUser;
        req.workplaceId = patient.workplaceId.toString();
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth - just proceed without patient info
    next();
  }
};

/**
 * Middleware to require active patient status
 * Must be used after patientAuth middleware
 */
export const requireActivePatient = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patient) {
    res.status(401).json({
      success: false,
      message: 'Patient authentication required.',
      code: 'NO_PATIENT_AUTH',
      requiresAuth: true,
    });
    return;
  }

  if (req.patient.status !== 'active') {
    res.status(403).json({
      success: false,
      message: 'Active patient account required.',
      code: 'PATIENT_NOT_ACTIVE',
      status: req.patient.status,
    });
    return;
  }

  next();
};

/**
 * Middleware to require email verification
 * Must be used after patientAuth middleware
 */
export const requireEmailVerification = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patient) {
    res.status(401).json({
      success: false,
      message: 'Patient authentication required.',
      code: 'NO_PATIENT_AUTH',
      requiresAuth: true,
    });
    return;
  }

  if (!req.patient.emailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required to access this feature.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
      requiresAction: 'email_verification',
      email: req.patient.email,
    });
    return;
  }

  next();
};

/**
 * Middleware to require linked patient record
 * Must be used after patientAuth middleware
 */
export const requireLinkedPatient = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patient) {
    res.status(401).json({
      success: false,
      message: 'Patient authentication required.',
      code: 'NO_PATIENT_AUTH',
      requiresAuth: true,
    });
    return;
  }

  if (!req.patient.patientId) {
    res.status(403).json({
      success: false,
      message: 'Your account must be linked to a patient record to access this feature. Please contact the pharmacy.',
      code: 'PATIENT_RECORD_NOT_LINKED',
      requiresAction: 'contact_pharmacy',
    });
    return;
  }

  next();
};

/**
 * Middleware to validate workspace context
 * Ensures the patient belongs to the specified workspace
 */
export const validateWorkspaceContext = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patient || !req.workplaceId) {
    res.status(401).json({
      success: false,
      message: 'Patient authentication and workspace context required.',
      code: 'NO_WORKSPACE_CONTEXT',
      requiresAuth: true,
    });
    return;
  }

  // Check if workspace ID from URL params matches authenticated patient's workspace
  const urlWorkspaceId = req.params.workspaceId || req.query.workspaceId;
  
  if (urlWorkspaceId && urlWorkspaceId !== req.workplaceId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access resources from your associated pharmacy.',
      code: 'WORKSPACE_ACCESS_DENIED',
      userWorkspaceId: req.workplaceId,
      requestedWorkspaceId: urlWorkspaceId,
    });
    return;
  }

  next();
};

/**
 * Middleware for patient portal rate limiting
 * Implements basic rate limiting per patient
 */
export const patientRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (
    req: PatientAuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const patientId = req.patient?._id;
    
    if (!patientId) {
      // No patient auth, skip rate limiting
      next();
      return;
    }

    const now = Date.now();
    const patientKey = `patient:${patientId}`;
    const record = requestCounts.get(patientKey);

    if (!record || now > record.resetTime) {
      // First request or window expired
      requestCounts.set(patientKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetIn,
        limit: maxRequests,
        windowMs: windowMs,
      });
      return;
    }

    // Increment count
    record.count++;
    next();
  };
};

/**
 * Audit logging middleware for patient actions
 * Logs patient actions for security and compliance
 */
export const auditPatientAction = (action: string) => {
  return (
    req: PatientAuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // Log the action (in production, this would go to a proper audit log)
    const auditData = {
      timestamp: new Date().toISOString(),
      action,
      patientId: req.patient?._id,
      patientEmail: req.patient?.email,
      workplaceId: req.workplaceId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Patient Action Audit:', auditData);
    }

    // In production, this would be sent to a secure audit logging service
    // Example: await PatientAuditLog.create(auditData);

    next();
  };
};

export default {
  patientAuth,
  patientAuthOptional,
  requireActivePatient,
  requireEmailVerification,
  requireLinkedPatient,
  validateWorkspaceContext,
  patientRateLimit,
  auditPatientAction,
};
