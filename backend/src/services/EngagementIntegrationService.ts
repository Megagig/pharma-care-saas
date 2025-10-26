import mongoose from 'mongoose';
import Appointment, { IAppointment } from '../models/Appointment';
import MTRFollowUp, { IMTRFollowUp } from '../models/MTRFollowUp';
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import Visit from '../models/Visit';
import logger from '../utils/logger';
// Simple error class
class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export interface CreateAppointmentFromMTRData {
  mtrSessionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  duration?: number;
  description?: string;
  workplaceId: mongoose.Types.ObjectId;
  locationId?: string;
}

export interface LinkMTRToAppointmentData {
  mtrFollowUpId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
}

export interface SyncStatusData {
  sourceId: mongoose.Types.ObjectId;
  sourceType: 'appointment' | 'mtr_followup';
  newStatus: string;
  updatedBy: mongoose.Types.ObjectId;
}

/**
 * Service for integrating Patient Engagement & Follow-up Management with MTR module
 */
export class EngagementIntegrationService {
  /**
   * Create an appointment when MTR session is scheduled
   */
  async createAppointmentFromMTR(data: CreateAppointmentFromMTRData): Promise<{
    appointment: IAppointment;
    mtrSession: any;
  }> {
    try {
      logger.info('Creating appointment from MTR session', {
        mtrSessionId: data.mtrSessionId,
        patientId: data.patientId,
      });

      // Verify MTR session exists
      const mtrSession = await MedicationTherapyReview.findById(data.mtrSessionId);
      if (!mtrSession) {
        throw new AppError('MTR session not found', 404);
      }

      // Create appointment
      const appointment = new Appointment({
        workplaceId: data.workplaceId,
        locationId: data.locationId,
        patientId: data.patientId,
        assignedTo: data.assignedTo,
        type: 'mtm_session',
        title: `MTR Session - ${mtrSession.reviewNumber || 'Follow-up'}`,
        description: data.description || `Medication Therapy Review session for ${mtrSession.reviewNumber}`,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration || 60, // Default 60 minutes for MTR sessions
        timezone: 'Africa/Lagos',
        status: 'scheduled',
        confirmationStatus: 'pending',
        isRecurring: false,
        relatedRecords: {
          mtrSessionId: data.mtrSessionId,
        },
        metadata: {
          source: 'automated_trigger',
          triggerEvent: 'mtr_session_scheduled',
          customFields: {
            mtrReviewNumber: mtrSession.reviewNumber,
            mtrType: mtrSession.reviewType,
          },
        },
        createdBy: data.assignedTo,
      });

      await appointment.save();

      logger.info('Appointment created from MTR session', {
        appointmentId: appointment._id,
        mtrSessionId: data.mtrSessionId,
      });

      return {
        appointment,
        mtrSession,
      };
    } catch (error) {
      logger.error('Error creating appointment from MTR session', {
        error: error.message,
        mtrSessionId: data.mtrSessionId,
      });
      throw error;
    }
  }

  /**
   * Link MTRFollowUp to Appointment model
   */
  async linkMTRFollowUpToAppointment(data: LinkMTRToAppointmentData): Promise<{
    mtrFollowUp: IMTRFollowUp;
    appointment: IAppointment;
  }> {
    try {
      logger.info('Linking MTR follow-up to appointment', {
        mtrFollowUpId: data.mtrFollowUpId,
        appointmentId: data.appointmentId,
      });

      // Find both records
      const [mtrFollowUp, appointment] = await Promise.all([
        MTRFollowUp.findById(data.mtrFollowUpId),
        Appointment.findById(data.appointmentId),
      ]);

      if (!mtrFollowUp) {
        throw new AppError('MTR follow-up not found', 404);
      }

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Update MTR follow-up to reference appointment
      // Note: We'll need to add appointmentId field to MTRFollowUp model
      (mtrFollowUp as any).appointmentId = appointment._id;
      await mtrFollowUp.save();

      // Update appointment to reference MTR follow-up
      appointment.relatedRecords.followUpTaskId = mtrFollowUp._id;
      await appointment.save();

      logger.info('Successfully linked MTR follow-up to appointment', {
        mtrFollowUpId: data.mtrFollowUpId,
        appointmentId: data.appointmentId,
      });

      return {
        mtrFollowUp,
        appointment,
      };
    } catch (error) {
      logger.error('Error linking MTR follow-up to appointment', {
        error: error.message,
        mtrFollowUpId: data.mtrFollowUpId,
        appointmentId: data.appointmentId,
      });
      throw error;
    }
  }

