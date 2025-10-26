import express from 'express';
import {
  getAppointmentAnalytics,
  getFollowUpAnalytics,
  getReminderAnalytics,
  getCapacityAnalytics,
  exportAppointmentAnalytics
} from '../controllers/appointmentAnalyticsController';
import { auth } from '../middlewares/auth';
import { rbac } from '../middlewares/rbac';
import { appointmentAnalyticsValidators } from '../validators/appointmentAnalyticsValidators';
import { validate } from '../middlewares/validation';
import { rateLimiting } from '../middlewares/rateLimiting';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiting({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many analytics requests, please try again later'
}));

/**
 * @route GET /api/appointments/analytics
 * @desc Get comprehensive appointment analytics
 * @access Private (requires view_appointment_analytics permission)
 */
router.get(
  '/appointments/analytics',
  rbac(['view_appointment_analytics', 'view_appointments']),
  validate(appointmentAnalyticsValidators.getAppointmentAnalytics),
  getAppointmentAnalytics
);

/**
 * @route GET /api/follow-ups/analytics
 * @desc Get follow-up task analytics
 * @access Private (requires view_followup_analytics permission)
 */
router.get(
  '/follow-ups/analytics',
  rbac(['view_followup_analytics', 'view_follow_ups']),
  validate(appointmentAnalyticsValidators.getFollowUpAnalytics),
  getFollowUpAnalytics
);

/**
 * @route GET /api/reminders/analytics
 * @desc Get reminder effectiveness analytics
 * @access Private (requires view_reminder_analytics permission)
 */
router.get(
  '/reminders/analytics',
  rbac(['view_reminder_analytics', 'view_appointments']),
  validate(appointmentAnalyticsValidators.getReminderAnalytics),
  getReminderAnalytics
);

/**
 * @route GET /api/schedules/capacity
 * @desc Get capacity utilization analytics
 * @access Private (requires view_capacity_analytics permission)
 */
router.get(
  '/schedules/capacity',
  rbac(['view_capacity_analytics', 'view_schedules']),
  validate(appointmentAnalyticsValidators.getCapacityAnalytics),
  getCapacityAnalytics
);

/**
 * @route POST /api/appointments/analytics/export
 * @desc Export appointment analytics to PDF/Excel
 * @access Private (requires export_analytics permission)
 */
router.post(
  '/appointments/analytics/export',
  rbac(['export_analytics', 'view_appointment_analytics']),
  validate(appointmentAnalyticsValidators.exportAnalytics),
  rateLimiting({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit exports to 10 per hour
    message: 'Too many export requests, please try again later'
  }),
  exportAppointmentAnalytics
);

export default router;