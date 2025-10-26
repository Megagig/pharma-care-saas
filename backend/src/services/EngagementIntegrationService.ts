import mongoose from 'mongoose';
import Appointment, { IAppointment } from '../models/Appointment';
import MTRFollowUp, { IMTRFollowUp } from '../models/MTRFollowUp';
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import Visit from '../models/Visit';
import FollowUpTask, { IFollowUpTask } from '../models/FollowUpTask';
import ClinicalIntervention, { IClinicalIntervention } from '../models/ClinicalIntervention';
import DiagnosticCase, { IDiagnosticCase } from '../models/DiagnosticCase';
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

export interface CreateFollowUpFromInterventionData {
  interventionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  locationId?: string;
  createdBy: mongoose.Types.ObjectId;
}

export interface CreateFollowUpFromDiagnosticData {
  diagnosticCaseId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  locationId?: string;
  createdBy: mongoose.Types.ObjectId;
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
   * Create follow-up task from clinical intervention when requires_followup is true
   */
  async createFollowUpFromIntervention(data: CreateFollowUpFromInterventionData): Promise<{
    followUpTask: IFollowUpTask;
    intervention: IClinicalIntervention;
  }> {
    try {
      logger.info('Creating follow-up task from clinical intervention', {
        interventionId: data.interventionId,
        patientId: data.patientId,
      });

      // Verify clinical intervention exists
      const intervention = await ClinicalIntervention.findById(data.interventionId);
      if (!intervention) {
        throw new AppError('Clinical intervention not found', 404);
      }

      // Check if follow-up is required
      if (!intervention.followUp.required) {
        throw new AppError('Follow-up is not required for this intervention', 400);
      }

      // Check if follow-up task already exists
      const existingTask = await FollowUpTask.findOne({
        'relatedRecords.clinicalInterventionId': data.interventionId,
        status: { $nin: ['completed', 'cancelled'] },
      });

      if (existingTask) {
        logger.info('Follow-up task already exists for intervention', {
          interventionId: data.interventionId,
          existingTaskId: existingTask._id,
        });
        return {
          followUpTask: existingTask,
          intervention,
        };
      }

      // Map intervention priority to follow-up priority
      const priorityMapping: Record<string, IFollowUpTask['priority']> = {
        'critical': 'critical',
        'high': 'urgent',
        'medium': 'high',
        'low': 'medium',
      };

      // Calculate due date based on intervention priority and category
      const dueDateMapping: Record<string, number> = {
        'critical': 1, // 1 day
        'high': 3,     // 3 days
        'medium': 7,   // 7 days
        'low': 14,     // 14 days
      };

      const daysToAdd = dueDateMapping[intervention.priority] || 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      // Use scheduled date from intervention if available
      if (intervention.followUp.scheduledDate) {
        dueDate.setTime(intervention.followUp.scheduledDate.getTime());
      }

      // Generate follow-up task details based on intervention
      const taskTitle = this.generateInterventionFollowUpTitle(intervention);
      const taskDescription = this.generateInterventionFollowUpDescription(intervention);
      const objectives = this.generateInterventionFollowUpObjectives(intervention);

      // Create follow-up task
      const followUpTask = new FollowUpTask({
        workplaceId: data.workplaceId,
        locationId: data.locationId,
        patientId: data.patientId,
        assignedTo: data.assignedTo,
        type: 'general_followup',
        title: taskTitle,
        description: taskDescription,
        objectives,
        priority: priorityMapping[intervention.priority] || 'medium',
        dueDate,
        estimatedDuration: 30, // Default 30 minutes for intervention follow-up
        status: 'pending',
        trigger: {
          type: 'system_rule',
          sourceId: data.interventionId,
          sourceType: 'ClinicalIntervention',
          triggerDate: new Date(),
          triggerDetails: {
            interventionNumber: intervention.interventionNumber,
            interventionCategory: intervention.category,
            interventionPriority: intervention.priority,
            requiresFollowUp: intervention.followUp.required,
          },
        },
        relatedRecords: {
          clinicalInterventionId: data.interventionId,
        },
        createdBy: data.createdBy,
      });

      await followUpTask.save();

      logger.info('Follow-up task created from clinical intervention', {
        followUpTaskId: followUpTask._id,
        interventionId: data.interventionId,
        priority: followUpTask.priority,
        dueDate: followUpTask.dueDate,
      });

      return {
        followUpTask,
        intervention,
      };
    } catch (error) {
      logger.error('Error creating follow-up task from clinical intervention', {
        error: error.message,
        interventionId: data.interventionId,
      });
      throw error;
    }
  }

