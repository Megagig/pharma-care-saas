import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient, LoadingState, ErrorState } from './types';
import type {
    MedicationTherapyReview,
    DrugTherapyProblem,
    MTRIntervention,
    MTRFollowUp,
    TherapyPlan,
    TherapyRecommendation,
    MonitoringParameter,
    TherapyGoal,
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
}

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
    selectedPatient: Patient | null;
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
    saveReview: () => Promise<void>;
    completeReview: () => Promise<void>;
    cancelReview: () => Promise<void>;

    // Step navigation actions
    goToStep: (step: number) => void;
    completeStep: (step: number, data: Record<string, unknown>) => Promise<void>;
    getNextStep: () => number | null;
    getCurrentStepName: () => string;

    // Patient selection actions
    selectPatient: (patient: Patient) => void;
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
    checkDrugInteractions: (medications: MTRMedication[]) => Promise<DrugTherapyProblem[]>;

    // Plan development actions
    createPlan: (plan: TherapyPlan) => Promise<void>;
    updatePlan: (updates: Partial<TherapyPlan>) => void;
    addRecommendation: (recommendation: TherapyRecommendation) => void;
    addMonitoringParameter: (parameter: MonitoringParameter) => void;
    addTherapyGoal: (goal: TherapyGoal) => void;

    // Intervention actions
    recordIntervention: (intervention: MTRIntervention) => Promise<void>;
    updateIntervention: (id: string, updates: Partial<MTRIntervention>) => void;
    markInterventionComplete: (id: string, outcome: string, details?: string) => void;

    // Follow-up actions
    scheduleFollowUp: (followUp: MTRFollowUp) => Promise<void>;
    updateFollowUp: (id: string, updates: Partial<MTRFollowUp>) => void;
    completeFollowUp: (id: string, outcome: MTRFollowUp['outcome']) => Promise<void>;
    rescheduleFollowUp: (id: string, newDate: string, reason?: string) => void;

    // Utility actions
    clearStore: () => void;
    setLoading: (key: string, loading: boolean) => void;
    setError: (key: string, error: string | null) => void;
    clearErrors: () => void;
    getCompletionPercentage: () => number;
    canCompleteReview: () => boolean;
    validateStep: (step: number) => string[];
}

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
            loading: {},
            errors: {},

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

            createReview: async (patientId: string) => {
                const { setLoading, setError } = get();
                setLoading('createReview', true);
                setError('createReview', null);

                try {
                    // In a real implementation, this would call the API
                    // For now, create a mock review
                    const newReview: MedicationTherapyReview = {
                        _id: `mtr-${Date.now()}`,
                        workplaceId: 'current-workplace-id', // Would come from auth context
                        patientId,
                        pharmacistId: 'current-user-id', // Would come from auth context
                        reviewNumber: `MTR-${Date.now()}`,
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
                        currentReview: newReview,
                        currentStep: 0,
                        stepData: {},
                        medications: [],
                        identifiedProblems: [],
                        therapyPlan: null,
                        interventions: [],
                        followUps: [],
                    });

                    // Load patient data if available
                    // This would typically fetch from the patient store or API
                    console.log('Created new MTR review for patient:', patientId);
                } catch (error) {
                    setError('createReview', error instanceof Error ? error.message : 'Failed to create review');
                } finally {
                    setLoading('createReview', false);
                }
            },

            loadReview: async (reviewId: string) => {
                const { setLoading, setError } = get();
                setLoading('loadReview', true);
                setError('loadReview', null);

                try {
                    // In a real implementation, this would call the API
                    // For now, create a mock loaded review
                    console.log('Loading MTR review:', reviewId);

                    // Mock implementation - would fetch from API
                    // const response = await mtrService.getReview(reviewId);
                    // set({ currentReview: response.data });
                } catch (error) {
                    setError('loadReview', error instanceof Error ? error.message : 'Failed to load review');
                } finally {
                    setLoading('loadReview', false);
                }
            },

            saveReview: async () => {
                const { setLoading, setError, currentReview } = get();
                if (!currentReview) return;

                setLoading('saveReview', true);
                setError('saveReview', null);

                try {
                    // In a real implementation, this would call the API
                    console.log('Saving MTR review:', currentReview._id);

                    // Mock implementation - would save to API
                    // const response = await mtrService.updateReview(currentReview._id, currentReview);
                    // set({ currentReview: response.data });
                } catch (error) {
                    setError('saveReview', error instanceof Error ? error.message : 'Failed to save review');
                } finally {
                    setLoading('saveReview', false);
                }
            },

            completeReview: async () => {
                const { setLoading, setError, currentReview, canCompleteReview } = get();
                if (!currentReview || !canCompleteReview()) return;

                setLoading('completeReview', true);
                setError('completeReview', null);

                try {
                    const updatedReview = {
                        ...currentReview,
                        status: 'completed' as const,
                        completedAt: new Date().toISOString(),
                    };

                    set({ currentReview: updatedReview });

                    // In a real implementation, this would call the API
                    console.log('Completed MTR review:', currentReview._id);
                } catch (error) {
                    setError('completeReview', error instanceof Error ? error.message : 'Failed to complete review');
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
                    setError('cancelReview', error instanceof Error ? error.message : 'Failed to cancel review');
                } finally {
                    setLoading('cancelReview', false);
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
                        'followUp'
                    ];

                    const stepName = stepNames[step];
                    if (!stepName) throw new Error('Invalid step number');

                    const updatedSteps = {
                        ...currentReview.steps,
                        [stepName]: {
                            completed: true,
                            completedAt: new Date().toISOString(),
                            data,
                        },
                    };

                    const updatedReview = {
                        ...currentReview,
                        steps: updatedSteps,
                    };

                    set({
                        currentReview: updatedReview,
                        stepData: { ...get().stepData, [stepName]: data },
                    });

                    // Auto-save after completing step
                    await saveReview();
                } catch (error) {
                    setError('completeStep', error instanceof Error ? error.message : 'Failed to complete step');
                } finally {
                    setLoading('completeStep', false);
                }
            },

            getNextStep: () => {
                const { currentReview } = get();
                if (!currentReview) return null;

                const stepOrder = [
                    'patientSelection',
                    'medicationHistory',
                    'therapyAssessment',
                    'planDevelopment',
                    'interventions',
                    'followUp'
                ];

                for (let i = 0; i < stepOrder.length; i++) {
                    const stepName = stepOrder[i] as keyof typeof currentReview.steps;
                    if (!currentReview.steps[stepName].completed) {
                        return i;
                    }
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
                    'Follow-Up'
                ];
                return stepNames[currentStep] || 'Unknown Step';
            },

            // Patient selection actions
            selectPatient: (patient: Patient) => {
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
                    setError('searchPatients', error instanceof Error ? error.message : 'Failed to search patients');
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
                    setError('createNewPatient', error instanceof Error ? error.message : 'Failed to create patient');
                    return null;
                } finally {
                    setLoading('createNewPatient', false);
                }
            },

            // Medication management actions
            addMedication: (medication: MTRMedication) => {
                set((state) => ({
                    medications: [...state.medications, { ...medication, id: Date.now().toString() }],
                }));
            },

            updateMedication: (id: string, updates: Partial<MTRMedication>) => {
                set((state) => ({
                    medications: state.medications.map(med =>
                        med.id === id ? { ...med, ...updates } : med
                    ),
                }));
            },

            removeMedication: (id: string) => {
                set((state) => ({
                    medications: state.medications.filter(med => med.id !== id),
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
                    setError('importMedications', error instanceof Error ? error.message : 'Failed to import medications');
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
                        errors.push(`Medication ${index + 1}: Strength must be greater than 0`);
                    }
                });

                return errors;
            },

            // Problem identification actions
            runAssessment: async () => {
                const { setLoading, setError, medications, checkDrugInteractions } = get();
                setLoading('runAssessment', true);
                setError('runAssessment', null);

                try {
                    // Run various assessments
                    const interactions = await checkDrugInteractions(medications);

                    // Add other assessment logic here (duplicates, contraindications, etc.)

                    set({ identifiedProblems: interactions });
                } catch (error) {
                    setError('runAssessment', error instanceof Error ? error.message : 'Failed to run assessment');
                } finally {
                    setLoading('runAssessment', false);
                }
            },

            addProblem: (problem: DrugTherapyProblem) => {
                set((state) => ({
                    identifiedProblems: [...state.identifiedProblems, { ...problem, _id: Date.now().toString() }],
                }));
            },

            updateProblem: (id: string, updates: Partial<DrugTherapyProblem>) => {
                set((state) => ({
                    identifiedProblems: state.identifiedProblems.map(problem =>
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
                        description: 'Potential drug interaction detected between medications',
                        clinicalSignificance: 'Monitor for increased side effects',
                        affectedMedications: medications.slice(0, 2).map(m => m.drugName),
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
                    setError('createPlan', error instanceof Error ? error.message : 'Failed to create plan');
                } finally {
                    setLoading('createPlan', false);
                }
            },

            updatePlan: (updates: Partial<TherapyPlan>) => {
                set((state) => ({
                    therapyPlan: state.therapyPlan ? { ...state.therapyPlan, ...updates } : null,
                }));
            },

            addRecommendation: (recommendation: TherapyRecommendation) => {
                const { therapyPlan, updatePlan } = get();
                if (!therapyPlan) return;

                const updatedRecommendations = [...therapyPlan.recommendations, recommendation];
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
                    setError('recordIntervention', error instanceof Error ? error.message : 'Failed to record intervention');
                } finally {
                    setLoading('recordIntervention', false);
                }
            },

            updateIntervention: (id: string, updates: Partial<MTRIntervention>) => {
                set((state) => ({
                    interventions: state.interventions.map(intervention =>
                        intervention._id === id ? { ...intervention, ...updates } : intervention
                    ),
                }));
            },

            markInterventionComplete: (id: string, outcome: string, details?: string) => {
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
                    setError('scheduleFollowUp', error instanceof Error ? error.message : 'Failed to schedule follow-up');
                } finally {
                    setLoading('scheduleFollowUp', false);
                }
            },

            updateFollowUp: (id: string, updates: Partial<MTRFollowUp>) => {
                set((state) => ({
                    followUps: state.followUps.map(followUp =>
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
                    setError('completeFollowUp', error instanceof Error ? error.message : 'Failed to complete follow-up');
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
                    loading: {},
                    errors: {},
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
                const { currentReview } = get();
                if (!currentReview) return 0;

                const steps = Object.values(currentReview.steps);
                const completedSteps = steps.filter(step => step.completed).length;
                return Math.round((completedSteps / steps.length) * 100);
            },

            canCompleteReview: () => {
                const { currentReview } = get();
                if (!currentReview) return false;

                return Object.values(currentReview.steps).every(step => step.completed);
            },

            validateStep: (step: number) => {
                const { selectedPatient, medications, identifiedProblems, therapyPlan, interventions, followUps } = get();
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
export const useMTRSession = () => useMTRStore((state) => ({
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

export const useMTRNavigation = () => useMTRStore((state) => ({
    currentStep: state.currentStep,
    currentStepName: state.getCurrentStepName(),
    nextStep: state.getNextStep(),
    goToStep: state.goToStep,
    completeStep: state.completeStep,
    validateStep: state.validateStep,
    loading: state.loading.completeStep || false,
    error: state.errors.completeStep || null,
}));

export const useMTRPatient = () => useMTRStore((state) => ({
    selectedPatient: state.selectedPatient,
    selectPatient: state.selectPatient,
    searchPatients: state.searchPatients,
    createNewPatient: state.createNewPatient,
    loading: state.loading.searchPatients || state.loading.createNewPatient || false,
    error: state.errors.searchPatients || state.errors.createNewPatient || null,
}));

export const useMTRMedications = () => useMTRStore((state) => ({
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

export const useMTRAssessment = () => useMTRStore((state) => ({
    identifiedProblems: state.identifiedProblems,
    runAssessment: state.runAssessment,
    addProblem: state.addProblem,
    updateProblem: state.updateProblem,
    resolveProblem: state.resolveProblem,
    loading: state.loading.runAssessment || false,
    error: state.errors.runAssessment || null,
}));

export const useMTRPlan = () => useMTRStore((state) => ({
    therapyPlan: state.therapyPlan,
    createPlan: state.createPlan,
    updatePlan: state.updatePlan,
    addRecommendation: state.addRecommendation,
    addMonitoringParameter: state.addMonitoringParameter,
    addTherapyGoal: state.addTherapyGoal,
    loading: state.loading.createPlan || false,
    error: state.errors.createPlan || null,
}));

export const useMTRInterventions = () => useMTRStore((state) => ({
    interventions: state.interventions,
    recordIntervention: state.recordIntervention,
    updateIntervention: state.updateIntervention,
    markInterventionComplete: state.markInterventionComplete,
    loading: state.loading.recordIntervention || false,
    error: state.errors.recordIntervention || null,
}));

export const useMTRFollowUps = () => useMTRStore((state) => ({
    followUps: state.followUps,
    scheduleFollowUp: state.scheduleFollowUp,
    updateFollowUp: state.updateFollowUp,
    completeFollowUp: state.completeFollowUp,
    rescheduleFollowUp: state.rescheduleFollowUp,
    loading: state.loading.scheduleFollowUp || state.loading.completeFollowUp || false,
    error: state.errors.scheduleFollowUp || state.errors.completeFollowUp || null,
}));