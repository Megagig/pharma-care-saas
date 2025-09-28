import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    LinearProgress,
    Alert,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    IconButton,
    Toolbar,
    AppBar,
    Fab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    SwipeableDrawer,
    Card,
    CardContent,
} from '@mui/material';
import Save from '@mui/icons-material/Save';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Check from '@mui/icons-material/Check';
import Timeline from '@mui/icons-material/Timeline';

import { useMTRStore } from '../../stores/mtrStore';
// import { useAuthStore } from '../../stores/authStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useSpacing } from '../../hooks/useSpacing';
import { Patient } from '../../stores/types';
import { convertPatientToStoreType, convertStorePatientToPatient } from '../../utils/patientUtils';

// Import MTR step components
import PatientSelection from './steps/PatientSelection';
import MedicationHistory from './steps/MedicationHistory';
import TherapyAssessment from './steps/TherapyAssessment';
import PlanDevelopment from './steps/PlanDevelopment';
import Interventions from './steps/Interventions';
import FollowUp from './steps/FollowUp';

// Import utility components
import OfflineIndicator from '../../components/common/OfflineIndicator';
import MTRErrorBoundary from './MTRErrorBoundary';
import MTRHelpSystem from './MTRHelpSystem';
import QuickReference from './QuickReference';

// Import types
import type {
    MTRMedication,
    DrugTherapyProblem,
    TherapyPlan,
    MTRIntervention,
    MTRFollowUp,
} from '../../stores/mtrStore';

// MTR step configuration
const MTR_STEPS = [
    {
        id: 'patientSelection',
        label: 'Patient Selection',
        description: 'Select or create a patient for the MTR',
        component: PatientSelection,
    },
    {
        id: 'medicationHistory',
        label: 'Medication History',
        description: 'Review and document current medications',
        component: MedicationHistory,
    },
    {
        id: 'therapyAssessment',
        label: 'Therapy Assessment',
        description: 'Identify drug therapy problems',
        component: TherapyAssessment,
    },
    {
        id: 'planDevelopment',
        label: 'Plan Development',
        description: 'Create a therapy plan with recommendations',
        component: PlanDevelopment,
    },
    {
        id: 'interventions',
        label: 'Interventions',
        description: 'Document interventions performed',
        component: Interventions,
    },
    {
        id: 'followUp',
        label: 'Follow-Up',
        description: 'Schedule follow-up activities',
        component: FollowUp,
    },
];

