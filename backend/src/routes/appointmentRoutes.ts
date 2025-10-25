import express from 'express';
import {
  createAppointment,
  getCalendarAppointments,
  getAppointments,
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getAvailableSlots,
  getPatientAppointments,
  getUpcomingAppointments,
  confirmAppointment,
} from '../controllers/appointmentController';
import { auth } from '../middlewares/auth';
import { authWithWorkspace } from '../middlewares/authWithWorkspace';
import { requireDynamicPermission } from '../middlewares/rbac';
import {
  requireAppointmentRead,
  requireAppointmentCreate,
  requireAppointmentUpdate,
  requireAppointmentDelete,
  requireAppointmentReschedule,
  requireAppointmentCancel,
  requireAppointmentConfirm,
  checkAppointmentOwnership,
  checkAppointmentFeatureAccess,
} from '../middlewares/appointmentRBAC';
import {
  validateRequest,
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  confirmAppointmentSchema,
  appointmentParamsSchema,
  appointmentQuerySchema,
  availableSlotsQuerySchema,
  upcomingAppointmentsQuerySchema,
} from '../validators/appointmentValidators';

const router = express.Router();

// Apply authentication and workspace context to all routes
router.use(auth);
router.use(authWithWorkspace);

// Apply feature access check to all routes
router.use(checkAppointmentFeatureAccess);

// ===============================
// APPOINTMENT ROUTES
// ===============================

/**
 * GET /api/appointments/calendar
 * Get appointments in calendar view
 */
router.get(
  '/calendar',
  requireAppointmentRead,
  requireDynamicPermission('appointment.calendar_view'),
  validateRequest(appointmentQuerySchema, 'query'),
  getCalendarAppointments
);

/**
 * GET /api/appointments/available-slots
 * Get available appointment slots
 */
router.get(
  '/available-slots',
  requireAppointmentRead,
  requireDynamicPermission('appointment.available_slots'),
  validateRequest(availableSlotsQuerySchema, 'query'),
  getAvailableSlots
);

/**
 * GET /api/appointments/upcoming
 * Get upcoming appointments
 */
router.get(
  '/upcoming',
  requireAppointmentRead,
  requireDynamicPermission('appointment.read'),
  validateRequest(upcomingAppointmentsQuerySchema, 'query'),
  getUpcomingAppointments
);

/**
 * GET /api/appointments/patient/:patientId
 * Get appointments for a specific patient
 */
router.get(
  '/patient/:patientId',
  requireAppointmentRead,
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentParamsSchema, 'params'),
  getPatientAppointments
);

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post(
  '/',
  requireAppointmentCreate,
  requireDynamicPermission('appointment.create'),
  validateRequest(createAppointmentSchema, 'body'),
  createAppointment
);

/**
 * GET /api/appointments
 * List appointments with filtering and pagination
 */
router.get(
  '/',
  requireAppointmentRead,
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentQuerySchema, 'query'),
  getAppointments
);

/**
 * GET /api/appointments/:id
 * Get single appointment details
 */
router.get(
  '/:id',
  requireAppointmentRead,
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentParamsSchema, 'params'),
  checkAppointmentOwnership,
  getAppointment
);

/**
 * PUT /api/appointments/:id
 * Update appointment details
 */
router.put(
  '/:id',
  requireAppointmentUpdate,
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(updateAppointmentSchema, 'body'),
  checkAppointmentOwnership,
  updateAppointment
);

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status
 */
router.patch(
  '/:id/status',
  requireAppointmentUpdate,
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(updateAppointmentStatusSchema, 'body'),
  checkAppointmentOwnership,
  updateAppointmentStatus
);

/**
 * POST /api/appointments/:id/reschedule
 * Reschedule an appointment
 */
router.post(
  '/:id/reschedule',
  requireAppointmentReschedule,
  requireDynamicPermission('appointment.reschedule'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(rescheduleAppointmentSchema, 'body'),
  checkAppointmentOwnership,
  rescheduleAppointment
);

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.post(
  '/:id/cancel',
  requireAppointmentCancel,
  requireDynamicPermission('appointment.cancel'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(cancelAppointmentSchema, 'body'),
  checkAppointmentOwnership,
  cancelAppointment
);

/**
 * POST /api/appointments/:id/confirm
 * Confirm an appointment
 */
router.post(
  '/:id/confirm',
  requireAppointmentConfirm,
  requireDynamicPermission('appointment.confirm'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(confirmAppointmentSchema, 'body'),
  checkAppointmentOwnership,
  confirmAppointment
);

export default router;
