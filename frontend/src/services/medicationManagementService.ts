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
  name: string;
  rxcui?: string;
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
    const response = await api.post(
      '/api/medication-management',
      medicationData
    );
    return response.data.data;
  },

  getMedicationsByPatient: async (
    patientId: string,
    status = 'active'
  ): Promise<MedicationData[]> => {
    const response = await api.get(
      `/api/medication-management/patient/${patientId}`,
      {
        params: { status },
      }
    );
    return response.data.data;
  },

  getMedicationById: async (id: string): Promise<MedicationData> => {
    const response = await api.get(`/api/medication-management/${id}`);
    return response.data.data;
  },

  updateMedication: async (
    id: string,
    medicationData: MedicationUpdateData
  ): Promise<MedicationData> => {
    const response = await api.put(
      `/api/medication-management/${id}`,
      medicationData
    );
    return response.data.data;
  },

  archiveMedication: async (
    id: string,
    reason?: string
  ): Promise<MedicationData> => {
    const response = await api.patch(
      `/api/medication-management/${id}/archive`,
      { reason }
    );
    return response.data.data;
  },

  // Adherence tracking
  logAdherence: async (
    adherenceData: AdherenceLogCreateData
  ): Promise<AdherenceLogData> => {
    const response = await api.post(
      '/api/medication-management/adherence',
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
      `/api/medication-management/adherence/patient/${patientId}`,
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
      '/api/medication-management/check-interactions',
      {
        medications,
      }
    );
    return response.data.data;
  },
};

export default medicationManagementService;
