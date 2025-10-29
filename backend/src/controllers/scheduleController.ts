/**
 * Schedule Controller
 * 
 * Handles pharmacist schedule management operations
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import PharmacistSchedule from '../models/PharmacistSchedule';
import User from '../models/User';

class ScheduleController {
  /**
   * Get current user's schedule
   */
  async getMySchedule(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const workplaceId = req.user?.workplaceId;

      if (!userId || !workplaceId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and workplace ID are required'
        });
      }

      const schedule = await PharmacistSchedule.findOne({
        pharmacistId: userId,
        workplaceId,
        isActive: true
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'No schedule found'
        });
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      logger.error('Error getting user schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get schedule'
      });
    }
  }

  /**
   * Create or update current user's schedule
   */
  async createOrUpdateMySchedule(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const workplaceId = req.user?.workplaceId;

      logger.info('Schedule save request received', {
        userId: userId?.toString(),
        workplaceId: workplaceId?.toString(),
        body: req.body
      });

      if (!userId || !workplaceId) {
        logger.error('Missing user ID or workplace ID', { userId, workplaceId });
        return res.status(400).json({
          success: false,
          message: 'User ID and workplace ID are required'
        });
      }

      const { workingHours, appointmentPreferences } = req.body;

      logger.info('Extracted request data', {
        workingHours: JSON.stringify(workingHours),
        appointmentPreferences: JSON.stringify(appointmentPreferences)
      });

      // Find existing schedule or create new one
      let schedule = await PharmacistSchedule.findOne({
        pharmacistId: userId,
        workplaceId,
        isActive: true
      });

      logger.info('Existing schedule found:', { scheduleExists: !!schedule });

      const scheduleData = {
        workplaceId,
        pharmacistId: userId,
        workingHours,
        appointmentPreferences,
        timeOff: schedule?.timeOff || [],
        capacityStats: schedule?.capacityStats || {
          totalSlotsAvailable: 0,
          slotsBooked: 0,
          utilizationRate: 0,
          lastCalculatedAt: new Date()
        },
        isActive: true,
        effectiveFrom: schedule?.effectiveFrom || new Date(),
        createdBy: schedule?.createdBy || userId,
        updatedBy: userId,
        isDeleted: false
      };

      if (schedule) {
        // Update existing schedule
        logger.info('Updating existing schedule');
        Object.assign(schedule, scheduleData);
        await schedule.save();
        logger.info('Schedule updated successfully');
      } else {
        // Create new schedule
        logger.info('Creating new schedule', { scheduleData: JSON.stringify(scheduleData) });
        schedule = await PharmacistSchedule.create(scheduleData);
        logger.info('Schedule created successfully');
      }

      logger.info('Schedule saved successfully', {
        userId: userId.toString(),
        workplaceId: workplaceId.toString(),
        scheduleId: schedule._id.toString()
      });

      res.json({
        success: true,
        message: 'Schedule saved successfully',
        data: schedule
      });
    } catch (error) {
      logger.error('Error saving schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all pharmacist schedules
   */
  async getPharmacistSchedules(req: AuthRequest, res: Response) {
    try {
      const workplaceId = req.user?.workplaceId;
      const { date } = req.query;

      if (!workplaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workplace ID is required'
        });
      }

      const query: any = {
        workplaceId,
        isActive: true
      };

      // If date is provided, filter by effective dates
      if (date) {
        const targetDate = new Date(date as string);
        query.effectiveFrom = { $lte: targetDate };
        query.$or = [
          { effectiveTo: { $exists: false } },
          { effectiveTo: null },
          { effectiveTo: { $gte: targetDate } }
        ];
      }

      const schedules = await PharmacistSchedule.find(query)
        .populate('pharmacistId', 'firstName lastName email role')
        .sort({ 'pharmacistId.firstName': 1 });

      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      logger.error('Error getting pharmacist schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pharmacist schedules'
      });
    }
  }

  /**
   * Get pharmacist availability for a date range
   */
  async getPharmacistAvailability(req: AuthRequest, res: Response) {
    try {
      const { pharmacistId } = req.params;
      const { startDate, endDate } = req.query;
      const workplaceId = req.user?.workplaceId;

      if (!workplaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workplace ID is required'
        });
      }

      const schedule = await PharmacistSchedule.findOne({
        pharmacistId: new mongoose.Types.ObjectId(pharmacistId),
        workplaceId,
        isActive: true
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found for pharmacist'
        });
      }

      // Generate availability for the date range
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const availability = [];

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const workingHour = schedule.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
        
        const isAvailable = workingHour?.isWorkingDay && 
          !schedule.timeOff.some(timeOff => 
            timeOff.status === 'approved' &&
            date >= timeOff.startDate && 
            date <= timeOff.endDate
          );

        availability.push({
          date: new Date(date),
          isAvailable,
          workingHours: workingHour?.shifts || [],
          reason: !isAvailable ? (workingHour?.isWorkingDay ? 'Time off' : 'Not working day') : null
        });
      }

      res.json({
        success: true,
        data: {
          pharmacistId,
          availability,
          schedule: {
            workingHours: schedule.workingHours,
            appointmentPreferences: schedule.appointmentPreferences
          }
        }
      });
    } catch (error) {
      logger.error('Error getting pharmacist availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pharmacist availability'
      });
    }
  }

  /**
   * Request time off
   */
  async requestTimeOff(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const workplaceId = req.user?.workplaceId;
      const { startDate, endDate, reason, type } = req.body;

      if (!userId || !workplaceId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and workplace ID are required'
        });
      }

      const schedule = await PharmacistSchedule.findOne({
        pharmacistId: userId,
        workplaceId,
        isActive: true
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'No active schedule found'
        });
      }

      // Add time off request
      schedule.timeOff.push({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        type,
        status: 'pending'
      });

      await schedule.save();

      logger.info('Time off requested', {
        userId: userId.toString(),
        startDate,
        endDate,
        type
      });

      res.json({
        success: true,
        message: 'Time off request submitted successfully',
        data: schedule.timeOff[schedule.timeOff.length - 1]
      });
    } catch (error) {
      logger.error('Error requesting time off:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request time off'
      });
    }
  }
}

export default new ScheduleController();