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

export default router;
