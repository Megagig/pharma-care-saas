import mongoose from 'mongoose';
import Patient from '../models/Patient';
import PatientUser from '../models/PatientUser';
import logger from '../utils/logger';

export class PatientSyncService {
  /**
   * Create or link a Patient record when a PatientUser is approved
   */
  static async createOrLinkPatientRecord(patientUserId: string): Promise<{ patient: any; isNewRecord: boolean }> {
    try {
      const patientUser = await PatientUser.findById(patientUserId);
      if (!patientUser) {
        throw new Error('PatientUser not found');
      }

      // Check if a Patient record already exists with the same email or phone
      let existingPatient = null;
      
      // First try to find by email
      if (patientUser.email) {
        existingPatient = await Patient.findOne({
          workplaceId: patientUser.workplaceId,
          email: patientUser.email,
          isDeleted: false,
        });
      }

      // If not found by email, try by phone
      if (!existingPatient && patientUser.phone) {
        existingPatient = await Patient.findOne({
          workplaceId: patientUser.workplaceId,
          phone: patientUser.phone,
          isDeleted: false,
        });
      }

      if (existingPatient) {
        // Link existing Patient record to PatientUser
        patientUser.patientId = existingPatient._id;
        await patientUser.save();

        // Update existing patient with any missing information from PatientUser
        await this.syncPatientUserToPatient(patientUser, existingPatient);

        logger.info(`Linked existing Patient record ${existingPatient._id} to PatientUser ${patientUserId}`);
        return { patient: existingPatient, isNewRecord: false };
      } else {
        // Create new Patient record
        const newPatient = await this.createPatientFromPatientUser(patientUser);
        
        // Link the new Patient record to PatientUser
        patientUser.patientId = newPatient._id;
        await patientUser.save();

        logger.info(`Created new Patient record ${newPatient._id} for PatientUser ${patientUserId}`);
        return { patient: newPatient, isNewRecord: true };
      }
    } catch (error) {
      logger.error('Error creating or linking patient record:', error);
      throw error;
    }
  }

  /**
   * Create a new Patient record from PatientUser data
   */
  static async createPatientFromPatientUser(patientUser: any): Promise<any> {
    try {
      // Get workplace to get the invite code for MRN generation
      const Workplace = mongoose.model('Workplace');
      const workplace = await Workplace.findById(patientUser.workplaceId);
      if (!workplace) {
        throw new Error('Workplace not found');
      }

      // Generate MRN for the new patient using the static method
      const mrn = await Patient.generateNextMRN(patientUser.workplaceId, workplace.inviteCode);

      const patientData = {
        workplaceId: patientUser.workplaceId,
        mrn,
        firstName: patientUser.firstName,
        lastName: patientUser.lastName,
        email: patientUser.email,
        phone: patientUser.phone,
        dob: patientUser.dateOfBirth,
        
        // Initialize empty arrays for patient portal fields
        allergies: [],
        chronicConditions: [],
        enhancedEmergencyContacts: [],
        patientLoggedVitals: [],
        
        // Initialize insurance info as empty object
        insuranceInfo: {
          isActive: false,
        },

        // Initialize notification preferences from PatientUser
        notificationPreferences: {
          email: patientUser.notificationPreferences?.email ?? true,
          sms: patientUser.notificationPreferences?.sms ?? true,
          push: patientUser.notificationPreferences?.push ?? true,
          resultNotifications: patientUser.notificationPreferences?.appointmentReminders ?? true,
          orderReminders: patientUser.notificationPreferences?.medicationReminders ?? true,
        },

        // Initialize appointment preferences
        appointmentPreferences: {
          preferredDays: [], // Will be set by patient later
          preferredTimeSlots: [],
          reminderPreferences: {
            email: patientUser.notificationPreferences?.email ?? true,
            sms: patientUser.notificationPreferences?.sms ?? true,
            push: patientUser.notificationPreferences?.push ?? true,
            whatsapp: patientUser.notificationPreferences?.whatsapp ?? false,
          },
          language: patientUser.language || 'en',
          timezone: patientUser.timezone || 'Africa/Lagos',
        },

        // Initialize engagement metrics
        engagementMetrics: {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowAppointments: 0,
          completionRate: 0,
          totalFollowUps: 0,
          completedFollowUps: 0,
          overdueFollowUps: 0,
          followUpCompletionRate: 0,
          averageResponseTime: 0,
          engagementScore: 0,
          lastUpdated: new Date(),
        },

        // Audit fields
        createdBy: patientUser._id, // Created by the patient user themselves
        isDeleted: false,
      };

      const patient = new Patient(patientData);
      await patient.save();

      return patient;
    } catch (error) {
      logger.error('Error creating patient from patient user:', error);
      throw error;
    }
  }

