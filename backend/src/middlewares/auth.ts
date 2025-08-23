import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';

interface AuthRequest extends Request {
  user?: any;
}

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
      .select('-passwordHash');

    if (!user) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(401).json({ message: 'Account is not active.' });
      return;
    }

    req.user = user;
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

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions.' });
      return;
    }

    next();
  };
};

// Middleware to check subscription plan features
export const requireFeature = (featureName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      const user = req.user;
      let plan = user.currentPlanId;

      // If user has plan override, check that first
      if (user.planOverride && user.planOverride[featureName] !== undefined) {
        if (user.planOverride[featureName]) {
          next();
          return;
        } else {
          res.status(403).json({
            message: `This feature is not available in your current plan.`,
            feature: featureName,
            upgradeRequired: true
          });
          return;
        }
      }

      // Check plan features
      if (!plan || !plan.features || !plan.features[featureName]) {
        res.status(403).json({
          message: `This feature is not available in your current plan.`,
          feature: featureName,
          upgradeRequired: true
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking feature access.' });
    }
  };
};

// Middleware to check subscription plan limits
export const checkLimit = (limitName: string, currentCount: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
      }

      const user = req.user;
      let plan = user.currentPlanId;

      // If user has plan override, check that first
      if (user.planOverride && user.planOverride[limitName] !== undefined) {
        const limit = user.planOverride[limitName];
        if (limit === null || currentCount < limit) {
          next();
          return;
        } else {
          res.status(403).json({
            message: `You have reached your ${limitName} limit.`,
            limit: limit,
            current: currentCount,
            upgradeRequired: true
          });
          return;
        }
      }

      // Check plan limits
      if (!plan || !plan.features) {
        res.status(403).json({ message: 'Plan information not available.' });
        return;
      }

      const limit = plan.features[limitName];
      if (limit !== null && currentCount >= limit) {
        res.status(403).json({
          message: `You have reached your ${limitName} limit.`,
          limit: limit,
          current: currentCount,
          upgradeRequired: true
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking limit.' });
    }
  };
};