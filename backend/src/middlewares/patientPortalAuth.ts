import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import PatientUser from '../models/PatientUser';

export interface PatientAuthRequest extends Request {
  patient?: {
    _id: string;
    email: string;
    workplaceId: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

/**
 * Authentication middleware for patient portal
 * Validates patient JWT tokens from httpOnly cookies
 */
export const patientAuth = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies.patientAccessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
        code: 'NO_TOKEN',
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
        message: 'Invalid token type',
      });
      return;
    }

    // Get patient from database
    const patient = await PatientUser.findById(decoded.patientUserId)
      .select('-passwordHash -refreshTokens')
      .lean();

    if (!patient) {
      res.status(401).json({
        success: false,
        message: 'Patient account not found',
      });
      return;
    }

    // Check if patient account is active
    if (patient.status !== 'active' || !patient.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact the administrator.',
        status: patient.status,
      });
      return;
    }

    // Attach patient info to request
    req.patient = {
      _id: patient._id.toString(),
      email: patient.email,
      workplaceId: patient.workplaceId.toString(),
      firstName: patient.firstName,
      lastName: patient.lastName,
      status: patient.status,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
        requiresRefresh: true,
      });
      return;
    }

    console.error('Patient auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional patient authentication
 * Allows requests to proceed even without authentication
 */
export const patientAuthOptional = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.patientAccessToken;

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
        .select('-passwordHash -refreshTokens')
        .lean();

      if (patient && patient.status === 'active' && patient.isActive) {
        req.patient = {
          _id: patient._id.toString(),
          email: patient.email,
          workplaceId: patient.workplaceId.toString(),
          firstName: patient.firstName,
          lastName: patient.lastName,
          status: patient.status,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};