  /**
   * Sync status changes between MTR and Appointment
   */
  async syncMTRFollowUpStatus(data: SyncStatusData): Promise<void> {
    try {
      logger.info('Syncing status between MTR follow-up and appointment', {
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        newStatus: data.newStatus,
      });

      if (data.sourceType === 'appointment') {
        await this.syncAppointmentToMTRFollowUp(data);
      } else if (data.sourceType === 'mtr_followup') {
        await this.syncMTRFollowUpToAppointment(data);
      }

      logger.info('Status sync completed', {
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        newStatus: data.newStatus,
      });
    } catch (error) {
      logger.error('Error syncing status', {
        error: error.message,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
      });
      throw error;
    }
  }

  /**
   * Sync appointment status to MTR follow-up
   */
  private async syncAppointmentToMTRFollowUp(data: SyncStatusData): Promise<void> {
    const appointment = await Appointment.findById(data.sourceId);
    if (!appointment || !appointment.relatedRecords.followUpTaskId) {
      return;
    }

    const mtrFollowUp = await MTRFollowUp.findById(appointment.relatedRecords.followUpTaskId);
    if (!mtrFollowUp) {
      return;
    }

    // Map appointment status to MTR follow-up status
    const statusMapping: Record<string, string> = {
      'scheduled': 'scheduled',
      'confirmed': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no_show': 'missed',
      'rescheduled': 'rescheduled',
    };

    const newMTRStatus = statusMapping[data.newStatus];
    if (newMTRStatus && mtrFollowUp.status !== newMTRStatus) {
      mtrFollowUp.status = newMTRStatus as any;
      mtrFollowUp.updatedBy = data.updatedBy;

      // If appointment is completed, mark MTR follow-up as completed with outcome
      if (data.newStatus === 'completed' && appointment.outcome) {
        mtrFollowUp.outcome = {
          status: appointment.outcome.status,
          notes: appointment.outcome.notes,
          nextActions: appointment.outcome.nextActions,
          adherenceImproved: true, // Default assumption for MTR sessions
          problemsResolved: [],
          newProblemsIdentified: [],
        };
        mtrFollowUp.completedAt = appointment.completedAt;
      }

      await mtrFollowUp.save();
    }
  }

  /**
   * Sync MTR follow-up status to appointment
   */
  private async syncMTRFollowUpToAppointment(data: SyncStatusData): Promise<void> {
    const mtrFollowUp = await MTRFollowUp.findById(data.sourceId);
    if (!mtrFollowUp) {
      return;
    }

    // Find linked appointment
    const appointment = await Appointment.findOne({
      'relatedRecords.followUpTaskId': mtrFollowUp._id,
    });

    if (!appointment) {
      return;
    }

    // Map MTR follow-up status to appointment status
    const statusMapping: Record<string, string> = {
      'scheduled': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'missed': 'no_show',
      'rescheduled': 'rescheduled',
    };

    const newAppointmentStatus = statusMapping[data.newStatus];
    if (newAppointmentStatus && appointment.status !== newAppointmentStatus) {
      appointment.status = newAppointmentStatus as any;
      appointment.updatedBy = data.updatedBy;

      // If MTR follow-up is completed, mark appointment as completed with outcome
      if (data.newStatus === 'completed' && mtrFollowUp.outcome) {
        appointment.outcome = {
          status: mtrFollowUp.outcome.status,
          notes: mtrFollowUp.outcome.notes,
          nextActions: mtrFollowUp.outcome.nextActions,
          visitCreated: false,
        };
        appointment.completedAt = mtrFollowUp.completedAt;
      }

      await appointment.save();
    }
  }

