import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Snackbar,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import TimelineIcon from '@mui/icons-material/Timeline';

// Import MTR step components
import PatientSelection from './PatientSelection';
import MedicationHistory from './MedicationHistory';
import TherapyAssessment from './TherapyAssessment';
import PlanDevelopment from './PlanDevelopment';
import InterventionsDashboard from './InterventionsDashboard';
import FollowUpScheduler from './FollowUpScheduler';
import MTRErrorBoundary from './MTRErrorBoundary';
import OfflineIndicator from './common/OfflineIndicator';
import MTRHelpSystem from './help/MTRHelpSystem';
import { QuickReference } from './help/MTRContextualHelp';

// Import store and types
import { useMTRStore } from '../stores/mtrStore';
import { useResponsive } from '../hooks/useResponsive';
import type { Patient, NigerianState } from '../types/patientManagement';
import type { Patient as StorePatient } from '../stores/types';
import type {
  DrugTherapyProblem,
  MTRIntervention,
  MTRFollowUp,
  TherapyPlan,
} from '../types/mtr';
import type { MTRMedication } from '../stores/mtrStore';

// Helper function to convert Patient types
const convertPatientToStoreType = (patient: Patient): StorePatient => ({
  _id: patient._id,
  firstName: patient.firstName,
  lastName: patient.lastName,
  email: patient.email,
  phone: patient.phone || '',
  dateOfBirth: patient.dob || '',
  address: {
    street: patient.address || '',
    state: patient.state || '',
  },
  allergies: [], // Will be loaded separately
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

// Step configuration
interface MTRStepConfig {
  id: number;
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  icon?: React.ReactNode;
  optional?: boolean;
  validationRequired?: boolean;
}

const MTR_STEPS: MTRStepConfig[] = [
  {
    id: 0,
    label: 'Patient Selection',
    description: 'Select or create a patient for medication therapy review',
    component: PatientSelection,
    validationRequired: true,
  },
  {
    id: 1,
    label: 'Medication History',
    description: 'Collect comprehensive medication history and current regimen',
    component: MedicationHistory,
    validationRequired: true,
  },
  {
    id: 2,
    label: 'Therapy Assessment',
    description: 'Assess therapy for drug-related problems and interactions',
    component: TherapyAssessment,
    validationRequired: true,
  },
  {
    id: 3,
    label: 'Plan Development',
    description: 'Develop therapy recommendations and monitoring plans',
    component: PlanDevelopment,
    validationRequired: true,
  },
  {
    id: 4,
    label: 'Interventions',
    description: 'Document interventions and track outcomes',
    component: InterventionsDashboard,
    validationRequired: false,
  },
  {
    id: 5,
    label: 'Follow-Up',
    description: 'Schedule follow-up activities and monitoring',
    component: FollowUpScheduler,
    validationRequired: false,
  },
];

interface MTRDashboardProps {
  patientId?: string;
  reviewId?: string;
  onComplete?: (reviewId: string) => void;
  onCancel?: () => void;
}

const MTRDashboard: React.FC<MTRDashboardProps> = ({
  patientId,
  reviewId,
  onComplete,
  onCancel,
}) => {
  // Navigation and URL handling
  const [searchParams, setSearchParams] = useSearchParams();

  // Theme and responsive
  const { isMobile, isTablet, isSmallMobile, getSpacing } = useResponsive();

  // Local state
  const [autoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Store
  const {
    currentReview,
    currentStep,
    selectedPatient,
    medications,
    identifiedProblems,
    interventions,
    loading,
    errors,
    goToStep,
    completeStep,
    saveReview,
    completeReview,
    cancelReview,
    createReview,
    loadReview,
    loadInProgressReview,
    getCompletionPercentage,
    canCompleteReview,
    getCurrentStepName,
    getNextStep,
    clearErrors,
    selectPatient,
    setMedications,
    addProblem,
    createPlan,
    checkPermissions,
  } = useMTRStore();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled) {
      console.log('Auto-save disabled');
      return;
    }

    if (!currentReview) {
      console.error('Auto-save skipped: No current review');
      return;
    }

    if (loading.saveReview) {
      console.log('Auto-save skipped: Save already in progress');
      return;
    }

    // Enhanced validation for review ID
    if (!currentReview._id || currentReview._id.trim() === '') {
      console.error('Auto-save skipped: Review ID is missing or invalid', {
        hasReview: !!currentReview,
        reviewId: currentReview._id,
        reviewKeys: Object.keys(currentReview || {}),
      });
      return;
    }

    try {
      console.log('Auto-saving review with ID:', currentReview._id);
      await saveReview();
      setLastSaved(new Date());
      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [autoSaveEnabled, currentReview, loading.saveReview, saveReview]);

  // Auto-save timer
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [autoSave, autoSaveEnabled]);

  // Offline detection (for future use)
  useEffect(() => {
    const handleOnline = () => {
      // Handle online state if needed
    };
    const handleOffline = () => {
      // Handle offline state if needed
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check permissions first
  useEffect(() => {
    const checkUserPermissions = async () => {
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        setSnackbarMessage(
          'You do not have permission to access MTR reviews. Please contact your administrator.'
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    };

    checkUserPermissions();
  }, [checkPermissions]);

  // Initialize MTR session
  useEffect(() => {
    const initializeSession = async () => {
      // Check permissions first
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        return; // Don't proceed if no permissions
      }

      try {
        if (reviewId) {
          console.log('Loading existing review with ID:', reviewId);
          await loadReview(reviewId);

          // Verify we have a valid review with ID after loading
          const { currentReview } = useMTRStore.getState();
          console.log(
            'Loaded review:',
            currentReview?._id ? 'ID present' : 'ID missing',
            currentReview
              ? JSON.stringify({ id: currentReview._id })
              : 'No review'
          );
        } else if (patientId) {
          console.log(
            'Checking for in-progress review for patient:',
            patientId
          );
          // First, check if there's an in-progress review for this patient
          const inProgressReview = await loadInProgressReview(patientId);

          if (!inProgressReview) {
            console.log(
              'No in-progress review found, creating new one for patient:',
              patientId
            );
            // No in-progress review found, create new one
            await createReview(patientId);

            // Verify we have a valid review with ID after creation
            const { currentReview } = useMTRStore.getState();
            console.log(
              'Created review:',
              currentReview?._id ? 'ID present' : 'ID missing',
              currentReview
                ? JSON.stringify({ id: currentReview._id })
                : 'No review'
            );
          } else {
            console.log(
              'In-progress review found with ID:',
              inProgressReview._id
            );
          }
          // If in-progress review found, it's already loaded by loadInProgressReview
        }
      } catch (error) {
        console.error('Error initializing MTR session:', error);
        setSnackbarMessage(
          `Failed to initialize MTR session: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    initializeSession();
  }, [
    reviewId,
    patientId,
    loadReview,
    createReview,
    loadInProgressReview,
    checkPermissions,
  ]);

  // Update URL when step changes (one-way sync only)
  useEffect(() => {
    if (!currentReview) return;

    const stepParam = searchParams.get('step');
    const urlStep = stepParam ? parseInt(stepParam, 10) : null;

    console.log(
      'URL sync effect - currentStep:',
      currentStep,
      'urlStep:',
      urlStep
    );

    // Only update URL if it's different from current step
    if (urlStep !== currentStep) {
      console.log('Updating URL to step:', currentStep);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('step', currentStep.toString());
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [currentStep, currentReview, searchParams, setSearchParams]); // Only depend on currentStep, not searchParams

  // Auto-save functionality
  useEffect(() => {
    if (!currentReview) {
      console.log('Auto-save skipped: No current review');
      return;
    }

    if (currentReview.status === 'completed') {
      console.log('Auto-save skipped: Review already completed');
      return;
    }

    console.log(
      'Setting up auto-save for review:',
      JSON.stringify({
        id: currentReview._id,
        status: currentReview.status,
      })
    );

    const autoSaveInterval = setInterval(async () => {
      try {
        // Always re-check if currentReview is available and has ID
        const { currentReview } = useMTRStore.getState();

        if (!currentReview) {
          console.error('Auto-save skipped: No current review available');
          return;
        }

        // Enhanced validation for review ID
        if (!currentReview._id || currentReview._id.trim() === '') {
          console.error('Auto-save skipped: Review ID is missing or invalid', {
            hasReview: !!currentReview,
            reviewId: currentReview._id,
            reviewKeys: Object.keys(currentReview || {}),
          });
          return;
        }

        console.log('Auto-saving review with ID:', currentReview._id);
        await saveReview();
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentReview, saveReview]);

  // Session state persistence
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!currentReview) {
        console.log('No review to save before unload');
        return;
      }

      if (!autoSaveEnabled) {
        console.log('Auto-save disabled, skipping save before unload');
        return;
      }

      if (!currentReview._id) {
        console.error('Cannot save before unload - Review ID is missing');
        return;
      }

      // Trigger auto-save before page unload
      console.log(
        'Attempting to save review before unload:',
        currentReview._id
      );
      autoSave();

      // Show confirmation dialog if there are unsaved changes
      const message =
        'You have unsaved changes. Are you sure you want to leave?';
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentReview, autoSaveEnabled, autoSave]);

  // Handle step navigation
  const handleNext = async () => {
    // Simple validation based on current step
    let hasValidationErrors = false;
    let validationMessage = '';

    switch (currentStep) {
      case 0: // Patient Selection
        if (!selectedPatient) {
          hasValidationErrors = true;
          validationMessage = 'Please select a patient first';
        }
        break;
      case 1: // Medication History - allow progression without medications for now
        // Optional: Add medication validation here if needed
        break;
      case 2: // Therapy Assessment
        // Optional: Add assessment validation here if needed
        break;
      default:
        // Allow progression for other steps
        break;
    }

    if (hasValidationErrors) {
      setSnackbarMessage(validationMessage);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Move to next step
    try {
      // Complete current step with basic data
      await completeStep(currentStep, {
        completedAt: new Date().toISOString(),
        stepName: MTR_STEPS[currentStep]?.label || 'Unknown Step',
      });

      // Navigate to next step
      if (currentStep < MTR_STEPS.length - 1) {
        const newStep = currentStep + 1;
        goToStep(newStep);
      }

      setSnackbarMessage('Step completed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error completing step:', error);
      setSnackbarMessage('Failed to complete step');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      goToStep(newStep);
      // URL will be updated by the synchronization effect
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or the next incomplete step
    const nextStep = getNextStep();
    if (stepIndex <= (nextStep ?? MTR_STEPS.length - 1)) {
      goToStep(stepIndex);
      // URL will be updated by the synchronization effect
    }
  };

  const handleSave = async () => {
    try {
      // Check if currentReview exists and has an ID before saving
      if (!currentReview) {
        setSnackbarMessage('Cannot save - No active review');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (!currentReview._id) {
        setSnackbarMessage('Cannot save - Review ID is missing');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('Cannot save review - ID is missing', currentReview);
        return;
      }

      // Debug logging to understand the current state
      console.log('🔍 Manual save triggered - Current review state:', {
        id: currentReview._id,
        status: currentReview.status,
        stepsCompleted: currentReview.steps
          ? Object.entries(currentReview.steps).map(([key, step]) => ({
              step: key,
              completed: step.completed,
            }))
          : 'No steps',
        canComplete: canCompleteReview(),
        loadingSave: loading.saveReview,
      });

      await saveReview();
      setLastSaved(new Date());
      setSnackbarMessage('Review saved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Save error:', error);
      setSnackbarMessage(
        `Failed to save review: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleComplete = async () => {
    if (!canCompleteReview()) {
      setSnackbarMessage(
        'Please complete all required steps before finishing the review'
      );
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Check if currentReview exists and has an ID before completing
    if (!currentReview) {
      setSnackbarMessage('Cannot complete - No active review');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Create a local variable for the review we'll complete - initialized with the current review
    let reviewToComplete = currentReview;

    // Log detailed information about the current review
    console.log('Current review for completion:', {
      hasReview: !!currentReview,
      reviewId: currentReview?._id,
      steps: !!currentReview?.steps,
      urlReviewId: reviewId,
    });

    // Check if we're missing an ID but have a review with steps and other data
    if (
      (!currentReview._id || currentReview._id === '') &&
      currentReview.steps
    ) {
      setSnackbarMessage('Attempting to recover review ID...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      console.warn(
        'Review missing ID but has data - attempting recovery',
        currentReview
      );

      // First try to get the latest review from the store
      try {
        const { currentReview: latestReview } = useMTRStore.getState();

        // If the store has a review with ID, use that
        if (latestReview && latestReview._id) {
          console.log('Found review ID in store:', latestReview._id);

          // Update our local reference to use this review with ID
          reviewToComplete = latestReview;
        } else if (reviewId) {
          // If we have a reviewId from URL params, try to reload the review
          console.log('Attempting to reload review using URL ID:', reviewId);

          try {
            await loadReview(reviewId);
            const { currentReview: reloadedReview } = useMTRStore.getState();

            if (reloadedReview && reloadedReview._id) {
              console.log(
                'Successfully reloaded review with ID:',
                reloadedReview._id
              );
              reviewToComplete = reloadedReview;
            } else {
              console.error('Failed to reload review with valid ID');
              setSnackbarMessage(
                'Cannot complete - Unable to recover review ID'
              );
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
              return;
            }
          } catch (loadError) {
            console.error('Error reloading review:', loadError);
            setSnackbarMessage('Cannot complete - Failed to reload review');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
          }
        } else {
          console.error('Could not recover review ID from store or URL');
          setSnackbarMessage(
            'Cannot complete - Review ID is missing and cannot be recovered'
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      } catch (error) {
        console.error('Error trying to recover review ID:', error);
        setSnackbarMessage('Cannot complete - Error during recovery attempt');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }

    try {
      // First check if our reviewToComplete has an ID
      if (!reviewToComplete._id) {
        console.error(
          'Cannot complete review - ID is missing',
          reviewToComplete
        );

        // Last resort attempt - if we have a reviewId from URL params
        if (reviewId) {
          console.log(
            'Last resort recovery: Using reviewId from URL params:',
            reviewId
          );
          reviewToComplete._id = reviewId;
          console.log(
            'Updated reviewToComplete with URL ID:',
            reviewToComplete
          );
        } else {
          setSnackbarMessage(
            'Cannot complete - Review ID is still missing after recovery attempts'
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      }

      // Save the review to ensure all data is up to date
      console.log(
        'Saving review before completing with ID:',
        reviewToComplete._id
      );
      await saveReview();

      // Then complete it
      console.log('Completing review with ID:', reviewToComplete._id);
      const result = await completeReview(reviewToComplete._id);

      if (result) {
        setSnackbarMessage('MTR completed successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        if (onComplete) {
          onComplete(reviewToComplete._id);
        }
      } else {
        throw new Error('Complete operation did not return expected result');
      }
    } catch (error) {
      console.error('Failed to complete review:', error);
      setSnackbarMessage(
        `Failed to complete review: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => {
    setShowExitDialog(true);
  };

  const confirmCancel = async () => {
    try {
      await cancelReview();
      setShowExitDialog(false);
      if (onCancel) {
        onCancel();
      }
    } catch {
      setSnackbarMessage('Failed to cancel review');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Memoized callbacks to prevent unnecessary re-renders
  const handleMedicationsUpdate = useCallback(
    (medications: MTRMedication[]) => {
      setMedications(medications);
    },
    [setMedications]
  );

  const handlePatientSelect = useCallback(
    (patient: Patient) => {
      selectPatient(convertPatientToStoreType(patient));
    },
    [selectPatient]
  );

  const handleProblemsIdentified = useCallback(
    (problems: DrugTherapyProblem[]) => {
      problems.forEach((problem: DrugTherapyProblem) => addProblem(problem));
    },
    [addProblem]
  );

  const handlePlanCreated = useCallback(
    (plan: TherapyPlan) => {
      createPlan(plan);
    },
    [createPlan]
  );

  const handleInterventionRecorded = useCallback(
    (intervention: MTRIntervention) => {
      console.log('Intervention recorded:', intervention);
    },
    []
  );

  const handleFollowUpScheduled = useCallback((followUp: MTRFollowUp) => {
    console.log('Follow-up scheduled:', followUp);
  }, []);

  // Get current step component
  const getCurrentStepComponent = () => {
    const stepConfig = MTR_STEPS[currentStep];
    if (!stepConfig) return null;

    const StepComponent = stepConfig.component;
    const commonProps = {
      onNext: handleNext,
      onBack: currentStep > 0 ? handleBack : undefined,
    };

    switch (currentStep) {
      case 0: // Patient Selection
        return (
          <StepComponent
            {...commonProps}
            onPatientSelect={handlePatientSelect}
            selectedPatient={selectedPatient || undefined}
          />
        );
      case 1: // Medication History
        return (
          <StepComponent
            {...commonProps}
            patientId={selectedPatient?._id}
            onMedicationsUpdate={handleMedicationsUpdate}
          />
        );
      case 2: // Therapy Assessment
        return (
          <StepComponent
            {...commonProps}
            patientId={selectedPatient?._id}
            medications={medications}
            patientInfo={
              selectedPatient
                ? {
                    age: 0, // Will be calculated from dateOfBirth
                    gender: 'unknown', // Will be loaded from patient data
                    conditions: [], // Will be loaded from patient conditions
                    allergies: [], // Will be loaded from patient allergies
                  }
                : undefined
            }
            onProblemsIdentified={handleProblemsIdentified}
          />
        );
      case 3: // Plan Development
        return (
          <StepComponent
            {...commonProps}
            patientId={selectedPatient?._id}
            problems={identifiedProblems}
            onPlanCreated={handlePlanCreated}
          />
        );
      case 4: // Interventions
        return (
          <StepComponent
            {...commonProps}
            reviewId={currentReview?._id}
            patientId={selectedPatient?._id}
            onInterventionRecorded={handleInterventionRecorded}
          />
        );
      case 5: // Follow-Up
        return (
          <StepComponent
            {...commonProps}
            reviewId={currentReview?._id}
            patientId={selectedPatient?._id}
            interventions={interventions}
            onFollowUpScheduled={handleFollowUpScheduled}
          />
        );
      default:
        return null;
    }
  };

  // Get step status
  const getStepStatus = (stepIndex: number) => {
    if (!currentReview) return 'pending';
    if (!currentReview.steps) return 'pending';

    const stepNames = [
      'patientSelection',
      'medicationHistory',
      'therapyAssessment',
      'planDevelopment',
      'interventions',
      'followUp',
    ];

    try {
      const stepName = stepNames[stepIndex] as keyof typeof currentReview.steps;
      const step = currentReview.steps[stepName];

      if (step?.completed) return 'completed';
      if (stepIndex === currentStep) return 'active';
      if (stepIndex < currentStep) return 'completed';
      return 'pending';
    } catch (error) {
      console.error('Error determining step status:', error);
      return 'pending';
    }
  };

  // Calculate completion percentage
  const completionPercentage = getCompletionPercentage();

  // Loading state
  if (loading.createReview || loading.loadReview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
          <Typography variant="body1" color="text.secondary">
            {loading.createReview
              ? 'Creating MTR session...'
              : 'Loading MTR session...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (errors.createReview || errors.loadReview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => clearErrors()}>
              Retry
            </Button>
          }
        >
          {errors.createReview || errors.loadReview}
        </Alert>
      </Container>
    );
  }

  // No review state - show patient selection
  if (!currentReview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Start New Medication Therapy Review
        </Typography>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <PatientSelection
              onPatientSelect={(patient: Patient) => {
                // Create a new review for the selected patient
                console.log('Patient selected:', patient);
                selectPatient(convertPatientToStoreType(patient));
                createReview(patient._id);
              }}
              onNext={() => {
                // Move to next step after patient selection
                console.log('Moving to next step');
                goToStep(1);
              }}
              selectedPatient={
                selectedPatient
                  ? {
                      ...selectedPatient,
                      pharmacyId: 'default-pharmacy',
                      mrn: selectedPatient._id,
                      dob: selectedPatient.dateOfBirth,
                      address: selectedPatient.address?.street || '',
                      state:
                        (selectedPatient.address?.state as NigerianState) ||
                        undefined,
                    }
                  : null
              }
            />
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Mobile stepper drawer
  const renderMobileStepper = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      onOpen={() => setMobileDrawerOpen(true)}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          MTR Steps
        </Typography>
        <List>
          {MTR_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable =
              index <= (getNextStep() ?? MTR_STEPS.length - 1);

            return (
              <ListItem
                key={step.id}
                component="div"
                onClick={() => {
                  if (isClickable) {
                    handleStepClick(index);
                    setMobileDrawerOpen(false);
                  }
                }}
                sx={{
                  cursor: isClickable ? 'pointer' : 'default',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor:
                    status === 'active'
                      ? 'primary.50'
                      : status === 'completed'
                      ? 'success.50'
                      : 'transparent',
                }}
              >
                <ListItemIcon>
                  {status === 'completed' ? (
                    <CheckIcon color="success" />
                  ) : status === 'active' ? (
                    <Typography
                      variant="body2"
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {index + 1}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 1,
                        borderColor: 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {index + 1}
                    </Typography>
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={step.label}
                  secondary={step.description}
                  primaryTypographyProps={{
                    fontWeight: status === 'active' ? 600 : 400,
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <MTRErrorBoundary>
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showDetails={!isMobile} />

      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <TimelineIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                MTR - Step {currentStep + 1}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {MTR_STEPS[currentStep]?.label}
              </Typography>
            </Box>
            <Chip
              label={`${Math.round(completionPercentage)}%`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Toolbar>
        </AppBar>
      )}

      <Container
        maxWidth="lg"
        sx={{
          py: isMobile ? 1 : 2,
          px: isMobile ? 1 : 3,
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <Paper sx={{ p: getSpacing(2, 3, 3), mb: getSpacing(2, 3, 3) }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexDirection: isTablet ? 'column' : 'row',
                gap: isTablet ? 2 : 0,
              }}
            >
              <Box sx={{ textAlign: isTablet ? 'center' : 'left' }}>
                <Typography
                  variant={isTablet ? 'h5' : 'h4'}
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  Medication Therapy Review
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {currentReview.reviewNumber} • {getCurrentStepName()}
                </Typography>
                {selectedPatient && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Patient: {selectedPatient.firstName}{' '}
                    {selectedPatient.lastName} (ID: {selectedPatient._id})
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  justifyContent: isTablet ? 'center' : 'flex-end',
                }}
              >
                <Chip
                  label={`${Math.round(completionPercentage)}% Complete`}
                  color={completionPercentage === 100 ? 'success' : 'primary'}
                  variant="outlined"
                />
                {currentReview && currentReview.status && (
                  <Chip
                    label={currentReview.status.replace('_', ' ').toUpperCase()}
                    color={
                      currentReview.status === 'completed'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                  />
                )}
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Auto-save indicator */}
            {lastSaved && (
              <Typography variant="caption" color="text.secondary">
                Last saved: {lastSaved.toLocaleTimeString()}
              </Typography>
            )}
          </Paper>
        )}

        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            gap: getSpacing(1, 2, 3),
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          {/* Desktop Stepper */}
          {!isMobile && (
            <Paper
              sx={{
                p: getSpacing(1, 2, 2),
                minWidth: isTablet ? 280 : 300,
                maxWidth: isTablet ? 320 : 350,
                height: 'fit-content',
                position: 'sticky',
                top: 20,
              }}
            >
              <Stepper
                activeStep={currentStep}
                orientation="vertical"
                sx={{
                  '& .MuiStepLabel-root': {
                    cursor: 'pointer',
                  },
                }}
              >
                {MTR_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable =
                    index <= (getNextStep() ?? MTR_STEPS.length - 1);

                  return (
                    <Step key={step.id} completed={status === 'completed'}>
                      <StepLabel
                        onClick={() => isClickable && handleStepClick(index)}
                        sx={{
                          cursor: isClickable ? 'pointer' : 'default',
                          opacity: isClickable ? 1 : 0.6,
                        }}
                        StepIconProps={{
                          sx: {
                            color:
                              status === 'completed'
                                ? 'success.main'
                                : status === 'active'
                                ? 'primary.main'
                                : 'grey.400',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: status === 'active' ? 600 : 400 }}
                        >
                          {step.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Box sx={{ py: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {step.description}
                          </Typography>
                        </Box>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </Paper>
          )}

          {/* Step Content */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: isMobile ? 'auto' : 600,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Paper
              sx={{
                p: getSpacing(1, 2, 3),
                minHeight: isMobile ? 'auto' : '100%',
                borderRadius: isMobile ? 2 : 1,
              }}
            >
              {getCurrentStepComponent()}
            </Paper>
          </Box>
        </Box>

        {/* Mobile Stepper Drawer */}
        {isMobile && renderMobileStepper()}

        {/* Action Buttons */}
        <Paper
          sx={{
            p: getSpacing(1, 2, 2),
            mt: getSpacing(2, 3, 3),
            position: isMobile ? 'sticky' : 'static',
            bottom: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 1000 : 'auto',
            borderRadius: isMobile ? '16px 16px 0 0' : 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading.cancelReview}
                size={isMobile ? 'large' : 'medium'}
                sx={{ minWidth: isMobile ? 120 : 'auto' }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading.saveReview}
                size={isMobile ? 'large' : 'medium'}
                sx={{ minWidth: isMobile ? 120 : 'auto' }}
              >
                {loading.saveReview ? 'Saving...' : 'Save'}
              </Button>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-end',
              }}
            >
              <Button
                variant="outlined"
                startIcon={<NavigateBeforeIcon />}
                onClick={handleBack}
                disabled={currentStep === 0}
                size={isMobile ? 'large' : 'medium'}
                sx={{ minWidth: isMobile ? 120 : 'auto' }}
              >
                Back
              </Button>

              {currentStep < MTR_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                  onClick={handleNext}
                  disabled={loading.completeStep}
                  size={isMobile ? 'large' : 'medium'}
                  sx={{ minWidth: isMobile ? 140 : 'auto' }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={handleComplete}
                  disabled={!canCompleteReview() || loading.completeReview}
                  size={isMobile ? 'large' : 'medium'}
                  sx={{ minWidth: isMobile ? 140 : 'auto' }}
                >
                  {loading.completeReview ? 'Completing...' : 'Complete Review'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Floating Action Buttons for Mobile */}
        {isMobile && (
          <>
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 80,
                right: 16,
                zIndex: 1000,
              }}
              onClick={handleSave}
              disabled={loading.saveReview}
              size="medium"
            >
              <SaveIcon />
            </Fab>

            {/* Quick step navigation */}
            <Fab
              color="secondary"
              sx={{
                position: 'fixed',
                bottom: 140,
                right: 16,
                zIndex: 1000,
              }}
              onClick={() => setMobileDrawerOpen(true)}
              size="small"
            >
              <TimelineIcon />
            </Fab>
          </>
        )}

        {/* Exit Confirmation Dialog */}
        <Dialog
          open={showExitDialog}
          onClose={() => setShowExitDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isSmallMobile}
        >
          <DialogTitle>Cancel MTR Session?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this MTR session? Any unsaved
              changes will be lost.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0,
              p: isMobile ? 2 : 1,
            }}
          >
            <Button
              onClick={() => setShowExitDialog(false)}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              Continue Working
            </Button>
            <Button
              onClick={confirmCancel}
              color="error"
              variant="contained"
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              Cancel Session
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{
            vertical: isMobile ? 'top' : 'bottom',
            horizontal: isMobile ? 'center' : 'left',
          }}
          sx={{
            ...(isMobile && {
              top: 80, // Below mobile app bar
            }),
          }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              ...(isMobile && {
                borderRadius: 2,
              }),
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* MTR Help System */}
        <MTRHelpSystem
          currentStep={currentStep + 1}
          onStartTour={() => {
            // Optional: Reset to first step for tour
            goToStep(0);
          }}
        />

        {/* Quick Reference for Current Step */}
        {currentStep >= 0 && currentStep < MTR_STEPS.length && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              maxWidth: 300,
              zIndex: 999,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <QuickReference step={currentStep + 1} />
          </Box>
        )}
      </Container>
    </MTRErrorBoundary>
  );
};

export default MTRDashboard;
