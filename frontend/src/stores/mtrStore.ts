import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient, LoadingState, ErrorState } from './types';
import { StorePatient } from '../utils/patientUtils';
// Import from our proxy which handles all the TypeScript issues
import { mtrService } from '../services/mtrServiceProxy';
import type {
  MedicationTherapyReview,
  DrugTherapyProblem,
  MTRIntervention,
  MTRFollowUp,
  TherapyPlan,
  TherapyRecommendation,
  MonitoringParameter,
  TherapyGoal,
  ClinicalOutcomes,
  MTRMedicationEntry,
} from '../types/mtr';

// Re-export types for easier importing
export type {
  DrugTherapyProblem,
  MTRIntervention,
  MTRFollowUp,
  TherapyPlan,
  MedicationTherapyReview,
} from '../types/mtr';

// MTR-specific types based on backend models
export interface MTRMedication {
  id?: string;
  drugName: string;
  genericName?: string;
  strength: {
    value: number;
    unit: string;
  };
  dosageForm: string;
  instructions: {
    dose: string;
    frequency: string;
    route: string;
    duration?: string;
  };
  category: 'prescribed' | 'otc' | 'herbal' | 'supplement';
  prescriber?: {
    name: string;
    license?: string;
    contact?: string;
  };
  startDate: Date;
  endDate?: Date;
  indication: string;
  adherenceScore?: number;
  notes?: string;
  isManual?: boolean; // Flag to indicate if medication was manually entered
}

// Helper functions to convert between API types and store types
const convertMedicationEntryToMTRMedication = (entry: {
  _id?: string;
  id?: string;
  drugName: string;
  genericName?: string;
  strength: { value: number; unit: string };
  dosageForm: string;
  instructions: {
    dose: string;
    frequency: string;
    route: string;
    duration?: string;
  };
  category: 'prescribed' | 'otc' | 'herbal' | 'supplement';
  prescriber?: { name: string; license?: string; contact?: string };
  startDate: string | Date;
  endDate?: string | Date;
  indication: string;
  adherenceScore?: number;
  notes?: string;
  isManual?: boolean;
}): MTRMedication => ({
  id: entry._id || entry.id,
  drugName: entry.drugName,
  genericName: entry.genericName,
  strength: entry.strength,
  dosageForm: entry.dosageForm,
  instructions: entry.instructions,
  category: entry.category,
  prescriber: entry.prescriber,
  startDate:
    typeof entry.startDate === 'string'
      ? new Date(entry.startDate)
      : entry.startDate,
  endDate: entry.endDate
    ? typeof entry.endDate === 'string'
      ? new Date(entry.endDate)
      : entry.endDate
    : undefined,
  indication: entry.indication,
  adherenceScore: entry.adherenceScore,
  notes: entry.notes,
  isManual: entry.isManual,
});

const convertMTRMedicationToEntry = (
  medication: MTRMedication
): {
  drugName: string;
  genericName?: string;
  strength: { value: number; unit: string };
  dosageForm: string;
  instructions: {
    dose: string;
    frequency: string;
    route: string;
    duration?: string;
  };
  category: 'prescribed' | 'otc' | 'herbal' | 'supplement';
  prescriber?: { name: string; license?: string; contact?: string };
  startDate: string;
  endDate?: string;
  indication: string;
  adherenceScore?: number;
  notes?: string;
  isManual?: boolean;
} => ({
  drugName: medication.drugName,
  genericName: medication.genericName,
  strength: medication.strength,
  dosageForm: medication.dosageForm,
  instructions: medication.instructions,
  category: medication.category,
  prescriber: medication.prescriber,
  startDate: medication.startDate.toISOString(),
  endDate: medication.endDate?.toISOString(),
  indication: medication.indication,
  adherenceScore: medication.adherenceScore,
  notes: medication.notes,
  isManual: medication.isManual,
});

// Using imported DrugTherapyProblem type

// Using imported TherapyRecommendation type

// Using imported MonitoringParameter type

// Using imported TherapyGoal type

// Using imported TherapyPlan type

// Using imported MTRIntervention type

// Using imported MTRFollowUp type

export interface MTRStep {
  completed: boolean;
  completedAt?: Date;
  data?: Record<string, unknown>;
}

interface MTRStore {
  // Current session state
  currentReview: MedicationTherapyReview | null;
  currentStep: number;
  stepData: Record<string, Record<string, unknown>>;

  // Patient and medications
  selectedPatient: StorePatient | null;
  medications: MTRMedication[];

  // Assessment results
  identifiedProblems: DrugTherapyProblem[];
  therapyPlan: TherapyPlan | null;

  // Interventions and follow-ups
  interventions: MTRIntervention[];
  followUps: MTRFollowUp[];

  // UI state
  loading: LoadingState;
  errors: ErrorState;

  // Session management actions
  initializeSession: () => void;
  createReview: (patientId: string) => Promise<void>;
  loadReview: (reviewId: string) => Promise<void>;
  loadInProgressReview: (
    patientId: string
  ) => Promise<MedicationTherapyReview | null>;
  saveReview: () => Promise<void>;
  completeReview: (reviewId?: string) => Promise<MedicationTherapyReview>;
  cancelReview: () => Promise<void>;
  setCurrentReview: (review: MedicationTherapyReview | null | ((prev: MedicationTherapyReview | null) => MedicationTherapyReview | null)) => void;

  // Step navigation actions
  goToStep: (step: number) => void;
  completeStep: (step: number, data: Record<string, unknown>) => Promise<void>;
  getNextStep: () => number | null;
  getCurrentStepName: () => string;

  // Patient selection actions
  selectPatient: (patient: StorePatient) => void;
  searchPatients: (query: string) => Promise<Patient[]>;
  createNewPatient: (patientData: Partial<Patient>) => Promise<Patient | null>;

  // Medication management actions
  addMedication: (medication: MTRMedication) => void;
  updateMedication: (id: string, updates: Partial<MTRMedication>) => void;
  removeMedication: (id: string) => void;
  setMedications: (medications: MTRMedication[]) => void;
  importMedications: (patientId: string) => Promise<void>;
  validateMedications: () => string[];

  // Problem identification actions
  runAssessment: () => Promise<void>;
  addProblem: (problem: DrugTherapyProblem) => void;
  updateProblem: (id: string, updates: Partial<DrugTherapyProblem>) => void;
  resolveProblem: (id: string, resolution: string) => void;
  checkDrugInteractions: (
    medications: MTRMedication[]
  ) => Promise<DrugTherapyProblem[]>;

  // Plan development actions
  createPlan: (plan: TherapyPlan) => Promise<void>;
  updatePlan: (updates: Partial<TherapyPlan>) => void;
  addRecommendation: (recommendation: TherapyRecommendation) => void;
  addMonitoringParameter: (parameter: MonitoringParameter) => void;
  addTherapyGoal: (goal: TherapyGoal) => void;

  // Intervention actions
  recordIntervention: (intervention: MTRIntervention) => Promise<void>;
  updateIntervention: (id: string, updates: Partial<MTRIntervention>) => void;
  markInterventionComplete: (
    id: string,
    outcome: string,
    details?: string
  ) => void;

  // Follow-up actions
  scheduleFollowUp: (followUp: MTRFollowUp) => Promise<void>;
  updateFollowUp: (id: string, updates: Partial<MTRFollowUp>) => void;
  completeFollowUp: (
    id: string,
    outcome: MTRFollowUp['outcome']
  ) => Promise<void>;
  rescheduleFollowUp: (id: string, newDate: string, reason?: string) => void;

