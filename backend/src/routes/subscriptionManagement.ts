import express from 'express';
import { auth } from '../middlewares/auth';
import { subscriptionController } from '../controllers/subscriptionManagementController';

const router = express.Router();

// Analytics endpoint
router.get('/analytics', auth, subscriptionController.getSubscriptionAnalytics);

// Subscription checkout endpoints
router.post('/checkout', auth, subscriptionController.checkout);
router.get('/verify', auth, subscriptionController.verifyPayment);

export default router;
