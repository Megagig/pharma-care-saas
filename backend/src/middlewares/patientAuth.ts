import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import PatientUser, { IPatientUser } from '../models/PatientUser';
import Patient, { IPatient } from '../models/Patient';
import logger from '../utils/logger';

// Extend Request interface for patient authentication
export interface PatientAuthRequest extends Request {
  patientUser?: IPatientUser;
  patient?: IPatient;
  workplaceId?: mongoose.Types.ObjectId;
}

/**
 * Patient authentication middleware
 * Validates JWT token and sets patientUser in request
 */
export const patientAuth = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    const token = 
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies.patientAccessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      patientUserId: string;
      workplaceId: string;
      email: string;
    };

    // Find patient user
    const patientUser = await PatientUser.findOne({
      _id: decoded.patientUserId,
      workplaceId: decoded.workplaceId,
      isDeleted: false,
    });

    if (!patientUser) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Check if account is active
    if (patientUser.status === 'suspended') {
      res.status(401).json({
        success: false,
        message: 'Account is suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    if (patientUser.status === 'inactive') {
      res.status(401).json({
        success: false,
        message: 'Account is inactive.',
        code: 'ACCOUNT_INACTIVE',
      });
      return;
    }

    // Check if account is locked
    if (patientUser.isLocked()) {
      res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts.',
        code: 'ACCOUNT_LOCKED',
      });
      return;
    }

    // Get associated patient record if exists
    let patient: IPatient | undefined;
    if (patientUser.patientId) {
      patient = await Patient.findOne({
        _id: patientUser.patientId,
        workplaceId: patientUser.workplaceId,
        isDeleted: false,
      });
    }

    // Set request properties
    req.patientUser = patientUser;
    req.patient = patient;
    req.workplaceId = new mongoose.Types.ObjectId(decoded.workplaceId);

    next();
  } catch (error) {
    logger.error('Patient auth middleware error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error.',
        code: 'AUTH_ERROR',
      });
    }
  }
};

/**
 * Optional patient authentication middleware
 * Sets patientUser if token is provided, but doesn't require it
 */
export const patientAuthOptional = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    const token = 
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies.patientAccessToken;

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      patientUserId: string;
      workplaceId: string;
      email: string;
    };

    // Find patient user
    const patientUser = await PatientUser.findOne({
      _id: decoded.patientUserId,
      workplaceId: decoded.workplaceId,
      isDeleted: false,
    });

    if (patientUser && patientUser.status !== 'suspended' && !patientUser.isLocked()) {
      // Get associated patient record if exists
      let patient: IPatient | undefined;
      if (patientUser.patientId) {
        patient = await Patient.findOne({
          _id: patientUser.patientId,
          workplaceId: patientUser.workplaceId,
          isDeleted: false,
        });
      }

      // Set request properties
      req.patientUser = patientUser;
      req.patient = patient;
      req.workplaceId = new mongoose.Types.ObjectId(decoded.workplaceId);
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    logger.warn('Optional patient auth middleware error:', error);
    next();
  }
};

/**
 * Middleware to require email verification
 */
export const requireEmailVerification = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patientUser) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.patientUser.emailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
      requiresAction: 'email_verification',
    });
    return;
  }

  next();
};

/**
 * Middleware to require active status
 */
export const requireActiveStatus = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patientUser) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (req.patientUser.status !== 'active') {
    res.status(403).json({
      success: false,
      message: 'Account must be active to access this resource.',
      code: 'ACCOUNT_NOT_ACTIVE',
      status: req.patientUser.status,
      requiresAction: req.patientUser.status === 'pending' ? 'email_verification' : 'account_activation',
    });
    return;
  }

  next();
};

/**
 * Middleware to require linked patient record
 */
export const requireLinkedPatient = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patientUser) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.patient) {
    res.status(403).json({
      success: false,
      message: 'Patient record must be linked to access this resource.',
      code: 'PATIENT_RECORD_REQUIRED',
      requiresAction: 'link_patient_record',
    });
    return;
  }

  next();
};

/**
 * Middleware to validate workspace context
 */
export const validatePatientWorkspace = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.patientUser) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  // Check if workspace ID in request matches patient user's workplace
  const requestWorkplaceId = req.params.workplaceId || req.query.workplaceId || req.body.workplaceId;
  
  if (requestWorkplaceId && requestWorkplaceId !== req.patientUser.workplaceId.toString()) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Invalid workplace context.',
      code: 'INVALID_WORKPLACE',
    });
    return;
  }

  next();
};

/**
 * Get patient auth context from request
 */
export const getPatientAuthContext = (req: PatientAuthRequest) => {
  return {
    patientUserId: req.patientUser?._id,
    patientId: req.patient?._id,
    workplaceId: req.workplaceId,
    email: req.patientUser?.email,
    isEmailVerified: req.patientUser?.emailVerified,
    status: req.patientUser?.status,
  };
};