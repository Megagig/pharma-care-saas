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
import { authWithWorkspace } from '../middlewares/authWithWorkspace';
import { requireDynamicPermission } from '../middlewares/rbac';
import {
  requireFollowUpRead,
  requireFollowUpCreate,
  requireFollowUpUpdate,
  requireFollowUpComplete,
  requireFollowUpEscalate,
  requireFollowUpConvert,
  checkFollowUpOwnership,
  checkFollowUpFeatureAccess,
  applyFollowUpDataFiltering,
} from '../middlewares/followUpRBAC';
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

// Apply authentication and workspace context to all routes
router.use(auth);
router.use(authWithWorkspace);

// Apply feature access check to all routes
router.use(checkFollowUpFeatureAccess);

// ===============================
// FOLLOW-UP TASK ROUTES
// ===============================

/**
 * GET /api/follow-ups/overdue
 * Get overdue follow-up tasks
 */
router.get(
  '/overdue',
  requireFollowUpRead,
  requireDynamicPermission('followup.read'),
  applyFollowUpDataFiltering,
  getOverdueFollowUps
);

/**
 * GET /api/follow-ups/patient/:patientId
 * Get follow-up tasks for a specific patient
 */
router.get(
  '/patient/:patientId',
  requireFollowUpRead,
  requireDynamicPermission('followup.read'),
  validateRequest(followUpParamsSchema, 'params'),
  applyFollowUpDataFiltering,
  getPatientFollowUps
);

/**
 * POST /api/follow-ups
 * Create a new follow-up task
 */
router.post(
  '/',
  requireFollowUpCreate,
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
  requireFollowUpRead,
  requireDynamicPermission('followup.read'),
  validateRequest(followUpQuerySchema, 'query'),
  applyFollowUpDataFiltering,
  getFollowUps
);

/**
 * GET /api/follow-ups/:id
 * Get single follow-up task details
 */
router.get(
  '/:id',
  requireFollowUpRead,
  requireDynamicPermission('followup.read'),
  validateRequest(followUpParamsSchema, 'params'),
  checkFollowUpOwnership,
  getFollowUp
);

/**
 * PUT /api/follow-ups/:id
 * Update follow-up task details
 */
router.put(
  '/:id',
  requireFollowUpUpdate,
  requireDynamicPermission('followup.update'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(updateFollowUpSchema, 'body'),
  checkFollowUpOwnership,
  updateFollowUp
);

/**
 * POST /api/follow-ups/:id/complete
 * Complete a follow-up task
 */
router.post(
  '/:id/complete',
  requireFollowUpComplete,
  requireDynamicPermission('followup.complete'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(completeFollowUpSchema, 'body'),
  checkFollowUpOwnership,
  completeFollowUp
);

/**
 * POST /api/follow-ups/:id/convert-to-appointment
 * Convert follow-up task to appointment
 */
router.post(
  '/:id/convert-to-appointment',
  requireFollowUpConvert,
  requireDynamicPermission('followup.convert_to_appointment'),
  requireDynamicPermission('appointment.create'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(convertToAppointmentSchema, 'body'),
  checkFollowUpOwnership,
  convertToAppointment
);

/**
 * POST /api/follow-ups/:id/escalate
 * Escalate follow-up task priority
 */
router.post(
  '/:id/escalate',
  requireFollowUpEscalate,
  requireDynamicPermission('followup.escalate'),
  validateRequest(followUpParamsSchema, 'params'),
  validateRequest(escalateFollowUpSchema, 'body'),
  checkFollowUpOwnership,
  escalateFollowUp
);

export default router;
