import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Extend AuthRequest to include Patient Management specific properties
export interface PatientAuthRequest extends AuthRequest {
  isAdmin?: boolean;
  canManage?: boolean;
  patientRole?: PatientManagementRole;
}

/**
 * Patient Management RBAC Middleware
 * Implements role-based access control for Patient Management module
 *
 * Roles:
 * - owner: Full access (create, read, update, delete all)
 * - pharmacist: Full access (create, read, update, delete all)
 * - technician: Limited access (view, add vitals/assessments only)
 * - admin: Cross-tenant view access (read all across pharmacies)
 */

export type PatientManagementRole =
  | 'owner'
  | 'pharmacist'
  | 'technician'
  | 'admin';
export type PatientManagementAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';

// Define role permissions for Patient Management
const PATIENT_MANAGEMENT_PERMISSIONS: Record<
  PatientManagementRole,
  PatientManagementAction[]
> = {
  owner: ['create', 'read', 'update', 'delete', 'manage'],
  pharmacist: ['create', 'read', 'update', 'delete', 'manage'],
  technician: ['read'], // Technicians can only view and add specific data
  admin: ['read', 'manage'], // Admins can view across tenants but limited modifications
};

// Special permissions for technicians - they can create/update these specific data types
const TECHNICIAN_ALLOWED_RESOURCES = ['clinical-assessments', 'vitals', 'labs'];

/**
 * Check if user has required permission for Patient Management
 */
export const hasPatientManagementPermission = (
  userRole: string,
  action: PatientManagementAction,
  resource?: string
): boolean => {
  const role = mapToPatientManagementRole(userRole);
  const allowedActions = PATIENT_MANAGEMENT_PERMISSIONS[role] || [];

  // Check basic permission
  if (allowedActions.includes(action)) {
    return true;
  }

  // Special case for technicians - they can create/update specific resources
  if (
    role === 'technician' &&
    ['create', 'update'].includes(action) &&
    resource
  ) {
    return TECHNICIAN_ALLOWED_RESOURCES.some((allowedResource) =>
      resource.includes(allowedResource)
    );
  }

  return false;
};

/**
 * Map system roles to Patient Management roles
 */
const mapToPatientManagementRole = (
  systemRole: string
): PatientManagementRole => {
  switch (systemRole) {
    case 'super_admin':
      return 'admin';
    case 'pharmacy_outlet':
      return 'owner';
    case 'pharmacist':
    case 'pharmacy_team':
      return 'pharmacist';
    case 'intern_pharmacist':
      return 'technician';
    default:
      return 'technician'; // Default to most restrictive
  }
};

/**
 * Middleware to check Patient Management permissions
 */
export const requirePatientPermission = (
  action: PatientManagementAction,
  resource?: string
) => {
  return (req: PatientAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userRole = req.user.role as string;
    const hasPermission = hasPatientManagementPermission(
      userRole,
      action,
      resource
    );

    if (!hasPermission) {
      res.status(403).json({
        message: 'Insufficient permissions for this action',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: action,
        userRole: mapToPatientManagementRole(userRole),
        resource: resource,
      });
      return;
    }

    // Add role info to request for controllers
    req.patientRole = mapToPatientManagementRole(userRole);
    req.canManage = hasPatientManagementPermission(userRole, 'manage');
    req.isAdmin = mapToPatientManagementRole(userRole) === 'admin';

    next();
  };
};

/**
 * Specific permission middlewares for common patterns
 */
export const requirePatientRead = requirePatientPermission('read');
export const requirePatientCreate = requirePatientPermission('create');
export const requirePatientUpdate = requirePatientPermission('update');
export const requirePatientDelete = requirePatientPermission('delete');
export const requirePatientManage = requirePatientPermission('manage');

// Resource-specific permissions
export const requireClinicalAssessmentAccess = requirePatientPermission(
  'create',
  'clinical-assessments'
);
export const requireVitalsAccess = requirePatientPermission('create', 'vitals');

/**
 * Middleware to check pharmacy ownership for non-admin users
 */
export const checkPharmacyAccess = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip pharmacy check for admin users (they have cross-tenant access)
  if (req.isAdmin) {
    next();
    return;
  }

  // For non-admin users, ensure they have a pharmacy association
  if (!req.user?.pharmacyId && !req.user?.currentPlanId) {
    res.status(403).json({
      message: 'No pharmacy association found',
      code: 'NO_PHARMACY_ACCESS',
      requiresAction: 'pharmacy_setup',
    });
    return;
  }

  next();
};

/**
 * Plan gate middleware for Patient Management features
 */
export const checkPatientPlanLimits = async (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip plan checks for admin users
    if (req.isAdmin) {
      next();
      return;
    }

    const subscription = req.subscription;

    if (!subscription || !subscription.planId) {
      res.status(402).json({
        message: 'Active subscription required for Patient Management',
        code: 'SUBSCRIPTION_REQUIRED',
        feature: 'patient_management',
      });
      return;
    }

    // Check if creating a new patient (for plan limits)
    if (req.method === 'POST' && req.path === '/') {
      const planFeatures = (subscription.planId as any).features || {};
      const maxPatients = planFeatures.maxPatients || 0;

      if (maxPatients > 0) {
        // Get current patient count for this pharmacy
        const Patient = require('../models/Patient').default;
        const currentCount = await Patient.countDocuments({
          pharmacyId: req.user?.pharmacyId,
          isDeleted: false,
        });

        if (currentCount >= maxPatients) {
          res.status(402).json({
            message: `Patient limit reached. Your plan allows up to ${maxPatients} patients.`,
            code: 'PATIENT_LIMIT_REACHED',
            current: currentCount,
            limit: maxPatients,
            upgradeUrl: '/api/subscriptions/plans',
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Plan limit check error:', error);
    next(); // Don't block on plan check errors
  }
};

// Extend AuthRequest interface
declare global {
  namespace Express {
    interface Request {
      patientRole?: PatientManagementRole;
      canManage?: boolean;
      isAdmin?: boolean;
    }
  }
}
