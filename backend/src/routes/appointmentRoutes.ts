/**
 * Appointment Routes
 * 
 * Routes for appointment scheduling and management with feature flag protection
 */

import express from 'express';
import { body, query, param } from 'express-validator';
import { auth } from '../middlewares/auth';
import rbac from '../middlewares/rbac';
import { validateRequest } from '../middlewares/validation';
import {
  requirePatientEngagementModule,
  requireAppointmentScheduling,
  requireRecurringAppointments,
  requirePatientPortal,
  PATIENT_ENGAGEMENT_FLAGS
} from '../middlewares/patientEngagementFeatureFlags';
import appointmentController from '../controllers/appointmentController';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Apply patient engagement module check to all routes
router.use(requirePatientEngagementModule);

/**
 * @route   GET /api/appointments/calendar
 * @desc    Get appointments for calendar view
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.get(
  '/calendar',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    query('view')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('View must be day, week, or month'),
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in ISO format'),
    query('pharmacistId')
      .optional()
      .isMongoId()
      .withMessage('Pharmacist ID must be valid'),
    query('locationId')
      .optional()
      .isString()
      .withMessage('Location ID must be a string'),
  ],
  validateRequest,
  appointmentController.getCalendarAppointments
);

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available appointment slots
 * @access  Private (Pharmacist, Manager, Admin) + Public (Patient Portal)
 */
