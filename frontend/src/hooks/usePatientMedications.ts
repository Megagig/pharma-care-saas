import { useState, useEffect, useCallback } from 'react';
import { usePatientAuth } from './usePatientAuth';
import { MedicationRecord } from '../types/patientManagement';

interface AdherenceData {
  overallScore: number;
  trend: 'up' | 'down' | 'stable';
  medicationScores: Array<{
    medicationId: string;
    medicationName: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    daysTracked: number;
    missedDoses: number;
    totalDoses: number;
  }>;
  weeklyScores: Array<{
    week: string;
    score: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
  }>;
}

interface RefillRequest {
  _id: string;
  medicationId: string;
  medicationName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'denied';
  requestedDate: string;
  completedDate?: string;
  estimatedCompletionDate?: string;
  notes?: string;
  pharmacistNotes?: string;
  quantity?: number;
  refillsRemaining?: number;
  urgency?: 'routine' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface UsePatientMedicationsReturn {
  currentMedications: MedicationRecord[] | null;
  medicationHistory: MedicationRecord[] | null;
  adherenceData: AdherenceData | null;
  refillRequests: RefillRequest[] | null;
  loading: boolean;
  error: string | null;
  refreshMedications: () => Promise<void>;
  requestRefill: (medicationId: string, notes: string) => Promise<void>;
  cancelRefillRequest: (requestId: string, reason: string) => Promise<void>;
  refillLoading: boolean;
  cancelLoading: boolean;
}

interface PatientMedicationResponse {
  success: boolean;
  data?: {
    currentMedications: MedicationRecord[];
    medicationHistory: MedicationRecord[];
    adherenceData: AdherenceData;
    refillRequests: RefillRequest[];
  };
  message?: string;
  error?: {
    message: string;
  };
}

interface RefillRequestResponse {
  success: boolean;
  data?: {
    request: RefillRequest;
  };
  message?: string;
  error?: {
    message: string;
  };
}

// Patient Medication API Service
class PatientMedicationService {
  private static baseUrl = '/api/patient-portal';

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('patient_auth_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async getMedicationData(patientId: string): Promise<PatientMedicationResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockCurrentMedications: MedicationRecord[] = [
      {
        _id: 'med_001',
        pharmacyId: 'pharmacy_456',
        patientId: patientId,
        phase: 'current',
        medicationName: 'Metformin 500mg',
        purposeIndication: 'Type 2 Diabetes Management',
        dose: '500mg',
        frequency: 'Twice daily',
        route: 'Oral',
        duration: '3 months',
        startDate: '2024-01-15',
        endDate: '2024-04-15',
        adherence: 'good',
        status: 'active',
        notes: 'Take with meals to reduce stomach upset',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        createdBy: 'pharmacist_123'
      },
      {
        _id: 'med_002',
        pharmacyId: 'pharmacy_456',
        patientId: patientId,
        phase: 'current',
        medicationName: 'Lisinopril 10mg',
        purposeIndication: 'Hypertension Control',
        dose: '10mg',
        frequency: 'Once daily',
        route: 'Oral',
        duration: '6 months',
        startDate: '2024-02-01',
        endDate: '2024-08-01',
        adherence: 'good',
        status: 'active',
        notes: 'Take at the same time each day, preferably in the morning',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        createdBy: 'pharmacist_123'
      }
    ];

    const mockMedicationHistory: MedicationRecord[] = [
      {
        _id: 'med_003',
        pharmacyId: 'pharmacy_456',
        patientId: patientId,
        phase: 'past',
        medicationName: 'Amoxicillin 500mg',
        purposeIndication: 'Bacterial Infection Treatment',
        dose: '500mg',
        frequency: 'Three times daily',
        route: 'Oral',
        duration: '7 days',
        startDate: '2023-12-01',
        endDate: '2023-12-07',
        adherence: 'good',
        status: 'completed',
        notes: 'Completed full course as prescribed',
        createdAt: '2023-12-01T00:00:00.000Z',
        updatedAt: '2023-12-07T00:00:00.000Z',
        createdBy: 'pharmacist_123'
      }
    ];

    const mockAdherenceData: AdherenceData = {
      overallScore: 87,
      trend: 'up',
      medicationScores: [
        {
          medicationId: 'med_001',
          medicationName: 'Metformin 500mg',
          score: 92,
          trend: 'up',
          daysTracked: 30,
          missedDoses: 2,
          totalDoses: 60
        },
        {
          medicationId: 'med_002',
          medicationName: 'Lisinopril 10mg',
          score: 83,
          trend: 'stable',
          daysTracked: 30,
          missedDoses: 5,
          totalDoses: 30
        }
      ],
      weeklyScores: [
        { week: 'Week 1', score: 85 },
        { week: 'Week 2', score: 88 },
        { week: 'Week 3', score: 90 },
        { week: 'Week 4', score: 87 }
      ],
      insights: [
        {
          type: 'success',
          message: 'Great job! Your adherence has improved by 5% this month.'
        },
        {
          type: 'warning',
          message: 'Consider setting reminders for your evening Metformin dose.'
        }
      ]
    };

