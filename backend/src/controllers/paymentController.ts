import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';

interface AuthRequest extends Request {
  user?: any;
}

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('subscription')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({ payment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('subscription');

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    res.json({ payment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const processWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle payment webhooks from Stripe/PayPal
    const { type, data } = req.body;

    if (type === 'payment.succeeded') {
      await Payment.findByIdAndUpdate(
        data.paymentId,
        { status: 'completed' }
      );
    }

    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};