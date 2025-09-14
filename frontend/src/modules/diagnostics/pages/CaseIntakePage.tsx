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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';

// Use the stable version of patient store
import { usePatientStore } from '../../../stores';

// Test 2: Add back form validation
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
  const [activeStep, setActiveStep] = useState(0);

  // Use individual selectors to avoid object recreation
  const patients = usePatientStore((state) => state.patients);
  const loading = usePatientStore(
    (state) => state.loading.fetchPatients || false
  );

  const fetchPatients = usePatientStore((state) => state.fetchPatients);

  // Fetch patients when component mounts
  React.useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Initialize react-hook-form with zod validation
  const methods = useForm<CaseIntakeFormData>({
    resolver: zodResolver(caseIntakeSchema),
    defaultValues: {
      patientId: '',
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
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = methods;

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

  const onSubmit = (data: CaseIntakeFormData) => {
    console.log('Form submitted:', data);
    // TODO: Submit to API
    navigate('/diagnostics');
  };

  // Helper function to determine which fields to validate for each step
  const getFieldsForStep = (step: number): (keyof CaseIntakeFormData)[] => {
    switch (step) {
      case 0:
        return ['patientId'];
      case 1:
        return ['symptoms'];
      case 2:
        return ['vitals', 'currentMedications', 'allergies', 'medicalHistory'];
      case 3:
        return ['consent'];
      default:
        return [];
    }
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
              <Button
                size="small"
                onClick={() => fetchPatients()}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Loading...' : 'Refresh Patients'}
              </Button>
            </Box>
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
                      patients.map((patient) => (
                        <MenuItem key={patient._id} value={patient._id}>
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      You need to add patients before creating a diagnostic
                      case.{' '}
                      <Button
                        size="small"
                        onClick={() => navigate('/patients')}
                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                      >
                        Go to Patients
                      </Button>
                    </Typography>
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
              <Grid item xs={12}>
                <Controller
                  name="symptoms.subjective"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[
                        'Headache',
                        'Fever',
                        'Cough',
                        'Fatigue',
                        'Nausea',
                        'Chest pain',
                        'Shortness of breath',
                        'Dizziness',
                      ]}
                      value={field.value}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Subjective Symptoms"
                          placeholder="Type or select symptoms"
                          error={!!errors.symptoms?.subjective}
                          helperText={errors.symptoms?.subjective?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Vital Signs
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
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || undefined)
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
                      label="Temperature (°F)"
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || undefined)
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, mt: 2 }}>
                  Medical History
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={['Penicillin', 'Peanuts', 'Shellfish', 'Latex']}
                      value={field.value || []}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Allergies"
                          placeholder="Type or select allergies"
                        />
                      )}
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
              <Typography variant="subtitle2">Symptoms:</Typography>
              <Typography variant="body2" color="text.secondary">
                {watch('symptoms.subjective')?.join(', ') || 'None specified'}
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
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={!watch('consent')}
                        >
                          Submit Case
                        </Button>
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
