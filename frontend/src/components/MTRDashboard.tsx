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
    state: patient.state || ''
  },
  allergies: [], // Will be loaded separately
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt
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
  onCancel
}) => {
  // Navigation and URL handling
  const [searchParams, setSearchParams] = useSearchParams();

  // Theme and responsive
  const { isMobile, isTablet, isSmallMobile, getSpacing } = useResponsive();

  // Local state
  const [autoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
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
        reviewKeys: Object.keys(currentReview || {})
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
        toast.error(
          'You do not have permission to access MTR reviews. Please contact your administrator.'
        );
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
        toast.error(
          `Failed to initialize MTR session: ${error instanceof Error ? error.message : 'Unknown error'
          }`
        );
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
        status: currentReview.status
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
            reviewKeys: Object.keys(currentReview || {})
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
      toast.warning(validationMessage);
      return;
    }

    // Move to next step
    try {
      // Complete current step with basic data
      await completeStep(currentStep, {
        completedAt: new Date().toISOString(),
        stepName: MTR_STEPS[currentStep]?.label || 'Unknown Step'
      });

      // Navigate to next step
      if (currentStep < MTR_STEPS.length - 1) {
        const newStep = currentStep + 1;
        goToStep(newStep);
      }

      toast.success('Step completed successfully');
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
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
        toast.error('Cannot save - No active review');
        return;
      }

      if (!currentReview._id) {
        toast.error('Cannot save - Review ID is missing');
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
            completed: step.completed
          }))
          : 'No steps',
        canComplete: canCompleteReview(),
        loadingSave: loading.saveReview
      });

      await saveReview();
      setLastSaved(new Date());
      toast.success('Review saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        `Failed to save review: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const handleComplete = async () => {
    if (!canCompleteReview()) {
      toast.warning(
        'Please complete all required steps before finishing the review'
      );
      return;
    }

    // Check if currentReview exists and has an ID before completing
    if (!currentReview) {
      toast.error('Cannot complete - No active review');
      return;
    }

    // Create a local variable for the review we'll complete - initialized with the current review
    let reviewToComplete = currentReview;

    // Log detailed information about the current review
    console.log('Current review for completion:', {
      hasReview: !!currentReview,
      reviewId: currentReview?._id,
      steps: !!currentReview?.steps,
      urlReviewId: reviewId
    });

    // Check if we're missing an ID but have a review with steps and other data
    if (
      (!currentReview._id || currentReview._id === '') &&
      currentReview.steps
    ) {
      toast.info('Attempting to recover review ID...');
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
              toast.error(
                'Cannot complete - Unable to recover review ID'
              );
              return;
            }
          } catch (loadError) {
            console.error('Error reloading review:', loadError);
            toast.error('Cannot complete - Failed to reload review');
            return;
          }
        } else {
          console.error('Could not recover review ID from store or URL');
          toast.error(
            'Cannot complete - Review ID is missing and cannot be recovered'
          );
          return;
        }
      } catch (error) {
        console.error('Error trying to recover review ID:', error);
        toast.error('Cannot complete - Error during recovery attempt');
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
          toast.error(
            'Cannot complete - Review ID is still missing after recovery attempts'
          );
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
        toast.success('MTR completed successfully');
        if (onComplete) {
          onComplete(reviewToComplete._id);
        }
      } else {
        throw new Error('Complete operation did not return expected result');
      }
    } catch (error) {
      console.error('Failed to complete review:', error);
      toast.error(
        `Failed to complete review: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
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
      toast.error('Failed to cancel review');
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
      <div maxWidth="lg" className="">
        <div className="">
          <Progress className="" />
          <div color="text.secondary">
            {loading.createReview
              ? 'Creating MTR session...'
              : 'Loading MTR session...'}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.createReview || errors.loadReview) {
    return (
      <div maxWidth="lg" className="">
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
      </div>
    );
  }

  // No review state - show patient selection
  if (!currentReview) {
    return (
      <div maxWidth="lg" className="">
        <div className="">
          Start New Medication Therapy Review
        </div>
        <Card>
          <CardContent className="">
            <PatientSelection
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
      </div>
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
      <div className="">
        <div className="">
          MTR Steps
        </div>
        <List>
          {MTR_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable =
              index <= (getNextStep() ?? MTR_STEPS.length - 1);

            return (
              <div
                key={step.id}
                component="div"
                onClick={() => {
                  if (isClickable) {
                    handleStepClick(index);
                    setMobileDrawerOpen(false);
                  }
                }}
                className=""
              >
                <div>
                  {status === 'completed' ? (
                    <CheckIcon color="success" />
                  ) : status === 'active' ? (
                    <div className="">
                      {index + 1}
                    </div>
                  ) : (
                    <div className="">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div
                  primary={step.label}
                  secondary={step.description}
                />
              </div>
            );
          })}
        </List>
      </div>
    </SwipeableDrawer>
  );

  return (
    <MTRErrorBoundary>
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showDetails={!isMobile} />

      {/* Mobile App Bar */}
      {isMobile && (
        <header position="sticky">
          <div>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              className=""
            >
              <TimelineIcon />
            </IconButton>
            <div className="">
              <div noWrap>
                MTR - Step {currentStep + 1}
              </div>
              <div className="">
                {MTR_STEPS[currentStep]?.label}
              </div>
            </div>
            <Chip
              label={`${Math.round(completionPercentage)}%`}
              size="small"
              className=""
            />
          </div>
        </header>
      )}

      <div maxWidth="lg" className="">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="">
            <div className="">
              <div className="">
                <div
                  variant={isTablet ? 'h5' : 'h4'}
                  className=""
                >
                  Medication Therapy Review
                </div>
                <div color="text.secondary">
                  {currentReview.reviewNumber} • {getCurrentStepName()}
                </div>
                {selectedPatient && (
                  <div
                    color="text.secondary"
                    className=""
                  >
                    Patient: {selectedPatient.firstName}{' '}
                    {selectedPatient.lastName} (ID: {selectedPatient._id})
                  </div>
                )}
              </div>
              <div className="">
                <Chip
                  label={`${Math.round(completionPercentage)}% Complete`}
                  color={completionPercentage === 100 ? 'success' : 'primary'}
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
              </div>
            </div>

            {/* Progress Bar */}
            <div className="">
              <Progress className="" />
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div color="text.secondary">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="">
          {/* Desktop Stepper */}
          {!isMobile && (
            <div className="">
              <Stepper
                activeStep={currentStep}
                orientation="vertical"
                className=""
              >
                {MTR_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable =
                    index <= (getNextStep() ?? MTR_STEPS.length - 1);

                  return (
                    <Step key={step.id} completed={status === 'completed'}>
                      <StepLabel
                        onClick={() => isClickable && handleStepClick(index)}
                        className=""
                      >
                        <div className="">
                          {step.label}
                        </div>
                        <div color="text.secondary">
                          {step.description}
                        </div>
                      </StepLabel>
                      <StepContent>
                        <div className="">
                          <div color="text.secondary">
                            {step.description}
                          </div>
                        </div>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </div>
          )}

          {/* Step Content */}
          <div className="">
            <div className="">
              {getCurrentStepComponent()}
            </div>
          </div>
        </div>

        {/* Mobile Stepper Drawer */}
        {isMobile && renderMobileStepper()}

        {/* Action Buttons */}
        <div className="">
          <div className="">
            <div className="">
              <Button
                onClick={handleCancel}
                disabled={loading.cancelReview}
                size={isMobile ? 'large' : 'medium'}
                className=""
              >
                Cancel
              </Button>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading.saveReview}
                size={isMobile ? 'large' : 'medium'}
                className=""
              >
                {loading.saveReview ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <div className="">
              <Button
                startIcon={<NavigateBeforeIcon />}
                onClick={handleBack}
                disabled={currentStep === 0}
                size={isMobile ? 'large' : 'medium'}
                className=""
              >
                Back
              </Button>
              {currentStep < MTR_STEPS.length - 1 ? (
                <Button
                  endIcon={<NavigateNextIcon />}
                  onClick={handleNext}
                  disabled={loading.completeStep}
                  size={isMobile ? 'large' : 'medium'}
                  className=""
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={handleComplete}
                  disabled={!canCompleteReview() || loading.completeReview}
                  size={isMobile ? 'large' : 'medium'}
                  className=""
                >
                  {loading.completeReview ? 'Completing...' : 'Complete Review'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Buttons for Mobile */}
        {isMobile && (
          <>
            <Fab
              color="primary"
              className=""
              onClick={handleSave}
              disabled={loading.saveReview}
              size="medium"
            >
              <SaveIcon />
            </Fab>

            {/* Quick step navigation */}
            <Fab
              color="secondary"
              className=""
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
            <div>
              Are you sure you want to cancel this MTR session? Any unsaved
              changes will be lost.
            </div>
          </DialogContent>
          <DialogActions className="">
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
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              Cancel Session
            </Button>
          </DialogActions>
        </Dialog>

        {/* MTR Help System */}
        <MTRHelpSystem
          currentStep={currentStep + 1}
        />

        {/* Quick Reference for Current Step */}
        {currentStep >= 0 && currentStep < MTR_STEPS.length && (
          <div className="">
            <QuickReference step={currentStep + 1} />
          </div>
        )}
      </div>
    </MTRErrorBoundary>
  );
};

export default MTRDashboard;
