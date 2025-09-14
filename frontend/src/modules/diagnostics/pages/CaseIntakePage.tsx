import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import components
import {
  SymptomInput,
  VitalSignsInput,
  MedicationHistoryInput,
  AllergyInput,
} from '../components';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

// Import hooks and stores
import {
  useCreateDiagnosticRequest,
  useDiagnosticResult,
} from '../hooks/useDiagnostics';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { usePatients } from '../../../stores';

// Import types
import type { DiagnosticRequestForm } from '../types';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';

// Validation schema
const caseIntakeSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  symptoms: z.object({
    subjective: z.array(z.string()).min(1, 'At least one symptom is required'),
    objective: z.array(z.string()),
    duration: z.string().min(1, 'Duration is required'),
    severity: z.enum(['mild', 'moderate', 'severe']),
    onset: z.enum(['acute', 'chronic', 'subacute']),
  }),
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      bloodGlucose: z.number().optional(),
      respiratoryRate: z.number().optional(),
    })
    .optional(),
  currentMedications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
      })
    )
    .optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  labResults: z.array(z.string()).optional(),
  consent: z.boolean().refine((val) => val === true, 'Consent is required'),
});

type CaseIntakeFormData = z.infer<typeof caseIntakeSchema>;

const steps = [
  {
    label: 'Patient Selection',
    description: 'Select the patient for this diagnostic case',
  },
  {
    label: 'Symptom Assessment',
    description: 'Document patient symptoms and clinical findings',
  },
  {
    label: 'Vital Signs & History',
    description: 'Record vital signs, medications, and medical history',
  },
  {
    label: 'Review & Consent',
    description: 'Review information and obtain AI analysis consent',
  },
];

interface PatientSelectionStepProps {
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  error?: string;
}

