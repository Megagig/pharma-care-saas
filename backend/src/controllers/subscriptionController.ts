import { Request, Response } from 'express';
import Subscription from '../models/Subscription';

interface AuthRequest extends Request {
  user?: any;
}

export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 29.99,
        features: ['Up to 50 patients', '500 clinical notes', '2GB storage'],
        limits: { maxPatients: 50, maxNotes: 500, storageGB: 2 }
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 59.99,
        features: ['Up to 200 patients', '2000 clinical notes', '10GB storage', 'Advanced reporting'],
        limits: { maxPatients: 200, maxNotes: 2000, storageGB: 10 }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99.99,
        features: ['Unlimited patients', 'Unlimited notes', '50GB storage', 'Priority support'],
        limits: { maxPatients: -1, maxNotes: -1, storageGB: 50 }
      }
    ];
    res.json({ plans });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    res.json({ subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      { status: 'cancelled', autoRenew: false },
      { new: true }
    );
    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const renewSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      {
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      { new: true }
    );
    res.json({ message: 'Subscription renewed', subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};