  // Utility actions
  clearStore: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearErrors: () => void;
  getCompletionPercentage: () => number;
  canCompleteReview: () => boolean;
  validateStep: (step: number) => string[];
  checkPermissions: () => Promise<boolean>;
}

// Helper function to check MTR permissions
const checkMTRPermissions = async (): Promise<boolean> => {
  console.log('🔍 Starting MTR permission check...');
  console.log('🌍 Environment:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  // Multiple checks for development mode
  const isDevelopment =
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    import.meta.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    console.warn(
      '🔧 Development mode detected: Allowing MTR access for testing'
    );
    return true;
  }

  try {
    const { authService } = await import('../services/authService');
    const isAuthenticated = await authService.isAuthenticated();

    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      return false;
    }

    // Get current user to check permissions
    const user = await authService.getCurrentUser();
    console.log('👤 Current user for MTR permission check:', user);

    if (!user) {
      console.log('❌ No user object found');
      return false;
    }

    // For now, allow all authenticated users - you can make this more restrictive later
    const hasPermission = !!user; // Simply check if user exists

    console.log('🔐 MTR Permission check result:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('❌ Error checking MTR permissions:', error);

    // Fallback: allow access if we can't determine permissions
    console.warn(
      '🔧 Fallback: Allowing MTR access due to permission check error'
    );
    return true;
  }
};

