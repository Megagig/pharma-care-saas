import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ISubscription } from '../models/Subscription';
import { IPayment } from '../models/Payment';

const Subscription = mongoose.model<ISubscription>('Subscription');
const Payment = mongoose.model<IPayment>('Payment');

interface CustomRequest extends Request {
  user?: {
    _id: string;
  };
}

class SubscriptionController {
  // Get subscription analytics
  async getSubscriptionAnalytics(
    req: CustomRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      // Get current subscription details
      const currentSubscription = await Subscription.findOne({
        userId,
        status: 'active',
      }).populate('planId');

      // Get payment history for the last 30 days
      const payments = await Payment.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      });

      // Calculate metrics
      const totalPayments = payments.length;
      const successfulPayments = payments.filter(
        (p: IPayment) => p.status === 'completed'
      ).length;
      const totalAmount = payments.reduce(
        (sum: number, p: IPayment) => sum + (p.amount || 0),
        0
      );
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      return res.json({
        currentPlan:
          (currentSubscription?.planId as any)?.name || 'No active plan',
        billingCycle:
          (currentSubscription?.planId as any)?.billingInterval || 'N/A',
        status: currentSubscription?.status || 'inactive',
        metrics: {
          totalPayments,
          successfulPayments,
          totalAmount,
          averageAmount,
        },
        subscription: currentSubscription,
        recentPayments: payments.slice(0, 5), // Last 5 payments
      });
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return res
        .status(500)
        .json({ message: 'Error fetching subscription analytics' });
    }
  }
}

// Export the controller
export const subscriptionController = new SubscriptionController();
