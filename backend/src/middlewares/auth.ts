import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';
import Subscription, { ISubscription } from '../models/Subscription';
import { FeatureFlag } from '../models/FeatureFlag';

// Export AuthRequest interface for backward compatibility
export interface AuthRequest extends Request {
  user?: IUser & {
    currentUsage?: number;
    usageLimit?: number;
  };
  subscription?: ISubscription | null;
}

// Define role types
type UserRole =
  | 'pharmacist'
  | 'pharmacy_team'
  | 'pharmacy_outlet'
  | 'intern_pharmacist'
  | 'super_admin'
  | 'owner';

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: [
    'super_admin',
    'owner',
    'pharmacy_outlet',
    'pharmacy_team',
    'pharmacist',
    'intern_pharmacist',
  ],
  owner: ['owner', 'pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
  pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
  pharmacy_team: ['pharmacy_team', 'pharmacist'],
  pharmacist: ['pharmacist'],
  intern_pharmacist: ['intern_pharmacist'],
};

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Special bypass for super_admin testing (development only)
    if (process.env.NODE_ENV === 'development' && req.header('X-Super-Admin-Test') === 'true') {
      // Create a mock super_admin user for testing
      // Use a consistent workplaceId that matches existing data
      req.user = {
        _id: new mongoose.Types.ObjectId('68b5cb81f1f0f9758b8afadd'), // Consistent user ID
        email: 'super_admin@test.com',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        workplaceId: new mongoose.Types.ObjectId('68b5cb82f1f0f9758b8afadf'), // Match existing workplace
      } as any;
      next();
      return;
    }

    // Try to get token from httpOnly cookie first, fallback to Authorization header for API compatibility
    const token =
      req.cookies.accessToken ||
      req.cookies.token ||
      req.header('Authorization')?.replace('Bearer ', '');

    // If no access token but we have a refresh token, try using the refresh flow
    // This helps prevent intermittent logouts if access token expires
    if (
      !token &&
      req.cookies.refreshToken &&
      !req.originalUrl.includes('/auth/refresh-token')
    ) {
      console.log(
        'Auth middleware - no access token but found refresh token, redirecting to refresh flow'
      );
      res.status(401).json({
        message: 'Access token expired, please refresh',
        requiresRefresh: true,
      });
      return;
    }

    // Debug token information with limited logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - checking token:', {
        hasAccessToken: !!req.cookies.accessToken,
        hasRefreshToken: !!req.cookies.refreshToken,
        hasToken: !!req.cookies.token,
        hasAuthHeader: !!req.header('Authorization'),
        tokenExists: !!token,
        url: req.url,
        method: req.method,
      });
    }

    // Check for any token
    if (!token) {
      console.log('Auth middleware - No token provided');
      res.status(401).json({
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      id?: string; // Support old token format
    };

    // Handle both old and new token formats
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId)
      .populate('currentPlanId')
      .populate('parentUserId', 'firstName lastName role')
      .populate('teamMembers', 'firstName lastName role status')
      .select('-passwordHash');

    if (!user) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    // Check if user account is active
    // Block suspended users explicitly
    if (user.status === 'suspended') {
      res.status(401).json({
        message: 'Account is suspended. Please contact support.',
        status: user.status,
        requiresAction: 'contact_support',
      });
      return;
    }

    // Block license_rejected users
    if (user.status === 'license_rejected') {
      res.status(401).json({
        message: 'License verification was rejected. Please resubmit your license.',
        status: user.status,
        requiresAction: 'license_resubmission',
      });
      return;
    }

    // Allow active and license_pending users in all environments
    // In development, also allow pending users for testing
    const allowedStatuses = ['active', 'license_pending'];

    // In development, also allow pending users
    if (process.env.NODE_ENV === 'development') {
      allowedStatuses.push('pending');
    }

    if (!allowedStatuses.includes(user.status)) {
      res.status(401).json({
        message: user.status === 'pending'
          ? 'Please verify your email before logging in.'
          : 'Account is not active.',
        status: user.status,
        requiresAction:
          user.status === 'license_pending'
            ? 'license_verification'
            : user.status === 'pending'
              ? 'email_verification'
              : 'account_activation',
      });
      return;
    }

    // Get user's subscription through their workspace
    let subscription = null;
    if (user.workplaceId) {
      subscription = await Subscription.findOne({
        workspaceId: user.workplaceId,
        status: { $in: ['active', 'trial', 'past_due'] },
      }).populate('planId');
    }
    // Users without workplaces don't have subscriptions (they access basic features only)

    // Set subscription information regardless of validity
    // This allows the request to proceed even if subscription is expired
    // Frontend will handle display of subscription warnings/requirements
    req.subscription = subscription;

    req.user = user;
    req.subscription = subscription;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired.' });
    } else {
      res.status(401).json({ message: 'Invalid token.' });
    }
  }
};

