import { useState, useEffect, useCallback } from 'react';
import { usePatientAuth } from './usePatientAuth';

// Types for lab results
interface LabTestResult {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: {
    min?: number;
    max?: number;
    normal?: string;
  };
  status: 'normal' | 'high' | 'low' | 'critical';
  flag?: string;
}

interface LabResult {
  _id: string;
  patientId: string;
  testDate: string;
  testType: string;
  orderingPhysician?: string;
  pharmacistName?: string;
  labName?: string;
  status: 'pending' | 'completed' | 'reviewed';
  results: LabTestResult[];
  interpretation?: string;
  recommendations?: string;
  followUpRequired?: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Types for visit history
interface Visit {
  _id: string;
  patientId: string;
  visitDate: string;
  visitType?: string;
  chiefComplaint?: string;
  assessment?: string;
  recommendations?: string;
  pharmacistName?: string;
  status?: string;
  followUpRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types for vitals
interface VitalReading {
  recordedDate: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  glucose?: number;
  oxygenSaturation?: number;
  notes?: string;
  source: 'patient_portal';
}

interface VitalsTrend {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'normal' | 'warning' | 'critical';
}

interface VitalsInsight {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  metric?: string;
}

interface VitalsTrendsData {
  readings: Array<{
    date: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    weight?: number;
    glucose?: number;
    temperature?: number;
    oxygenSaturation?: number;
  }>;
  trends: VitalsTrend[];
  insights: VitalsInsight[];
  summary: {
    totalReadings: number;
    daysTracked: number;
    lastReading: string;
    averages: {
      bloodPressure?: { systolic: number; diastolic: number };
      heartRate?: number;
      weight?: number;
      glucose?: number;
    };
  };
}

// Hook return type
interface UsePatientHealthRecordsReturn {
  labResults: LabResult[] | null;
  visitHistory: Visit[] | null;
  vitalsHistory: VitalReading[] | null;
  vitalsTrends: VitalsTrendsData | null;
  loading: boolean;
  error: string | null;
  refreshHealthRecords: () => Promise<void>;
  logVitals: (vitalsData: Partial<VitalReading>) => Promise<void>;
  downloadMedicalRecords: () => Promise<void>;
  vitalsLoading: boolean;
  downloadLoading: boolean;
}

// API Response types
interface HealthRecordsResponse {
  success: boolean;
  data?: {
    labResults: LabResult[];
    visitHistory: Visit[];
    vitalsHistory: VitalReading[];
    vitalsTrends: VitalsTrendsData;
  };
  message?: string;
  error?: {
    message: string;
  };
}

interface VitalsLogResponse {
  success: boolean;
  data?: {
    vital: VitalReading;
  };
  message?: string;
  error?: {
    message: string;
  };
}

// Patient Health Records API Service
class PatientHealthRecordsService {
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