  /**
   * Update intervention status when follow-up is completed
   */
  async updateInterventionFromFollowUp(
    followUpTaskId: mongoose.Types.ObjectId,
    updatedBy: mongoose.Types.ObjectId
  ): Promise<{
    intervention: IClinicalIntervention;
    followUpTask: IFollowUpTask;
  }> {
    try {
      logger.info('Updating intervention status from completed follow-up', {
        followUpTaskId,
      });

      // Find the follow-up task
      const followUpTask = await FollowUpTask.findById(followUpTaskId);
      if (!followUpTask) {
        throw new AppError('Follow-up task not found', 404);
      }

      if (followUpTask.status !== 'completed') {
        throw new AppError('Follow-up task must be completed to update intervention', 400);
      }

      // Find the linked intervention
      const interventionId = followUpTask.relatedRecords.clinicalInterventionId;
      if (!interventionId) {
        throw new AppError('No linked clinical intervention found', 400);
      }

      const intervention = await ClinicalIntervention.findById(interventionId);
      if (!intervention) {
        throw new AppError('Linked clinical intervention not found', 404);
      }

      // Update intervention follow-up status
      intervention.followUp.completedDate = followUpTask.completedAt || new Date();
      intervention.followUp.notes = followUpTask.outcome?.notes || '';

      // Set next review date if specified in follow-up outcome
      if (followUpTask.outcome?.nextActions?.length) {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + 30); // Default 30 days
        intervention.followUp.nextReviewDate = nextReviewDate;
      }

      // Update intervention status based on follow-up outcome
      if (followUpTask.outcome?.status === 'successful') {
        // If intervention was in progress, mark as implemented
        if (intervention.status === 'in_progress') {
          intervention.status = 'implemented';
        }
        // If already implemented, consider marking as completed
        else if (intervention.status === 'implemented') {
          intervention.status = 'completed';
          intervention.completedAt = new Date();
        }
      } else if (followUpTask.outcome?.status === 'unsuccessful') {
        // Keep current status but add notes about unsuccessful follow-up
        intervention.implementationNotes = 
          (intervention.implementationNotes || '') + 
          `\n\nFollow-up completed on ${followUpTask.completedAt?.toDateString()}: ${followUpTask.outcome.notes}`;
      }

      intervention.updatedBy = updatedBy;
      await intervention.save();

      logger.info('Intervention status updated from follow-up completion', {
        interventionId: intervention._id,
        newStatus: intervention.status,
        followUpTaskId,
      });

      return {
        intervention,
        followUpTask,
      };
    } catch (error) {
      logger.error('Error updating intervention from follow-up', {
        error: error.message,
        followUpTaskId,
      });
      throw error;
    }
  }

  /**
   * Get clinical intervention with linked follow-up tasks and appointments
   */
  async getInterventionWithEngagementData(interventionId: mongoose.Types.ObjectId): Promise<{
    intervention: IClinicalIntervention;
    followUpTasks: IFollowUpTask[];
    appointments: IAppointment[];
  }> {
    try {
      const [intervention, followUpTasks, appointments] = await Promise.all([
        ClinicalIntervention.findById(interventionId),
        FollowUpTask.find({ 'relatedRecords.clinicalInterventionId': interventionId }),
        Appointment.find({ 'relatedRecords.clinicalInterventionId': interventionId }),
      ]);

      if (!intervention) {
        throw new AppError('Clinical intervention not found', 404);
      }

      return {
        intervention,
        followUpTasks: followUpTasks || [],
        appointments: appointments || [],
      };
    } catch (error) {
      logger.error('Error getting intervention with engagement data', {
        error: error.message,
        interventionId,
      });
      throw error;
    }
  }

  /**
   * Generate follow-up task title based on intervention
   */
  private generateInterventionFollowUpTitle(intervention: IClinicalIntervention): string {
    const categoryTitles: Record<string, string> = {
      'drug_therapy_problem': 'Drug Therapy Problem Follow-up',
      'adverse_drug_reaction': 'ADR Monitoring Follow-up',
      'medication_nonadherence': 'Adherence Check Follow-up',
      'drug_interaction': 'Drug Interaction Follow-up',
      'dosing_issue': 'Dosing Adjustment Follow-up',
      'contraindication': 'Contraindication Follow-up',
      'other': 'Clinical Intervention Follow-up',
    };

    return categoryTitles[intervention.category] || 'Clinical Intervention Follow-up';
  }

  /**
   * Generate follow-up task description based on intervention
   */
  private generateInterventionFollowUpDescription(intervention: IClinicalIntervention): string {
    const baseDescription = `Follow-up for clinical intervention ${intervention.interventionNumber}`;
    const issueDescription = intervention.issueDescription;
    
    let description = `${baseDescription}\n\nOriginal Issue: ${issueDescription}`;
    
    if (intervention.strategies && intervention.strategies.length > 0) {
      description += '\n\nImplemented Strategies:';
      intervention.strategies.forEach((strategy, index) => {
        description += `\n${index + 1}. ${strategy.description}`;
      });
    }

    description += '\n\nFollow-up Objectives:\n- Monitor patient response to intervention\n- Assess effectiveness of implemented strategies\n- Identify any new issues or concerns\n- Determine next steps if needed';

    return description;
  }

  /**
   * Generate follow-up task objectives based on intervention
   */
  private generateInterventionFollowUpObjectives(intervention: IClinicalIntervention): string[] {
    const baseObjectives = [
      'Assess patient response to intervention',
      'Monitor for any adverse effects',
      'Evaluate effectiveness of implemented strategies',
    ];

    // Add category-specific objectives
    const categoryObjectives: Record<string, string[]> = {
      'drug_therapy_problem': [
        'Verify drug therapy problem resolution',
        'Check medication effectiveness',
      ],
      'adverse_drug_reaction': [
        'Monitor for continued ADR symptoms',
        'Assess tolerability of alternative therapy',
      ],
      'medication_nonadherence': [
        'Evaluate adherence improvement',
        'Identify remaining adherence barriers',
      ],
      'drug_interaction': [
        'Monitor for interaction symptoms',
        'Verify separation of interacting medications',
      ],
      'dosing_issue': [
        'Assess response to dose adjustment',
        'Monitor for dose-related side effects',
      ],
      'contraindication': [
        'Verify contraindication management',
        'Monitor alternative therapy effectiveness',
      ],
    };

    const specificObjectives = categoryObjectives[intervention.category] || [];
    
    return [...baseObjectives, ...specificObjectives];
  }

  /**
   * Create follow-up task from diagnostic case
   */
  async createFollowUpFromDiagnostic(data: CreateFollowUpFromDiagnosticData): Promise<{
    followUpTask: IFollowUpTask;
    diagnosticCase: IDiagnosticCase;
  }> {
    try {
      logger.info('Creating follow-up task from diagnostic case', {
        diagnosticCaseId: data.diagnosticCaseId,
        patientId: data.patientId,
      });

      // Verify diagnostic case exists
      const diagnosticCase = await DiagnosticCase.findById(data.diagnosticCaseId);
      if (!diagnosticCase) {
        throw new AppError('Diagnostic case not found', 404);
      }

      // Check if follow-up task already exists
      const existingTask = await FollowUpTask.findOne({
        'relatedRecords.diagnosticCaseId': data.diagnosticCaseId,
        status: { $nin: ['completed', 'cancelled'] },
      });

      if (existingTask) {
        logger.info('Follow-up task already exists for diagnostic case', {
          diagnosticCaseId: data.diagnosticCaseId,
          existingTaskId: existingTask._id,
        });
        return {
          followUpTask: existingTask,
          diagnosticCase,
        };
      }

      // Set priority based on AI confidence score and red flags
      const priority = this.calculateDiagnosticFollowUpPriority(diagnosticCase);

      // Calculate due date based on priority and red flags
      const dueDate = this.calculateDiagnosticFollowUpDueDate(diagnosticCase, priority);

      // Generate follow-up task details based on diagnostic case
      const taskTitle = this.generateDiagnosticFollowUpTitle(diagnosticCase);
      const taskDescription = this.generateDiagnosticFollowUpDescription(diagnosticCase);
      const objectives = this.generateDiagnosticFollowUpObjectives(diagnosticCase);

      // Create follow-up task
      const followUpTask = new FollowUpTask({
        workplaceId: data.workplaceId,
        locationId: data.locationId,
        patientId: data.patientId,
        assignedTo: data.assignedTo,
        type: 'general_followup',
        title: taskTitle,
        description: taskDescription,
        objectives,
        priority,
        dueDate,
        estimatedDuration: 30, // Default 30 minutes for diagnostic follow-up
        status: 'pending',
        trigger: {
          type: 'system_rule',
          sourceId: data.diagnosticCaseId,
          sourceType: 'DiagnosticCase',
          triggerDate: new Date(),
          triggerDetails: {
            caseId: diagnosticCase.caseId,
            confidenceScore: diagnosticCase.aiAnalysis?.confidenceScore,
            redFlagsCount: diagnosticCase.aiAnalysis?.redFlags?.length || 0,
            hasReferralRecommendation: diagnosticCase.aiAnalysis?.referralRecommendation?.recommended || false,
          },
        },
        relatedRecords: {
          diagnosticCaseId: data.diagnosticCaseId,
        },
        createdBy: data.createdBy,
      });

      await followUpTask.save();

      logger.info('Follow-up task created from diagnostic case', {
        followUpTaskId: followUpTask._id,
        diagnosticCaseId: data.diagnosticCaseId,
        priority: followUpTask.priority,
        dueDate: followUpTask.dueDate,
      });

      return {
        followUpTask,
        diagnosticCase,
      };
    } catch (error) {
      logger.error('Error creating follow-up task from diagnostic case', {
        error: error.message,
        diagnosticCaseId: data.diagnosticCaseId,
      });
      throw error;
    }
  }

  /**
   * Get diagnostic case with linked follow-up tasks and appointments
   */
  async getDiagnosticWithEngagementData(diagnosticCaseId: mongoose.Types.ObjectId): Promise<{
    diagnosticCase: IDiagnosticCase;
    followUpTasks: IFollowUpTask[];
    appointments: IAppointment[];
  }> {
    try {
      const [diagnosticCase, followUpTasks, appointments] = await Promise.all([
        DiagnosticCase.findById(diagnosticCaseId),
        FollowUpTask.find({ 'relatedRecords.diagnosticCaseId': diagnosticCaseId }),
        Appointment.find({ 'relatedRecords.diagnosticCaseId': diagnosticCaseId }),
      ]);

      if (!diagnosticCase) {
        throw new AppError('Diagnostic case not found', 404);
      }

      return {
        diagnosticCase,
        followUpTasks: followUpTasks || [],
        appointments: appointments || [],
      };
    } catch (error) {
      logger.error('Error getting diagnostic case with engagement data', {
        error: error.message,
        diagnosticCaseId,
      });
      throw error;
    }
  }

  /**
   * Calculate follow-up priority based on diagnostic case AI analysis
   */
  private calculateDiagnosticFollowUpPriority(diagnosticCase: IDiagnosticCase): IFollowUpTask['priority'] {
    const aiAnalysis = diagnosticCase.aiAnalysis;
    
    if (!aiAnalysis) {
      return 'medium';
    }

    // Check for critical red flags
    const criticalRedFlags = aiAnalysis.redFlags?.filter(flag => flag.severity === 'critical') || [];
    if (criticalRedFlags.length > 0) {
      return 'critical';
    }

    // Check for high severity red flags
    const highRedFlags = aiAnalysis.redFlags?.filter(flag => flag.severity === 'high') || [];
    if (highRedFlags.length > 0) {
      return 'urgent';
    }

    // Check for immediate referral recommendation
    if (aiAnalysis.referralRecommendation?.recommended && 
        aiAnalysis.referralRecommendation.urgency === 'immediate') {
      return 'critical';
    }

    // Check for within 24h referral recommendation
    if (aiAnalysis.referralRecommendation?.recommended && 
        aiAnalysis.referralRecommendation.urgency === 'within_24h') {
      return 'urgent';
    }

    // Check confidence score - low confidence needs urgent follow-up
    if (aiAnalysis.confidenceScore < 0.6) {
      return 'urgent';
    }

    // Check for medium severity red flags
    const mediumRedFlags = aiAnalysis.redFlags?.filter(flag => flag.severity === 'medium') || [];
    if (mediumRedFlags.length > 0) {
      return 'high';
    }

    // Check for routine referral recommendation
    if (aiAnalysis.referralRecommendation?.recommended) {
      return 'high';
    }

    // Default based on confidence score
    if (aiAnalysis.confidenceScore >= 0.8) {
      return 'medium';
    } else if (aiAnalysis.confidenceScore >= 0.7) {
      return 'high';
    } else {
      return 'urgent';
    }
  }

  /**
   * Calculate follow-up due date based on diagnostic case priority and analysis
   */
  private calculateDiagnosticFollowUpDueDate(
    diagnosticCase: IDiagnosticCase, 
    priority: IFollowUpTask['priority']
  ): Date {
    const dueDate = new Date();
    const aiAnalysis = diagnosticCase.aiAnalysis;

    // Check for immediate referral or critical red flags
    if (aiAnalysis?.referralRecommendation?.urgency === 'immediate' ||
        aiAnalysis?.redFlags?.some(flag => flag.severity === 'critical')) {
      dueDate.setHours(dueDate.getHours() + 2); // 2 hours for critical cases
      return dueDate;
    }

    // Check for within 24h referral
    if (aiAnalysis?.referralRecommendation?.urgency === 'within_24h') {
      dueDate.setDate(dueDate.getDate() + 1); // 1 day
      return dueDate;
    }

    // Priority-based due dates
    const dueDateMapping: Record<IFollowUpTask['priority'], number> = {
      'critical': 1,  // 1 day
      'urgent': 2,    // 2 days
      'high': 3,      // 3 days
      'medium': 7,    // 7 days
      'low': 14,      // 14 days
    };

    const daysToAdd = dueDateMapping[priority] || 7;
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    return dueDate;
  }

  /**
   * Generate follow-up task title based on diagnostic case
   */
  private generateDiagnosticFollowUpTitle(diagnosticCase: IDiagnosticCase): string {
    const topDiagnosis = diagnosticCase.aiAnalysis?.differentialDiagnoses?.[0];
    
    if (topDiagnosis) {
      return `Diagnostic Follow-up: ${topDiagnosis.condition}`;
    }
    
    return `Diagnostic Case Follow-up - ${diagnosticCase.caseId}`;
  }

  /**
   * Generate follow-up task description based on diagnostic case
   */
  private generateDiagnosticFollowUpDescription(diagnosticCase: IDiagnosticCase): string {
    const aiAnalysis = diagnosticCase.aiAnalysis;
    const topDiagnosis = aiAnalysis?.differentialDiagnoses?.[0];
    
    let description = `Follow-up for diagnostic case ${diagnosticCase.caseId}\n\n`;
    
    if (topDiagnosis) {
      description += `Primary Diagnosis: ${topDiagnosis.condition} (${Math.round(topDiagnosis.probability * 100)}% confidence)\n`;
      description += `Reasoning: ${topDiagnosis.reasoning}\n\n`;
    }

    // Add symptoms summary
    if (diagnosticCase.symptoms) {
      description += `Original Symptoms:\n`;
      description += `- Subjective: ${diagnosticCase.symptoms.subjective.join(', ')}\n`;
      if (diagnosticCase.symptoms.objective?.length > 0) {
        description += `- Objective: ${diagnosticCase.symptoms.objective.join(', ')}\n`;
      }
      description += `- Duration: ${diagnosticCase.symptoms.duration}\n`;
      description += `- Severity: ${diagnosticCase.symptoms.severity}\n\n`;
    }

    // Add red flags if any
    if (aiAnalysis?.redFlags && aiAnalysis.redFlags.length > 0) {
      description += `Red Flags Identified:\n`;
      aiAnalysis.redFlags.forEach((flag, index) => {
        description += `${index + 1}. ${flag.flag} (${flag.severity}) - ${flag.action}\n`;
      });
      description += '\n';
    }

    // Add referral recommendation if any
    if (aiAnalysis?.referralRecommendation?.recommended) {
      description += `AI Referral Recommendation:\n`;
      description += `- Specialty: ${aiAnalysis.referralRecommendation.specialty}\n`;
      description += `- Urgency: ${aiAnalysis.referralRecommendation.urgency}\n`;
      description += `- Reason: ${aiAnalysis.referralRecommendation.reason}\n\n`;
    }

    // Add recommended tests if any
    if (aiAnalysis?.recommendedTests && aiAnalysis.recommendedTests.length > 0) {
      description += `Recommended Tests:\n`;
      aiAnalysis.recommendedTests.slice(0, 3).forEach((test, index) => {
        description += `${index + 1}. ${test.testName} (${test.priority}) - ${test.reasoning}\n`;
      });
      description += '\n';
    }

    description += `Follow-up Objectives:\n`;
    description += `- Monitor patient's condition and symptom progression\n`;
    description += `- Assess response to any implemented interventions\n`;
    description += `- Review any additional test results or referral outcomes\n`;
    description += `- Determine if further action or referral is needed`;

    return description;
  }

  /**
   * Generate follow-up task objectives based on diagnostic case
   */
  private generateDiagnosticFollowUpObjectives(diagnosticCase: IDiagnosticCase): string[] {
    const aiAnalysis = diagnosticCase.aiAnalysis;
    const objectives: string[] = [
      'Monitor patient\'s current condition and symptoms',
      'Assess any changes since initial diagnostic assessment',
    ];

    // Add red flag monitoring if applicable
    if (aiAnalysis?.redFlags && aiAnalysis.redFlags.length > 0) {
      objectives.push('Monitor for red flag symptoms and complications');
    }

    // Add test result review if tests were recommended
    if (aiAnalysis?.recommendedTests && aiAnalysis.recommendedTests.length > 0) {
      objectives.push('Review results of recommended diagnostic tests');
    }

    // Add referral follow-up if referral was recommended
    if (aiAnalysis?.referralRecommendation?.recommended) {
      objectives.push('Follow up on specialist referral and recommendations');
    }

    // Add medication monitoring if therapeutic options were suggested
    if (aiAnalysis?.therapeuticOptions && aiAnalysis.therapeuticOptions.length > 0) {
      objectives.push('Monitor response to prescribed medications');
      objectives.push('Assess for medication side effects or adverse reactions');
    }

    // Add confidence-based objectives
    if (aiAnalysis?.confidenceScore && aiAnalysis.confidenceScore < 0.7) {
      objectives.push('Reassess diagnosis with additional clinical information');
      objectives.push('Consider alternative diagnostic approaches if needed');
    }

    objectives.push('Determine next steps and ongoing care plan');

    return objectives;
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