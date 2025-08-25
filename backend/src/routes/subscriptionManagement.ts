import express from 'express';
import { auth } from '../middlewares/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = express.Router();

// Analytics endpoint
router.get('/analytics', auth, subscriptionController.getSubscriptionAnalytics);

export default router;
