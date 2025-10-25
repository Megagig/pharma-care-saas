/**
 * Appointment Reminder Job Processor
 * Processes appointment reminder jobs from the queue
 */

import { Job } from 'bull';
import mongoose from 'mongoose';
import { AppointmentReminderJobData } from '../config/queue';
import { reminderSchedulerService } from '../services/ReminderSchedulerService';
import logger from '../utils/logger';

/**
 * Process appointment reminder job
 */
export async function processAppointmentReminder(
  job: Job<AppointmentReminderJobData>
): Promise<void> {
  const { appointmentId, patientId, workplaceId, reminderType, channels } = job.data;

  logger.info(`Processing ${reminderType} reminder for appointment ${appointmentId}`, {
    jobId: job.id,
    patientId,
    workplaceId,
    channels,
  });

  try {
    // Update job progress
    await job.progress(10);

    // Send reminder through specified channels
    const result = await reminderSchedulerService.sendReminder(
      new mongoose.Types.ObjectId(appointmentId),
      reminderType,
      channels
    );

    await job.progress(90);

    // Check if all deliveries were successful
    const allSuccessful = result.deliveryResults.every((r) => r.success);
    const failedChannels = result.deliveryResults
      .filter((r) => !r.success)
      .map((r) => r.channel);

    if (!allSuccessful) {
      logger.warn(`Some reminder deliveries failed for appointment ${appointmentId}`, {
        failedChannels,
        reminderType,
      });
    }

    await job.progress(100);

    logger.info(`Successfully processed ${reminderType} reminder for appointment ${appointmentId}`, {
      jobId: job.id,
      deliveryResults: result.deliveryResults,
    });
  } catch (error) {
    logger.error(`Failed to process ${reminderType} reminder for appointment ${appointmentId}:`, {
      jobId: job.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Re-throw to trigger Bull's retry mechanism
    throw error;
  }
}

/**
 * Handle job completion
 */
export function onAppointmentReminderCompleted(
  job: Job<AppointmentReminderJobData>,
  result: any
): void {
  logger.info(`Appointment reminder job completed`, {
    jobId: job.id,
    appointmentId: job.data.appointmentId,
    reminderType: job.data.reminderType,
    duration: Date.now() - job.processedOn!,
  });
}

/**
 * Handle job failure
 */
export function onAppointmentReminderFailed(
  job: Job<AppointmentReminderJobData>,
  error: Error
): void {
  logger.error(`Appointment reminder job failed`, {
    jobId: job.id,
    appointmentId: job.data.appointmentId,
    reminderType: job.data.reminderType,
    error: error.message,
    attemptsMade: job.attemptsMade,
    attemptsLeft: (job.opts.attempts || 0) - job.attemptsMade,
  });

  // If all retries exhausted, log critical error
  if (job.attemptsMade >= (job.opts.attempts || 3)) {
    logger.error(`Appointment reminder job exhausted all retries`, {
      jobId: job.id,
      appointmentId: job.data.appointmentId,
      reminderType: job.data.reminderType,
    });

    // TODO: Send alert to admin/manager about failed reminder
  }
}

export default {
  processAppointmentReminder,
  onAppointmentReminderCompleted,
  onAppointmentReminderFailed,
};
