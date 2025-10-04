import { Request, Response } from 'express';
import { billingService } from '../services/BillingService';
import { nombaService } from '../services/nombaService';
import BillingSubscription from '../models/BillingSubscription';
import BillingInvoice from '../models/BillingInvoice';
import Payment from '../models/Payment';

interface AuthRequest extends Request {
  user?: any;
}

export class BillingController {
  /**
   * Create a new subscription
   */
  async createSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { planId, billingInterval = 'monthly', trialDays } = req.body;
      const user = req.user;

      if (!user?.workplaceId) {
        res.status(400).json({
          success: false,
          message: 'User must be associated with a workspace'
        });
        return;
      }

      const subscription = await billingService.createSubscription({
        workspaceId: user.workplaceId,
        planId,
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`,
        billingInterval,
        trialDays,
        metadata: {
          userId: user._id,
          createdBy: user.email
        }
      });

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Get current subscription for workspace
   */
  async getCurrentSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user?.workplaceId) {
        res.status(400).json({
          success: false,
          message: 'User must be associated with a workspace'
        });
        return;
      }

      const subscription = await billingService.getSubscriptionByWorkspace(user.workplaceId);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription'
      });
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async updateSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId, newPlanId, prorationBehavior = 'immediate' } = req.body;

      const subscription = await billingService.updateSubscription({
        subscriptionId,
        newPlanId,
        prorationBehavior
      });

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId, cancelAtPeriodEnd = true, reason } = req.body;

      const subscription = await billingService.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd,
        reason
      );

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription canceled successfully'
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  /**
   * Get billing history for workspace
   */
  async getBillingHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!user?.workplaceId) {
        res.status(400).json({
          success: false,
          message: 'User must be associated with a workspace'
        });
        return;
      }

      const invoices = await billingService.getInvoicesByWorkspace(user.workplaceId, limit);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      console.error('Get billing history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing history'
      });
    }
  }

  /**
   * Create checkout session for subscription payment
   */
  async createCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId, invoiceId } = req.body;
      const user = req.user;

      let invoice;
      if (invoiceId) {
        invoice = await BillingInvoice.findById(invoiceId);
      } else if (subscriptionId) {
        // Create invoice for subscription payment
        const subscription = await BillingSubscription.findById(subscriptionId);
        if (!subscription) {
          res.status(404).json({
            success: false,
            message: 'Subscription not found'
          });
          return;
        }
        // Create invoice logic would go here
      }

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
        return;
      }

      // Create Nomba payment
      const paymentData = {
        amount: invoice.total,
        currency: invoice.currency,
        customerEmail: invoice.customerEmail,
        customerName: invoice.customerName,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        callbackUrl: `${process.env.FRONTEND_URL}/billing/payment-success`,
        metadata: {
          invoiceId: invoice._id.toString(),
          subscriptionId: subscriptionId,
          userId: user._id.toString()
        }
      };

      if (nombaService.isNombaConfigured()) {
        const paymentResponse = await nombaService.initiatePayment(paymentData);

        if (paymentResponse.success) {
          // Store payment record
          await Payment.create({
            userId: user._id,
            amount: invoice.total,
            currency: invoice.currency,
            paymentReference: paymentResponse.data!.reference,
            status: 'pending',
            paymentMethod: 'nomba',
            metadata: paymentData.metadata
          });

          res.json({
            success: true,
            data: {
              checkoutUrl: paymentResponse.data!.checkoutUrl,
              reference: paymentResponse.data!.reference
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: paymentResponse.message
          });
        }
      } else {
        // Development mode or Nomba not configured
        const mockReference = `mock_${Date.now()}_${user._id}`;
        
        await Payment.create({
          userId: user._id,
          amount: invoice.total,
          currency: invoice.currency,
          paymentReference: mockReference,
          status: 'pending',
          paymentMethod: 'nomba',
          metadata: paymentData.metadata
        });

        res.json({
          success: true,
          data: {
            checkoutUrl: `${process.env.FRONTEND_URL}/billing/mock-payment?reference=${mockReference}`,
            reference: mockReference
          },
          message: 'Development mode: Mock payment initiated'
        });
      }
    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create checkout session'
      });
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Payment reference is required'
        });
        return;
      }

      // Find payment record
      const paymentRecord = await Payment.findOne({ paymentReference });
      if (!paymentRecord) {
        res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
        return;
      }

      // Verify payment with Nomba (unless mock)
      if (!paymentReference.startsWith('mock_') && nombaService.isNombaConfigured()) {
        const verificationResult = await nombaService.verifyPayment(paymentReference);
        
        if (!verificationResult.success || verificationResult.data?.status !== 'success') {
          res.status(400).json({
            success: false,
            message: 'Payment verification failed'
          });
          return;
        }
      }

      // Update payment record
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Update invoice if applicable
      const invoiceId = paymentRecord.metadata?.invoiceId;
      if (invoiceId) {
        const invoice = await BillingInvoice.findById(invoiceId);
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          invoice.amountPaid = invoice.total;
          await invoice.save();
        }
      }

      res.json({
        success: true,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      console.error('Handle payment success error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment'
      });
    }
  }

  /**
   * Process refund
   */
  async processRefund(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { paymentReference, amount, reason } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Payment reference is required'
        });
        return;
      }

      // Find payment record
      const paymentRecord = await Payment.findOne({ paymentReference });
      if (!paymentRecord) {
        res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
        return;
      }

      if (paymentRecord.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Can only refund completed payments'
        });
        return;
      }

      // Process refund with Nomba
      if (nombaService.isNombaConfigured()) {
        const refundResult = await nombaService.refundPayment(paymentReference, amount);
        
        if (refundResult.success) {
          // Update payment record
          paymentRecord.status = 'refunded';
          paymentRecord.refundedAt = new Date();
          paymentRecord.refundAmount = amount || paymentRecord.amount;
          paymentRecord.refundReason = reason;
          await paymentRecord.save();

          res.json({
            success: true,
            message: 'Refund processed successfully'
          });
        } else {
          res.status(400).json({
            success: false,
            message: refundResult.message
          });
        }
      } else {
        // Mock refund for development
        paymentRecord.status = 'refunded';
        paymentRecord.refundedAt = new Date();
        paymentRecord.refundAmount = amount || paymentRecord.amount;
        paymentRecord.refundReason = reason;
        await paymentRecord.save();

        res.json({
          success: true,
          message: 'Refund processed successfully (development mode)'
        });
      }
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }
  }

  /**
   * Get billing analytics (admin only)
   */
  async getBillingAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const analytics = await billingService.getBillingAnalytics(timeRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get billing analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing analytics'
      });
    }
  }
}

export const billingController = new BillingController();