import express from 'express';
import {
  getPayments,
  createPayment,
  getPayment,
  processWebhook
} from '../controllers/paymentController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/webhook', processWebhook); // Webhook doesn't need auth
router.use(auth); // All other payment routes require authentication

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.get('/:id', getPayment);

export default router;