  static async getHealthRecords(patientId: string): Promise<HealthRecordsResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockLabResults: LabResult[] = [
      {
        _id: 'lab_001',
        patientId: patientId,
        testDate: '2024-03-15',
        testType: 'Complete Blood Count (CBC)',
        pharmacistName: 'Dr. Sarah Johnson',
        labName: 'Central Medical Laboratory',
        status: 'reviewed',
        results: [
          {
            testName: 'Hemoglobin',
            value: 13.5,
            unit: 'g/dL',
            referenceRange: { min: 12.0, max: 15.5 },
            status: 'normal'
          },
          {
            testName: 'White Blood Cells',
            value: 8.2,
            unit: '×10³/μL',
            referenceRange: { min: 4.5, max: 11.0 },
            status: 'normal'
          },
          {
            testName: 'Platelets',
            value: 320,
            unit: '×10³/μL',
            referenceRange: { min: 150, max: 450 },
            status: 'normal'
          }
        ],
        interpretation: 'All blood count parameters are within normal limits. No signs of anemia or infection.',
        createdAt: '2024-03-15T10:00:00.000Z',
        updatedAt: '2024-03-15T14:30:00.000Z'
      },
      {
        _id: 'lab_002',
        patientId: patientId,
        testDate: '2024-03-10',
        testType: 'Lipid Profile',
        pharmacistName: 'Dr. Sarah Johnson',
        labName: 'Central Medical Laboratory',
        status: 'reviewed',
        results: [
          {
            testName: 'Total Cholesterol',
            value: 195,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 200 },
            status: 'normal'
          },
          {
            testName: 'LDL Cholesterol',
            value: 125,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 100 },
            status: 'high',
            flag: 'Slightly elevated - consider dietary modifications'
          },
          {
            testName: 'HDL Cholesterol',
            value: 55,
            unit: 'mg/dL',
            referenceRange: { min: 40, max: 100 },
            status: 'normal'
          },
          {
            testName: 'Triglycerides',
            value: 85,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 150 },
            status: 'normal'
          }
        ],
        interpretation: 'LDL cholesterol is slightly elevated. Recommend dietary modifications and regular exercise.',
        recommendations: 'Reduce saturated fat intake, increase fiber consumption, and maintain regular physical activity.',
        followUpRequired: true,
        createdAt: '2024-03-10T09:00:00.000Z',
        updatedAt: '2024-03-10T16:45:00.000Z'
      }
    ];

    const mockVisitHistory: Visit[] = [
      {
        _id: 'visit_001',
        patientId: patientId,
        visitDate: '2024-03-20',
        visitType: 'Medication Therapy Review',
        chiefComplaint: 'Follow-up for diabetes management and blood pressure control',
        assessment: 'Patient shows good adherence to medication regimen. Blood pressure well controlled. HbA1c improved from last visit.',
        recommendations: 'Continue current medications. Monitor blood glucose daily. Schedule follow-up in 3 months.',
        pharmacistName: 'Dr. Sarah Johnson',
        status: 'completed',
        followUpRequired: true,
        createdAt: '2024-03-20T14:00:00.000Z',
        updatedAt: '2024-03-20T15:30:00.000Z'
      },
      {
        _id: 'visit_002',
        patientId: patientId,
        visitDate: '2024-02-15',
        visitType: 'Initial Consultation',
        chiefComplaint: 'New patient consultation for medication management',
        assessment: 'Patient presents with Type 2 diabetes and hypertension. Currently on multiple medications.',
        recommendations: 'Medication reconciliation completed. Patient education provided on proper medication timing and monitoring.',
        pharmacistName: 'Dr. Sarah Johnson',
        status: 'completed',
        createdAt: '2024-02-15T10:00:00.000Z',
        updatedAt: '2024-02-15T11:00:00.000Z'
      }
    ];

    const mockVitalsHistory: VitalReading[] = [
      {
        recordedDate: '2024-03-22T08:00:00.000Z',
        bloodPressure: { systolic: 128, diastolic: 82 },
        heartRate: 72,
        weight: 75.5,
        glucose: 110,
        notes: 'Morning reading before breakfast',
        source: 'patient_portal'
      },
      {
        recordedDate: '2024-03-21T08:15:00.000Z',
        bloodPressure: { systolic: 125, diastolic: 80 },
        heartRate: 68,
        weight: 75.8,
        glucose: 105,
        source: 'patient_portal'
      },
      {
        recordedDate: '2024-03-20T08:30:00.000Z',
        bloodPressure: { systolic: 130, diastolic: 85 },
        heartRate: 75,
        weight: 76.0,
        glucose: 115,
        notes: 'Felt slightly stressed this morning',
        source: 'patient_portal'
      },
      {
        recordedDate: '2024-03-19T08:00:00.000Z',
        bloodPressure: { systolic: 122, diastolic: 78 },
        heartRate: 70,
        weight: 75.3,
        glucose: 108,
        source: 'patient_portal'
      },
      {
        recordedDate: '2024-03-18T08:10:00.000Z',
        bloodPressure: { systolic: 126, diastolic: 81 },
        heartRate: 73,
        weight: 75.6,
        glucose: 112,
        source: 'patient_portal'
      }
    ];

    const mockVitalsTrends: VitalsTrendsData = {
      readings: mockVitalsHistory.map(vital => ({
        date: vital.recordedDate,
        bloodPressureSystolic: vital.bloodPressure?.systolic,
        bloodPressureDiastolic: vital.bloodPressure?.diastolic,
        heartRate: vital.heartRate,
        weight: vital.weight,
        glucose: vital.glucose,
        temperature: vital.temperature,
        oxygenSaturation: vital.oxygenSaturation
      })),
      trends: [
        {
          metric: 'Blood Pressure',
          trend: 'stable',
          change: -2,
          status: 'normal'
        },
        {
          metric: 'Heart Rate',
          trend: 'stable',
          change: 1,
          status: 'normal'
        },
        {
          metric: 'Weight',
          trend: 'down',
          change: -0.8,
          status: 'normal'
        },
        {
          metric: 'Glucose',
          trend: 'stable',
          change: 3,
          status: 'normal'
        }
      ],
      insights: [
        {
          type: 'success',
          message: 'Your blood pressure has been stable and within target range this week.'
        },
        {
          type: 'info',
          message: 'Weight trend shows slight decrease - great progress!'
        },
        {
          type: 'warning',
          message: 'Consider logging vitals at the same time each day for more accurate trends.'
        }
      ],
      summary: {
        totalReadings: mockVitalsHistory.length,
        daysTracked: 5,
        lastReading: mockVitalsHistory[0].recordedDate,
        averages: {
          bloodPressure: { systolic: 126, diastolic: 81 },
          heartRate: 72,
          weight: 75.6,
          glucose: 110
        }
      }
    };

    return {
      success: true,
      data: {
        labResults: mockLabResults,
        visitHistory: mockVisitHistory,
        vitalsHistory: mockVitalsHistory,
        vitalsTrends: mockVitalsTrends
      },
      message: 'Health records retrieved successfully'
    };
  }

  static async logVitals(patientId: string, vitalsData: Partial<VitalReading>): Promise<VitalsLogResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate validation errors
    if (!vitalsData || Object.keys(vitalsData).length === 0) {
      throw new Error('At least one vital sign measurement is required');
    }

    // Mock successful vitals logging
    const mockVitalReading: VitalReading = {
      recordedDate: new Date().toISOString(),
      ...vitalsData,
      source: 'patient_portal'
    };

    return {
      success: true,
      data: { vital: mockVitalReading },
      message: 'Vitals logged successfully'
    };
  }

  static async downloadMedicalRecords(patientId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock PDF download
    const mockPdfContent = 'Mock PDF content for medical records';
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-records-${patientId}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
}

