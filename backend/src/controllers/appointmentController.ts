import { Response } from 'express';
import mongoose from 'mongoose';
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

    const result = await AppointmentService.createAppointment(
      appointmentData,
      new mongoose.Types.ObjectId(context.workplaceId),
      context.userId
    );

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

    const calendarData = await CalendarService.getCalendarView(
      view,
      date ? new Date(date) : new Date(),
      {
        pharmacistId: pharmacistId ? new mongoose.Types.ObjectId(pharmacistId) : undefined,
        locationId,
      },
      new mongoose.Types.ObjectId(context.workplaceId)
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

    const result = await AppointmentService.getAppointments(
      {
        status,
        type,
        patientId: patientId ? new mongoose.Types.ObjectId(patientId) : undefined,
        assignedTo: pharmacistId ? new mongoose.Types.ObjectId(pharmacistId) : undefined,
        locationId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      {
        limit: parseInt(limit) || 50,
      },
      new mongoose.Types.ObjectId(context.workplaceId)
    );

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

    const appointment = await AppointmentService.getAppointmentById(
      id,
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!appointment) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
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

    const appointment = await AppointmentService.updateAppointment(
      id,
      new mongoose.Types.ObjectId(context.workplaceId),
      updateData,
      context.userId
    );

    if (!appointment) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
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

    const appointment = await AppointmentService.updateAppointmentStatus(
      new mongoose.Types.ObjectId(id),
      { status, reason, outcome },
      context.userId,
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!appointment) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
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

    const appointment = await AppointmentService.rescheduleAppointment(
      new mongoose.Types.ObjectId(id),
      {
        newDate: new Date(newDate),
        newTime,
        reason,
        notifyPatient,
      },
      context.userId,
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!appointment) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
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

    const result = await AppointmentService.cancelAppointment(
      new mongoose.Types.ObjectId(id),
      {
        reason,
        notifyPatient,
        cancelType,
      },
      context.userId,
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!result) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
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

    const slots = await CalendarService.calculateAvailableSlots(
      new mongoose.Types.ObjectId(pharmacistId),
      new Date(date),
      parseInt(duration) || 30,
      new mongoose.Types.ObjectId(context.workplaceId),
      type
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

    const result = await AppointmentService.getAppointments(
      {
        patientId: new mongoose.Types.ObjectId(patientId),
        status,
      },
      {
        limit: parseInt(limit) || 10,
      },
      new mongoose.Types.ObjectId(context.workplaceId)
    );

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

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(days) || 7));

    const result = await AppointmentService.getAppointments(
      {
        assignedTo: pharmacistId ? new mongoose.Types.ObjectId(pharmacistId) : undefined,
        locationId,
        startDate: new Date(),
        endDate,
        status: 'scheduled',
      },
      {},
      new mongoose.Types.ObjectId(context.workplaceId)
    );

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

    const appointment = await AppointmentService.updateAppointmentStatus(
      new mongoose.Types.ObjectId(id),
      { status: 'confirmed' },
      context.userId,
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!appointment) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found', 404);
    }

    sendSuccess(res, { appointment, message: 'Appointment confirmed successfully' }, 'Appointment confirmed successfully');
  }
);