// Authentication middleware that doesn't enforce subscription requirements
// Useful for subscription management endpoints where users need access to upgrade
export const authOptionalSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from httpOnly cookie first, fallback to Authorization header for API compatibility
    const token =
      req.cookies.accessToken ||
      req.cookies.token ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      id?: string; // Support old token format
    };

    // Handle both old and new token formats
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId)
      .populate('currentPlanId')
      .populate('parentUserId', 'firstName lastName role')
      .populate('teamMembers', 'firstName lastName role status')
      .select('-passwordHash');

    if (!user) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    // Check if user account is active
    if (!['active', 'license_pending'].includes(user.status)) {
      res.status(401).json({
        message: 'Account is not active.',
        status: user.status,
        requiresAction:
          user.status === 'license_pending'
            ? 'license_verification'
            : 'account_activation',
      });
      return;
    }

    // Get user's subscription through their workspace (optional - don't block if none)
    let subscription = null;
    if (user.workplaceId) {
      subscription = await Subscription.findOne({
        workspaceId: user.workplaceId,
        status: { $in: ['active', 'trial', 'grace_period'] },
      }).populate('planId');
    }
    // Users without workplaces don't have subscriptions (they access basic features only)

    req.user = user;
    req.subscription = subscription || undefined; // May be undefined
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired.' });
    } else {
      res.status(401).json({ message: 'Invalid token.' });
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Access denied.' });
      return;
    }

    const userRole = req.user.role as UserRole;
    const hasRole = roles.some((role) => {
      const allowedRoles = ROLE_HIERARCHY[userRole] || [userRole];
      return allowedRoles.includes(role);
    });

    if (!hasRole) {
      res.status(403).json({
        message: 'Insufficient permissions.',
        requiredRoles: roles,
        userRole: userRole,
      });
      return;
    }

    next();
  };
};

// Enhanced permission-based authorization
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Access denied.' });
      return;
    }

    if (!req.user.hasPermission(permission)) {
      res.status(403).json({
        message: 'Insufficient permissions.',
        requiredPermission: permission,
        userPermissions: req.user.permissions,
      });
      return;
    }

    next();
  };
};

// Enhanced license verification middleware with detailed status checking
export const requireLicense = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  const requiresLicense = ['pharmacist', 'intern_pharmacist'].includes(
    req.user.role
  );

  // Super admin bypasses license check
  if ((req.user.role as string) === 'super_admin') {
    return next();
  }

  if (requiresLicense) {
    switch (req.user.licenseStatus) {
      case 'approved':
        // License is valid, allow access
        break;

      case 'pending':
        res.status(403).json({
          message:
            'Your license is pending review. This usually takes 1-3 business days.',
          licenseStatus: 'pending',
          requiresAction: 'license_pending',
          nextStep: 'You will be notified when your license has been reviewed.',
        });
        return;

      case 'rejected':
        res.status(403).json({
          message: 'Your license verification was rejected.',
          licenseStatus: 'rejected',
          requiresAction: 'license_resubmission',
          rejectionReason:
            req.user.licenseRejectionReason ||
            'Invalid or incomplete information.',
          nextStep: 'Please resubmit with valid license information.',
        });
        return;

      default:
        res.status(403).json({
          message: 'Valid license required for this role.',
          licenseStatus: req.user.licenseStatus || 'not_submitted',
          requiresAction: 'license_verification',
          nextStep: 'Please submit your pharmacy license for verification.',
        });
        return;
    }
  }

  next();
};

