import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import AppointmentService from '../services/AppointmentService';
import CalendarService from '../services/CalendarService';
import PatientPortalService from '../services/PatientPortalService';
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getRequestContext,
} from '../utils/responseHelpers';

/**
 * Patient Portal Controller
 * Handles patient-facing appointment booking and management
 */

/**
 * GET /api/patient-portal/appointment-types
 * Get available appointment types for booking
 * Public endpoint - no authentication required
 */
export const getAppointmentTypes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // For public endpoint, we need to determine workspace from query parameter or default
    const workplaceId = req.query.workplaceId as string;
    
    if (!workplaceId || !mongoose.Types.ObjectId.isValid(workplaceId)) {
      return sendError(res, 'BAD_REQUEST', 'Valid workplace ID is required', 400);
    }

    const appointmentTypes = await PatientPortalService.getAppointmentTypes(
      new mongoose.Types.ObjectId(workplaceId)
    );

    sendSuccess(res, appointmentTypes, 'Appointment types retrieved successfully');
  }
);

/**
 * GET /api/patient-portal/available-slots
 * Get available appointment slots
 * Public endpoint - no authentication required
 */
export const getAvailableSlots = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { 
      workplaceId, 
      date, 
      type, 
      duration = 30, 
      pharmacistId, 
      locationId 
    } = req.query as any;

    if (!workplaceId || !mongoose.Types.ObjectId.isValid(workplaceId)) {
      return sendError(res, 'BAD_REQUEST', 'Valid workplace ID is required', 400);
    }

    const targetDate = date ? new Date(date) : new Date();
    
    const availableSlots = await PatientPortalService.getAvailableSlots(
      new mongoose.Types.ObjectId(workplaceId),
      targetDate,
      {
        type,
        duration: parseInt(duration),
        pharmacistId: pharmacistId ? new mongoose.Types.ObjectId(pharmacistId) : undefined,
        locationId,
      }
    );

    sendSuccess(res, availableSlots, 'Available slots retrieved successfully');
  }
);

/**
 * POST /api/patient-portal/appointments
 * Book a new appointment
 * Requires authentication
 */
export const bookAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    
    // Validate that the patient belongs to the authenticated user's workplace
    const appointmentData = {
      ...req.body,
      workplaceId: context.workplaceId,
      createdBy: context.userId,
      // For patient portal, the patient is booking for themselves
      // We'll validate this in the service layer
    };

    const result = await PatientPortalService.bookAppointment(
      appointmentData,
      new mongoose.Types.ObjectId(context.workplaceId),
      context.userId
    );

    sendSuccess(res, result, 'Appointment booked successfully', 201);
  }
);

/**
 * GET /api/patient-portal/appointments
 * Get my appointments (patient's own appointments)
 * Requires authentication
 */
export const getMyAppointments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const {
      status,
      type,
      startDate,
      endDate,
      limit,
      cursor,
      includeCompleted,
      includeCancelled,
    } = req.query as any;

    // For patient portal, we only show appointments for patients associated with the user
    const result = await PatientPortalService.getPatientAppointments(
      new mongoose.Types.ObjectId(context.workplaceId),
      context.userId,
      {
        status,
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeCompleted: includeCompleted === 'true',
        includeCancelled: includeCancelled === 'true',
      },
      {
        limit: parseInt(limit) || 20,
        cursor,
      }
    );

    sendSuccess(res, result, 'Appointments retrieved successfully');
  }
);

/**
 * POST /api/patient-portal/appointments/:id/reschedule
 * Reschedule an appointment
 * Requires authentication
 */
export const rescheduleAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { newDate, newTime, reason, notifyPharmacist = true } = req.body;

    const result = await PatientPortalService.rescheduleAppointment(
      new mongoose.Types.ObjectId(id),
      {
        newDate: new Date(newDate),
        newTime,
        reason,
        notifyPharmacist,
      },
      new mongoose.Types.ObjectId(context.workplaceId),
      context.userId
    );

    sendSuccess(res, result, 'Appointment rescheduled successfully');
  }
);

/**
 * POST /api/patient-portal/appointments/:id/cancel
 * Cancel an appointment
 * Requires authentication
 */
export const cancelAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { reason, notifyPharmacist = true } = req.body;

    const result = await PatientPortalService.cancelAppointment(
      new mongoose.Types.ObjectId(id),
      {
        reason,
        notifyPharmacist,
      },
      new mongoose.Types.ObjectId(context.workplaceId),
      context.userId
    );

    sendSuccess(res, result, 'Appointment cancelled successfully');
  }
);

/**
 * POST /api/patient-portal/appointments/:id/confirm
 * Confirm an appointment
 * Supports both authenticated users and confirmation tokens
 */
export const confirmAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { confirmationToken, patientNotes, specialRequirements } = req.body;

    // If user is authenticated, use their context
    if (req.user) {
      const context = getRequestContext(req);
      
      const result = await PatientPortalService.confirmAppointment(
        new mongoose.Types.ObjectId(id),
        {
          patientNotes,
          specialRequirements,
        },
        new mongoose.Types.ObjectId(context.workplaceId),
        context.userId
      );

      return sendSuccess(res, result, 'Appointment confirmed successfully');
    }

    // If no user but has confirmation token, use token-based confirmation
    if (confirmationToken) {
      const result = await PatientPortalService.confirmAppointmentWithToken(
        new mongoose.Types.ObjectId(id),
        confirmationToken,
        {
          patientNotes,
          specialRequirements,
        }
      );

      return sendSuccess(res, result, 'Appointment confirmed successfully');
    }

    // Neither authenticated user nor token provided
    return sendError(res, 'UNAUTHORIZED', 'Authentication or confirmation token required', 401);
  }
);