export const usePatientHealthRecords = (patientId?: string): UsePatientHealthRecordsReturn => {
  const { user, isAuthenticated } = usePatientAuth();
  const [labResults, setLabResults] = useState<LabResult[] | null>(null);
  const [visitHistory, setVisitHistory] = useState<Visit[] | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalReading[] | null>(null);
  const [vitalsTrends, setVitalsTrends] = useState<VitalsTrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState<boolean>(false);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);

  // Load health records data when user is authenticated
  const loadHealthRecords = useCallback(async () => {
    if (!isAuthenticated || !user || !patientId) {
      setLabResults(null);
      setVisitHistory(null);
      setVitalsHistory(null);
      setVitalsTrends(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PatientHealthRecordsService.getHealthRecords(patientId);
      if (response.success && response.data) {
        setLabResults(response.data.labResults);
        setVisitHistory(response.data.visitHistory);
        setVitalsHistory(response.data.vitalsHistory);
        setVitalsTrends(response.data.vitalsTrends);
      } else {
        throw new Error(response.message || 'Failed to load health records');
      }
    } catch (err: any) {
      console.error('Failed to load health records:', err);
      setError(err.message || 'Failed to load health records');
      setLabResults(null);
      setVisitHistory(null);
      setVitalsHistory(null);
      setVitalsTrends(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, patientId]);

  // Load health records on mount and when dependencies change
  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  // Log vitals function
  const logVitals = useCallback(async (vitalsData: Partial<VitalReading>) => {
    if (!isAuthenticated || !user || !patientId) {
      throw new Error('User not authenticated');
    }

    setVitalsLoading(true);

    try {
      const response = await PatientHealthRecordsService.logVitals(patientId, vitalsData);
      if (response.success && response.data) {
        // Add the new vital reading to the history
        setVitalsHistory(prev => prev ? [response.data!.vital, ...prev] : [response.data!.vital]);
        
        // Refresh trends data
        await loadHealthRecords();
      } else {
        throw new Error(response.message || 'Failed to log vitals');
      }
    } catch (err: any) {
      console.error('Failed to log vitals:', err);
      throw err;
    } finally {
      setVitalsLoading(false);
    }
  }, [isAuthenticated, user, patientId, loadHealthRecords]);

  // Download medical records function
  const downloadMedicalRecords = useCallback(async () => {
    if (!isAuthenticated || !user || !patientId) {
      throw new Error('User not authenticated');
    }

    setDownloadLoading(true);

    try {
      await PatientHealthRecordsService.downloadMedicalRecords(patientId);
    } catch (err: any) {
      console.error('Failed to download medical records:', err);
      throw err;
    } finally {
      setDownloadLoading(false);
    }
  }, [isAuthenticated, user, patientId]);

  // Refresh health records function
  const refreshHealthRecords = useCallback(async () => {
    await loadHealthRecords();
  }, [loadHealthRecords]);

  return {
    labResults,
    visitHistory,
    vitalsHistory,
    vitalsTrends,
    loading,
    error,
    refreshHealthRecords,
    logVitals,
    downloadMedicalRecords,
    vitalsLoading,
    downloadLoading
  };
};

export default usePatientHealthRecords;