  /**
   * Create both MTR follow-up and appointment records
   */
  async createMTRWithAppointment(data: {
    mtrSessionId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId;
    scheduledDate: Date;
    scheduledTime: string;
    duration?: number;
    description: string;
    objectives: string[];
    priority: 'high' | 'medium' | 'low';
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    createdBy: mongoose.Types.ObjectId;
  }): Promise<{
    appointment: IAppointment;
    mtrFollowUp: IMTRFollowUp;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info('Creating MTR follow-up with appointment', {
        mtrSessionId: data.mtrSessionId,
        patientId: data.patientId,
      });

      // Create appointment first
      const appointment = new Appointment({
        workplaceId: data.workplaceId,
        locationId: data.locationId,
        patientId: data.patientId,
        assignedTo: data.assignedTo,
        type: 'mtm_session',
        title: `MTR Follow-up Session`,
        description: data.description,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration || 60,
        timezone: 'Africa/Lagos',
        status: 'scheduled',
        confirmationStatus: 'pending',
        isRecurring: false,
        relatedRecords: {
          mtrSessionId: data.mtrSessionId,
        },
        metadata: {
          source: 'manual',
          triggerEvent: 'mtr_followup_scheduled',
        },
        createdBy: data.createdBy,
      });

      await appointment.save({ session });

      // Create MTR follow-up
      const mtrFollowUp = new MTRFollowUp({
        workplaceId: data.workplaceId,
        reviewId: data.mtrSessionId,
        patientId: data.patientId,
        type: 'appointment',
        priority: data.priority,
        description: data.description,
        objectives: data.objectives,
        scheduledDate: data.scheduledDate,
        estimatedDuration: data.duration || 60,
        assignedTo: data.assignedTo,
        status: 'scheduled',
        createdBy: data.createdBy,
      });

      // Add appointmentId field (we'll need to extend the model)
      (mtrFollowUp as any).appointmentId = appointment._id;
      await mtrFollowUp.save({ session });

      // Link appointment to MTR follow-up
      appointment.relatedRecords.followUpTaskId = mtrFollowUp._id;
      await appointment.save({ session });

      await session.commitTransaction();

      logger.info('Successfully created MTR follow-up with appointment', {
        appointmentId: appointment._id,
        mtrFollowUpId: mtrFollowUp._id,
      });

      return {
        appointment,
        mtrFollowUp,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating MTR follow-up with appointment', {
        error: error.message,
        mtrSessionId: data.mtrSessionId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get MTR session with linked appointment details
   */
  async getMTRSessionWithAppointment(mtrSessionId: mongoose.Types.ObjectId): Promise<{
    mtrSession: any;
    linkedAppointments: IAppointment[];
    followUps: IMTRFollowUp[];
  }> {
    try {
      const [mtrSession, linkedAppointments, followUps] = await Promise.all([
        MedicationTherapyReview.findById(mtrSessionId),
        Appointment.find({ 'relatedRecords.mtrSessionId': mtrSessionId }),
        MTRFollowUp.find({ reviewId: mtrSessionId }),
      ]);

      return {
        mtrSession,
        linkedAppointments: linkedAppointments || [],
        followUps: followUps || [],
      };
    } catch (error) {
      logger.error('Error getting MTR session with appointment', {
        error: error.message,
        mtrSessionId,
      });
      throw error;
    }
  }

  /**
   * Create visit from completed appointment
   */
  async createVisitFromAppointment(appointmentId: mongoose.Types.ObjectId): Promise<any> {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId')
        .populate('assignedTo');

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.status !== 'completed') {
        throw new AppError('Only completed appointments can create visits', 400);
      }

      if (appointment.outcome?.visitCreated) {
        throw new AppError('Visit already created for this appointment', 400);
      }

      // Create visit record
      const visit = new Visit({
        workplaceId: appointment.workplaceId,
        patientId: appointment.patientId,
        visitDate: appointment.scheduledDate,
        visitTime: appointment.scheduledTime,
        visitType: 'follow_up',
        chiefComplaint: appointment.description || 'MTR Follow-up Session',
        presentingComplaint: appointment.outcome?.notes || '',
        clinicalNotes: {
          subjective: appointment.outcome?.notes || '',
          objective: 'MTR session completed',
          assessment: appointment.outcome?.status === 'successful' ? 'Goals achieved' : 'Partial goals achieved',
          plan: appointment.outcome?.nextActions?.join('; ') || '',
        },
        appointmentId: appointment._id,
        createdBy: appointment.assignedTo,
      });

      await visit.save();

      // Update appointment to mark visit as created
      appointment.outcome = {
        ...appointment.outcome!,
        visitCreated: true,
        visitId: visit._id,
      };
      await appointment.save();

      logger.info('Visit created from appointment', {
        appointmentId: appointment._id,
        visitId: visit._id,
      });

      return visit;
    } catch (error) {
      logger.error('Error creating visit from appointment', {
        error: error.message,
        appointmentId,
      });
      throw error;
    }
  }
}

export const engagementIntegrationService = new EngagementIntegrationService();
export default engagementIntegrationService;