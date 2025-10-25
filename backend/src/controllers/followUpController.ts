import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import FollowUpService from '../services/FollowUpService';
import AppointmentService from '../services/AppointmentService';
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getRequestContext,
} from '../utils/responseHelpers';

/**
 * Follow-up Task Management Controller
 * Handles all follow-up task-related HTTP requests
 */

/**
 * POST /api/follow-ups
 * Create a new follow-up task
 */
export const createFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const followUpData = {
      ...req.body,
      workplaceId: context.workplaceId,
      createdBy: context.userId,
      assignedTo: req.body.assignedTo || context.userId,
    };

    const followUpService = FollowUpService.getInstance();
    const followUpTask = await followUpService.createFollowUpTask(followUpData);

    sendSuccess(res, { followUpTask }, 'Follow-up task created successfully', 201);
  }
);

/**
 * GET /api/follow-ups
 * List follow-up tasks with filtering and pagination
 */
export const getFollowUps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const {
      status,
      priority,
      type,
      assignedTo,
      patientId,
      startDate,
      endDate,
      overdue,
      limit,
      cursor,
    } = req.query as any;

    const followUpService = FollowUpService.getInstance();
    const result = await followUpService.getFollowUpTasks(context.workplaceId, {
      status,
      priority,
      type,
      assignedTo,
      patientId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      overdue,
      limit: parseInt(limit) || 50,
      cursor,
    });

    // Calculate summary statistics
    const summary = {
      total: result.tasks.length,
      overdue: result.tasks.filter((task: any) => task.status === 'overdue').length,
      dueToday: result.tasks.filter((task: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && task.status === 'pending';
      }).length,
      byPriority: result.tasks.reduce((acc: any, task: any) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}),
    };

    sendSuccess(res, { ...result, summary }, 'Follow-up tasks retrieved successfully');
  }
);

/**
 * GET /api/follow-ups/:id
 * Get single follow-up task details
 */
export const getFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;

    const followUpService = FollowUpService.getInstance();
    const task = await followUpService.getFollowUpTaskById(
      id,
      context.workplaceId
    );

    if (!task) {
      return sendError(res, 'Follow-up task not found', 404);
    }

    sendSuccess(res, { task }, 'Follow-up task retrieved successfully');
  }
);

/**
 * PUT /api/follow-ups/:id
 * Update follow-up task details
 */
export const updateFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: context.userId,
    };

    const followUpService = FollowUpService.getInstance();
    const task = await followUpService.updateFollowUpTask(
      id,
      context.workplaceId,
      updateData
    );

    if (!task) {
      return sendError(res, 'Follow-up task not found', 404);
    }

    sendSuccess(res, { task }, 'Follow-up task updated successfully');
  }
);

/**
 * POST /api/follow-ups/:id/complete
 * Complete a follow-up task
 */
export const completeFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { outcome } = req.body;

    const followUpService = FollowUpService.getInstance();
    const task = await followUpService.completeFollowUpTask(
      id,
      context.workplaceId,
      context.userId,
      outcome
    );

    if (!task) {
      return sendError(res, 'Follow-up task not found', 404);
    }

    sendSuccess(res, { task }, 'Follow-up task completed successfully');
  }
);

/**
 * POST /api/follow-ups/:id/convert-to-appointment
 * Convert follow-up task to appointment
 */
export const convertToAppointment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { scheduledDate, scheduledTime, duration, type, description } = req.body;

    const followUpService = FollowUpService.getInstance();
    const result = await followUpService.convertToAppointment(
      id,
      context.workplaceId,
      {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration,
        type,
        description,
        createdBy: context.userId,
      }
    );

    if (!result) {
      return sendError(res, 'Follow-up task not found', 404);
    }

    sendSuccess(res, result, 'Follow-up task converted to appointment successfully', 201);
  }
);

/**
 * GET /api/follow-ups/overdue
 * Get overdue follow-up tasks
 */
export const getOverdueFollowUps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { assignedTo } = req.query as any;

    const followUpService = FollowUpService.getInstance();
    const result = await followUpService.getFollowUpTasks(context.workplaceId, {
      status: 'overdue',
      assignedTo,
    });

    // Calculate summary by priority
    const summary = {
      total: result.tasks.length,
      critical: result.tasks.filter((task: any) => task.priority === 'critical').length,
      high: result.tasks.filter((task: any) => task.priority === 'high').length,
      urgent: result.tasks.filter((task: any) => task.priority === 'urgent').length,
    };

    sendSuccess(res, { ...result, summary }, 'Overdue follow-up tasks retrieved successfully');
  }
);

/**
 * POST /api/follow-ups/:id/escalate
 * Escalate follow-up task priority
 */
export const escalateFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { id } = req.params;
    const { newPriority, reason } = req.body;

    const followUpService = FollowUpService.getInstance();
    const task = await followUpService.escalateFollowUp(
      id,
      context.workplaceId,
      newPriority,
      reason,
      context.userId
    );

    if (!task) {
      return sendError(res, 'Follow-up task not found', 404);
    }

    sendSuccess(res, { task }, 'Follow-up task escalated successfully');
  }
);

/**
 * GET /api/follow-ups/patient/:patientId
 * Get follow-up tasks for a specific patient
 */
export const getPatientFollowUps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const { patientId } = req.params;
    const { status, limit } = req.query as any;

    const followUpService = FollowUpService.getInstance();
    const result = await followUpService.getFollowUpTasks(context.workplaceId, {
      patientId,
      status,
      limit: parseInt(limit) || 10,
    });

    sendSuccess(res, result, 'Patient follow-up tasks retrieved successfully');
  }
);
