import express from 'express';
import {
  getSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  getPlans
} from '../controllers/subscriptionController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.get('/plans', getPlans);
router.get('/', auth, getSubscription);
router.put('/', auth, updateSubscription);
router.post('/cancel', auth, cancelSubscription);
router.post('/renew', auth, renewSubscription);

export default router;