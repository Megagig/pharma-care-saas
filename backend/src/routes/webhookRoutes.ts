import express from 'express';
import { webhookController } from '../controllers/webhookController';

const router = express.Router();

/**
 * @route POST /api/webhooks/nomba
 * @desc Handles webhooks from Nomba payment gateway
 * @access Public - secured by webhook signature
 */
router.post(
   '/nomba',
   webhookController.handleNombaWebhook.bind(webhookController)
);

/**
 * @route POST /api/webhooks/paystack
 * @desc Handles webhooks from Paystack payment gateway
 * @access Public - secured by webhook signature
 */
router.post(
   '/paystack',
   webhookController.handlePaystackWebhook.bind(webhookController)
);

export default router;