// Enhanced feature flag middleware with subscription validation
export const requireFeature = (featureKey: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      console.log(`🔧 RequireFeature Debug - Feature: ${featureKey}, User: ${req.user.email}, Role: ${req.user.role}`);

      // Check if user is super admin - they bypass all restrictions
      if ((req.user.role as string) === 'super_admin') {
        console.log('🔧 Super admin bypass granted');
        return next();
      }

      // Get feature flag configuration
      const featureFlag = await FeatureFlag.findOne({
        key: featureKey,
        isActive: true,
      });

      console.log(`🔧 Feature flag found: ${!!featureFlag}, Key: ${featureKey}`);
      if (featureFlag) {
        console.log(`🔧 Feature flag details: allowedTiers=${featureFlag.allowedTiers}, allowedRoles=${featureFlag.allowedRoles}`);
      }

      if (!featureFlag) {
        console.log(`🔧 Feature flag not found or inactive: ${featureKey}`);
        res.status(404).json({
          message: 'Feature not found or inactive.',
          feature: featureKey,
        });
        return;
      }

      const user = req.user;
      const subscription = req.subscription;

      console.log(`🔧 Subscription: ${subscription ? 'found' : 'not found'}`);
      if (subscription) {
        console.log(`🔧 Subscription details: status=${subscription.status}, tier=${subscription.tier}`);
      }

      // If no subscription is found, check if this is a basic feature that doesn't require subscription
      if (!subscription) {
        // Allow access to basic features without subscription
        // This handles cases where users have expired subscriptions but still need access to core features
        const basicFeatures = [
          'patient_management',
          'basic_prescriptions',
          'basic_notes'
        ];

        if (basicFeatures.includes(featureKey)) {
          return next();
        }

        res.status(403).json({
          message: 'Active subscription required for this feature.',
          feature: featureKey,
          subscriptionStatus: 'none',
          requiresAction: 'subscription_required',
          upgradeRequired: true,
        });
        return;
      }

      // Check subscription status
      if (!['active', 'trial', 'past_due'].includes(subscription.status)) {
        console.log(`🔧 Subscription status check failed: ${subscription.status}`);
        res.status(403).json({
          message: 'Your subscription is not active.',
          feature: featureKey,
          subscriptionStatus: subscription.status,
          requiresAction: 'subscription_renewal',
          upgradeRequired: true,
        });
        return;
      }

      // Check tier access
      if (!featureFlag.allowedTiers.includes(subscription.tier)) {
        console.log(`🔧 Tier access check failed: user tier=${subscription.tier}, allowed=${featureFlag.allowedTiers}`);
        res.status(403).json({
          message: 'Feature not available in your current plan.',
          feature: featureKey,
          currentTier: subscription.tier,
          requiredTiers: featureFlag.allowedTiers,
          upgradeRequired: true,
        });
        return;
      }

      // Check role access
      if (featureFlag.allowedRoles.length > 0) {
        const hasRoleAccess = featureFlag.allowedRoles.some((role) => {
          const allowedRoles = ROLE_HIERARCHY[user.role as UserRole] || [
            user.role,
          ];
          return allowedRoles.includes(role as UserRole);
        });

        if (!hasRoleAccess) {
          res.status(403).json({
            message: 'Feature not available for your role.',
            feature: featureKey,
            userRole: user.role,
            requiredRoles: featureFlag.allowedRoles,
          });
          return;
        }
      }

      // Check custom rules
      if (featureFlag.customRules) {
        // Check license requirement
        if (
          featureFlag.customRules.requiredLicense &&
          user.licenseStatus !== 'approved'
        ) {
          res.status(403).json({
            message: 'Feature requires verified license.',
            feature: featureKey,
            licenseStatus: user.licenseStatus,
            requiresAction: 'license_verification',
          });
          return;
        }

        // Check max users (for team features)
        if (featureFlag.customRules.maxUsers && user.teamMembers) {
          const teamSize = user.teamMembers.length + 1; // Include the user
          if (teamSize > featureFlag.customRules.maxUsers) {
            res.status(403).json({
              message: 'Team size exceeds feature limit.',
              feature: featureKey,
              currentTeamSize: teamSize,
              maxAllowed: featureFlag.customRules.maxUsers,
            });
            return;
          }
        }
      }

      // Check if user has explicit feature access
      const hasFeatureAccess =
        subscription.features.includes(featureKey) ||
        subscription.customFeatures.includes(featureKey) ||
        user.features.includes(featureKey) ||
        (user.role as string) === 'super_admin';

      if (!hasFeatureAccess) {
        res.status(403).json({
          message: 'Feature not enabled for this account.',
          feature: featureKey,
          upgradeRequired: true,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: 'Error checking feature access.',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  };
};;

// Usage limit middleware with analytics
export const checkUsageLimit = (featureKey: string, limitKey: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.subscription) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      const subscription = req.subscription;
      const plan = subscription.planId as any; // This should be populated from the subscription

      // Get the limit from the plan
      const limit = plan?.features?.[limitKey];
      if (limit === null || limit === undefined) {
        // No limit set, allow access
        next();
        return;
      }

      // Get current usage
      const usageMetric = subscription.usageMetrics.find(
        (m: { feature: string; count: number; lastUpdated: Date }) =>
          m.feature === featureKey
      );
      const currentUsage = usageMetric ? usageMetric.count : 0;

      if (currentUsage >= limit) {
        res.status(429).json({
          message: `Usage limit exceeded for ${featureKey}.`,
          feature: featureKey,
          limit: limit,
          current: currentUsage,
          upgradeRequired: true,
        });
        return;
      }

      // Store current usage in request for potential increment
      req.user.currentUsage = currentUsage;
      req.user.usageLimit = limit;

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking usage limit.' });
    }
  };
};

// Team management middleware
export const requireTeamAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  const allowedRoles = ['pharmacy_team', 'pharmacy_outlet', 'super_admin', 'owner'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      message: 'Team features not available for your role.',
      requiredRoles: allowedRoles,
    });
    return;
  }

  next();
};

// Admin-only middleware
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  if (req.user.role !== 'super_admin') {
    res.status(403).json({
      message: 'Administrator access required.',
      userRole: req.user.role,
    });
    return;
  }

  next();
};

// Super Admin-only middleware
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  if (req.user.role !== 'super_admin') {
    res.status(403).json({
      message: 'Super Administrator access required.',
      userRole: req.user.role,
    });
    return;
  }

  next();
};