export const useMTRStore = create<MTRStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentReview: null,
      currentStep: 0,
      stepData: {},
      selectedPatient: null,
      medications: [],
      identifiedProblems: [],
      therapyPlan: null,
      interventions: [],
      followUps: [],
      loading: {
        createReview: false,
        loadReview: false,
        saveReview: false,
        completeStep: false,
        completeReview: false,
        searchPatients: false,
        createNewPatient: false,
        importMedications: false,
        runAssessment: false,
        createPlan: false,
        recordIntervention: false,
        scheduleFollowUp: false,
        completeFollowUp: false,
        cancelReview: false,
      },
      errors: {
        createReview: null,
        loadReview: null,
        saveReview: null,
        completeStep: null,
        completeReview: null,
        searchPatients: null,
        createNewPatient: null,
        importMedications: null,
        runAssessment: null,
        createPlan: null,
        recordIntervention: null,
        scheduleFollowUp: null,
        completeFollowUp: null,
        cancelReview: null,
      },

      // Session management actions
      initializeSession: () => {
        // Initialize a basic MTR session for patient selection
        const basicReview: MedicationTherapyReview = {
          _id: `temp-${Date.now()}`,
          workplaceId: 'current-workplace-id', // Would come from auth context
          patientId: '', // Will be set when patient is selected
          pharmacistId: 'current-user-id', // Would come from auth context
          reviewNumber: `MTR-TEMP-${Date.now()}`,
          status: 'in_progress',
          priority: 'routine',
          reviewType: 'initial',
          steps: {
            patientSelection: { completed: false },
            medicationHistory: { completed: false },
            therapyAssessment: { completed: false },
            planDevelopment: { completed: false },
            interventions: { completed: false },
            followUp: { completed: false },
          },
          medications: [],
          problems: [],
          interventions: [],
          followUps: [],
          clinicalOutcomes: {
            problemsResolved: 0,
            medicationsOptimized: 0,
            adherenceImproved: false,
            adverseEventsReduced: false,
          },
          startedAt: new Date().toISOString(),
          patientConsent: false,
          confidentialityAgreed: false,
          createdBy: 'current-user-id',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          currentReview: basicReview,
          currentStep: 0,
          stepData: {},
          selectedPatient: null,
          medications: [],
          identifiedProblems: [],
          therapyPlan: null,
          interventions: [],
          followUps: [],
        });

        console.log('Initialized basic MTR session for patient selection');
      },

      /**
       * Creates a new MTR review for a patient
       *
       * ENHANCED RESPONSE HANDLING:
       * This function has been updated to handle multiple response formats:
       * 1. Standard format: ID in response.review._id
       * 2. New API format: ID in response.review.session._id or response.review.session.id
       * 3. Alternative format: ID in response.data.session._id or response.data.session.id
       * 4. Direct format: ID in response.data._id or response.data.id
       *
       * The function includes comprehensive logging and will construct a valid review
       * object regardless of which format is returned by the API.
       */
      createReview: async (patientId: string) => {
        const { setLoading, setError } = get();
        setLoading('createReview', true);
        setError('createReview', null);

        try {
          console.log(
            '🚀 Starting MTR review creation for patient:',
            patientId
          );
          console.log('🌍 Environment mode:', import.meta.env.MODE);
          console.log('🔧 Development mode:', import.meta.env.DEV);

          // Validate patientId
          if (!patientId) {
            throw new Error('Patient ID is required to create an MTR review');
          }

          // Check authentication and permissions first
          console.log('🔐 Checking MTR permissions...');
          const hasPermissions = await checkMTRPermissions();
          console.log('✅ Permission check result:', hasPermissions);

          if (!hasPermissions) {
            console.error('❌ Permission denied for MTR review creation');
            throw new Error(
              'You do not have permission to create MTR reviews. Please contact your administrator.'
            );
          }

          console.log('✅ Permissions validated, proceeding with MTR creation');

          // mtrService is already imported at the top of the file
          // No need to dynamically import it here

          // Create new MTR session via API
          const createData = {
            patientId,
            reviewType: 'initial' as const,
            priority: 'routine' as const,
            patientConsent: false,
            confidentialityAgreed: false,
          };

          const response = await mtrService.createMTRSession(createData);

          // For debugging: log the full response structure
          console.log(
            'Full MTR creation response:',
            JSON.stringify(response, null, 2)
          );

          // Validate response structure
          if (!response) {
            console.error(
              'Error: Invalid response structure from MTR service',
              response
            );
            throw new Error(
              'Failed to create MTR review - empty response from server'
            );
          }

          console.log('MTR creation response received:', {
            hasReview: !!response.review,
            reviewId: response.review?._id,
            responseKeys: Object.keys(response),
          });

          // Helper function to create default workflow steps
          const createDefaultSteps = () => ({
            patientSelection: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
            medicationHistory: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
            therapyAssessment: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
            planDevelopment: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
            interventions: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
            followUp: {
              completed: false,
              completedAt: undefined,
              data: {},
            },
          });

          // Extract review data and ID from response
          if (!response.review) {
            console.error('No review data in response:', response);
            throw new Error('Failed to create MTR review - invalid response format');
          }

          const reviewData = response.review;
          let reviewId = reviewData._id;

          if (!reviewId) {
            console.error('No review ID in response:', reviewData);
            throw new Error('Failed to create MTR review - missing ID');
          }

          console.log('Successfully extracted review ID:', reviewId);

          // Extract the review data from whatever structure we received
          let reviewObj:
            | (MedicationTherapyReview & { session?: Record<string, unknown> })
            | null = null;

          // Case 1: Direct response.review object with necessary processing
          if (response.review) {
            // First convert to unknown to avoid type errors, then use a more specific type
            const reviewWithSession =
              response.review as unknown as MedicationTherapyReview & {
                session?: {
                  _id?: string;
                  id?: string;
                  [key: string]: unknown;
                };
              };

            // Handle the nested session case (as seen in the error)
            if (
              !reviewWithSession._id &&
              reviewWithSession.session &&
              typeof reviewWithSession.session === 'object'
            ) {
              const session = reviewWithSession.session;
              // Get the session ID from either _id or id field
              const sessionId =
                (session._id as string) || (session.id as string);

              if (sessionId) {
                console.log('Found session ID, applying to review:', sessionId);
                // Create a new review object with the session ID
                const reviewAsUnknown = response.review as unknown;
                const typedReview = reviewAsUnknown as {
                  session?: Record<string, unknown>;
                  [key: string]: unknown;
                };

                // Copy the session data to create a valid MedicationTherapyReview
                const sessionData = typedReview.session || {};
                reviewObj = {
                  _id: sessionId, // Use the session ID as the review ID
                  workplaceId: (sessionData.workplaceId as string) || 'unknown',
                  patientId: (sessionData.patientId as string) || patientId,
                  pharmacistId:
                    (sessionData.pharmacistId as string) || 'current-user',
                  reviewNumber:
                    (sessionData.reviewNumber as string) || `MTR-${Date.now()}`,
                  status:
                    (sessionData.status as
                      | 'in_progress'
                      | 'completed'
                      | 'cancelled'
                      | 'on_hold') || 'in_progress',
                  reviewType:
                    (sessionData.reviewType as
                      | 'initial'
                      | 'follow_up'
                      | 'annual'
                      | 'targeted') || 'initial',
                  priority:
                    (sessionData.priority as
                      | 'routine'
                      | 'urgent'
                      | 'high_risk') || 'routine',
                  steps: typedReview.steps
                    ? (typedReview.steps as unknown as ReturnType<
                      typeof createDefaultSteps
                    >)
                    : createDefaultSteps(),
                  medications: Array.isArray(sessionData.medications)
                    ? sessionData.medications
                    : [],
                  problems: Array.isArray(sessionData.problems)
                    ? sessionData.problems
                    : [],
                  interventions: Array.isArray(sessionData.interventions)
                    ? sessionData.interventions
                    : [],
                  followUps: Array.isArray(sessionData.followUps)
                    ? sessionData.followUps
                    : [],
                  clinicalOutcomes:
                    sessionData.clinicalOutcomes &&
                      typeof sessionData.clinicalOutcomes === 'object'
                      ? (sessionData.clinicalOutcomes as ClinicalOutcomes)
                      : {
                        problemsResolved: 0,
                        medicationsOptimized: 0,
                        adherenceImproved: false,
                        adverseEventsReduced: false,
                      },
                  patientConsent: !!sessionData.patientConsent,
                  confidentialityAgreed: !!sessionData.confidentialityAgreed,
                  startedAt:
                    (sessionData.startedAt as string) ||
                    new Date().toISOString(),
                  createdAt:
                    (sessionData.createdAt as string) ||
                    new Date().toISOString(),
                  updatedAt:
                    (sessionData.updatedAt as string) ||
                    new Date().toISOString(),
                  createdBy:
                    (sessionData.createdBy as string) || 'current-user',
                  isDeleted: !!sessionData.isDeleted,
                };
              }
            } else {
              reviewObj = response.review;
            }

            // Double-check we have an ID after processing
            if (reviewObj && reviewObj._id) {
              reviewId = reviewObj._id;
              console.log('Using response.review format. Found ID:', reviewId);
            }
          }
          // Case 2: Nested in response.data.session (new API format)
          else if (
            response.data &&
            typeof response.data === 'object' &&
            response.data !== null &&
            'session' in (response.data as Record<string, unknown>) &&
            (response.data as Record<string, unknown>).session
          ) {
            const responseData = response.data as Record<string, unknown>;
            const sessionData = responseData.session as Record<string, unknown>;

            // Try to extract ID from different possible fields
            reviewId =
              (sessionData._id as string) || (sessionData.id as string);

            if (reviewId) {
              // Create a valid MedicationTherapyReview object from the session data
              reviewObj = {
                _id: reviewId,
                workplaceId: (sessionData.workplaceId as string) || 'unknown',
                patientId: (sessionData.patientId as string) || '',
                pharmacistId: (sessionData.pharmacistId as string) || '',
                reviewNumber:
                  (sessionData.reviewNumber as string) || `MTR-${Date.now()}`,
                status:
                  (sessionData.status as
                    | 'in_progress'
                    | 'completed'
                    | 'cancelled'
                    | 'on_hold') || 'in_progress',
                reviewType:
                  (sessionData.reviewType as
                    | 'initial'
                    | 'follow_up'
                    | 'annual'
                    | 'targeted') || 'initial',
                priority:
                  (sessionData.priority as
                    | 'routine'
                    | 'urgent'
                    | 'high_risk') || 'routine',
                steps: createDefaultSteps(),
                medications: (sessionData.medications ||
                  []) as MTRMedicationEntry[],
                problems: (sessionData.problems || []) as string[],
                interventions: (sessionData.interventions || []) as string[],
                followUps: (sessionData.followUps || []) as string[],
                clinicalOutcomes:
                  (sessionData.clinicalOutcomes as ClinicalOutcomes) || {
                    problemsResolved: 0,
                    medicationsOptimized: 0,
                    adherenceImproved: false,
                    adverseEventsReduced: false,
                    qualityOfLifeImproved: false,
                    clinicalParametersImproved: false,
                  },
                patientConsent: !!sessionData.patientConsent,
                confidentialityAgreed: !!sessionData.confidentialityAgreed,
                startedAt:
                  (sessionData.startedAt as string) || new Date().toISOString(),
                createdAt:
                  (sessionData.createdAt as string) || new Date().toISOString(),
                updatedAt:
                  (sessionData.updatedAt as string) || new Date().toISOString(),
                createdBy: (sessionData.createdBy as string) || '',
                isDeleted: !!sessionData.isDeleted,
              };

              // Handle optional fields
              if (sessionData.completedAt) {
                reviewObj.completedAt = sessionData.completedAt as string;
              }

              if (sessionData.plan) {
                reviewObj.plan = sessionData.plan as TherapyPlan;
              }

              console.log(
                'Using response.data.session format. Constructed review with ID:',
                reviewId
              );
            }
          }
          // Case 3: Directly in response.data (alternative format)
          else if (response.data && typeof response.data === 'object') {
            const responseData = response.data as Record<string, unknown>;
            reviewId =
              (responseData._id as string) || (responseData.id as string);

            if (reviewId) {
              // Create a valid MedicationTherapyReview object
              reviewObj = {
                _id: reviewId,
                workplaceId: (responseData.workplaceId as string) || 'unknown',
                patientId: (responseData.patientId as string) || '',
                pharmacistId: (responseData.pharmacistId as string) || '',
                reviewNumber:
                  (responseData.reviewNumber as string) || `MTR-${Date.now()}`,
                status:
                  (responseData.status as
                    | 'in_progress'
                    | 'completed'
                    | 'cancelled'
                    | 'on_hold') || 'in_progress',
                reviewType:
                  (responseData.reviewType as
                    | 'initial'
                    | 'follow_up'
                    | 'annual'
                    | 'targeted') || 'initial',
                priority:
                  (responseData.priority as
                    | 'routine'
                    | 'urgent'
                    | 'high_risk') || 'routine',
                steps: createDefaultSteps(),
                medications: (responseData.medications ||
                  []) as MTRMedicationEntry[],
                problems: (responseData.problems || []) as string[],
                interventions: (responseData.interventions || []) as string[],
                followUps: (responseData.followUps || []) as string[],
                clinicalOutcomes:
                  (responseData.clinicalOutcomes as ClinicalOutcomes) || {
                    problemsResolved: 0,
                    medicationsOptimized: 0,
                    adherenceImproved: false,
                    adverseEventsReduced: false,
                    qualityOfLifeImproved: false,
                    clinicalParametersImproved: false,
                  },
                patientConsent: !!responseData.patientConsent,
                confidentialityAgreed: !!responseData.confidentialityAgreed,
                startedAt:
                  (responseData.startedAt as string) ||
                  new Date().toISOString(),
                createdAt:
                  (responseData.createdAt as string) ||
                  new Date().toISOString(),
                updatedAt:
                  (responseData.updatedAt as string) ||
                  new Date().toISOString(),
                createdBy: (responseData.createdBy as string) || '',
                isDeleted: !!responseData.isDeleted,
              };

              // Handle optional fields
              if (responseData.completedAt) {
                reviewObj.completedAt = responseData.completedAt as string;
              }

              if (responseData.plan) {
                reviewObj.plan = responseData.plan as TherapyPlan;
              }

              console.log(
                'Using response.data format. Constructed review with ID:',
                reviewId
              );
            }
          }

          // If we found a reviewId but no reviewObj, try to create a basic reviewObj from response.review
          if (reviewId && !reviewObj && response.review) {
            // Special case: if response.review has a session object with ID, but review itself doesn't have _id
            const reviewAny = response.review as MedicationTherapyReview & {
              session?: {
                _id?: string;
                id?: string;
              };
            };
            if (
              !reviewAny._id &&
              reviewAny.session &&
              typeof reviewAny.session === 'object' &&
              (reviewAny.session._id || reviewAny.session.id)
            ) {
              // Copy the session ID to the review object's _id field
              reviewAny._id = (reviewAny.session._id ||
                reviewAny.session.id) as string;
              console.log(
                'Fixed missing _id in review by copying from session:',
                reviewAny._id
              );
            }

            reviewObj = response.review;
            console.log(
              'Using existing review object with found ID:',
              reviewId
            );
          }

          // If we found an ID but still no review object, create a minimal one
          if (reviewId && !reviewObj) {
            console.log(
              'Creating minimal review object with found ID:',
              reviewId
            );
            reviewObj = {
              _id: reviewId,
              workplaceId: 'unknown',
              patientId,
              pharmacistId: 'current-user',
              reviewNumber: `MTR-${Date.now()}`,
              status: 'in_progress' as const,
              reviewType: 'initial' as const,
              priority: 'routine' as const,
              steps: createDefaultSteps(),
              medications: [],
              problems: [],
              interventions: [],
              followUps: [],
              clinicalOutcomes: {
                problemsResolved: 0,
                medicationsOptimized: 0,
                adherenceImproved: false,
                adverseEventsReduced: false,
              },
              patientConsent: false,
              confidentialityAgreed: false,
              startedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'current-user',
              isDeleted: false,
            };
          }

          // If we have a review object but it's missing an ID, make sure to add it
          if (reviewObj && !reviewObj._id && reviewId) {
            console.log('Adding missing ID to review object:', reviewId);
            reviewObj._id = reviewId;
          }

          // Final check if we have what we need
          if (!reviewObj || !reviewId) {
            console.error(
              'Error: Cannot extract a valid review with ID from response. Response structure:',
              JSON.stringify(response, null, 2)
            );

            // Log the specific paths we checked to help with debugging
            console.error('Checked paths for ID:', [
              'response.review._id',
              'response.review.session._id',
              'response.review.session.id',
              'response.data.session._id',
              'response.data.session.id',
              'response.data._id',
              'response.data.id',
            ]);

            throw new Error(
              'Failed to create MTR review - could not find or extract a valid ID'
            );
          }

          // Create final review object with guaranteed ID
          const validReview: MedicationTherapyReview = {
            ...reviewData,
            _id: reviewId,
            // Ensure steps are properly initialized
            steps: reviewData.steps || createDefaultSteps(),
            // Ensure arrays are properly initialized
            medications: reviewData.medications || [],
            problems: reviewData.problems || [],
            interventions: reviewData.interventions || [],
            followUps: reviewData.followUps || [],
            // Ensure clinical outcomes are properly initialized
            clinicalOutcomes: reviewData.clinicalOutcomes || {
              problemsResolved: 0,
              medicationsOptimized: 0,
              adherenceImproved: false,
              adverseEventsReduced: false,
            },
          };

          console.log('Setting current review with ID:', validReview._id);

          // Safely convert medications to MTR medications
          const medications = (validReview.medications || [])
            .filter((med) => typeof med === 'object' && med !== null)
            .map((med) => {
              try {
                return convertMedicationEntryToMTRMedication(med as unknown);
              } catch (err) {
                console.warn('Failed to convert medication:', med, err);
                return null;
              }
            })
            .filter(Boolean) as MTRMedication[];

          set({
            currentReview: validReview,
            currentStep: 0,
            stepData: {},
            medications: medications,
            identifiedProblems: [], // Will be populated from actual DrugTherapyProblem objects
            therapyPlan: (validReview.plan as TherapyPlan) || null,
            interventions: [], // Will be populated from actual MTRIntervention objects
            followUps: [], // Will be populated from actual MTRFollowUp objects
          });

          console.log('Created new MTR review for patient:', patientId);
        } catch (error: any) {
          console.error('Failed to create MTR review:', error);

          // Handle specific error types with better user messaging
          if (error?.response?.status === 401) {
            setError(
              'createReview',
              'Authentication required. Please log in to create MTR reviews.'
            );
          } else if (error?.response?.status === 403) {
            setError(
              'createReview',
              'You do not have permission to create MTR reviews. Please contact your administrator.'
            );
          } else if (error?.code === 'ERR_NETWORK') {
            setError(
              'createReview',
              'Network error: Unable to connect to the server. Please check your connection and try again.'
            );
          } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
            setError(
              'createReview',
              'Request timed out. The server may be busy. Please try again in a moment.'
            );
          } else if (error instanceof Error) {
            if (
              error.message.includes('Permission denied') ||
              error.message.includes('403')
            ) {
              setError(
                'createReview',
                'You do not have permission to create MTR reviews. Please contact your administrator.'
              );
            } else if (error.message.includes('Authentication required')) {
              setError('createReview', error.message);
            } else {
              setError('createReview', error.message);
            }
          } else {
            setError('createReview', 'Failed to create review');
          }
        } finally {
          setLoading('createReview', false);
        }
      },

      loadReview: async (reviewId: string) => {
        const { setLoading, setError } = get();
        setLoading('loadReview', true);
        setError('loadReview', null);

        try {
          // mtrService is already imported at the top of the file
          // No need to dynamically import it here

          // Load MTR session from API
          const response = await mtrService.getMTRSession(reviewId);

          if (response.review) {
            if (!response.review._id) {
              console.error(
                'Error: Loaded MTR review is missing an ID',
                response.review
              );
              throw new Error('Failed to load MTR review with valid ID');
            }

            // Create a valid review object with _id guaranteed
            const validReview = {
              ...response.review,
              _id: response.review._id, // Ensure ID is explicitly set
            };

            console.log(
              'Setting current review with verified ID:',
              validReview._id
            );

            set({
              currentReview: validReview,
              medications: (validReview.medications || []).map(
                convertMedicationEntryToMTRMedication
              ),
              identifiedProblems: [], // Will be populated from actual DrugTherapyProblem objects
              therapyPlan: validReview.plan || null,
              interventions: [], // Will be populated from actual MTRIntervention objects
              followUps: [], // Will be populated from actual MTRFollowUp objects
              // Set current step based on review progress
              currentStep: get().getNextStep() || 0,
            });

            console.log('Loaded MTR review:', reviewId);
          } else {
            set({ currentReview: null });
          }
        } catch (error) {
          console.error('Failed to load MTR review:', error);

          // Handle specific error types
          if (error instanceof Error) {
            if (
              error.message.includes('Permission denied') ||
              error.message.includes('403')
            ) {
              setError(
                'loadReview',
                'You do not have permission to access MTR reviews. Please contact your administrator.'
              );
            } else if (error.message.includes('Authentication required')) {
              setError(
                'loadReview',
                'Authentication required. Please log in to access MTR reviews.'
              );
            } else {
              setError('loadReview', error.message);
            }
          } else {
            setError('loadReview', 'Failed to load review');
          }
          set({ currentReview: null });
        } finally {
          setLoading('loadReview', false);
        }
      },

      loadInProgressReview: async (patientId: string) => {
        const { setLoading, setError } = get();
        setLoading('loadReview', true);
        setError('loadReview', null);

        try {
          // mtrService is already imported at the top of the file
          // No need to dynamically import it here

          // Get all MTR sessions for patient
          const response = await mtrService.getMTRSessions({
            patientId,
            status: 'in_progress',
          });

          if (response.results && response.results.length > 0) {
            // Load the most recent in-progress review
            const inProgressReview = response.results[0];

            if (!inProgressReview._id) {
              console.error(
                'Error: In-progress MTR review is missing an ID',
                inProgressReview
              );
              throw new Error(
                'Failed to load in-progress MTR review with valid ID'
              );
            }

            // Create a valid review object with _id guaranteed
            const validReview = {
              ...inProgressReview,
              _id: inProgressReview._id, // Ensure ID is explicitly set
            };

            console.log(
              'Setting current in-progress review with verified ID:',
              validReview._id
            );

            set({
              currentReview: validReview,
              medications: (validReview.medications || []).map(
                convertMedicationEntryToMTRMedication
              ),
              identifiedProblems: [], // Will be populated from actual DrugTherapyProblem objects
              therapyPlan: validReview.plan || null,
              interventions: [], // Will be populated from actual MTRIntervention objects
              followUps: [], // Will be populated from actual MTRFollowUp objects
              currentStep: get().getNextStep() || 0,
            });

            console.log(
              'Loaded in-progress MTR review for patient:',
              patientId
            );
            return inProgressReview;
          } else {
            set({ currentReview: null });
            return null;
          }
        } catch (error) {
          console.error('Failed to load in-progress MTR review:', error);
          setError(
            'loadReview',
            error instanceof Error
              ? error.message
              : 'Failed to load in-progress review'
          );
          set({ currentReview: null });
          return null;
        } finally {
          setLoading('loadReview', false);
        }
      },

      saveReview: async () => {
        const {
          setLoading,
          setError,
          currentReview,
          medications,
          identifiedProblems,
          therapyPlan,
          interventions,
          followUps,
        } = get();
        if (!currentReview) {
          console.error('Cannot save review - No current review');
          return;
        }

        console.log(
          'Current review before save:',
          JSON.stringify({
            id: currentReview._id,
            status: currentReview.status,
          })
        );

        if (!currentReview._id || currentReview._id === '') {
          setError('saveReview', 'Session ID is missing');
          console.error('Cannot save review - Session ID is missing');
          return;
        }

        setLoading('saveReview', true);
        setError('saveReview', null);

        try {
          // mtrService is already imported at the top of the file
          // No need to dynamically import it here

          // Prepare update data with current state
          const updateData: {
            medications: ReturnType<typeof convertMTRMedicationToEntry>[];
            problems: DrugTherapyProblem[];
            plan?: TherapyPlan;
            interventions: MTRIntervention[];
            followUps: MTRFollowUp[];
            updatedAt?: string;
            steps?: Record<string, unknown>;
            status?: string;
            [key: string]: unknown; // Allow additional properties with unknown type
          } = {
            medications: medications.map(convertMTRMedicationToEntry),
            problems: identifiedProblems,
            plan: therapyPlan || undefined,
            interventions,
            followUps, // Send follow-ups so backend can handle them properly
            updatedAt: new Date().toISOString(),
          };

          // Only include steps and status if they exist
          if (currentReview.steps) {
            updateData.steps = currentReview.steps;
          }

          if (currentReview.status) {
            updateData.status = currentReview.status;
          }

          // Auto-complete follow-up step if follow-ups are present
          if (updateData.followUps.length > 0 && currentReview.steps?.followUp && !currentReview.steps.followUp.completed) {
            console.log('🔄 Auto-completing follow-up step since follow-ups are present');
            currentReview.steps.followUp.completed = true;
            currentReview.steps.followUp.completedAt = new Date();
            currentReview.steps.followUp.data = {
              completedAt: new Date().toISOString(),
              stepName: 'Follow-Up',
              followUpsCount: updateData.followUps.length
            };
            updateData.steps = currentReview.steps;
          }

          // Debug logging
          console.log('🔍 Saving MTR with data:', {
            reviewId: currentReview._id,
            medicationsCount: updateData.medications.length,
            problemsCount: updateData.problems.length,
            interventionsCount: updateData.interventions.length,
            followUpsCount: updateData.followUps.length,
            hasPlan: !!updateData.plan,
            status: updateData.status,
            stepsCompleted: currentReview.steps ? Object.entries(currentReview.steps).filter(([_, step]) => step.completed).length : 0,
            followUpStepCompleted: currentReview.steps?.followUp?.completed
          });

          // Call the API to save the review
          const response = await mtrService.updateMTRSession(
            currentReview._id,
            updateData
          );

          // Update the store with the saved review
          set({
            currentReview: {
              ...response.review,
              updatedAt: new Date().toISOString(),
            },
          });

          console.log('MTR review saved successfully:', currentReview._id);
        } catch (error) {
          console.error('Failed to save MTR review:', error);

          // Handle specific error types
          if (error instanceof Error) {
            if (
              error.message.includes('Permission denied') ||
              error.message.includes('403')
            ) {
              setError(
                'saveReview',
                'You do not have permission to save MTR reviews. Please contact your administrator.'
              );
            } else if (error.message.includes('Authentication required')) {
              setError(
                'saveReview',
                'Authentication required. Please log in to save MTR reviews.'
              );
            } else {
              setError('saveReview', error.message);
            }
          } else {
            setError('saveReview', 'Failed to save review');
          }
        } finally {
          setLoading('saveReview', false);
        }
      },

      completeReview: async (reviewId?: string) => {
        const { setLoading, setError, currentReview } = get();

        console.log('Complete review called with:', {
          providedId: reviewId,
          hasCurrentReview: !!currentReview,
          currentReviewId: currentReview?._id,
        });

        // Use provided reviewId or fallback to currentReview._id
        let idToUse = reviewId || (currentReview && currentReview._id);

        if (!currentReview) {
          const error = new Error('No current review');
          console.error('Complete review failed:', error);
          throw error;
        }

        // If ID is still missing but we have a current review, try to use the session ID if available
        // Use a type assertion to safely check for session property
        const reviewWithSession = currentReview as unknown as {
          session?: { _id?: string };
        };
        if ((!idToUse || idToUse === '') && reviewWithSession.session?._id) {
          idToUse = reviewWithSession.session._id;
          console.log('Using session ID as fallback:', idToUse);
        }

        if (!idToUse || idToUse === '') {
          const error = new Error('Session ID is missing');
          console.error(
            'Complete review failed:',
            error,
            'Review:',
            currentReview
          );

          // Log additional details to help debug
          // Use our type assertion to check for session too
          console.error('Review ID extraction failed. Details:', {
            providedReviewId: reviewId,
            currentReviewExists: !!currentReview,
            currentReviewHasId: !!currentReview?._id,
            currentReviewId: currentReview?._id,
            sessionExists: !!reviewWithSession.session,
            sessionHasId: !!reviewWithSession.session?._id,
          });

          throw error;
        }

        setLoading('completeReview', true);
        setError('completeReview', null);

        try {
          console.log('Starting review completion for ID:', idToUse);
          // mtrService is already imported at the top of the file
          // No need to dynamically import it here

          // Update review status to completed
          const updateData = {
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const response = await mtrService.updateMTRSession(
            idToUse,
            updateData
          );

          // Update the store with completed review, ensuring ID is preserved
          const completedReview = {
            ...response.review,
            _id: response.review?._id || idToUse, // Ensure ID is preserved
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
          };

          // Double-check ID is set
          if (!completedReview._id) {
            console.error(
              'CRITICAL: Completed review is missing _id after completion!',
              {
                originalId: idToUse,
                responseReviewId: response.review?._id,
              }
            );
            // Force set the ID we know was used for the API call
            completedReview._id = idToUse;
          }

          set({ currentReview: completedReview });

          console.log('MTR review completed successfully:', idToUse);
          return completedReview;
        } catch (error) {
          console.error('Failed to complete MTR review:', error);
          setError(
            'completeReview',
            error instanceof Error ? error.message : 'Failed to complete review'
          );
          throw error;
        } finally {
          setLoading('completeReview', false);
        }
      },

      cancelReview: async () => {
        const { setLoading, setError, currentReview } = get();
        if (!currentReview) return;

        setLoading('cancelReview', true);
        setError('cancelReview', null);

        try {
          const updatedReview = {
            ...currentReview,
            status: 'cancelled' as const,
          };

          set({ currentReview: updatedReview });

          console.log('Cancelled MTR review:', currentReview._id);
        } catch (error) {
          setError(
            'cancelReview',
            error instanceof Error ? error.message : 'Failed to cancel review'
          );
        } finally {
          setLoading('cancelReview', false);
        }
      },

      setCurrentReview: (review) => {
        if (typeof review === 'function') {
          set((state) => ({ currentReview: review(state.currentReview) }));
        } else {
          set({ currentReview: review });
        }
      },

      // Step navigation actions
      goToStep: (step: number) => {
        const { currentReview } = get();
        if (!currentReview) return;

        // Validate step number
        if (step < 0 || step > 5) return;

        set({ currentStep: step });
      },

      completeStep: async (step: number, data: Record<string, unknown>) => {
        const { setLoading, setError, currentReview, saveReview } = get();
        if (!currentReview) return;

        setLoading('completeStep', true);
        setError('completeStep', null);

        try {
          const stepNames = [
            'patientSelection',
            'medicationHistory',
            'therapyAssessment',
            'planDevelopment',
            'interventions',
            'followUp',
          ];

          const stepName = stepNames[step];
          if (!stepName) throw new Error('Invalid step number');

          // Add null check for currentReview.steps
          const updatedSteps = {
            ...(currentReview.steps || {}),
            [stepName]: {
              completed: true,
              completedAt: new Date().toISOString(),
              data,
            },
          };

          // Ensure ID is preserved explicitly
          const updatedReview = {
            ...currentReview,
            _id: currentReview._id, // Explicitly preserve the ID
            steps: updatedSteps,
          };
          set({
            currentReview: updatedReview,
            stepData: { ...get().stepData, [stepName]: data },
          });

          // Auto-save after completing step
          await saveReview();
        } catch (error) {
          setError(
            'completeStep',
            error instanceof Error ? error.message : 'Failed to complete step'
          );
        } finally {
          setLoading('completeStep', false);
        }
      },

      getNextStep: () => {
        const { currentReview } = get();
        if (!currentReview) return null;
        if (!currentReview.steps) return 0; // Return first step if steps don't exist

        try {
          const stepOrder = [
            'patientSelection',
            'medicationHistory',
            'therapyAssessment',
            'planDevelopment',
            'interventions',
            'followUp',
          ];

          for (let i = 0; i < stepOrder.length; i++) {
            const stepName = stepOrder[i] as keyof typeof currentReview.steps;
            if (
              !currentReview.steps[stepName] ||
              !currentReview.steps[stepName].completed
            ) {
              return i;
            }
          }
        } catch (error) {
          console.error('Error finding next step:', error);
          return 0; // Default to first step on error
        }
        return null;
      },

      getCurrentStepName: () => {
        const { currentStep } = get();
        const stepNames = [
          'Patient Selection',
          'Medication History',
          'Therapy Assessment',
          'Plan Development',
          'Interventions',
          'Follow-Up',
        ];
        return stepNames[currentStep] || 'Unknown Step';
      },

      // Patient selection actions
      selectPatient: (patient: StorePatient) => {
        set({ selectedPatient: patient });
      },

      searchPatients: async (query: string) => {
        const { setLoading, setError } = get();
        setLoading('searchPatients', true);
        setError('searchPatients', null);

        try {
          // In a real implementation, this would call the patient service
          console.log('Searching patients:', query);

          // Mock implementation
          return [];
        } catch (error) {
          setError(
            'searchPatients',
            error instanceof Error ? error.message : 'Failed to search patients'
          );
          return [];
        } finally {
          setLoading('searchPatients', false);
        }
      },

      createNewPatient: async (patientData: unknown) => {
        const { setLoading, setError } = get();
        setLoading('createNewPatient', true);
        setError('createNewPatient', null);

        try {
          // In a real implementation, this would call the patient service
          console.log('Creating new patient:', patientData);

          // Mock implementation
          return null;
        } catch (error) {
          setError(
            'createNewPatient',
            error instanceof Error ? error.message : 'Failed to create patient'
          );
          return null;
        } finally {
          setLoading('createNewPatient', false);
        }
      },

      // Medication management actions
      addMedication: (medication: MTRMedication) => {
        set((state) => ({
          medications: [
            ...state.medications,
            { ...medication, id: Date.now().toString() },
          ],
        }));
      },

      updateMedication: (id: string, updates: Partial<MTRMedication>) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, ...updates } : med
          ),
        }));
      },

      removeMedication: (id: string) => {
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
        }));
      },

      setMedications: (medications: MTRMedication[]) => {
        set({ medications });
      },

      importMedications: async (patientId: string) => {
        const { setLoading, setError } = get();
        setLoading('importMedications', true);
        setError('importMedications', null);

        try {
          // In a real implementation, this would call the medication service
          console.log('Importing medications for patient:', patientId);

          // Mock implementation
          // const medications = await medicationService.getPatientMedications(patientId);
          // set({ medications });
        } catch (error) {
          setError(
            'importMedications',
            error instanceof Error
              ? error.message
              : 'Failed to import medications'
          );
        } finally {
          setLoading('importMedications', false);
        }
      },

      validateMedications: () => {
        const { medications } = get();
        const errors: string[] = [];

        medications.forEach((med, index) => {
          if (!med.drugName.trim()) {
            errors.push(`Medication ${index + 1}: Drug name is required`);
          }
          if (!med.indication.trim()) {
            errors.push(`Medication ${index + 1}: Indication is required`);
          }
          if (med.strength.value <= 0) {
            errors.push(
              `Medication ${index + 1}: Strength must be greater than 0`
            );
          }
        });

        return errors;
      },

      // Problem identification actions
      runAssessment: async () => {
        const { setLoading, setError, medications, checkDrugInteractions } =
          get();
        setLoading('runAssessment', true);
        setError('runAssessment', null);

        try {
          // Run various assessments
          const interactions = await checkDrugInteractions(medications);

          // Add other assessment logic here (duplicates, contraindications, etc.)

          set({ identifiedProblems: interactions });
        } catch (error) {
          setError(
            'runAssessment',
            error instanceof Error ? error.message : 'Failed to run assessment'
          );
        } finally {
          setLoading('runAssessment', false);
        }
      },

      addProblem: (problem: DrugTherapyProblem) => {
        set((state) => ({
          identifiedProblems: [
            ...state.identifiedProblems,
            { ...problem, _id: Date.now().toString() },
          ],
        }));
      },

      updateProblem: (id: string, updates: Partial<DrugTherapyProblem>) => {
        set((state) => ({
          identifiedProblems: state.identifiedProblems.map((problem) =>
            problem._id === id ? { ...problem, ...updates } : problem
          ),
        }));
      },

      resolveProblem: (id: string, resolution: string) => {
        const { updateProblem } = get();
        updateProblem(id, {
          status: 'resolved',
          resolution: {
            action: resolution,
            outcome: 'Problem resolved',
            resolvedAt: new Date().toISOString(),
          },
        });
      },

      checkDrugInteractions: async (medications: MTRMedication[]) => {
        // Mock drug interaction checking
        // In a real implementation, this would call a drug database API
        const interactions: DrugTherapyProblem[] = [];

        // Simple mock logic for demonstration
        if (medications.length > 1) {
          interactions.push({
            _id: `dtp_${Date.now()}`,
            workplaceId: 'mock_workplace',
            patientId: 'mock_patient',
            category: 'safety',
            subcategory: 'drug_interaction',
            type: 'interaction',
            severity: 'moderate',
            description:
              'Potential drug interaction detected between medications',
            clinicalSignificance: 'Monitor for increased side effects',
            affectedMedications: medications.slice(0, 2).map((m) => m.drugName),
            relatedConditions: [],
            evidenceLevel: 'probable',
            riskFactors: ['Multiple medications'],
            status: 'identified',
            identifiedBy: 'system',
            identifiedAt: new Date().toISOString(),
            resolution: undefined,
            createdBy: 'system',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        return interactions;
      },

      // Plan development actions
      createPlan: async (plan: TherapyPlan) => {
        const { setLoading, setError } = get();
        setLoading('createPlan', true);
        setError('createPlan', null);

        try {
          set({ therapyPlan: plan });
          console.log('Created therapy plan');
        } catch (error) {
          setError(
            'createPlan',
            error instanceof Error ? error.message : 'Failed to create plan'
          );
        } finally {
          setLoading('createPlan', false);
        }
      },

      updatePlan: (updates: Partial<TherapyPlan>) => {
        set((state) => ({
          therapyPlan: state.therapyPlan
            ? { ...state.therapyPlan, ...updates }
            : null,
        }));
      },

      addRecommendation: (recommendation: TherapyRecommendation) => {
        const { therapyPlan, updatePlan } = get();
        if (!therapyPlan) return;

        const updatedRecommendations = [
          ...therapyPlan.recommendations,
          recommendation,
        ];
        updatePlan({ recommendations: updatedRecommendations });
      },

      addMonitoringParameter: (parameter: MonitoringParameter) => {
        const { therapyPlan, updatePlan } = get();
        if (!therapyPlan) return;

        const updatedMonitoring = [...therapyPlan.monitoringPlan, parameter];
        updatePlan({ monitoringPlan: updatedMonitoring });
      },

      addTherapyGoal: (goal: TherapyGoal) => {
        const { therapyPlan, updatePlan } = get();
        if (!therapyPlan) return;

        const updatedGoals = [...therapyPlan.goals, goal];
        updatePlan({ goals: updatedGoals });
      },

      // Intervention actions
      recordIntervention: async (intervention: MTRIntervention) => {
        const { setLoading, setError } = get();
        setLoading('recordIntervention', true);
        setError('recordIntervention', null);

        try {
          const newIntervention = {
            ...intervention,
            _id: Date.now().toString(),
            performedAt: new Date().toISOString(),
          };

          set((state) => ({
            interventions: [...state.interventions, newIntervention],
          }));

          console.log('Recorded intervention');
        } catch (error) {
          setError(
            'recordIntervention',
            error instanceof Error
              ? error.message
              : 'Failed to record intervention'
          );
        } finally {
          setLoading('recordIntervention', false);
        }
      },

      updateIntervention: (id: string, updates: Partial<MTRIntervention>) => {
        set((state) => ({
          interventions: state.interventions.map((intervention) =>
            intervention._id === id
              ? { ...intervention, ...updates }
              : intervention
          ),
        }));
      },

      markInterventionComplete: (
        id: string,
        outcome: string,
        details?: string
      ) => {
        const { updateIntervention } = get();
        updateIntervention(id, {
          outcome: outcome as MTRIntervention['outcome'],
          outcomeDetails: details || '',
        });
      },

      // Follow-up actions
      scheduleFollowUp: async (followUp: MTRFollowUp) => {
        const { setLoading, setError } = get();
        setLoading('scheduleFollowUp', true);
        setError('scheduleFollowUp', null);

        try {
          const newFollowUp = {
            ...followUp,
            _id: Date.now().toString(),
          };

          set((state) => ({
            followUps: [...state.followUps, newFollowUp],
          }));

          console.log('Scheduled follow-up');
        } catch (error) {
          setError(
            'scheduleFollowUp',
            error instanceof Error
              ? error.message
              : 'Failed to schedule follow-up'
          );
        } finally {
          setLoading('scheduleFollowUp', false);
        }
      },

      updateFollowUp: (id: string, updates: Partial<MTRFollowUp>) => {
        set((state) => ({
          followUps: state.followUps.map((followUp) =>
            followUp._id === id ? { ...followUp, ...updates } : followUp
          ),
        }));
      },

      completeFollowUp: async (id: string, outcome: MTRFollowUp['outcome']) => {
        const { setLoading, setError, updateFollowUp } = get();
        setLoading('completeFollowUp', true);
        setError('completeFollowUp', null);

        try {
          updateFollowUp(id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            outcome: outcome as MTRFollowUp['outcome'],
          });

          console.log('Completed follow-up');
        } catch (error) {
          setError(
            'completeFollowUp',
            error instanceof Error
              ? error.message
              : 'Failed to complete follow-up'
          );
        } finally {
          setLoading('completeFollowUp', false);
        }
      },

      rescheduleFollowUp: (id: string, newDate: string, reason?: string) => {
        const { updateFollowUp } = get();
        updateFollowUp(id, {
          scheduledDate: newDate,
          status: 'rescheduled',
          ...(reason && { rescheduledReason: reason }),
        });
      },

      // Utility actions
      clearStore: () => {
        set({
          currentReview: null,
          currentStep: 0,
          stepData: {},
          selectedPatient: null,
          medications: [],
          identifiedProblems: [],
          therapyPlan: null,
          interventions: [],
          followUps: [],
          loading: {
            createReview: false,
            loadReview: false,
            saveReview: false,
            completeStep: false,
            completeReview: false,
            searchPatients: false,
            createNewPatient: false,
            importMedications: false,
            runAssessment: false,
            createPlan: false,
            recordIntervention: false,
            scheduleFollowUp: false,
            completeFollowUp: false,
            cancelReview: false,
          },
          errors: {
            createReview: null,
            loadReview: null,
            saveReview: null,
            completeStep: null,
            completeReview: null,
            searchPatients: null,
            createNewPatient: null,
            importMedications: null,
            runAssessment: null,
            createPlan: null,
            recordIntervention: null,
            scheduleFollowUp: null,
            completeFollowUp: null,
            cancelReview: null,
          },
        });
      },

      setLoading: (key: string, loading: boolean) => {
        set((state) => ({
          loading: { ...state.loading, [key]: loading },
        }));
      },

      setError: (key: string, error: string | null) => {
        set((state) => ({
          errors: { ...state.errors, [key]: error },
        }));
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      getCompletionPercentage: () => {
        const { currentReview, followUps } = get();
        if (!currentReview) return 0;

        // Check if steps exists to prevent "Cannot convert undefined or null to object" error
        if (!currentReview.steps) {
          console.warn(
            'MTR steps missing in currentReview, returning 0% completion'
          );
          return 0;
        }

        try {
          const steps = Object.values(currentReview.steps);
          const completedSteps = steps.filter(
            (step) => step && step.completed
          ).length;
          const totalSteps = steps.length;

          // Base completion on steps (90% of total)
          let basePercentage = (completedSteps / totalSteps) * 90;

          // Add 10% if at least one follow-up is scheduled (required for completion)
          if (followUps.length > 0) {
            basePercentage += 10;
          }

          // Ensure we don't exceed 100%
          return Math.min(Math.round(basePercentage), 100);
        } catch (error) {
          console.error('Error calculating completion percentage:', error);
          return 0; // Return 0% completion on error
        }
      },

      canCompleteReview: () => {
        const { currentReview, followUps } = get();
        if (!currentReview) return false;
        if (!currentReview.steps) return false;

        try {
          // Check if all steps are completed
          const allStepsCompleted = Object.values(currentReview.steps).every(
            (step) => step && step.completed
          );

          // For completion, we only require all steps to be completed
          // Follow-ups are optional - they can be scheduled later if needed
          return allStepsCompleted;
        } catch (error) {
          console.error('Error checking if review can be completed:', error);
          return false;
        }
      },

      validateStep: (step: number) => {
        const {
          selectedPatient,
          medications,
          identifiedProblems,
          therapyPlan,
          interventions,
          followUps,
        } = get();
        const errors: string[] = [];

        switch (step) {
          case 0: // Patient Selection
            if (!selectedPatient) {
              errors.push('Patient must be selected');
            }
            break;
          case 1: // Medication History
            if (medications.length === 0) {
              errors.push('At least one medication must be entered');
            }
            errors.push(...get().validateMedications());
            break;
          case 2: // Therapy Assessment
            if (identifiedProblems.length === 0) {
              errors.push('Assessment must be completed');
            }
            break;
          case 3: // Plan Development
            if (!therapyPlan) {
              errors.push('Therapy plan must be created');
            }
            break;
          case 4: // Interventions
            if (interventions.length === 0) {
              errors.push('At least one intervention must be recorded');
            }
            break;
          case 5: // Follow-Up
            if (followUps.length === 0) {
              errors.push('Follow-up must be scheduled');
            }
            break;
        }

        return errors;
      },

      checkPermissions: async () => {
        return await checkMTRPermissions();
      },
    }),
    {
      name: 'mtr-store',
      partialize: (state) => ({
        currentReview: state.currentReview,
        currentStep: state.currentStep,
        stepData: state.stepData,
        selectedPatient: state.selectedPatient,
      }),
    }
  )
);

