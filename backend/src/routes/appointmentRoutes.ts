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
import { requireDynamicPermission } from '../middlewares/rbac';
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

// Apply authentication to all routes
router.use(auth);

// ===============================
// APPOINTMENT ROUTES
// ===============================

/**
 * GET /api/appointments/calendar
 * Get appointments in calendar view
 */
router.get(
  '/calendar',
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentQuerySchema, 'query'),
  getCalendarAppointments
);

/**
 * GET /api/appointments/available-slots
 * Get available appointment slots
 */
router.get(
  '/available-slots',
  requireDynamicPermission('appointment.read'),
  validateRequest(availableSlotsQuerySchema, 'query'),
  getAvailableSlots
);

/**
 * GET /api/appointments/upcoming
 * Get upcoming appointments
 */
router.get(
  '/upcoming',
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
  requireDynamicPermission('appointment.read'),
  validateRequest(appointmentParamsSchema, 'params'),
  getAppointment
);

/**
 * PUT /api/appointments/:id
 * Update appointment details
 */
router.put(
  '/:id',
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(updateAppointmentSchema, 'body'),
  updateAppointment
);

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status
 */
router.patch(
  '/:id/status',
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(updateAppointmentStatusSchema, 'body'),
  updateAppointmentStatus
);

/**
 * POST /api/appointments/:id/reschedule
 * Reschedule an appointment
 */
router.post(
  '/:id/reschedule',
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(rescheduleAppointmentSchema, 'body'),
  rescheduleAppointment
);

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.post(
  '/:id/cancel',
  requireDynamicPermission('appointment.delete'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(cancelAppointmentSchema, 'body'),
  cancelAppointment
);

/**
 * POST /api/appointments/:id/confirm
 * Confirm an appointment
 */
router.post(
  '/:id/confirm',
  requireDynamicPermission('appointment.update'),
  validateRequest(appointmentParamsSchema, 'params'),
  validateRequest(confirmAppointmentSchema, 'body'),
  confirmAppointment
);

export default router;
