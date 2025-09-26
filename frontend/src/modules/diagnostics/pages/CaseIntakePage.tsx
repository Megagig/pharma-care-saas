import React, { useState } from 'react';
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
  LinearProgress,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';
import { aiDiagnosticService } from '../../../services/aiDiagnosticService';
import { toast } from 'react-hot-toast';

// Use the stable version of patient store
import { usePatientStore } from '../../../stores';

// Test 2: Add back form validation
const caseIntakeSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  symptoms: z.object({
    subjective: z.string().min(1, 'Subjective symptoms are required'),
    objective: z.string().optional(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    onset: z.enum(['acute', 'chronic', 'subacute']).optional(),
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
  allergies: z.string().optional(),
  medicalHistory: z.string().min(1, 'Medical history is required'),
  labResults: z.array(z.string()).optional(),
  consent: z.boolean().refine((val) => val === true, 'Consent is required'),
});

type CaseIntakeFormData = z.infer<typeof caseIntakeSchema>;

const STEPS = [
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

const CaseIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    email: '',
  });

  // Use individual selectors to avoid object recreation
  const patients = usePatientStore((state) => state.patients);
  const loading = usePatientStore(
    (state) => state.loading.fetchPatients || false
  );
  const createLoading = usePatientStore(
    (state) => state.loading.createPatient || false
  );
  const fetchPatients = usePatientStore((state) => state.fetchPatients);
  const createPatient = usePatientStore((state) => state.createPatient);

  // Fetch patients only once when component mounts (no dependencies to avoid infinite loop)
  React.useEffect(() => {
    const loadPatients = async () => {
      try {
        await fetchPatients();
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
    loadPatients();
  }, [fetchPatients]); // Empty dependency array - only run once on mount

  // Initialize react-hook-form with zod validation
  const methods = useForm<CaseIntakeFormData>({
    resolver: zodResolver(caseIntakeSchema),
    defaultValues: {
      patientId: '',
      symptoms: {
        subjective: '',
        objective: '',
        duration: '',
        severity: 'mild',
        onset: 'acute',
      },
      vitals: {},
      currentMedications: [],
      allergies: '',
      medicalHistory: '',
      labResults: [],
      consent: false,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = methods;

  // Handle patient selection from URL parameters (when returning from patients page)
  React.useEffect(() => {
    const selectedPatientId = searchParams.get('selectedPatient');
    if (selectedPatientId) {
      if (patients.length > 0) {
        // Verify the patient exists in the loaded patients
        const patientExists = patients.some((p) => p._id === selectedPatientId);
        if (patientExists) {
          setValue('patientId', selectedPatientId, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });

          // Manually trigger validation for this field
          setTimeout(() => {
            trigger('patientId');
          }, 100);

          // Clear the URL parameter to avoid re-selecting on refresh
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('selectedPatient');
          const newUrl = `/pharmacy/diagnostics/case/new${
            newSearchParams.toString() ? '?' + newSearchParams.toString() : ''
          }`;
          navigate(newUrl, { replace: true });
        }
      }
    }
  }, [searchParams, setValue, navigate, patients, trigger]);

  // Additional effect to handle the case where URL param exists but patients aren't loaded yet
  React.useEffect(() => {
    const selectedPatientId = searchParams.get('selectedPatient');
    if (selectedPatientId && patients.length > 0 && !watch('patientId')) {
      const patientExists = patients.some((p) => p._id === selectedPatientId);
      if (patientExists) {
        setValue('patientId', selectedPatientId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });

        // Manually trigger validation for this field
        setTimeout(() => {
          trigger('patientId');
        }, 100);
      }
    }
  }, [patients, searchParams, setValue, trigger, watch]);

  const handleNext = async () => {
    // Validate current step before proceeding
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid && activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleCancel = () => {
    navigate('/diagnostics');
  };

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: CaseIntakeFormData) => {
    try {
      setSubmitting(true);

      // Show loading message with time expectation
      toast.loading(
        'Submitting case for AI analysis... This may take up to 3 minutes.',
        {
          id: 'ai-analysis-loading',
        }
      );

      // Debug: Log the form data
      console.log('Form data received:', data);

      // Transform form data to match API expectations
      const caseData = {
        patientId: data.patientId,
        symptoms: {
          subjective:
            data.symptoms?.subjective && data.symptoms.subjective.trim()
              ? data.symptoms.subjective
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
              : [],
          objective:
            data.symptoms?.objective && data.symptoms.objective.trim()
              ? data.symptoms.objective
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
              : [],
          duration: data.symptoms?.duration || undefined,
          severity: data.symptoms?.severity || undefined,
          onset: data.symptoms?.onset || undefined,
        },
        vitalSigns: {
          bloodPressure: data.vitals?.bloodPressure || undefined,
          heartRate: data.vitals?.heartRate
            ? Number(data.vitals.heartRate)
            : undefined,
          temperature: data.vitals?.temperature
            ? Number(data.vitals.temperature)
            : undefined,
          respiratoryRate: data.vitals?.respiratoryRate
            ? Number(data.vitals.respiratoryRate)
            : undefined,
          bloodGlucose: data.vitals?.bloodGlucose
            ? Number(data.vitals.bloodGlucose)
            : undefined,
        },
        currentMedications: data.currentMedications || [],
        labResults: data.labResults || [],
        patientConsent: {
          provided: true,
          method: 'electronic',
        },
      };

      // Debug: Log the transformed data
      console.log('Transformed case data:', caseData);

      // Validate required fields before submission
      if (!caseData.patientId) {
        toast.error('Patient selection is required');
        return;
      }

      if (
        !caseData.symptoms.subjective ||
        caseData.symptoms.subjective.length === 0
      ) {
        toast.error('At least one subjective symptom is required');
        return;
      }

      // Submit case for AI analysis
      const diagnosticCase = await aiDiagnosticService.submitCase(caseData);

      // Dismiss loading toast and show success message
      toast.dismiss('ai-analysis-loading');
      toast.success('AI analysis completed successfully!');

      // Navigate to results page with the completed analysis
      navigate(`/pharmacy/diagnostics/case/${diagnosticCase.id}/results`);
    } catch (error: unknown) {
      console.error('Failed to submit case:', error);

      // Dismiss loading toast
      toast.dismiss('ai-analysis-loading');

      // Extract error message
      let errorMessage = 'Failed to submit case. Please try again.';

      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'errors' in error.response.data &&
        Array.isArray(error.response.data.errors)
      ) {
        // Show specific validation errors
        const validationErrors = error.response.data.errors
          .map((err: unknown) => {
            if (err && typeof err === 'object') {
              const errObj = err as {
                path?: string;
                param?: string;
                msg?: string;
                message?: string;
              };
              return `${errObj.path || errObj.param}: ${
                errObj.msg || errObj.message
              }`;
            }
            return String(err);
          })
          .join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        const responseData = error.response.data as { message: string };
        errorMessage = responseData.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as { message: string };
        errorMessage = errorObj.message;
      }

      // Debug: Log the full error
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        console.error('Full error details:', error.response.data);
      }

      // Show error toast
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePatient = async () => {
    if (
      !newPatientData.firstName ||
      !newPatientData.lastName ||
      !newPatientData.phone ||
      !newPatientData.dateOfBirth
    ) {
      return;
    }

    const createdPatient = await createPatient(newPatientData);
    if (createdPatient) {
      // Auto-select the newly created patient
      methods.setValue('patientId', createdPatient._id);
      setCreatePatientOpen(false);
      setNewPatientData({
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        email: '',
      });
    }
  };

  const handleCloseCreatePatient = () => {
    setCreatePatientOpen(false);
    setNewPatientData({
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      email: '',
    });
  };

  // Helper function to determine which fields to validate for each step
  const getFieldsForStep = (step: number): (keyof CaseIntakeFormData)[] => {
    switch (step) {
      case 0:
        return ['patientId'];
      case 1:
        return ['symptoms'];
      case 2:
        return ['medicalHistory'];
      case 3:
        return ['consent'];
      default:
        return [];
    }
  };

  // Helper function to sort patients with selected patient first
  const getSortedPatients = () => {
    const selectedPatientId = watch('patientId');
    if (!selectedPatientId) {
      return patients;
    }

    const selectedPatient = patients.find((p) => p._id === selectedPatientId);
    const otherPatients = patients.filter((p) => p._id !== selectedPatientId);

    return selectedPatient ? [selectedPatient, ...otherPatients] : patients;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6">Patient Selection</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    fetchPatients();
                  }}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/patients?for=diagnostics')}
                  sx={{ textTransform: 'none' }}
                >
                  Select from Patients
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreatePatientOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  New Patient
                </Button>
              </Box>
            </Box>

            {watch('patientId') && (
              <Box
                sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle2"
                  color="success.dark"
                  sx={{ mb: 1 }}
                >
                  Selected Patient:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {(() => {
                    const selectedPatient = patients.find(
                      (p) => p._id === watch('patientId')
                    );
                    return selectedPatient
                      ? `${selectedPatient.firstName} ${selectedPatient.lastName} - DOB: ${selectedPatient.dateOfBirth}`
                      : 'Loading patient details...';
                  })()}
                </Typography>
              </Box>
            )}
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.patientId}>
                  <InputLabel>Select Patient</InputLabel>
                  <Select {...field} label="Select Patient" disabled={loading}>
                    {loading ? (
                      <MenuItem disabled>Loading patients...</MenuItem>
                    ) : patients.length === 0 ? (
                      <MenuItem disabled>
                        No patients found. Please add patients first.
                      </MenuItem>
                    ) : (
                      getSortedPatients().map((patient, index) => (
                        <MenuItem key={patient._id} value={patient._id}>
                          {index === 0 &&
                            watch('patientId') === patient._id && (
                              <Typography
                                component="span"
                                sx={{
                                  fontWeight: 'bold',
                                  color: 'primary.main',
                                  mr: 1,
                                }}
                              >
                                ✓
                              </Typography>
                            )}
                          {patient.firstName} {patient.lastName} - DOB:{' '}
                          {patient.dateOfBirth}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.patientId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.patientId.message}
                    </Typography>
                  )}
                  {!loading && patients.length === 0 && (
                    <Box
                      sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        No patients found. You can:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate('/patients?for=diagnostics')}
                          sx={{ textTransform: 'none' }}
                        >
                          Select from Patients
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => setCreatePatientOpen(true)}
                          sx={{ textTransform: 'none' }}
                        >
                          Create New Patient
                        </Button>
                      </Box>
                    </Box>
                  )}
                </FormControl>
              )}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Symptom Assessment
            </Typography>
            <Grid container spacing={3}>
              {/* Subjective Symptoms - Large text area at top */}
              <Grid item xs={12}>
                <Controller
                  name="symptoms.subjective"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={6}
                      label="Subjective Symptoms"
                      placeholder="Describe the patient's reported symptoms in detail..."
                      error={!!errors.symptoms?.subjective}
                      helperText={errors.symptoms?.subjective?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              {/* Objective Symptoms - Free text field below subjective */}
              <Grid item xs={12}>
                <Controller
                  name="symptoms.objective"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Objective Symptoms (Optional)"
                      placeholder="Document observable signs and clinical findings..."
                      error={!!errors.symptoms?.objective}
                      helperText={errors.symptoms?.objective?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              {/* Duration, Severity, and Onset below */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="symptoms.duration"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Duration"
                      placeholder="e.g., 3 days, 2 weeks"
                      error={!!errors.symptoms?.duration}
                      helperText={errors.symptoms?.duration?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="symptoms.severity"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Severity</InputLabel>
                      <Select {...field} label="Severity">
                        <MenuItem value="mild">Mild</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="severe">Severe</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="symptoms.onset"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Onset</InputLabel>
                      <Select {...field} label="Onset">
                        <MenuItem value="acute">Acute</MenuItem>
                        <MenuItem value="chronic">Chronic</MenuItem>
                        <MenuItem value="subacute">Subacute</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Vital Signs & Medical History
            </Typography>
            <Grid container spacing={3}>
              {/* Medical History at the top */}
              <Grid item xs={12}>
                <Controller
                  name="medicalHistory"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={6}
                      label="Medical History"
                      placeholder="Document patient's medical history, past illnesses, surgeries, family history, etc..."
                      error={!!errors.medicalHistory}
                      helperText={errors.medicalHistory?.message}
                      sx={{ mb: 3 }}
                    />
                  )}
                />
              </Grid>

              {/* Allergies as free text */}
              <Grid item xs={12}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={2}
                      label="Allergies (Optional)"
                      placeholder="List any known allergies..."
                      sx={{ mb: 3 }}
                    />
                  )}
                />
              </Grid>

              {/* Vital Signs section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Vital Signs (Optional)
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="vitals.bloodPressure"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Blood Pressure"
                      placeholder="e.g., 120/80"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="vitals.heartRate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Heart Rate (bpm)"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="vitals.temperature"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Temperature (°C)"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="vitals.bloodGlucose"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Blood Glucose (mg/dL)"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="vitals.respiratoryRate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Respiratory Rate (breaths/min)"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Review & Submit
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the information below and provide consent for AI
              analysis.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Selected Patient:</Typography>
              <Typography variant="body2" color="text.secondary">
                {watch('patientId')
                  ? (() => {
                      const selectedPatient = patients.find(
                        (p) => p._id === watch('patientId')
                      );
                      return selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName} - DOB: ${selectedPatient.dateOfBirth}`
                        : 'Patient not found';
                    })()
                  : 'None selected'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Subjective Symptoms:</Typography>
              <Typography variant="body2" color="text.secondary">
                {watch('symptoms.subjective') || 'None specified'}
              </Typography>
            </Box>

            {watch('symptoms.objective') && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Objective Symptoms:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {watch('symptoms.objective')}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Medical History:</Typography>
              <Typography variant="body2" color="text.secondary">
                {watch('medicalHistory') || 'None specified'}
              </Typography>
            </Box>

            <Controller
              name="consent"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={field.value} onChange={field.onChange} />
                  }
                  label="I consent to AI-powered diagnostic analysis of this case"
                />
              )}
            />
            {errors.consent && (
              <Typography variant="caption" color="error" display="block">
                {errors.consent.message}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <FormProvider {...methods}>
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
                  Complete the form to create a new diagnostic case
                </Typography>
              </Box>
            </Box>

            {/* Progress */}
            <LinearProgress
              variant="determinate"
              value={(activeStep / (STEPS.length - 1)) * 100}
              sx={{ mb: 2 }}
            />
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
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
                      {STEPS.map((step) => (
                        <Step key={step.label}>
                          <StepLabel>
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
                    {renderStepContent()}
                  </CardContent>

                  {/* Navigation */}
                  <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Button onClick={handleBack} disabled={activeStep === 0}>
                        Back
                      </Button>
                      {activeStep === STEPS.length - 1 ? (
                        <>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              mb: 1,
                              fontStyle: 'italic',
                            }}
                          >
                            AI analysis may take up to 60 seconds to complete
                          </Typography>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={!watch('consent') || submitting}
                          >
                            {submitting
                              ? 'Submitting for AI Analysis...'
                              : 'Submit for AI Analysis'}
                          </Button>
                        </>
                      ) : (
                        <Button variant="contained" onClick={handleNext}>
                          Next
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </form>
        </Container>
      </FormProvider>

      {/* Create Patient Dialog */}
      <Dialog
        open={createPatientOpen}
        onClose={handleCloseCreatePatient}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Patient</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={newPatientData.firstName}
                  onChange={(e) =>
                    setNewPatientData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={newPatientData.lastName}
                  onChange={(e) =>
                    setNewPatientData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newPatientData.phone}
                  onChange={(e) =>
                    setNewPatientData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={newPatientData.dateOfBirth}
                  onChange={(e) =>
                    setNewPatientData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email (Optional)"
                  type="email"
                  value={newPatientData.email}
                  onChange={(e) =>
                    setNewPatientData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreatePatient}>Cancel</Button>
          <Button
            onClick={handleCreatePatient}
            variant="contained"
            disabled={
              createLoading ||
              !newPatientData.firstName ||
              !newPatientData.lastName ||
              !newPatientData.phone ||
              !newPatientData.dateOfBirth
            }
          >
            {createLoading ? 'Creating...' : 'Create Patient'}
          </Button>
        </DialogActions>
      </Dialog>
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
