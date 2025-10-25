import express from 'express';
import {
  getPharmacistSchedule,
  updatePharmacistSchedule,
  requestTimeOff,
  updateTimeOffStatus,
  getCapacityReport,
  getAllPharmacistSchedules,
} from '../controllers/scheduleController';
import { auth } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import {
  validateRequest,
  updateScheduleSchema,
  createTimeOffSchema,
  updateTimeOffSchema,
  scheduleParamsSchema,
  timeOffParamsSchema,
  capacityQuerySchema,
} from '../validators/scheduleValidators';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ===============================
// SCHEDULE MANAGEMENT ROUTES
// ===============================

/**
 * GET /api/schedules/capacity
 * Get capacity report
 */
router.get(
  '/capacity',
  requireDynamicPermission('schedule.read'),
  validateRequest(capacityQuerySchema, 'query'),
  getCapacityReport
);

/**
 * GET /api/schedules/pharmacists
 * Get all pharmacist schedules
 */
router.get(
  '/pharmacists',
  requireDynamicPermission('schedule.read'),
  getAllPharmacistSchedules
);

/**
 * GET /api/schedules/pharmacist/:pharmacistId
 * Get pharmacist schedule
 */
router.get(
  '/pharmacist/:pharmacistId',
  requireDynamicPermission('schedule.read'),
  validateRequest(scheduleParamsSchema, 'params'),
  getPharmacistSchedule
);

/**
 * PUT /api/schedules/pharmacist/:pharmacistId
 * Update pharmacist schedule
 */
router.put(
  '/pharmacist/:pharmacistId',
  requireDynamicPermission('schedule.update'),
  validateRequest(scheduleParamsSchema, 'params'),
  validateRequest(updateScheduleSchema, 'body'),
  updatePharmacistSchedule
);

/**
 * POST /api/schedules/pharmacist/:pharmacistId/time-off
 * Request time off
 */
router.post(
  '/pharmacist/:pharmacistId/time-off',
  requireDynamicPermission('schedule.create'),
  validateRequest(scheduleParamsSchema, 'params'),
  validateRequest(createTimeOffSchema, 'body'),
  requestTimeOff
);

/**
 * PATCH /api/schedules/pharmacist/:pharmacistId/time-off/:timeOffId
 * Update time-off status (approve/reject)
 */
router.patch(
  '/pharmacist/:pharmacistId/time-off/:timeOffId',
  requireDynamicPermission('schedule.update'),
  validateRequest(timeOffParamsSchema, 'params'),
  validateRequest(updateTimeOffSchema, 'body'),
  updateTimeOffStatus
);

export default router;