  /**
   * Sync PatientUser profile updates to linked Patient record
   */
  static async syncPatientUserToPatient(patientUser: any, patient?: any): Promise<void> {
    try {
      // If patient not provided, find it using patientId
      if (!patient && patientUser.patientId) {
        patient = await Patient.findById(patientUser.patientId);
      }

      if (!patient) {
        logger.warn(`No linked Patient record found for PatientUser ${patientUser._id}`);
        return;
      }

      // Track if any changes were made
      let hasChanges = false;

      // Sync basic profile fields
      const fieldsToSync = [
        { patientUserField: 'firstName', patientField: 'firstName' },
        { patientUserField: 'lastName', patientField: 'lastName' },
        { patientUserField: 'email', patientField: 'email' },
        { patientUserField: 'phone', patientField: 'phone' },
        { patientUserField: 'dateOfBirth', patientField: 'dob' },
      ];

      for (const { patientUserField, patientField } of fieldsToSync) {
        if (patientUser[patientUserField] !== undefined && 
            patientUser[patientUserField] !== patient[patientField]) {
          patient[patientField] = patientUser[patientUserField];
          hasChanges = true;
        }
      }

      // Sync notification preferences
      if (patientUser.notificationPreferences) {
        if (!patient.notificationPreferences) {
          patient.notificationPreferences = {};
        }

        const notificationFields = ['email', 'sms', 'push'];
        for (const field of notificationFields) {
          if (patientUser.notificationPreferences[field] !== undefined &&
              patientUser.notificationPreferences[field] !== patient.notificationPreferences[field]) {
            patient.notificationPreferences[field] = patientUser.notificationPreferences[field];
            hasChanges = true;
          }
        }

        // Map specific PatientUser notification preferences to Patient fields
        if (patientUser.notificationPreferences.appointmentReminders !== undefined &&
            patientUser.notificationPreferences.appointmentReminders !== patient.notificationPreferences?.resultNotifications) {
          patient.notificationPreferences.resultNotifications = patientUser.notificationPreferences.appointmentReminders;
          hasChanges = true;
        }

        if (patientUser.notificationPreferences.medicationReminders !== undefined &&
            patientUser.notificationPreferences.medicationReminders !== patient.notificationPreferences?.orderReminders) {
          patient.notificationPreferences.orderReminders = patientUser.notificationPreferences.medicationReminders;
          hasChanges = true;
        }
      }

      // Sync appointment preferences
      if (patientUser.language || patientUser.timezone) {
        if (!patient.appointmentPreferences) {
          patient.appointmentPreferences = {
            preferredDays: [],
            preferredTimeSlots: [],
            reminderPreferences: {
              email: true,
              sms: true,
              push: true,
              whatsapp: false,
            },
            language: 'en',
            timezone: 'Africa/Lagos',
          };
        }

        if (patientUser.language && patientUser.language !== patient.appointmentPreferences.language) {
          patient.appointmentPreferences.language = patientUser.language;
          hasChanges = true;
        }

        if (patientUser.timezone && patientUser.timezone !== patient.appointmentPreferences.timezone) {
          patient.appointmentPreferences.timezone = patientUser.timezone;
          hasChanges = true;
        }

        // Sync reminder preferences from PatientUser notification preferences
        if (patientUser.notificationPreferences) {
          const reminderFields = ['email', 'sms', 'push', 'whatsapp'];
          for (const field of reminderFields) {
            if (patientUser.notificationPreferences[field] !== undefined &&
                patientUser.notificationPreferences[field] !== patient.appointmentPreferences.reminderPreferences[field]) {
              patient.appointmentPreferences.reminderPreferences[field] = patientUser.notificationPreferences[field];
              hasChanges = true;
            }
          }
        }
      }

      // Update the updatedBy field to track who made the changes
      if (hasChanges) {
        patient.updatedBy = patientUser._id;
        await patient.save();
        logger.info(`Synced PatientUser ${patientUser._id} profile to Patient ${patient._id}`);
      }
    } catch (error) {
      logger.error('Error syncing PatientUser to Patient:', error);
      throw error;
    }
  }

  /**
   * Handle PatientUser profile updates and sync to Patient record
   */
  static async handlePatientUserProfileUpdate(patientUserId: string, updateData: any): Promise<void> {
    try {
      const patientUser = await PatientUser.findById(patientUserId);
      if (!patientUser) {
        throw new Error('PatientUser not found');
      }

      // Update PatientUser with new data
      Object.assign(patientUser, updateData);
      await patientUser.save();

      // Sync changes to linked Patient record if it exists
      if (patientUser.patientId) {
        await this.syncPatientUserToPatient(patientUser);
      }
    } catch (error) {
      logger.error('Error handling PatientUser profile update:', error);
      throw error;
    }
  }

  /**
   * Get Patient record for a PatientUser
   */
  static async getPatientRecordForUser(patientUserId: string): Promise<any | null> {
    try {
      const patientUser = await PatientUser.findById(patientUserId);
      if (!patientUser || !patientUser.patientId) {
        return null;
      }

      const patient = await Patient.findById(patientUser.patientId);
      return patient;
    } catch (error) {
      logger.error('Error getting patient record for user:', error);
      throw error;
    }
  }

  /**
   * Unlink Patient record when PatientUser is deleted or deactivated
   */
  static async unlinkPatientRecord(patientUserId: string): Promise<void> {
    try {
      const patientUser = await PatientUser.findById(patientUserId);
      if (patientUser && patientUser.patientId) {
        // Note: We don't delete the Patient record, just unlink it
        // The Patient record may have clinical data that should be preserved
        patientUser.patientId = undefined;
        await patientUser.save();
        
        logger.info(`Unlinked Patient record from PatientUser ${patientUserId}`);
      }
    } catch (error) {
      logger.error('Error unlinking patient record:', error);
      throw error;
    }
  }
}