const PatientSelectionStep: React.FC<PatientSelectionStepProps> = ({
  selectedPatientId,
  onPatientSelect,
  error,
}) => {
  const { patients, loading } = usePatients();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select Patient
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Typography>Loading patients...</Typography>
          </Grid>
        ) : patients.length > 0 ? (
          patients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} key={patient._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedPatientId === patient._id ? 2 : 1,
                  borderColor:
                    selectedPatientId === patient._id
                      ? 'primary.main'
                      : 'divider',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => onPatientSelect(patient._id)}
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    DOB: {patient.dateOfBirth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {patient._id.slice(-8)}
                  </Typography>
                  {selectedPatientId === patient._id && (
                    <Chip
                      label="Selected"
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No patients found. Please add patients first.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

interface ConsentDialogProps {
  open: boolean;
  onClose: () => void;
  onConsent: (consented: boolean) => void;
  patientName?: string;
}

const ConsentDialog: React.FC<ConsentDialogProps> = ({
  open,
  onClose,
  onConsent,
  patientName,
}) => {
  const [consented, setConsented] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
          AI Diagnostic Analysis Consent
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This diagnostic analysis will use AI assistance to help generate
            differential diagnoses and treatment recommendations. The AI
            analysis is for clinical decision support only and requires
            pharmacist review and approval.
          </Typography>
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Patient Consent for AI Analysis
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Patient: <strong>{patientName || 'Selected Patient'}</strong>
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            By proceeding with AI analysis, you confirm that:
          </Typography>
          <ul>
            <li>
              The patient has been informed about the use of AI in their
              diagnostic assessment
            </li>
            <li>
              The patient understands that AI recommendations require pharmacist
              review
            </li>
            <li>
              The patient consents to their clinical data being processed for
              diagnostic analysis
            </li>
            <li>
              All AI recommendations will be reviewed by a licensed pharmacist
              before implementation
            </li>
          </ul>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
            />
          }
          label="I confirm that appropriate patient consent has been obtained for AI diagnostic analysis"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConsent(consented)}
          disabled={!consented}
        >
          Proceed with Analysis
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CaseIntakePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId?: string }>();

  // Local state
  const [activeStep, setActiveStep] = useState(0);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Store state
  const { setActiveStep: setStoreActiveStep } = useDiagnosticStore();
  const { patients } = usePatients();

  // Form setup
  const methods = useForm<CaseIntakeFormData>({
    resolver: zodResolver(caseIntakeSchema),
    defaultValues: {
      patientId: patientId || '',
      symptoms: {
        subjective: [],
        objective: [],
        duration: '',
        severity: 'mild',
        onset: 'acute',
      },
      vitals: {},
      currentMedications: [],
      allergies: [],
      medicalHistory: [],
      labResults: [],
      consent: false,
    },
    mode: 'onChange',
  });

  const {
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = methods;
  const watchedValues = watch();

  // Mutations
  const createRequestMutation = useCreateDiagnosticRequest();

  // Auto-save functionality
  const saveDraft = useCallback(() => {
    if (autoSaveEnabled) {
      const formData = getValues();
      localStorage.setItem('diagnostic-draft', JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }
  }, [getValues, autoSaveEnabled]);

  // Auto-save on form changes
  // useEffect(() => {
  //   const subscription = watch(() => {
  //     if (activeStep > 0) {
  //       // Don't auto-save on patient selection step
  //       saveDraft();
  //     }
  //   });
  //   return () => subscription.unsubscribe();
  // }, [watch, saveDraft, activeStep]);

  // Load draft on mount
  // useEffect(() => {
  //   const savedDraft = localStorage.getItem('diagnostic-draft');
  //   if (savedDraft) {
  //     try {
  //       const draftData = JSON.parse(savedDraft);
  //       Object.keys(draftData).forEach((key) => {
  //         setValue(key as keyof CaseIntakeFormData, draftData[key]);
  //       });
  //     } catch (error) {
  //       console.error('Failed to load draft:', error);
  //     }
  //   }
  // }, [setValue]);

  // Sync with store
  // useEffect(() => {
  //   setStoreActiveStep(activeStep);
  // }, [activeStep, setStoreActiveStep]);

  // Handlers
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePatientSelect = (selectedPatientId: string) => {
    setValue('patientId', selectedPatientId);
  };

  const handleSubmit = () => {
    setConsentDialogOpen(true);
  };

  const handleConsent = async (consented: boolean) => {
    setConsentDialogOpen(false);

    if (!consented) {
      return;
    }

    setValue('consent', true);

    try {
      const formData = getValues();
      const result = await createRequestMutation.mutateAsync(formData);

      if (result) {
        // Clear draft
        localStorage.removeItem('diagnostic-draft');

        // Navigate to results page
        navigate(`/diagnostics/case/${result._id}`);
      }
    } catch (error) {
      console.error('Failed to create diagnostic request:', error);
    }
  };

  const handleCancel = () => {
    navigate('/diagnostics');
  };

  const clearDraft = () => {
    localStorage.removeItem('diagnostic-draft');
    methods.reset();
    setActiveStep(0);
  };

  // Get current step validation
  const getStepValid = (step: number) => {
    switch (step) {
      case 0:
        return !!watchedValues.patientId && !errors.patientId;
      case 1:
        return (
          watchedValues.symptoms.subjective.length > 0 &&
          !!watchedValues.symptoms.duration &&
          !errors.symptoms
        );
      case 2:
        return true; // Optional step
      case 3:
        return isValid;
      default:
        return false;
    }
  };

  const selectedPatient = null;

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                New Diagnostic Case
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Step-by-step patient assessment and AI diagnostic analysis
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {draftSaved && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Draft Saved"
                  color="success"
                  size="small"
                />
              )}
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={saveDraft}
                size="small"
              >
                Save Draft
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={clearDraft}
                size="small"
                color="error"
              >
                Clear
              </Button>
            </Box>
          </Box>

          {/* Progress */}
          <LinearProgress
            variant="determinate"
            value={(activeStep / (steps.length - 1)) * 100}
            sx={{ mb: 2 }}
          />
        </Box>

        <FormProvider {...methods}>
          <Grid container spacing={4}>
            {/* Stepper */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 24 }}>
                <CardContent>
                  <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    sx={{
                      '& .MuiStepContent-root': {
                        borderLeft: 'none',
                        pl: 0,
                        ml: 2,
                      },
                    }}
                  >
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel
                          optional={
                            index === 2 ? (
                              <Typography variant="caption">
                                Optional
                              </Typography>
                            ) : null
                          }
                        >
                          <Typography variant="subtitle2">
                            {step.label}
                          </Typography>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary">
                            {step.description}
                          </Typography>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>
            </Grid>

            {/* Step Content */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ minHeight: 400 }}>
                  {activeStep === 0 && (
                    <PatientSelectionStep
                      selectedPatientId={watchedValues.patientId}
                      onPatientSelect={handlePatientSelect}
                      error={errors.patientId?.message}
                    />
                  )}

                  {activeStep === 1 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Symptom Assessment
                      </Typography>
                      {selectedPatient && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          Patient: {selectedPatient.firstName}{' '}
                          {selectedPatient.lastName}
                        </Alert>
                      )}
                      <SymptomInput
                        value={watchedValues.symptoms}
                        onChange={(symptoms) => setValue('symptoms', symptoms)}
                        error={errors.symptoms?.message}
                      />
                    </Box>
                  )}

                  {activeStep === 2 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3 }}>
                        Vital Signs & Medical History
                      </Typography>

                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          Vital Signs
                        </Typography>
                        <VitalSignsInput
                          value={watchedValues.vitals}
                          onChange={(vitals) => setValue('vitals', vitals)}
                          error={errors.vitals?.message}
                        />
                      </Box>

                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          Current Medications
                        </Typography>
                        <MedicationHistoryInput
                          value={watchedValues.currentMedications}
                          onChange={(medications) =>
                            setValue('currentMedications', medications)
                          }
                          error={errors.currentMedications?.message}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          Allergies
                        </Typography>
                        <AllergyInput
                          value={watchedValues.allergies}
                          onChange={(allergies) =>
                            setValue('allergies', allergies)
                          }
                          error={errors.allergies?.message}
                        />
                      </Box>
                    </Box>
                  )}

                  {activeStep === 3 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3 }}>
                        Review & Submit
                      </Typography>

                      {selectedPatient && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Patient: {selectedPatient.firstName}{' '}
                            {selectedPatient.lastName}
                          </Typography>
                          <Typography variant="body2">
                            This case will be processed using AI diagnostic
                            analysis. Results will require pharmacist review
                            before implementation.
                          </Typography>
                        </Alert>
                      )}

                      {/* Summary */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Case Summary
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Primary Symptoms:
                            </Typography>
                            <Typography variant="body2">
                              {watchedValues.symptoms.subjective
                                .slice(0, 3)
                                .join(', ')}
                              {watchedValues.symptoms.subjective.length > 3 &&
                                '...'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Duration & Severity:
                            </Typography>
                            <Typography variant="body2">
                              {watchedValues.symptoms.duration} -{' '}
                              {watchedValues.symptoms.severity}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Current Medications:
                            </Typography>
                            <Typography variant="body2">
                              {watchedValues.currentMedications?.length || 0}{' '}
                              medications
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Known Allergies:
                            </Typography>
                            <Typography variant="body2">
                              {watchedValues.allergies?.length || 0} allergies
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>Important:</strong> AI analysis requires
                          patient consent and pharmacist review. Ensure
                          appropriate consent has been obtained before
                          proceeding.
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </CardContent>

                {/* Navigation */}
                <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Button onClick={handleBack} disabled={activeStep === 0}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={
                        !getStepValid(activeStep) ||
                        createRequestMutation.isPending
                      }
                      startIcon={
                        activeStep === steps.length - 1 ? <SendIcon /> : null
                      }
                    >
                      {createRequestMutation.isPending
                        ? 'Processing...'
                        : activeStep === steps.length - 1
                          ? 'Submit for Analysis'
                          : 'Next'}
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </FormProvider>

        {/* Consent Dialog */}
        <ConsentDialog
          open={consentDialogOpen}
          onClose={() => setConsentDialogOpen(false)}
          onConsent={handleConsent}
          patientName={
            selectedPatient
              ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
              : undefined
          }
        />
      </Container>
    </ErrorBoundary>
  );
};

// Wrap with feature guard
const CaseIntakePageWithGuard: React.FC = () => (
  <DiagnosticFeatureGuard>
    <CaseIntakePage />
  </DiagnosticFeatureGuard>
);

export default CaseIntakePageWithGuard;