    const mockRefillRequests: RefillRequest[] = [
      {
        _id: 'refill_001',
        medicationId: 'med_001',
        medicationName: 'Metformin 500mg',
        status: 'in_progress',
        requestedDate: '2024-03-10',
        estimatedCompletionDate: '2024-03-12',
        notes: 'Running low, need refill before weekend',
        quantity: 90,
        refillsRemaining: 2,
        urgency: 'routine',
        createdAt: '2024-03-10T10:30:00.000Z',
        updatedAt: '2024-03-10T10:30:00.000Z'
      }
    ];

    return {
      success: true,
      data: {
        currentMedications: mockCurrentMedications,
        medicationHistory: mockMedicationHistory,
        adherenceData: mockAdherenceData,
        refillRequests: mockRefillRequests
      },
      message: 'Medication data retrieved successfully'
    };
  }

  static async requestRefill(medicationId: string, notes: string): Promise<RefillRequestResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate validation errors
    if (!medicationId) {
      throw new Error('Medication ID is required');
    }

    // Mock successful refill request
    const mockRefillRequest: RefillRequest = {
      _id: `refill_${Date.now()}`,
      medicationId: medicationId,
      medicationName: 'Metformin 500mg', // This would come from the medication lookup
      status: 'pending',
      requestedDate: new Date().toISOString(),
      notes: notes,
      quantity: 90,
      refillsRemaining: 2,
      urgency: 'routine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: { request: mockRefillRequest },
      message: 'Refill request submitted successfully'
    };
  }

  static async cancelRefillRequest(requestId: string, reason: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!reason.trim()) {
      throw new Error('Cancellation reason is required');
    }

    return {
      success: true,
      message: 'Refill request cancelled successfully'
    };
  }
}

export const usePatientMedications = (patientId?: string): UsePatientMedicationsReturn => {
  const { user, isAuthenticated } = usePatientAuth();
  const [currentMedications, setCurrentMedications] = useState<MedicationRecord[] | null>(null);
  const [medicationHistory, setMedicationHistory] = useState<MedicationRecord[] | null>(null);
  const [adherenceData, setAdherenceData] = useState<AdherenceData | null>(null);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refillLoading, setRefillLoading] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  // Load medication data when user is authenticated
  const loadMedicationData = useCallback(async () => {
    if (!isAuthenticated || !user || !patientId) {
      setCurrentMedications(null);
      setMedicationHistory(null);
      setAdherenceData(null);
      setRefillRequests(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PatientMedicationService.getMedicationData(patientId);
      if (response.success && response.data) {
        setCurrentMedications(response.data.currentMedications);
        setMedicationHistory(response.data.medicationHistory);
        setAdherenceData(response.data.adherenceData);
        setRefillRequests(response.data.refillRequests);
      } else {
        throw new Error(response.message || 'Failed to load medication data');
      }
    } catch (err: any) {
      console.error('Failed to load medication data:', err);
      setError(err.message || 'Failed to load medication data');
      setCurrentMedications(null);
      setMedicationHistory(null);
      setAdherenceData(null);
      setRefillRequests(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, patientId]);

  // Load medication data on mount and when dependencies change
  useEffect(() => {
    loadMedicationData();
  }, [loadMedicationData]);

  // Request refill function
  const requestRefill = useCallback(async (medicationId: string, notes: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    setRefillLoading(true);

    try {
      const response = await PatientMedicationService.requestRefill(medicationId, notes);
      if (response.success && response.data) {
        // Add the new refill request to the list
        setRefillRequests(prev => prev ? [response.data!.request, ...prev] : [response.data!.request]);
      } else {
        throw new Error(response.message || 'Failed to submit refill request');
      }
    } catch (err: any) {
      console.error('Failed to request refill:', err);
      throw err;
    } finally {
      setRefillLoading(false);
    }
  }, [isAuthenticated, user]);

  // Cancel refill request function
  const cancelRefillRequest = useCallback(async (requestId: string, reason: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    setCancelLoading(true);

    try {
      await PatientMedicationService.cancelRefillRequest(requestId, reason);
      
      // Update the refill request status in the list
      setRefillRequests(prev => 
        prev ? prev.map(request => 
          request._id === requestId 
            ? { ...request, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
            : request
        ) : null
      );
    } catch (err: any) {
      console.error('Failed to cancel refill request:', err);
      throw err;
    } finally {
      setCancelLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh medication data function
  const refreshMedications = useCallback(async () => {
    await loadMedicationData();
  }, [loadMedicationData]);

  return {
    currentMedications,
    medicationHistory,
    adherenceData,
    refillRequests,
    loading,
    error,
    refreshMedications,
    requestRefill,
    cancelRefillRequest,
    refillLoading,
    cancelLoading
  };
};

export default usePatientMedications;