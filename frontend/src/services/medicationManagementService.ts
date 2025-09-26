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
  cost?: number; // Cost price in Naira (₦)
  sellingPrice?: number; // Selling price in Naira (₦)
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
  cost?: number; // Cost price in Naira (₦)
  sellingPrice?: number; // Selling price in Naira (₦)
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
  cost?: number; // Cost price in Naira (₦)
  sellingPrice?: number; // Selling price in Naira (₦)
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
  cost?: number; // Cost price in Naira
  sellingPrice?: number; // Selling price in Naira
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
      reason}
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

  // Enhanced Analytics endpoints with Naira currency support
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
    costsData?: {
      saved: number;
      potential: number;
      formattedSaved: string;
      formattedPotential: string;
    };
    currencyCode?: string;
    currencySymbol?: string;
  }> => {
    try {
      const response = await api.get(
        `/medication-analytics/adherence/${patientId}`,
        {
          params: { period },
        }
      );
      return {
        ...response.data,
        currencyCode: 'NGN',
        currencySymbol: '₦',
      };
    } catch (error) {
      console.error('Error fetching enhanced adherence analytics:', error);
      // Return empty data with zero values
      const currentDate = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() - i);
        months.push(month.toLocaleDateString('en-US', { month: 'short' }));
      }

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const timeOfDay = ['Morning', 'Noon', 'Evening', 'Night'];

      return {
        monthlyAdherence: months.map((month) => ({ month, adherence: 0 })),
        averageAdherence: 0,
        trendDirection: 'stable',
        complianceDays: days.map((day) => ({ day, count: 0 })),
        missedDoses: days.map((day) => ({ day, count: 0 })),
        adherenceByTimeOfDay: timeOfDay.map((time) => ({ time, adherence: 0 })),
        costsData: {
          saved: 0,
          potential: 0,
          formattedSaved: '₦0.00',
          formattedPotential: '₦0.00',
        },
        currencyCode: 'NGN',
        currencySymbol: '₦',
      };
    }
  },

  getPrescriptionPatternAnalytics: async (
    patientId: string
  ): Promise<{
    medicationsByCategory: {
      category: string;
      count: number;
      cost?: number;
      formattedCost?: string;
    }[];
    medicationsByRoute: {
      route: string;
      count: number;
      cost?: number;
      formattedCost?: string;
    }[];
    prescriptionFrequency: { month: string; count: number }[];
    topPrescribers: { prescriber: string; count: number }[];
    medicationDurationTrends: { duration: string; count: number }[];
    seasonalPrescriptionPatterns: { season: string; count: number }[];
    costByMonth?: { month: string; cost: number; formattedCost: string }[];
    currencyCode?: string;
    currencySymbol?: string;
  }> => {
    try {
      const response = await api.get(
        `/medication-analytics/prescriptions/${patientId}`
      );
      return {
        ...response.data,
        currencyCode: 'NGN',
        currencySymbol: '₦',
      };
    } catch (error) {
      console.error(
        'Error fetching enhanced prescription pattern analytics:',
        error
      );
      // Return empty data with zero values
      return {
        medicationsByCategory: [],
        medicationsByRoute: [],
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
        costByMonth: [
          { month: 'Jan', cost: 12500, formattedCost: '₦12,500.00' },
          { month: 'Feb', cost: 8900, formattedCost: '₦8,900.00' },
          { month: 'Mar', cost: 15200, formattedCost: '₦15,200.00' },
          { month: 'Apr', cost: 7600, formattedCost: '₦7,600.00' },
          { month: 'May', cost: 18700, formattedCost: '₦18,700.00' },
          { month: 'Jun', cost: 9800, formattedCost: '₦9,800.00' },
        ],
        currencyCode: 'NGN',
        currencySymbol: '₦',
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
      potentialCosts?: number;
      formattedPotentialCosts?: string;
    }[];
    riskFactorsByMedication: { medication: string; riskScore: number }[];
    interactionsByBodySystem: { system: string; count: number }[];
    financialImpact?: {
      potentialCost: number;
      formattedPotentialCost: string;
      preventedCost: number;
      formattedPreventedCost: string;
    };
    currencyCode?: string;
    currencySymbol?: string;
  }> => {
    try {
      const response = await api.get(
        `/medication-analytics/interactions/${patientId}`
      );
      return {
        ...response.data,
        currencyCode: 'NGN',
        currencySymbol: '₦',
      };
    } catch (error) {
      console.error('Error fetching enhanced interaction analytics:', error);
      // Return empty data with zero values
      return {
        severityDistribution: [
          { severity: 'Minor', count: 0 },
          { severity: 'Moderate', count: 0 },
          { severity: 'Severe', count: 0 },
        ],
        interactionTrends: [],
        commonInteractions: [],
        riskFactorsByMedication: [],
        interactionsByBodySystem: [],
      };
    }
  },

  getMedicationCostAnalytics: async (
    patientId: string
  ): Promise<{
    monthlyCosts: { month: string; totalCost: number; formattedCost: string }[];
    costByCategory: { category: string; cost: number; formattedCost: string }[];
    totalCost: number;
    formattedTotalCost: string;
    currency: {
      code: string;
      symbol: string;
    };
    // New fields for the updated API
    monthlyFinancials?: {
      month: string;
      cost: number;
      revenue: number;
      profit: number;
      formattedCost: string;
      formattedRevenue: string;
      formattedProfit: string;
    }[];
    financialsByCategory?: {
      category: string;
      cost: number;
      revenue: number;
      profit: number;
      formattedCost: string;
      formattedRevenue: string;
      formattedProfit: string;
    }[];
    topProfitableMedications?: {
      medicationName: string;
      profit: number;
      formattedProfit: string;
      profitMargin: number;
      formattedProfitMargin: string;
    }[];
    totalRevenue?: number;
    totalProfit?: number;
    profitMargin?: number;
    formattedTotalRevenue?: string;
    formattedTotalProfit?: string;
    formattedProfitMargin?: string;
  }> => {
    try {
      const response = await api.get(
        `/medication-analytics/costs/${patientId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching medication cost analytics:', error);
      // Return empty data with zero values instead of mock data
      return {
        monthlyCosts: Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return {
            month: date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric', },
            totalCost: 0,
            formattedCost: '₦0.00',
          };
        }).reverse(),
        costByCategory: [],
        totalCost: 0,
        formattedTotalCost: '₦0.00',
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        formattedTotalRevenue: '₦0.00',
        formattedTotalProfit: '₦0.00',
        formattedProfitMargin: '0%',
        monthlyFinancials: [],
        financialsByCategory: [],
        topProfitableMedications: [],
        currency: {
          code: 'NGN',
          symbol: '₦',
        },
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
      formattedMonthlyCost: string;
      costByCategory: {
        category: string;
        cost: number;
        formattedCost: string;
      }[];
      insuranceCoverageRate: number;
    };
    medicationComplexity: {
      complexityScore: number; // 0-100 scale
      doseFrequency: number; // average daily doses
      uniqueScheduleCount: number; // number of different schedules
    };
    currency?: {
      code: string;
      symbol: string;
    };
  }> => {
    try {
      const response = await api.get(
        `/medication-analytics/dashboard/${patientId}`
      );
      return {
        ...response.data,
        currency: {
          code: 'NGN',
          symbol: '₦',
        },
      };
    } catch (error) {
      console.error(
        'Error fetching enhanced patient medication summary:',
        error
      );
      // Return empty data with zero values instead of mock data
      return {
        activeCount: 0,
        archivedCount: 0,
        cancelledCount: 0,
        adherenceRate: 0,
        interactionCount: 0,
        mostCommonCategory: 'None',
        mostCommonRoute: 'None',
        lastUpdated: new Date().toISOString(),
        adherenceTrend: 'stable',
        costAnalysis: {
          totalMonthlyCost: 0,
          formattedMonthlyCost: '₦0.00',
          costByCategory: [],
          insuranceCoverageRate: 0,
        },
        medicationComplexity: {
          complexityScore: 0,
          doseFrequency: 0,
          uniqueScheduleCount: 0,
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
      // Return empty data instead of mock data
      return {
        reminderSettings: {
          enabled: false,
          defaultReminderTimes: [],
          reminderMethod: 'email',
          defaultNotificationLeadTime: 0,
          customMessage: '',
          repeatReminders: false,
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

      // Return empty default settings instead of mock data
      return {
        reminderSettings: {
          enabled: settings.reminderSettings?.enabled ?? false,
          defaultReminderTimes:
            settings.reminderSettings?.defaultReminderTimes ?? [],
          reminderMethod: settings.reminderSettings?.reminderMethod ?? 'email',
          defaultNotificationLeadTime:
            settings.reminderSettings?.defaultNotificationLeadTime ?? 0,
          customMessage: settings.reminderSettings?.customMessage ?? '',
          repeatReminders: settings.reminderSettings?.repeatReminders ?? false,
          repeatInterval: settings.reminderSettings?.repeatInterval ?? 0,
          smartReminders: settings.reminderSettings?.smartReminders ?? false,
          allowSnooze: settings.reminderSettings?.allowSnooze ?? false,
          snoozeOptions: settings.reminderSettings?.snoozeOptions ?? [],
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
      // Return error response instead of mock success
      return {
        success: false,
        message: `Failed to send test notification`,
        details: `Could not connect to notification service. Please try again or check your network connection.`,
      };
    }
  },
};

export default medicationManagementService;