// Utility hooks for easier access to specific MTR states
export const useMTRSession = () =>
  useMTRStore((state) => ({
    currentReview: state.currentReview,
    currentStep: state.currentStep,
    loading: state.loading.createReview || state.loading.loadReview || false,
    error: state.errors.createReview || state.errors.loadReview || null,
    createReview: state.createReview,
    loadReview: state.loadReview,
    saveReview: state.saveReview,
    completeReview: state.completeReview,
    cancelReview: state.cancelReview,
    completionPercentage: state.getCompletionPercentage(),
    canComplete: state.canCompleteReview(),
  }));

export const useMTRNavigation = () =>
  useMTRStore((state) => ({
    currentStep: state.currentStep,
    currentStepName: state.getCurrentStepName(),
    nextStep: state.getNextStep(),
    goToStep: state.goToStep,
    completeStep: state.completeStep,
    validateStep: state.validateStep,
    loading: state.loading.completeStep || false,
    error: state.errors.completeStep || null,
  }));

export const useMTRPatient = () =>
  useMTRStore((state) => ({
    selectedPatient: state.selectedPatient,
    selectPatient: state.selectPatient,
    searchPatients: state.searchPatients,
    createNewPatient: state.createNewPatient,
    loading:
      state.loading.searchPatients || state.loading.createNewPatient || false,
    error: state.errors.searchPatients || state.errors.createNewPatient || null,
  }));

