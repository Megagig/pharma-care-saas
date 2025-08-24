import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';
import Subscription from '../models/Subscription';
import FeatureFlag from '../models/FeatureFlag';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
  'super_admin': ['super_admin', 'pharmacy_outlet', 'pharmacy_team', 'pharmacist', 'intern_pharmacist'],
  'pharmacy_outlet': ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
  'pharmacy_team': ['pharmacy_team', 'pharmacist'],
  'pharmacist': ['pharmacist'],
  'intern_pharmacist': ['intern_pharmacist']
};

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId)
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
        requiresAction: user.status === 'license_pending' ? 'license_verification' : 'account_activation'
      });
      return;
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trial', 'grace_period'] }
    }).populate('planId');

    // Check subscription validity
    if (!subscription || subscription.isExpired()) {
      res.status(402).json({ 
        message: 'Subscription expired or not found.',
        requiresPayment: true,
        subscriptionStatus: subscription?.status || 'none'
      });
      return;
    }

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

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Access denied.' });
      return;
    }

    const userRole = req.user.role;
    const hasRole = roles.some(role => {
      const allowedRoles = ROLE_HIERARCHY[userRole] || [userRole];
      return allowedRoles.includes(role);
    });

    if (!hasRole) {
      res.status(403).json({ 
        message: 'Insufficient permissions.',
        requiredRoles: roles,
        userRole: userRole
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
        userPermissions: req.user.permissions
      });
      return;
    }

    next();
  };
};

// License verification middleware
export const requireLicense = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  const requiresLicense = ['pharmacist', 'intern_pharmacist'].includes(req.user.role);
  
  if (requiresLicense && req.user.licenseStatus !== 'approved') {
    res.status(403).json({ 
      message: 'Valid license required.',
      licenseStatus: req.user.licenseStatus,
      requiresAction: 'license_verification'
    });
    return;
  }

  next();
};

// Enhanced feature flag middleware
export const requireFeature = (featureKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.subscription) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      // Get feature flag configuration
      const featureFlag = await FeatureFlag.findOne({ 
        key: featureKey, 
        isActive: true 
      });

      if (!featureFlag) {
        res.status(404).json({
          message: 'Feature not found or inactive.',
          feature: featureKey
        });
        return;
      }

      const user = req.user;
      const subscription = req.subscription;

      // Check tier access
      if (!featureFlag.allowedTiers.includes(subscription.tier)) {
        res.status(403).json({
          message: 'Feature not available in your current plan.',
          feature: featureKey,
          currentTier: subscription.tier,
          requiredTiers: featureFlag.allowedTiers,
          upgradeRequired: true
        });
        return;
      }

      // Check role access
      if (featureFlag.allowedRoles.length > 0) {
        const hasRoleAccess = featureFlag.allowedRoles.some(role => {
          const allowedRoles = ROLE_HIERARCHY[user.role] || [user.role];
          return allowedRoles.includes(role);
        });

        if (!hasRoleAccess) {
          res.status(403).json({
            message: 'Feature not available for your role.',
            feature: featureKey,
            userRole: user.role,
            requiredRoles: featureFlag.allowedRoles
          });
          return;
        }
      }

      // Check custom rules
      if (featureFlag.customRules) {
        // Check license requirement
        if (featureFlag.customRules.requiredLicense && user.licenseStatus !== 'approved') {
          res.status(403).json({
            message: 'Feature requires verified license.',
            feature: featureKey,
            licenseStatus: user.licenseStatus,
            requiresAction: 'license_verification'
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
              maxAllowed: featureFlag.customRules.maxUsers
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
        user.role === 'super_admin';

      if (!hasFeatureAccess) {
        res.status(403).json({
          message: 'Feature not enabled for this account.',
          feature: featureKey,
          upgradeRequired: true
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        message: 'Error checking feature access.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Usage limit middleware with analytics
export const checkUsageLimit = (featureKey: string, limitKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.subscription) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      const subscription = req.subscription;
      const plan = subscription.planId;

      // Get the limit from the plan
      const limit = plan.features?.[limitKey];
      if (limit === null || limit === undefined) {
        // No limit set, allow access
        next();
        return;
      }

      // Get current usage
      const usageMetric = subscription.usageMetrics.find(m => m.feature === featureKey);
      const currentUsage = usageMetric ? usageMetric.count : 0;

      if (currentUsage >= limit) {
        res.status(429).json({
          message: `Usage limit exceeded for ${featureKey}.`,
          feature: featureKey,
          limit: limit,
          current: currentUsage,
          upgradeRequired: true
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
export const requireTeamAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  const allowedRoles = ['pharmacy_team', 'pharmacy_outlet', 'super_admin'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({ 
      message: 'Team features not available for your role.',
      requiredRoles: allowedRoles
    });
    return;
  }

  next();
};

// Admin-only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Access denied.' });
    return;
  }

  if (req.user.role !== 'super_admin') {
    res.status(403).json({ 
      message: 'Administrator access required.',
      userRole: req.user.role
    });
    return;
  }

  next();
};