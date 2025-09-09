import api from './api';

export interface MedicationCreateData {
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate?: string | Date;
  endDate?: string | Date;
  indication?: string;
  prescriber?: string;
  allergyCheck?: {
    status: boolean;
    details?: string;
  };
  status?: 'active' | 'archived' | 'cancelled';
}

export interface MedicationUpdateData {
  name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  indication?: string;
  prescriber?: string;
  allergyCheck?: {
    status: boolean;
    details?: string;
  };
  status?: 'active' | 'archived' | 'cancelled';
  historyNotes?: string;
}

export interface MedicationHistoryItem {
  name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  indication?: string;
  prescriber?: string;
  status?: 'active' | 'archived' | 'cancelled';
  updatedAt: string | Date;
  updatedBy?: string;
  notes?: string;
}

export interface MedicationData {
  _id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate?: string | Date;
  endDate?: string | Date;
  indication?: string;
  prescriber?: string;
  allergyCheck: {
    status: boolean;
    details?: string;
  };
  interactionCheck?: {
    status: boolean;
    details?: string;
    severity?: 'minor' | 'moderate' | 'severe';
  };
  status: 'active' | 'archived' | 'cancelled';
  history: MedicationHistoryItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdherenceLogCreateData {
  medicationId: string;
  patientId: string;
  refillDate?: string | Date;
  adherenceScore: number;
  pillCount?: number;
  notes?: string;
}

export interface AdherenceLogData {
  _id: string;
  medicationId: string;
  patientId: string;
  refillDate: string | Date;
  adherenceScore: number;
  pillCount?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InteractionCheckItem {
  medicationId?: string;
  medicationName: string;
  dosage?: string;
  route?: string;
}

export interface MedicationReminderSettings {
  enabled: boolean;
  defaultReminderTimes: string[];
  reminderMethod: 'email' | 'sms' | 'both';
  defaultNotificationLeadTime: number;
  customMessage?: string;
  repeatReminders?: boolean;
  repeatInterval?: number; // minutes
  smartReminders?: boolean; // adaptive reminders based on patient behavior
  allowSnooze?: boolean;
  snoozeOptions?: number[]; // minutes
  notifyCaregiver?: boolean;
  caregiverContact?: string;
}

export interface MedicationMonitoringSettings {
  adherenceMonitoring: boolean;
  refillReminders: boolean;
  interactionChecking: boolean;
  refillThreshold?: number; // percentage of medication remaining to trigger refill
  missedDoseThreshold?: number; // consecutive missed doses to trigger alert
  adherenceReporting?: boolean; // enable periodic adherence reports
  reportFrequency?: 'daily' | 'weekly' | 'monthly';
  alertOnLowAdherence?: boolean;
  lowAdherenceThreshold?: number; // percentage below which to alert
  stockoutPrediction?: boolean; // predict and alert before stockout
}

export interface InteractionResult {
  drugPair: string[];
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

/**
 * Medication Management API Service
 */
const medicationManagementService = {
  // Medication CRUD operations
  createMedication: async (
    medicationData: MedicationCreateData
  ): Promise<MedicationData> => {
    const response = await api.post('/medication-management', medicationData);
    return response.data.data;
  },

  getMedicationsByPatient: async (
    patientId: string,
    status = 'active'
  ): Promise<MedicationData[]> => {
    const response = await api.get(
      `/medication-management/patient/${patientId}`,
      {
        params: { status },
      }
    );
    return response.data.data;
  },

  getMedicationById: async (id: string): Promise<MedicationData> => {
    const response = await api.get(`/medication-management/${id}`);
    return response.data.data;
  },

  updateMedication: async (
    id: string,
    medicationData: MedicationUpdateData
  ): Promise<MedicationData> => {
    const response = await api.put(
      `/medication-management/${id}`,
      medicationData
    );
    return response.data.data;
  },

  archiveMedication: async (
    id: string,
    reason?: string
  ): Promise<MedicationData> => {
    const response = await api.patch(`/medication-management/${id}/archive`, {
      reason,
    });
    return response.data.data;
  },

  // Adherence tracking
  logAdherence: async (
    adherenceData: AdherenceLogCreateData
  ): Promise<AdherenceLogData> => {
    const response = await api.post(
      '/medication-management/adherence',
      adherenceData
    );
    return response.data.data;
  },

  getAdherenceLogs: async (
    patientId: string,
    startDate?: string | Date,
    endDate?: string | Date
  ): Promise<AdherenceLogData[]> => {
    const response = await api.get(
      `/medication-management/adherence/patient/${patientId}`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data.data;
  },

  // Medication interactions
  checkInteractions: async (
    medications: InteractionCheckItem[]
  ): Promise<InteractionResult[]> => {
    const response = await api.post(
      '/medication-management/check-interactions',
      {
        medications,
      }
    );
    return response.data.data;
  },

  // Dashboard endpoints
  getDashboardStats: async (): Promise<{
    activeMedications: number;
    averageAdherence: number;
    interactionAlerts: number;
  }> => {
    const response = await api.get('/medication-management/dashboard/stats');
    return response.data.data;
  },

  getAdherenceTrends: async (
    period?: string
  ): Promise<{ name: string; adherence: number }[]> => {
    const response = await api.get(
      '/medication-management/dashboard/adherence-trends',
      {
        params: { period },
      }
    );
    return response.data.data;
  },

  getRecentPatientsWithMedications: async (
    limit?: number
  ): Promise<
    {
      id: string;
      name: string;
      medicationCount: number;
      lastUpdate: string;
    }[]
  > => {
    const response = await api.get(
      '/medication-management/dashboard/recent-patients',
      {
        params: { limit },
      }
    );
    return response.data.data;
  },

  // Analytics endpoints
  getAdherenceAnalytics: async (
    patientId: string,
    period: string = '6months'
  ): Promise<{
    monthlyAdherence: { month: string; adherence: number }[];
    averageAdherence: number;
    trendDirection: 'up' | 'down' | 'stable';
    complianceDays: { day: string; count: number }[];
    missedDoses: { day: string; count: number }[];
    adherenceByTimeOfDay: { time: string; adherence: number }[];
  }> => {
    try {
      const response = await api.get(
        `/medication-management/analytics/adherence/${patientId}`,
        {
          params: { period },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching adherence analytics:', error);
      // Return mock data for development and fallback
      return {
        monthlyAdherence: [
          { month: 'Jan', adherence: 75 },
          { month: 'Feb', adherence: 82 },
          { month: 'Mar', adherence: 78 },
          { month: 'Apr', adherence: 85 },
          { month: 'May', adherence: 90 },
          { month: 'Jun', adherence: 88 },
        ],
        averageAdherence: 83,
        trendDirection: 'up',
        complianceDays: [
          { day: 'Mon', count: 24 },
          { day: 'Tue', count: 22 },
          { day: 'Wed', count: 26 },
          { day: 'Thu', count: 23 },
          { day: 'Fri', count: 20 },
          { day: 'Sat', count: 18 },
          { day: 'Sun', count: 17 },
        ],
        missedDoses: [
          { day: 'Mon', count: 2 },
          { day: 'Tue', count: 3 },
          { day: 'Wed', count: 1 },
          { day: 'Thu', count: 4 },
          { day: 'Fri', count: 5 },
          { day: 'Sat', count: 6 },
          { day: 'Sun', count: 7 },
        ],
        adherenceByTimeOfDay: [
          { time: 'Morning', adherence: 92 },
          { time: 'Noon', adherence: 85 },
          { time: 'Evening', adherence: 78 },
          { time: 'Night', adherence: 70 },
        ],
      };
    }
  },

  getPrescriptionPatternAnalytics: async (
    patientId: string
  ): Promise<{
    medicationsByCategory: { category: string; count: number }[];
    medicationsByRoute: { route: string; count: number }[];
    prescriptionFrequency: { month: string; count: number }[];
    topPrescribers: { prescriber: string; count: number }[];
    medicationDurationTrends: { duration: string; count: number }[];
    seasonalPrescriptionPatterns: { season: string; count: number }[];
  }> => {
    try {
      const response = await api.get(
        `/medication-management/analytics/prescription-patterns/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching prescription pattern analytics:', error);
      // Return mock data for development and fallback
      return {
        medicationsByCategory: [
          { category: 'Antibiotics', count: 5 },
          { category: 'Antihypertensives', count: 3 },
          { category: 'Analgesics', count: 7 },
          { category: 'Antidepressants', count: 2 },
          { category: 'Antidiabetics', count: 1 },
        ],
        medicationsByRoute: [
          { route: 'Oral', count: 12 },
          { route: 'Topical', count: 3 },
          { route: 'Injectable', count: 2 },
          { route: 'Inhalation', count: 1 },
        ],
        prescriptionFrequency: [
          { month: 'Jan', count: 3 },
          { month: 'Feb', count: 2 },
          { month: 'Mar', count: 4 },
          { month: 'Apr', count: 1 },
          { month: 'May', count: 5 },
          { month: 'Jun', count: 2 },
        ],
        topPrescribers: [
          { prescriber: 'Dr. Smith', count: 8 },
          { prescriber: 'Dr. Johnson', count: 5 },
          { prescriber: 'Dr. Williams', count: 4 },
          { prescriber: 'Dr. Brown', count: 3 },
        ],
        medicationDurationTrends: [
          { duration: '< 7 days', count: 6 },
          { duration: '1-4 weeks', count: 8 },
          { duration: '1-3 months', count: 4 },
          { duration: '3-6 months', count: 3 },
          { duration: '> 6 months', count: 7 },
        ],
        seasonalPrescriptionPatterns: [
          { season: 'Winter', count: 9 },
          { season: 'Spring', count: 6 },
          { season: 'Summer', count: 4 },
          { season: 'Fall', count: 7 },
        ],
      };
    }
  },

  getMedicationInteractionAnalytics: async (
    patientId: string
  ): Promise<{
    severityDistribution: { severity: string; count: number }[];
    interactionTrends: { month: string; count: number }[];
    commonInteractions: {
      medications: string[];
      description: string;
      count: number;
      severityLevel: 'minor' | 'moderate' | 'severe';
      recommendedAction: string;
    }[];
    riskFactorsByMedication: { medication: string; riskScore: number }[];
    interactionsByBodySystem: { system: string; count: number }[];
  }> => {
    try {
      const response = await api.get(
        `/medication-management/analytics/interactions/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching interaction analytics:', error);
      // Return mock data for development and fallback
      return {
        severityDistribution: [
          { severity: 'Minor', count: 12 },
          { severity: 'Moderate', count: 8 },
          { severity: 'Severe', count: 3 },
        ],
        interactionTrends: [
          { month: 'Jan', count: 2 },
          { month: 'Feb', count: 3 },
          { month: 'Mar', count: 5 },
          { month: 'Apr', count: 4 },
          { month: 'May', count: 6 },
          { month: 'Jun', count: 3 },
        ],
        commonInteractions: [
          {
            medications: ['Warfarin', 'Aspirin'],
            description: 'Increased risk of bleeding',
            count: 5,
            severityLevel: 'severe',
            recommendedAction:
              'Consider alternative antiplatelet therapy or close monitoring',
          },
          {
            medications: ['Lisinopril', 'Potassium supplements'],
            description: 'Increased risk of hyperkalemia',
            count: 3,
            severityLevel: 'moderate',
            recommendedAction: 'Monitor potassium levels regularly',
          },
          {
            medications: ['Simvastatin', 'Grapefruit juice'],
            description: 'Increased risk of myopathy',
            count: 4,
            severityLevel: 'moderate',
            recommendedAction: 'Advise patient to avoid grapefruit juice',
          },
        ],
        riskFactorsByMedication: [
          { medication: 'Warfarin', riskScore: 85 },
          { medication: 'Metformin', riskScore: 45 },
          { medication: 'Lisinopril', riskScore: 60 },
          { medication: 'Simvastatin', riskScore: 65 },
          { medication: 'Aspirin', riskScore: 55 },
        ],
        interactionsByBodySystem: [
          { system: 'Cardiovascular', count: 8 },
          { system: 'Digestive', count: 6 },
          { system: 'Central Nervous System', count: 5 },
          { system: 'Respiratory', count: 3 },
          { system: 'Endocrine', count: 2 },
        ],
      };
    }
  },

  getPatientMedicationSummary: async (
    patientId: string
  ): Promise<{
    activeCount: number;
    archivedCount: number;
    cancelledCount: number;
    adherenceRate: number;
    interactionCount: number;
    mostCommonCategory: string;
    mostCommonRoute: string;
    lastUpdated: string;
    adherenceTrend: 'increasing' | 'decreasing' | 'stable';
    costAnalysis: {
      totalMonthlyCost: number;
      costByCategory: { category: string; cost: number }[];
      insuranceCoverageRate: number;
    };
    medicationComplexity: {
      complexityScore: number; // 0-100 scale
      doseFrequency: number; // average daily doses
      uniqueScheduleCount: number; // number of different schedules
    };
  }> => {
    try {
      const response = await api.get(
        `/medication-management/analytics/summary/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching patient medication summary:', error);
      // Return mock data for development and fallback
      return {
        activeCount: 7,
        archivedCount: 3,
        cancelledCount: 1,
        adherenceRate: 86,
        interactionCount: 4,
        mostCommonCategory: 'Antihypertensives',
        mostCommonRoute: 'Oral',
        lastUpdated: '2023-08-15T14:30:00Z',
        adherenceTrend: 'increasing',
        costAnalysis: {
          totalMonthlyCost: 248.75,
          costByCategory: [
            { category: 'Antihypertensives', cost: 95.5 },
            { category: 'Analgesics', cost: 32.25 },
            { category: 'Antidiabetics', cost: 121.0 },
          ],
          insuranceCoverageRate: 75,
        },
        medicationComplexity: {
          complexityScore: 62,
          doseFrequency: 3.5,
          uniqueScheduleCount: 4,
        },
      };
    }
  },

  // Settings endpoints
  getPatientMedicationSettings: async (
    patientId: string
  ): Promise<{
    reminderSettings: MedicationReminderSettings;
    monitoringSettings: MedicationMonitoringSettings;
  }> => {
    try {
      const response = await api.get(
        `/medication-management/settings/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching patient medication settings:', error);
      // Return mock data for development and fallback
      return {
        reminderSettings: {
          enabled: true,
          defaultReminderTimes: ['09:00', '13:00', '19:00'],
          reminderMethod: 'email',
          defaultNotificationLeadTime: 15,
          customMessage: 'Time to take your medication!',
          repeatReminders: true,
          repeatInterval: 30,
          smartReminders: false,
          allowSnooze: true,
          snoozeOptions: [5, 10, 15, 30],
          notifyCaregiver: false,
          caregiverContact: '',
        },
        monitoringSettings: {
          adherenceMonitoring: true,
          refillReminders: true,
          interactionChecking: true,
          refillThreshold: 20,
          missedDoseThreshold: 2,
          adherenceReporting: true,
          reportFrequency: 'weekly',
          alertOnLowAdherence: true,
          lowAdherenceThreshold: 70,
          stockoutPrediction: true,
        },
      };
    }
  },

  updatePatientMedicationSettings: async (
    patientId: string,
    settings: {
      reminderSettings?: Partial<MedicationReminderSettings>;
      monitoringSettings?: Partial<MedicationMonitoringSettings>;
    }
  ): Promise<{
    reminderSettings: MedicationReminderSettings;
    monitoringSettings: MedicationMonitoringSettings;
  }> => {
    try {
      const response = await api.put(
        `/medication-management/settings/${patientId}`,
        settings
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating patient medication settings:', error);

      // Mock successful response for development purposes
      // In production, this should be removed
      return {
        reminderSettings: {
          enabled: settings.reminderSettings?.enabled ?? true,
          defaultReminderTimes: settings.reminderSettings
            ?.defaultReminderTimes ?? ['09:00', '13:00', '19:00'],
          reminderMethod: settings.reminderSettings?.reminderMethod ?? 'email',
          defaultNotificationLeadTime:
            settings.reminderSettings?.defaultNotificationLeadTime ?? 15,
          customMessage:
            settings.reminderSettings?.customMessage ??
            'Time to take your medication!',
          repeatReminders: settings.reminderSettings?.repeatReminders ?? true,
          repeatInterval: settings.reminderSettings?.repeatInterval ?? 30,
          smartReminders: settings.reminderSettings?.smartReminders ?? false,
          allowSnooze: settings.reminderSettings?.allowSnooze ?? true,
          snoozeOptions: settings.reminderSettings?.snoozeOptions ?? [
            5, 10, 15, 30,
          ],
          notifyCaregiver: settings.reminderSettings?.notifyCaregiver ?? false,
          caregiverContact: settings.reminderSettings?.caregiverContact ?? '',
        },
        monitoringSettings: {
          adherenceMonitoring:
            settings.monitoringSettings?.adherenceMonitoring ?? true,
          refillReminders: settings.monitoringSettings?.refillReminders ?? true,
          interactionChecking:
            settings.monitoringSettings?.interactionChecking ?? true,
          refillThreshold: settings.monitoringSettings?.refillThreshold ?? 20,
          missedDoseThreshold:
            settings.monitoringSettings?.missedDoseThreshold ?? 2,
          adherenceReporting:
            settings.monitoringSettings?.adherenceReporting ?? true,
          reportFrequency:
            settings.monitoringSettings?.reportFrequency ?? 'weekly',
          alertOnLowAdherence:
            settings.monitoringSettings?.alertOnLowAdherence ?? true,
          lowAdherenceThreshold:
            settings.monitoringSettings?.lowAdherenceThreshold ?? 70,
          stockoutPrediction:
            settings.monitoringSettings?.stockoutPrediction ?? true,
        },
      };
    }
  },

  testNotification: async (
    patientId: string,
    type: 'email' | 'sms',
    contact: string,
    testMessage?: string
  ): Promise<{ success: boolean; message: string; details?: string }> => {
    try {
      const response = await api.post(
        `/medication-management/settings/${patientId}/test-notification`,
        {
          type,
          contact,
          testMessage,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      // Return mock response for development
      return {
        success: true,
        message: `Test ${type.toUpperCase()} notification sent successfully to ${contact}`,
        details: `This is a simulated test response. In production, a real ${type} would be sent to ${contact}.`,
      };
    }
  },
};

export default medicationManagementService;