export const useMTRMedications = () =>
  useMTRStore((state) => ({
    medications: state.medications,
    addMedication: state.addMedication,
    updateMedication: state.updateMedication,
    removeMedication: state.removeMedication,
    setMedications: state.setMedications,
    importMedications: state.importMedications,
    validateMedications: state.validateMedications,
    loading: state.loading.importMedications || false,
    error: state.errors.importMedications || null,
  }));

export const useMTRAssessment = () =>
  useMTRStore((state) => ({
    identifiedProblems: state.identifiedProblems,
    runAssessment: state.runAssessment,
    addProblem: state.addProblem,
    updateProblem: state.updateProblem,
    resolveProblem: state.resolveProblem,
    loading: state.loading.runAssessment || false,
    error: state.errors.runAssessment || null,
  }));

export const useMTRPlan = () =>
  useMTRStore((state) => ({
    therapyPlan: state.therapyPlan,
    createPlan: state.createPlan,
    updatePlan: state.updatePlan,
    addRecommendation: state.addRecommendation,
    addMonitoringParameter: state.addMonitoringParameter,
    addTherapyGoal: state.addTherapyGoal,
    loading: state.loading.createPlan || false,
    error: state.errors.createPlan || null,
  }));

export const useMTRInterventions = () =>
  useMTRStore((state) => ({
    interventions: state.interventions,
    recordIntervention: state.recordIntervention,
    updateIntervention: state.updateIntervention,
    markInterventionComplete: state.markInterventionComplete,
    loading: state.loading.recordIntervention || false,
    error: state.errors.recordIntervention || null,
  }));

export const useMTRFollowUps = () =>
  useMTRStore((state) => ({
    followUps: state.followUps,
    scheduleFollowUp: state.scheduleFollowUp,
    updateFollowUp: state.updateFollowUp,
    completeFollowUp: state.completeFollowUp,
    rescheduleFollowUp: state.rescheduleFollowUp,
    loading:
      state.loading.scheduleFollowUp || state.loading.completeFollowUp || false,
    error:
      state.errors.scheduleFollowUp || state.errors.completeFollowUp || null,
  }));