router.get(
  '/available-slots',
  requireAppointmentScheduling,
  [
    query('date')
      .isISO8601()
      .withMessage('Date is required and must be in ISO format'),
    query('pharmacistId')
      .optional()
      .isMongoId()
      .withMessage('Pharmacist ID must be valid'),
    query('duration')
      .optional()
      .isInt({ min: 5, max: 120 })
      .withMessage('Duration must be between 5 and 120 minutes'),
    query('type')
      .optional()
      .isIn(['mtm_session', 'chronic_disease_review', 'new_medication_consultation', 
             'vaccination', 'health_check', 'smoking_cessation', 'general_followup'])
      .withMessage('Invalid appointment type'),
  ],
  validateRequest,
  appointmentController.getAvailableSlots
);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.post(
  '/',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    body('patientId')
      .isMongoId()
      .withMessage('Patient ID is required and must be valid'),
    body('type')
      .isIn(['mtm_session', 'chronic_disease_review', 'new_medication_consultation', 
             'vaccination', 'health_check', 'smoking_cessation', 'general_followup'])
      .withMessage('Valid appointment type is required'),
    body('scheduledDate')
      .isISO8601()
      .withMessage('Scheduled date is required and must be in ISO format'),
    body('scheduledTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Scheduled time must be in HH:mm format'),
    body('duration')
      .isInt({ min: 5, max: 120 })
      .withMessage('Duration must be between 5 and 120 minutes'),
    body('assignedTo')
      .optional()
      .isMongoId()
      .withMessage('Assigned pharmacist ID must be valid'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring must be a boolean'),
    body('recurrencePattern')
      .optional()
      .isObject()
      .withMessage('Recurrence pattern must be an object'),
    body('recurrencePattern.frequency')
      .if(body('isRecurring').equals('true'))
      .isIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'])
      .withMessage('Valid recurrence frequency is required'),
  ],
  validateRequest,
  appointmentController.createAppointment
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.get(
  '/:id',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
  ],
  validateRequest,
  appointmentController.getAppointment
);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.put(
  '/:id',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be in ISO format'),
    body('scheduledTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Scheduled time must be in HH:mm format'),
    body('duration')
      .optional()
      .isInt({ min: 5, max: 120 })
      .withMessage('Duration must be between 5 and 120 minutes'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('updateType')
      .optional()
      .isIn(['this_only', 'this_and_future'])
      .withMessage('Update type must be this_only or this_and_future'),
  ],
  validateRequest,
  appointmentController.updateAppointment
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.patch(
  '/:id/status',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('status')
      .isIn(['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
      .withMessage('Valid status is required'),
    body('reason')
      .if(body('status').isIn(['cancelled', 'no_show']))
      .notEmpty()
      .withMessage('Reason is required for cancellation or no-show'),
    body('outcome')
      .if(body('status').equals('completed'))
      .isObject()
      .withMessage('Outcome is required for completion'),
  ],
  validateRequest,
  appointmentController.updateAppointmentStatus
);

/**
 * @route   POST /api/appointments/:id/reschedule
 * @desc    Reschedule appointment
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.post(
  '/:id/reschedule',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('newDate')
      .isISO8601()
      .withMessage('New date is required and must be in ISO format'),
    body('newTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('New time is required and must be in HH:mm format'),
    body('reason')
      .notEmpty()
      .withMessage('Reason for rescheduling is required'),
    body('notifyPatient')
      .optional()
      .isBoolean()
      .withMessage('notifyPatient must be a boolean'),
  ],
  validateRequest,
  appointmentController.rescheduleAppointment
);

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.post(
  '/:id/cancel',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('reason')
      .notEmpty()
      .withMessage('Cancellation reason is required'),
    body('notifyPatient')
      .optional()
      .isBoolean()
      .withMessage('notifyPatient must be a boolean'),
    body('cancelType')
      .optional()
      .isIn(['this_only', 'all_future'])
      .withMessage('Cancel type must be this_only or all_future'),
  ],
  validateRequest,
  appointmentController.cancelAppointment
);

/**
 * @route   POST /api/appointments/:id/confirm
 * @desc    Confirm appointment (can be used by patients with token)
 * @access  Private or Public with confirmation token
 */
router.post(
  '/:id/confirm',
  // Note: This endpoint can be accessed without full auth if confirmation token is provided
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('confirmationToken')
      .optional()
      .isString()
      .withMessage('Confirmation token must be a string'),
  ],
  validateRequest,
  appointmentController.confirmAppointment
);

/**
 * @route   GET /api/appointments/patient/:patientId
 * @desc    Get appointments for a specific patient
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.get(
  '/patient/:patientId',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('patientId')
      .isMongoId()
      .withMessage('Patient ID must be valid'),
    query('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
      .withMessage('Invalid status filter'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
  ],
  validateRequest,
  appointmentController.getPatientAppointments
);

/**
 * @route   GET /api/appointments/upcoming
 * @desc    Get upcoming appointments
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.get(
  '/upcoming',
  requireAppointmentScheduling,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Days must be between 1 and 30'),
    query('pharmacistId')
      .optional()
      .isMongoId()
      .withMessage('Pharmacist ID must be valid'),
  ],
  validateRequest,
  appointmentController.getUpcomingAppointments
);

/**
 * Recurring Appointments Routes (require additional feature flag)
 */

/**
 * @route   POST /api/appointments/:id/recurring/update
 * @desc    Update recurring appointment series
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.post(
  '/:id/recurring/update',
  requireRecurringAppointments,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
    body('updateType')
      .isIn(['this_only', 'this_and_future', 'all_instances'])
      .withMessage('Update type is required'),
    body('changes')
      .isObject()
      .withMessage('Changes object is required'),
  ],
  validateRequest,
  appointmentController.updateRecurringAppointment
);

/**
 * @route   GET /api/appointments/:id/recurring/series
 * @desc    Get all appointments in recurring series
 * @access  Private (Pharmacist, Manager, Admin)
 */
router.get(
  '/:id/recurring/series',
  requireRecurringAppointments,
  rbac.requireRole('pharmacist', 'pharmacy_manager', 'admin'),
  [
    param('id')
      .isMongoId()
      .withMessage('Appointment ID must be valid'),
  ],
  validateRequest,
  appointmentController.getRecurringSeries
);

/**
 * Patient Portal Routes (require patient portal feature flag)
 */

/**
 * @route   GET /api/appointments/portal/types
 * @desc    Get available appointment types for patient portal
 * @access  Public (for patient portal)
 */
router.get(
  '/portal/types',
  requirePatientPortal,
  appointmentController.getAppointmentTypes
);

/**
 * @route   POST /api/appointments/portal/book
 * @desc    Book appointment through patient portal
 * @access  Public (for patient portal)
 */
router.post(
  '/portal/book',
  requirePatientPortal,
  [
    body('patientInfo')
      .isObject()
      .withMessage('Patient information is required'),
    body('appointmentType')
      .isIn(['mtm_session', 'chronic_disease_review', 'new_medication_consultation', 
             'vaccination', 'health_check', 'smoking_cessation', 'general_followup'])
      .withMessage('Valid appointment type is required'),
    body('scheduledDate')
      .isISO8601()
      .withMessage('Scheduled date is required'),
    body('scheduledTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Scheduled time is required'),
  ],
  validateRequest,
  appointmentController.bookAppointmentPortal
);

export default router;