import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import CalendarService from '../services/CalendarService';
import PharmacistSchedule from '../models/PharmacistSchedule';
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getRequestContext,
} from '../utils/responseHelpers';

/**
 * Pharmacist Schedule Management Controller
 * Handles all schedule-related HTTP requests
 */

/**
 * GET /api/schedules/pharmacist/:pharmacistId
 * Get pharmacist schedule
 */
export const getPharmacistSchedule = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { pharmacistId } = req.params;

    const availability = await CalendarService.getPharmacistAvailability(
      new mongoose.Types.ObjectId(pharmacistId),
      new Date(),
      new mongoose.Types.ObjectId(context.workplaceId)
    );

    if (!availability) {
      return sendError(res, 'NOT_FOUND', 'Pharmacist schedule not found', 404);
    }

    // Get pharmacist schedule for time-off information
    const schedule = await PharmacistSchedule.findOne({
      pharmacistId: new mongoose.Types.ObjectId(pharmacistId),
      workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
    });

    // Get upcoming time-off
    const upcomingTimeOff = schedule?.timeOff?.filter((timeOff: any) => {
      return new Date(timeOff.endDate) >= new Date() && timeOff.status === 'approved';
    }) || [];

    sendSuccess(res, {
      schedule: availability,
      upcomingTimeOff,
      utilizationRate: availability.utilizationRate,
    }, 'Pharmacist schedule retrieved successfully');
  }
);

/**
 * PUT /api/schedules/pharmacist/:pharmacistId
 * Update pharmacist schedule
 */
export const updatePharmacistSchedule = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { pharmacistId } = req.params;
    const { workingHours, appointmentPreferences, locationId, isActive } = req.body;

    // Find existing schedule or create new one
    let schedule = await PharmacistSchedule.findOne({
      workplaceId: context.workplaceId,
      pharmacistId,
      isActive: true,
    });

    if (!schedule) {
      // Create new schedule
      schedule = new PharmacistSchedule({
        workplaceId: context.workplaceId,
        pharmacistId,
        locationId,
        workingHours: workingHours || [],
        appointmentPreferences: appointmentPreferences || {
          appointmentTypes: [],
          defaultDuration: 30,
        },
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: context.userId,
      });
    } else {
      // Update existing schedule
      if (workingHours) schedule.workingHours = workingHours;
      if (appointmentPreferences) schedule.appointmentPreferences = appointmentPreferences;
      if (locationId !== undefined) schedule.locationId = locationId;
      if (isActive !== undefined) schedule.isActive = isActive;
      schedule.updatedBy = context.userId;
    }

    await schedule.save();

    sendSuccess(res, { schedule }, 'Pharmacist schedule updated successfully');
  }
);

/**
 * POST /api/schedules/pharmacist/:pharmacistId/time-off
 * Request time off
 */
export const requestTimeOff = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { pharmacistId } = req.params;
    const { startDate, endDate, reason, type } = req.body;

    // Find pharmacist schedule
    const schedule = await PharmacistSchedule.findOne({
      workplaceId: context.workplaceId,
      pharmacistId,
      isActive: true,
    });

    if (!schedule) {
      return sendError(res, 'NOT_FOUND', 'Pharmacist schedule not found', 404);
    }

    // Add time-off request
    const timeOffRequest = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      type,
      status: 'pending' as const,
    };

    schedule.timeOff = schedule.timeOff || [];
    schedule.timeOff.push(timeOffRequest);
    schedule.updatedBy = context.userId;
    await schedule.save();

    // Check for affected appointments
    const Appointment = (await import('../models/Appointment')).default;
    const affectedAppointments = await Appointment.find({
      workplaceId: context.workplaceId,
      assignedTo: pharmacistId,
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: { $in: ['scheduled', 'confirmed'] },
      isDeleted: { $ne: true },
    }).select('_id scheduledDate scheduledTime patientId type');

    sendSuccess(res, {
      timeOff: timeOffRequest,
      affectedAppointments,
    }, 'Time-off request created successfully', 201);
  }
);

/**
 * PATCH /api/schedules/pharmacist/:pharmacistId/time-off/:timeOffId
 * Update time-off status (approve/reject)
 */
export const updateTimeOffStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { pharmacistId, timeOffId } = req.params;
    const { status, reason } = req.body;

    // Find pharmacist schedule
    const schedule = await PharmacistSchedule.findOne({
      workplaceId: context.workplaceId,
      pharmacistId,
      isActive: true,
    });

    if (!schedule) {
      return sendError(res, 'NOT_FOUND', 'Pharmacist schedule not found', 404);
    }

    // Find and update time-off request
    const timeOffIndex = schedule.timeOff?.findIndex(
      (to: any) => to._id.toString() === timeOffId
    );

    if (timeOffIndex === undefined || timeOffIndex === -1) {
      return sendError(res, 'NOT_FOUND', 'Time-off request not found', 404);
    }

    schedule.timeOff![timeOffIndex].status = status;
    if (status === 'approved') {
      schedule.timeOff![timeOffIndex].approvedBy = context.userId;
    }
    schedule.updatedBy = context.userId;
    await schedule.save();

    sendSuccess(res, {
      timeOff: schedule.timeOff![timeOffIndex],
    }, `Time-off request ${status} successfully`);
  }
);

/**
 * GET /api/schedules/capacity
 * Get capacity report
 */
export const getCapacityReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { startDate, endDate, pharmacistId, locationId } = req.query as any;

    const capacityMetrics = await CalendarService.getCapacityMetrics(
      new Date(startDate),
      new Date(endDate),
      new mongoose.Types.ObjectId(context.workplaceId),
      pharmacistId ? [new mongoose.Types.ObjectId(pharmacistId)] : undefined
    );

    // Generate recommendations based on capacity data
    const recommendations: string[] = [];
    
    if (capacityMetrics.overall.utilizationRate < 50) {
      recommendations.push('Overall utilization is low. Consider marketing campaigns or reducing available slots.');
    }
    
    if (capacityMetrics.overall.utilizationRate > 90) {
      recommendations.push('High utilization detected. Consider adding more pharmacists or extending working hours.');
    }

    // Check for underutilized pharmacists
    if (capacityMetrics.byPharmacist) {
      capacityMetrics.byPharmacist.forEach((pharma: any) => {
        if (pharma.utilizationRate < 40) {
          recommendations.push(`Pharmacist ${pharma.pharmacistName} is underutilized (${pharma.utilizationRate}% utilization).`);
        }
      });
    }

    // Check for busy days
    if (capacityMetrics.byDay) {
      const busyDays = capacityMetrics.byDay.filter((day: any) => day.utilizationRate > 85);
      if (busyDays.length > 0) {
        const dayNames = busyDays.map((d: any) => d.dayName).join(', ');
        recommendations.push(`Consider adding more slots on: ${dayNames}`);
      }
    }

    sendSuccess(res, {
      ...capacityMetrics,
      recommendations,
    }, 'Capacity report retrieved successfully');
  }
);

/**
 * GET /api/schedules/pharmacists
 * Get all pharmacist schedules for the workplace
 */
export const getAllPharmacistSchedules = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { locationId } = req.query as any;

    const query: any = {
      workplaceId: context.workplaceId,
      isActive: true,
      isDeleted: { $ne: true },
    };

    if (locationId) {
      query.locationId = locationId;
    }

    const schedules = await PharmacistSchedule.find(query)
      .populate('pharmacistId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    sendSuccess(res, { schedules }, 'Pharmacist schedules retrieved successfully');
  }
);
