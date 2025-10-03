import express from 'express';
import { body, query } from 'express-validator';
import { auth, requireRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { billingController } from '../controllers/billingController';

const router = express.Router();

/**
 * @route POST /api/billing/subscriptions
 * @desc Create a new subscription
 * @access Private
 */
router.post(
  '/subscriptions',
  auth,
  [
    body('planId')
      .notEmpty()
      .withMessage('Plan ID is required')
      .isMongoId()
      .withMessage('Invalid plan ID'),
    body('billingInterval')
      .optional()
      .isIn(['monthly', 'yearly'])
      .withMessage('Billing interval must be monthly or yearly'),
    body('trialDays')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Trial days must be between 0 and 365'),
  ],
  validateRequest,
  billingController.createSubscription.bind(billingController)
);

/**
 * @route GET /api/billing/subscriptions/current
 * @desc Get current subscription for workspace
 * @access Private
 */
router.get(
  '/subscriptions/current',
  auth,
  billingController.getCurrentSubscription.bind(billingController)
);

/**
 * @route PUT /api/billing/subscriptions/:subscriptionId
 * @desc Update subscription (upgrade/downgrade)
 * @access Private
 */
router.put(
  '/subscriptions/:subscriptionId',
  auth,
  [
    body('newPlanId')
      .notEmpty()
      .withMessage('New plan ID is required')
      .isMongoId()
      .withMessage('Invalid plan ID'),
    body('prorationBehavior')
      .optional()
      .isIn(['immediate', 'next_cycle'])
      .withMessage('Proration behavior must be immediate or next_cycle'),
  ],
  validateRequest,
  billingController.updateSubscription.bind(billingController)
);

/**
 * @route POST /api/billing/subscriptions/:subscriptionId/cancel
 * @desc Cancel subscription
 * @access Private
 */
router.post(
  '/subscriptions/:subscriptionId/cancel',
  auth,
  [
    body('cancelAtPeriodEnd')
      .optional()
      .isBoolean()
      .withMessage('Cancel at period end must be boolean'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
  ],
  validateRequest,
  billingController.cancelSubscription.bind(billingController)
);

/**
 * @route GET /api/billing/history
 * @desc Get billing history for workspace
 * @access Private
 */
router.get(
  '/history',
  auth,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  billingController.getBillingHistory.bind(billingController)
);

/**
 * @route POST /api/billing/checkout
 * @desc Create checkout session for payment
 * @access Private
 */
router.post(
  '/checkout',
  auth,
  [
    body('subscriptionId')
      .optional()
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    body('invoiceId')
      .optional()
      .isMongoId()
      .withMessage('Invalid invoice ID'),
  ],
  validateRequest,
  billingController.createCheckoutSession.bind(billingController)
);

/**
 * @route POST /api/billing/payment-success
 * @desc Handle successful payment
 * @access Private
 */
router.post(
  '/payment-success',
  auth,
  [
    body('paymentReference')
      .notEmpty()
      .withMessage('Payment reference is required'),
  ],
  validateRequest,
  billingController.handlePaymentSuccess.bind(billingController)
);

/**
 * @route POST /api/billing/refunds
 * @desc Process refund
 * @access Private - Admin only
 */
router.post(
  '/refunds',
  auth,
  requireRole(['super_admin', 'admin']),
  [
    body('paymentReference')
      .notEmpty()
      .withMessage('Payment reference is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
  ],
  validateRequest,
  billingController.processRefund.bind(billingController)
);

/**
 * @route GET /api/billing/analytics
 * @desc Get billing analytics
 * @access Private - Super Admin only
 */
router.get(
  '/analytics',
  auth,
  requireRole(['super_admin']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],
  validateRequest,
  billingController.getBillingAnalytics.bind(billingController)
);

export default router;