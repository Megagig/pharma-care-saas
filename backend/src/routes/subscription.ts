import express from 'express';
import { auth } from '../middlewares/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = express.Router();

// Public webhook endpoint (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// All other routes require authentication
router.use(auth);

// Subscription management
router.get('/current', subscriptionController.getCurrentSubscription);
router.get('/plans', subscriptionController.getAvailablePlans);
router.post('/checkout', subscriptionController.createCheckoutSession);
router.post('/confirm-payment', subscriptionController.handleSuccessfulPayment);
router.post('/cancel', subscriptionController.cancelSubscription);

export default router;