const MTRDashboard: React.FC<{
    onComplete?: (reviewId: string) => void;
    onCancel?: () => void;
}> = ({ onComplete, onCancel }) => {
    // Router and navigation
    const navigate = useNavigate();
    const { reviewId } = useParams<{ reviewId: string }>();

    // Responsive design hooks
    const { isMobile, isTablet, isSmallMobile } = useResponsive();
    const getSpacing = useSpacing();

    // MTR store state and actions
    const {
        currentReview,
        currentStep,
        selectedPatient,
        medications,
        identifiedProblems,
        interventions,
        loading,
        errors,
        initializeSession,
        createReview,
        loadReview,
        loadInProgressReview,
        saveReview,
        completeReview,
        cancelReview,
        goToStep,
        completeStep,
        getNextStep,
        getCurrentStepName,
        selectPatient,
        setMedications,
        addProblem,
        createPlan,
        getCompletionPercentage,
        canCompleteReview,
        clearErrors,
        setCurrentReview,
    } = useMTRStore();

    // Auth store (user available if needed)
    // const { user } = useAuthStore();

    // Local UI state
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Auto-save effect
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (currentReview && currentReview.status === 'in_progress') {
                saveReview().then(() => {
                    setLastSaved(new Date());
                });
            }
        }, 30000); // Auto-save every 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [currentReview, saveReview]);

    // Initialize review on component mount
    useEffect(() => {
        const initializeReview = async () => {
            if (reviewId) {
                console.log('Loading existing MTR review with ID:', reviewId);
                await loadReview(reviewId);
            } else {
                // Check if there's an in-progress review for the selected patient
                if (selectedPatient) {
                    console.log('Checking for in-progress MTR review for patient:', selectedPatient._id);
                    const inProgressReview = await loadInProgressReview(selectedPatient._id);
                    if (!inProgressReview) {
                        console.log('No in-progress review found, initializing basic session');
                        initializeSession();
                    }
                } else {
                    console.log('No review ID or selected patient, initializing basic session');
                    initializeSession();
                }
            }
        };

        initializeReview();
    }, [reviewId, selectedPatient, loadReview, loadInProgressReview, initializeSession]);

    // Navigation handlers
    const handleNext = useCallback(async () => {
        // Validate current step before proceeding
        const stepErrors = validateCurrentStep();
        if (stepErrors.length > 0) {
            setSnackbarMessage(
                `Please fix the following issues before proceeding: ${stepErrors.join(', ')}`
            );
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        // Complete current step
        await completeStep(currentStep, {});

        // Move to next step
        if (currentStep < MTR_STEPS.length - 1) {
            goToStep(currentStep + 1);
        }
    }, [currentStep, completeStep, goToStep]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }, [currentStep, goToStep]);

    const handleStepClick = useCallback(
        (step: number) => {
            // Only allow navigation to completed steps or the next step
            const nextStep = getNextStep();
            if (step <= (nextStep ?? MTR_STEPS.length - 1)) {
                goToStep(step);
            }
        },
        [goToStep, getNextStep]
    );

    // Action handlers
    const handleSave = async () => {
        try {
            // Check if currentReview exists and has an ID before saving
            if (!currentReview) {
                setSnackbarMessage('Cannot save - No active review');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }

            // Check if we have a valid ID
            if (!currentReview._id || currentReview._id === '') {
                console.error('Cannot save review - ID is missing', currentReview);

                // Try to recover the ID from the URL params if available
                if (reviewId) {
                    console.log('Attempting to recover review ID from URL params:', reviewId);
                    // Update the current review with the ID from URL params
                    setCurrentReview((prev: any) => prev ? { ...prev, _id: reviewId } : null);
                    setSnackbarMessage('Recovered review ID. Trying to save again...');
                    setSnackbarSeverity('info');
                    setSnackbarOpen(true);
                    return; // Return and let user try saving again
                } else {
                    setSnackbarMessage('Cannot save review - ID is missing and cannot be recovered');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    return;
                }
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
                `Failed to save review: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleCancel = useCallback(() => {
        setShowExitDialog(true);
    }, []);

    const confirmCancel = useCallback(async () => {
        try {
            await cancelReview();
            setShowExitDialog(false);
            if (onCancel) {
                onCancel();
            } else {
                navigate('/mtr');
            }
        } catch (error) {
            console.error('Failed to cancel review:', error);
            setSnackbarMessage(
                `Failed to cancel review: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    }, [cancelReview, onCancel, navigate]);

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

        // Check if we have a valid ID
        if (!currentReview._id || currentReview._id === '') {
            console.error('Cannot complete review - ID is missing', currentReview);

            // Try to recover the ID from the URL params if available
            if (reviewId) {
                console.log('Attempting to recover review ID from URL params for completion:', reviewId);
                // Update the current review with the ID from URL params
                setCurrentReview((prev: any) => prev ? { ...prev, _id: reviewId } : null);
                setSnackbarMessage('Recovered review ID. Trying to complete again...');
                setSnackbarSeverity('info');
                setSnackbarOpen(true);
                return; // Return and let user try completing again
            } else {
                setSnackbarMessage('Cannot complete review - ID is missing and cannot be recovered');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }
        }

        try {
            // Save the review to ensure all data is up to date
            await saveReview();

            // Then complete it
            const result = await completeReview();

            if (result) {
                setSnackbarMessage('MTR completed successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                if (onComplete) {
                    onComplete(result._id);
                }
            } else {
                throw new Error('Complete operation did not return expected result');
            }
        } catch (error) {
            console.error('Failed to complete review:', error);
            setSnackbarMessage(
                `Failed to complete review: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Validation helper
    const validateCurrentStep = (): string[] => {
        switch (currentStep) {
            case 0: // Patient Selection
                return selectedPatient ? [] : ['Please select a patient'];
            case 1: // Medication History
                return medications.length > 0
                    ? []
                    : ['Please add at least one medication'];
            case 2: // Therapy Assessment
                return identifiedProblems.length > 0
                    ? []
                    : ['Please complete the therapy assessment'];
            case 3: // Plan Development
                return currentReview?.plan ? [] : ['Please create a therapy plan'];
            case 4: // Interventions
                return interventions.length > 0
                    ? []
                    : ['Please document at least one intervention'];
            case 5: // Follow-Up
                return currentReview?.followUps && currentReview.followUps.length > 0
                    ? []
                    : ['Please schedule a follow-up'];
            default:
                return [];
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
        const commonProps = {
            onNext: handleNext,
            onBack: currentStep > 0 ? handleBack : undefined,
        };

        switch (currentStep) {
            case 0: // Patient Selection
                return (
                    <PatientSelection
                        {...commonProps}
                        onPatientSelect={handlePatientSelect}
                        selectedPatient={selectedPatient ? convertStorePatientToPatient(selectedPatient) : undefined}
                    />
                );
            case 1: // Medication History
                return (
                    <MedicationHistory
                        {...commonProps}
                        patientId={selectedPatient?._id}
                        onMedicationsUpdate={handleMedicationsUpdate}
                    />
                );
            case 2: // Therapy Assessment
                return (
                    <TherapyAssessment
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
                    <PlanDevelopment
                        {...commonProps}
                        patientId={selectedPatient?._id}
                        problems={identifiedProblems}
                        onPlanCreated={handlePlanCreated}
                    />
                );
            case 4: // Interventions
                return (
                    <Interventions
                        {...commonProps}
                        reviewId={currentReview?._id}
                        patientId={selectedPatient?._id}
                        onInterventionRecorded={handleInterventionRecorded}
                    />
                );
            case 5: // Follow-Up
                return (
                    <FollowUp
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
                                        _id: selectedPatient._id,
                                        firstName: selectedPatient.firstName,
                                        lastName: selectedPatient.lastName,
                                        email: selectedPatient.email,
                                        phone: selectedPatient.phone || '',
                                        dateOfBirth: typeof selectedPatient.dateOfBirth === 'string' 
                                            ? selectedPatient.dateOfBirth 
                                            : selectedPatient.dateOfBirth.toISOString().split('T')[0],
                                        address: selectedPatient.address,
                                        medicalHistory: selectedPatient.medicalHistory?.[0],
                                        allergies: selectedPatient.allergies,
                                        emergencyContact: undefined,
                                        createdAt: selectedPatient.createdAt,
                                        updatedAt: selectedPatient.updatedAt,
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
                                        <Check color="success" />
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
                            <Timeline />
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
                                startIcon={<Save />}
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
                                startIcon={<NavigateBefore />}
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
                                    endIcon={<NavigateNext />}
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
                                    startIcon={<Check />}
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
                            <Save />
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
                            <Timeline />
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
                    currentStep={currentStep}
                />

                {/* Quick Reference for Current Step */}
                {currentStep >= 0 && currentStep < MTR_STEPS.length && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 80,
                            left: 16,
                            width: 300,
                            zIndex: 999,
                            display: { xs: 'none', md: 'block' },
                        }}
                    >
                        <QuickReference />
                    </Box>
                )}
            </Container>
        </MTRErrorBoundary>
    );
};

export default MTRDashboard;