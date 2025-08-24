import express from 'express';
import { auth, authOptionalSubscription } from '../middlewares/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = express.Router();

// Public webhook endpoint (no auth required)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

// Subscription management routes - allow access even without active subscription
router.get(
  '/current',
  authOptionalSubscription,
  subscriptionController.getCurrentSubscription
);
router.get('/plans', subscriptionController.getAvailablePlans);
router.post(
  '/checkout',
  authOptionalSubscription,
  subscriptionController.createCheckoutSession
);
router.post(
  '/confirm-payment',
  authOptionalSubscription,
  subscriptionController.handleSuccessfulPayment
);

// Routes that require active subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

export default router;
