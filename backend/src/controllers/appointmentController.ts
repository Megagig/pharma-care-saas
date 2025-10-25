import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import AppointmentService from '../services/AppointmentService';
import CalendarService from '../services/CalendarService';
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getRequestContext,
} from '../utils/responseHelpers';

/**
 * Appointment Management Controller
 * Handles all appointment-related HTTP requests
 */

/**
 * POST /api/appointments
 * Create a new appointment
 */
export const createAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const appointmentData = {
      ...req.body,
      workplaceId: context.workplaceId,
      createdBy: context.userId,
      assignedTo: req.body.assignedTo || context.userId,
    };

    const appointmentService = AppointmentService.getInstance();
    const result = await appointmentService.createAppointment(appointmentData);

    sendSuccess(res, result, 'Appointment created successfully', 201);
  }
);

/**
 * GET /api/appointments/calendar
 * Get appointments in calendar view
 */
export const getCalendarAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { view = 'week', date, pharmacistId, locationId } = req.query as any;

    const calendarService = CalendarService.getInstance();
    const calendarData = await calendarService.getCalendarView(
      context.workplaceId,
      {
        view,
        date: date ? new Date(date) : new Date(),
        pharmacistId,
        locationId,
      }
    );

    sendSuccess(res, calendarData, 'Calendar data retrieved successfully');
  }
);

/**
 * GET /api/appointments
 * List appointments with filtering and pagination
 */
export const getAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const {
      status,
      type,
      patientId,
      pharmacistId,
      locationId,
      startDate,
      endDate,
      limit,
      cursor,
    } = req.query as any;

    const appointmentService = AppointmentService.getInstance();
    const result = await appointmentService.getAppointments(context.workplaceId, {
      status,
      type,
      patientId,
      assignedTo: pharmacistId,
      locationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: parseInt(limit) || 50,
      cursor,
    });

    sendSuccess(res, result, 'Appointments retrieved successfully');
  }
);

/**
 * GET /api/appointments/:id
 * Get single appointment details
 */
export const getAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;

    const appointmentService = AppointmentService.getInstance();
    const appointment = await appointmentService.getAppointmentById(
      id,
      context.workplaceId
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment }, 'Appointment retrieved successfully');
  }
);

/**
 * PUT /api/appointments/:id
 * Update appointment details
 */
export const updateAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: context.userId,
    };

    const appointmentService = AppointmentService.getInstance();
    const appointment = await appointmentService.updateAppointment(
      id,
      context.workplaceId,
      updateData
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment }, 'Appointment updated successfully');
  }
);

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status
 */
export const updateAppointmentStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { status, reason, outcome } = req.body;

    const appointmentService = AppointmentService.getInstance();
    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      context.workplaceId,
      status,
      context.userId,
      { reason, outcome }
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment }, 'Appointment status updated successfully');
  }
);

/**
 * POST /api/appointments/:id/reschedule
 * Reschedule an appointment
 */
export const rescheduleAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { newDate, newTime, reason, notifyPatient } = req.body;

    const appointmentService = AppointmentService.getInstance();
    const appointment = await appointmentService.rescheduleAppointment(
      id,
      context.workplaceId,
      {
        newDate: new Date(newDate),
        newTime,
        reason,
        notifyPatient,
        rescheduledBy: context.userId,
      }
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment, notificationSent: notifyPatient }, 'Appointment rescheduled successfully');
  }
);

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment
 */
export const cancelAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { reason, notifyPatient, cancelType } = req.body;

    const appointmentService = AppointmentService.getInstance();
    const result = await appointmentService.cancelAppointment(
      id,
      context.workplaceId,
      {
        reason,
        notifyPatient,
        cancelType,
        cancelledBy: context.userId,
      }
    );

    if (!result) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, result, 'Appointment cancelled successfully');
  }
);

/**
 * GET /api/appointments/available-slots
 * Get available appointment slots
 */
export const getAvailableSlots = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { date, pharmacistId, duration, type, locationId } = req.query as any;

    const calendarService = CalendarService.getInstance();
    const slots = await calendarService.calculateAvailableSlots(
      context.workplaceId,
      {
        date: new Date(date),
        pharmacistId,
        duration: parseInt(duration) || 30,
        appointmentType: type,
        locationId,
      }
    );

    sendSuccess(res, { slots }, 'Available slots retrieved successfully');
  }
);

/**
 * GET /api/appointments/patient/:patientId
 * Get appointments for a specific patient
 */
export const getPatientAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { patientId } = req.params;
    const { status, limit } = req.query as any;

    const appointmentService = AppointmentService.getInstance();
    const result = await appointmentService.getAppointments(context.workplaceId, {
      patientId,
      status,
      limit: parseInt(limit) || 10,
    });

    sendSuccess(res, result, 'Patient appointments retrieved successfully');
  }
);

/**
 * GET /api/appointments/upcoming
 * Get upcoming appointments
 */
export const getUpcomingAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { days, pharmacistId, locationId } = req.query as any;

    const appointmentService = AppointmentService.getInstance();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(days) || 7));

    const result = await appointmentService.getAppointments(context.workplaceId, {
      assignedTo: pharmacistId,
      locationId,
      startDate: new Date(),
      endDate,
      status: 'scheduled',
    });

    // Calculate summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const summary = {
      today: result.appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      }).length,
      tomorrow: result.appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === tomorrow.getTime();
      }).length,
      thisWeek: result.appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate >= today && aptDate <= weekEnd;
      }).length,
    };

    sendSuccess(res, { ...result, summary }, 'Upcoming appointments retrieved successfully');
  }
);

/**
 * POST /api/appointments/:id/confirm
 * Confirm an appointment (can be used by patient with token)
 */
export const confirmAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { confirmationToken } = req.body;

    // TODO: Validate confirmation token if provided
    // For now, just update the status

    const appointmentService = AppointmentService.getInstance();
    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      context.workplaceId,
      'confirmed',
      context.userId
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment, message: 'Appointment confirmed successfully' }, 'Appointment confirmed successfully');
  }
);
