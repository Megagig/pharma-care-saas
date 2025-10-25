import express from 'express';
import {
  createFollowUp,
  getFollowUps,
  getFollowUp,
  updateFollowUp,
  completeFollowUp,
  convertToAppointment,
  getOverdueFollowUps,
  escalateFollowUp,
  getPatientFollowUps,
} from '../controllers/followUpController';
import { auth } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import {
  validateRequest,
  createFollowUpSchema,
  updateFollowUpSchema,
  completeFollowUpSchema,
  convertToAppointmentSchema,
  escalateFollowUpSchema,
  followUpParamsSchema,
  followUpQuerySchema,
} from '../validators/followUpValidators';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ===============================
// FOLLOW-UP TASK ROUTES
// ===============================

/**
 * GET /api/follow-ups/overdue
 * Get overdue follow-up tasks
 */
router.get(
  '/overdue',
  requireDynamicPermission('followup.read'),
  getOverdueFollowUps
);

/**
 * GET /api/follow-ups/patient/:patientId
 * Get follow-up tasks for a specific patient
 */
router.get(
  '/patient/:patientId',
  requireDynamicPermission('followup.read'),
  validateRequest(followUpParamsSchema, 'params'),
  getPatientFollowUps
);

/**
 * POST /api/follow-ups
 * Create a new follow-up task
 */
router.post(
  '/',
  requireDynamicPermission('followup.create'),
  validateRequest(createFollowUpSchema, 'body'),
  createFollowUp
);

/**
 * GET /api/follow-ups
 * List follow-up tasks with filtering and pagination
 */
router.get(
  '/',
  requireDynamicPermission('followup.read'),
  validateRequest(followUpQuerySchema, 'query'),
  getFollowUps
);

/**
 * GET /api/follow-ups/:id
 * Get single follow-up task details
 */
router.get(
  '/:id',
  requireDynamicPermission('followup.read'),
  validateRequest(followUpParamsSchema, 'params'),
  getFollowUp
);

/**
 * PUT /api/follow-ups/:id
 * Update follow-up task details
 */
router.put(
  '/:id',
  requireDynamicPermission('followup.update'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(updateFollowUpSchema, 'body'),
  updateFollowUp
);

/**
 * POST /api/follow-ups/:id/complete
 * Complete a follow-up task
 */
router.post(
  '/:id/complete',
  requireDynamicPermission('followup.update'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(completeFollowUpSchema, 'body'),
  completeFollowUp
);

/**
 * POST /api/follow-ups/:id/convert-to-appointment
 * Convert follow-up task to appointment
 */
router.post(
  '/:id/convert-to-appointment',
  requireDynamicPermission('followup.update'),
  requireDynamicPermission('appointment.create'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(convertToAppointmentSchema, 'body'),
  convertToAppointment
);

/**
 * POST /api/follow-ups/:id/escalate
 * Escalate follow-up task priority
 */
router.post(
  '/:id/escalate',
  requireDynamicPermission('followup.update'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(escalateFollowUpSchema, 'body'),
  escalateFollowUp
);

export default router;
