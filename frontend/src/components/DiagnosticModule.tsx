import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon,
  HealthAndSafety as HealthIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { usePatients, useSearchPatients } from '../queries/usePatients';
import type { Patient } from '../types/patientManagement';
import { Autocomplete } from '@mui/material';
import { apiHelpers } from '../services/api';

interface Symptom {
  type: 'subjective' | 'objective';
  description: string;
}

interface LabResult {
  testName: string;
  value: string;
  referenceRange: string;
  abnormal: boolean;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
}

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

interface ValidationError {
  field: string;
  message: string;
}

interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
  completedSections: number;
  totalSections: number;
}

interface DiagnosticAnalysis {
  caseId: string;
  analysis: {
    differentialDiagnoses: Array<{
      condition: string;
      probability: number;
      reasoning: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendedTests: Array<{
      testName: string;
      priority: 'urgent' | 'routine' | 'optional';
      reasoning: string;
    }>;
    therapeuticOptions: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      reasoning: string;
      safetyNotes: string[];
    }>;
    redFlags: Array<{
      flag: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      action: string;
    }>;
    referralRecommendation?: {
      recommended: boolean;
      urgency: 'immediate' | 'within_24h' | 'routine';
      specialty: string;
      reason: string;
    };
    disclaimer: string;
    confidenceScore: number;
  };
  drugInteractions: unknown[];
  processingTime: number;
}

const DiagnosticModule: React.FC = () => {
  const { user } = useAuth();
  const { hasFeature } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DiagnosticAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentDialog, setConsentDialog] = useState(false);
  const [patientConsent, setPatientConsent] = useState(false);

  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientObject, setSelectedPatientObject] =
    useState<Patient | null>(null);

  // Load patients for dropdown and search
  const { data: patientsData, isLoading: patientsLoading } = usePatients({
    limit: 100,
  });
  const { data: searchData, isLoading: searchLoading } =
    useSearchPatients(patientSearchQuery);

  const patients = patientsData?.data?.results || [];
  const searchResults = searchData?.data?.results || [];

  // Combine regular patients with search results
  const availablePatients =
    patientSearchQuery.length >= 2 ? searchResults : patients;

  // Form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { type: 'subjective', description: '' },
  ]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>(
    'mild'
  );
  const [onset, setOnset] = useState<'acute' | 'chronic' | 'subacute'>('acute');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Check feature access - super_admin bypasses feature flag checks
  const isSuperAdmin = user?.role === 'super_admin';
  const hasAccess = isSuperAdmin || hasFeature('clinical_decision_support');

  // Validation functions
  const validateBloodPressure = (bp: string): string | null => {
    if (!bp) return null;
    const bpPattern = /^\d{2,3}\/\d{2,3}$|^\d{2,3}$|^\d{2,3}\/\d{2,3}\s*mmHg$/;
    if (!bpPattern.test(bp)) {
      return 'Invalid format. Use: 120/80, 120, or 120/80 mmHg';
    }
    return null;
  };

  const validateHeartRate = (hr: number): string | null => {
    if (!hr) return null;
    if (hr < 30 || hr > 250) {
      return 'Heart rate must be between 30-250 bpm';
    }
    return null;
  };

  const validateTemperature = (temp: number): string | null => {
    if (!temp) return null;
    if (temp < 30 || temp > 45) {
      return 'Temperature must be between 30-45°C';
    }
    return null;
  };

  const validateRespiratoryRate = (rr: number): string | null => {
    if (!rr) return null;
    if (rr < 5 || rr > 100) {
      return 'Respiratory rate must be between 5-100 breaths/min';
    }
    return null;
  };

  const validateOxygenSaturation = (spo2: number): string | null => {
    if (!spo2) return null;
    if (spo2 < 50 || spo2 > 100) {
      return 'Oxygen saturation must be between 50-100%';
    }
    return null;
  };

  const validateDuration = (duration: string): string | null => {
    if (!duration) return null;
    if (duration.length < 1 || duration.length > 100) {
      return 'Duration must be between 1-100 characters';
    }
    // Check if it contains both number and time unit
    const durationPattern = /\d+\s*(day|week|month|year|hour|minute|second)/i;
    if (!durationPattern.test(duration)) {
      return 'Duration should include number and time unit (e.g., "3 days", "2 weeks")';
    }
    return null;
  };

  const validateSymptomDescription = (description: string): string | null => {
    if (!description) return 'Symptom description is required';
    if (description.length < 3) {
      return 'Symptom description must be at least 3 characters';
    }
    return null;
  };

  // Form validation
  const formValidation = useMemo((): FormValidation => {
    const errors: ValidationError[] = [];
    let completedSections = 0;
    const totalSections = 6;

    // 1. Patient Selection
    if (!selectedPatient) {
      errors.push({ field: 'patient', message: 'Patient selection is required' });
    } else {
      completedSections++;
    }

    // 2. Symptoms
    const validSubjectiveSymptoms = symptoms
      .filter(s => s.type === 'subjective' && s.description.trim().length >= 3);
    
    if (validSubjectiveSymptoms.length === 0) {
      errors.push({ field: 'symptoms', message: 'At least one subjective symptom (3+ characters) is required' });
    } else {
      completedSections++;
    }

    // Validate individual symptoms
    symptoms.forEach((symptom, index) => {
      if (symptom.description && touchedFields.has(`symptom-${index}`)) {
        const error = validateSymptomDescription(symptom.description);
        if (error) {
          errors.push({ field: `symptom-${index}`, message: error });
        }
      }
    });

    // 3. Clinical Details (optional but if provided, should be valid)
    let clinicalDetailsValid = true;
    if (duration && touchedFields.has('duration')) {
      const durationError = validateDuration(duration);
      if (durationError) {
        errors.push({ field: 'duration', message: durationError });
        clinicalDetailsValid = false;
      }
    }
    if (clinicalDetailsValid) completedSections++;

    // 4. Vital Signs (optional but if provided, should be valid)
    let vitalSignsValid = true;
    
    if (vitalSigns.bloodPressure && touchedFields.has('bloodPressure')) {
      const bpError = validateBloodPressure(vitalSigns.bloodPressure);
      if (bpError) {
        errors.push({ field: 'bloodPressure', message: bpError });
        vitalSignsValid = false;
      }
    }

    if (vitalSigns.heartRate && touchedFields.has('heartRate')) {
      const hrError = validateHeartRate(vitalSigns.heartRate);
      if (hrError) {
        errors.push({ field: 'heartRate', message: hrError });
        vitalSignsValid = false;
      }
    }

    if (vitalSigns.temperature && touchedFields.has('temperature')) {
      const tempError = validateTemperature(vitalSigns.temperature);
      if (tempError) {
        errors.push({ field: 'temperature', message: tempError });
        vitalSignsValid = false;
      }
    }

    if (vitalSigns.respiratoryRate && touchedFields.has('respiratoryRate')) {
      const rrError = validateRespiratoryRate(vitalSigns.respiratoryRate);
      if (rrError) {
        errors.push({ field: 'respiratoryRate', message: rrError });
        vitalSignsValid = false;
      }
    }

    if (vitalSigns.oxygenSaturation && touchedFields.has('oxygenSaturation')) {
      const spo2Error = validateOxygenSaturation(vitalSigns.oxygenSaturation);
      if (spo2Error) {
        errors.push({ field: 'oxygenSaturation', message: spo2Error });
        vitalSignsValid = false;
      }
    }

    if (vitalSignsValid) completedSections++;

    // 5. Lab Results (always valid for now)
    completedSections++;

    // 6. Medications (always valid for now)
    completedSections++;

    return {
      isValid: errors.length === 0 && selectedPatient !== '' && validSubjectiveSymptoms.length > 0,
      errors,
      completedSections,
      totalSections
    };
  }, [selectedPatient, symptoms, duration, vitalSigns, touchedFields]);

  // Update validation errors when form validation changes
  useEffect(() => {
    setValidationErrors(formValidation.errors);
  }, [formValidation.errors]);

  const markFieldAsTouched = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const getFieldError = (fieldName: string): string | null => {
    const error = validationErrors.find(e => e.field === fieldName);
    return error ? error.message : null;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(e => e.field === fieldName);
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Clinical Decision Support feature is not available in your current
            plan. Please upgrade to access AI-powered diagnostic assistance.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const addSymptom = (type: 'subjective' | 'objective') => {
    setSymptoms([...symptoms, { type, description: '' }]);
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const updateSymptom = (index: number, description: string) => {
    const updated = [...symptoms];
    updated[index].description = description;
    setSymptoms(updated);
  };

  const addLabResult = () => {
    setLabResults([
      ...labResults,
      { testName: '', value: '', referenceRange: '', abnormal: false },
    ]);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', startDate: '' },
    ]);
  };

  const handleAnalysis = async () => {
    if (!patientConsent) {
      setConsentDialog(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiHelpers.post('/diagnostics/ai', {
        patientId: selectedPatient,
        symptoms: {
          subjective: symptoms
            .filter((s) => s.type === 'subjective')
            .map((s) => s.description)
            .filter(Boolean),
          objective: symptoms
            .filter((s) => s.type === 'objective')
            .map((s) => s.description)
            .filter(Boolean),
          duration,
          severity,
          onset,
        },
        labResults: labResults.filter((lr) => lr.testName && lr.value),
        currentMedications: medications.filter((m) => m.name && m.dosage),
        vitalSigns,
        patientConsent: {
          provided: true,
          method: 'electronic',
        },
      });

      setAnalysis(response.data.data);
      setActiveTab(1); // Switch to results tab
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderInputForm = () => (
    <Box sx={{ '& > *': { mb: 4 } }}>
      {/* Progress Indicator */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 2,
          bgcolor: 'primary.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={600} color="primary.dark">
            Form Completion Progress
          </Typography>
          <Chip
            label={`${formValidation.completedSections}/${formValidation.totalSections} sections`}
            color="primary"
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={(formValidation.completedSections / formValidation.totalSections) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'primary.100',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Complete all required sections to enable AI analysis
        </Typography>
      </Card>

      {/* Patient Selection Section */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: hasFieldError('patient') ? 'error.main' : selectedPatient ? 'success.main' : 'divider',
          borderRadius: 2,
          bgcolor: selectedPatient ? 'success.50' : 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <HospitalIcon color={selectedPatient ? 'success' : 'primary'} />
          <Typography variant="h6" fontWeight={600}>
            Patient Selection
          </Typography>
          {selectedPatient && <CheckCircleIcon color="success" fontSize="small" />}
          <Chip
            label="Required"
            color="error"
            size="small"
            variant="outlined"
          />
        </Box>
        <Autocomplete
          fullWidth
          options={availablePatients}
          getOptionLabel={(patient: Patient) =>
            `${patient.displayName || `${patient.firstName} ${patient.lastName}`} - ${patient.mrn}${patient.age ? ` (${patient.age} years)` : ''}`
          }
          value={selectedPatientObject}
          onChange={(_, newValue) => {
            setSelectedPatientObject(newValue);
            setSelectedPatient(newValue ? newValue._id : '');
            markFieldAsTouched('patient');
          }}
          inputValue={patientSearchQuery}
          onInputChange={(_, newInputValue) => {
            setPatientSearchQuery(newInputValue);
          }}
          loading={patientsLoading || searchLoading}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search and Select Patient"
              placeholder="Type patient name, MRN, or phone number..."
              required
              error={hasFieldError('patient')}
              helperText={getFieldError('patient') || 'Select a patient to proceed with analysis'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                },
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {patientsLoading || searchLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, patient: Patient) => (
            <Box component="li" {...props}>
              <Box>
                <Typography variant="body1">
                  {patient.displayName ||
                    `${patient.firstName} ${patient.lastName}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  MRN: {patient.mrn} {patient.age && `• Age: ${patient.age}`}{' '}
                  {patient.phone && `• ${patient.phone}`}
                </Typography>
              </Box>
            </Box>
          )}
          noOptionsText={
            patientSearchQuery.length < 2
              ? 'Type at least 2 characters to search patients'
              : 'No patients found'
          }
        />
        {availablePatients.length === 0 &&
          !patientsLoading &&
          !searchLoading &&
          patientSearchQuery.length < 2 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              No patients found. Please add patients to the system first.
            </Typography>
          )}
      </Card>

      {/* Symptoms Section */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: hasFieldError('symptoms') ? 'error.main' : 
            symptoms.filter(s => s.type === 'subjective' && s.description.length >= 3).length > 0 ? 'success.main' : 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ScienceIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Symptoms & Clinical Findings
          </Typography>
          {symptoms.filter(s => s.type === 'subjective' && s.description.length >= 3).length > 0 && 
            <CheckCircleIcon color="success" fontSize="small" />
          }
          <Chip
            label="Required"
            color="error"
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Symptoms Counter */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
          <Typography variant="body2" color="info.dark" fontWeight={600}>
            Subjective Symptoms: {symptoms.filter(s => s.type === 'subjective' && s.description.length >= 3).length}/1 required
          </Typography>
          <Typography variant="caption" color="text.secondary">
            At least one subjective symptom with 3+ characters is required
          </Typography>
        </Box>

        {hasFieldError('symptoms') && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {getFieldError('symptoms')}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          {symptoms.map((symptom, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: hasFieldError(`symptom-${index}`) ? 'error.main' :
                  symptom.type === 'subjective' ? 'primary.light' : 'secondary.light',
                borderRadius: 2,
                bgcolor: symptom.type === 'subjective' ? 'primary.50' : 'secondary.50',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Chip
                  label={symptom.type === 'subjective' ? 'Subjective' : 'Objective'}
                  color={symptom.type === 'subjective' ? 'primary' : 'secondary'}
                  size="small"
                  sx={{ minWidth: 100, mt: 1 }}
                />
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder={`Enter ${symptom.type} symptom (minimum 3 characters)`}
                    value={symptom.description}
                    onChange={(e) => {
                      updateSymptom(index, e.target.value);
                      markFieldAsTouched(`symptom-${index}`);
                    }}
                    onBlur={() => markFieldAsTouched(`symptom-${index}`)}
                    variant="outlined"
                    size="small"
                    error={hasFieldError(`symptom-${index}`)}
                    helperText={getFieldError(`symptom-${index}`) || 
                      `${symptom.description.length} characters (minimum 3 required)`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                </Box>
                <IconButton 
                  onClick={() => removeSymptom(index)} 
                  size="small"
                  sx={{
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.50' },
                    mt: 1,
                  }}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('subjective')}
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Add Subjective
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('objective')}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: 2 }}
          >
            Add Objective
          </Button>
        </Box>
      </Card>

      {/* Clinical Details Section */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: hasFieldError('duration') ? 'error.main' : 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Clinical Details
          </Typography>
          <Chip
            label="Optional"
            color="info"
            size="small"
            variant="outlined"
          />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Duration"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                markFieldAsTouched('duration');
              }}
              onBlur={() => markFieldAsTouched('duration')}
              placeholder="e.g., 3 days, 2 weeks, 1 month"
              error={hasFieldError('duration')}
              helperText={getFieldError('duration') || 
                'Include number and time unit (1-100 characters)'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="mild">Mild</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="severe">Severe</MenuItem>
              </Select>
              <FormHelperText>Select symptom severity level</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Onset</InputLabel>
              <Select
                value={onset}
                onChange={(e) => setOnset(e.target.value as 'acute' | 'chronic' | 'subacute')}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="acute">Acute</MenuItem>
                <MenuItem value="chronic">Chronic</MenuItem>
                <MenuItem value="subacute">Subacute</MenuItem>
              </Select>
              <FormHelperText>Select symptom onset type</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Vital Signs Section */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: ['bloodPressure', 'heartRate', 'temperature', 'respiratoryRate', 'oxygenSaturation']
            .some(field => hasFieldError(field)) ? 'error.main' : 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <HealthIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Vital Signs
          </Typography>
          <Chip
            label="Optional"
            color="info"
            size="small"
            variant="outlined"
          />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Blood Pressure"
              value={vitalSigns.bloodPressure || ''}
              onChange={(e) => {
                setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value });
                markFieldAsTouched('bloodPressure');
              }}
              onBlur={() => markFieldAsTouched('bloodPressure')}
              placeholder="120/80"
              error={hasFieldError('bloodPressure')}
              helperText={getFieldError('bloodPressure') || 
                'Format: 120/80, 120, or 120/80 mmHg'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Heart Rate"
              type="number"
              value={vitalSigns.heartRate || ''}
              onChange={(e) => {
                setVitalSigns({
                  ...vitalSigns,
                  heartRate: Number(e.target.value),
                });
                markFieldAsTouched('heartRate');
              }}
              onBlur={() => markFieldAsTouched('heartRate')}
              placeholder="BPM"
              error={hasFieldError('heartRate')}
              helperText={getFieldError('heartRate') || 
                'Range: 30-250 bpm'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Temperature"
              type="number"
              value={vitalSigns.temperature || ''}
              onChange={(e) => {
                setVitalSigns({
                  ...vitalSigns,
                  temperature: Number(e.target.value),
                });
                markFieldAsTouched('temperature');
              }}
              onBlur={() => markFieldAsTouched('temperature')}
              placeholder="°C"
              error={hasFieldError('temperature')}
              helperText={getFieldError('temperature') || 
                'Range: 30-45°C'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="O2 Saturation"
              type="number"
              value={vitalSigns.oxygenSaturation || ''}
              onChange={(e) => {
                setVitalSigns({
                  ...vitalSigns,
                  oxygenSaturation: Number(e.target.value),
                });
                markFieldAsTouched('oxygenSaturation');
              }}
              onBlur={() => markFieldAsTouched('oxygenSaturation')}
              placeholder="%"
              error={hasFieldError('oxygenSaturation')}
              helperText={getFieldError('oxygenSaturation') || 
                'Range: 50-100%'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Generate Analysis Button */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, gap: 2 }}>
        {!formValidation.isValid && (
          <Alert severity="warning" sx={{ borderRadius: 2, maxWidth: 600 }}>
            <Typography variant="subtitle2" gutterBottom>
              Complete Required Fields:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {!selectedPatient && <li>Select a patient</li>}
              {symptoms.filter(s => s.type === 'subjective' && s.description.length >= 3).length === 0 && 
                <li>Add at least one subjective symptom (3+ characters)</li>}
              {formValidation.errors.filter(e => !['patient', 'symptoms'].includes(e.field)).map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </Box>
          </Alert>
        )}
        
        <Button
          variant="contained"
          size="large"
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />
          }
          onClick={handleAnalysis}
          disabled={loading || !formValidation.isValid}
          sx={{
            px: 6,
            py: 2,
            borderRadius: 3,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: loading || !formValidation.isValid
              ? 'grey.400' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: loading || !formValidation.isValid
              ? 'none' 
              : '0 8px 32px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: loading || !formValidation.isValid
                ? 'grey.400' 
                : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: loading || !formValidation.isValid ? 'none' : 'translateY(-2px)',
              boxShadow: loading || !formValidation.isValid
                ? 'none' 
                : '0 12px 40px rgba(102, 126, 234, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {loading ? 'Generating Analysis...' : 'Generate AI Analysis'}
        </Button>
        
        {formValidation.isValid && (
          <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon fontSize="small" />
            All required fields completed - Ready for analysis
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <Box>
        {/* Analysis Summary Card */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            border: '1px solid',
            borderColor: 'success.light',
            borderRadius: 2,
            bgcolor: 'success.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VerifiedIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} color="success.dark">
                Analysis Complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing time: {analysis.processingTime}ms • Confidence: {analysis.analysis.confidenceScore}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`${analysis.analysis.differentialDiagnoses.length} Diagnoses`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${analysis.analysis.recommendedTests.length} Tests`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`${analysis.analysis.therapeuticOptions.length} Treatments`}
              color="info"
              variant="outlined"
            />
            {analysis.analysis.redFlags.length > 0 && (
              <Chip
                label={`${analysis.analysis.redFlags.length} Red Flags`}
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Card>

        {/* Differential Diagnoses */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Accordion defaultExpanded elevation={0}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HospitalIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Differential Diagnoses
                </Typography>
                <Chip 
                  label={analysis.analysis.differentialDiagnoses.length} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {analysis.analysis.differentialDiagnoses.map((diagnosis, index) => (
                <Card
                  key={index}
                  elevation={0}
                  sx={{
                    m: 2,
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                      {diagnosis.condition}
                    </Typography>
                    <Chip
                      label={`${diagnosis.probability}%`}
                      color={
                        diagnosis.probability > 70
                          ? 'error'
                          : diagnosis.probability > 40
                            ? 'warning'
                            : 'success'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={diagnosis.severity}
                      color={
                        diagnosis.severity === 'high'
                          ? 'error'
                          : diagnosis.severity === 'medium'
                            ? 'warning'
                            : 'info'
                      }
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {diagnosis.reasoning}
                  </Typography>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Red Flags */}
        {analysis.analysis.redFlags.length > 0 && (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: 'error.light',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Accordion elevation={0}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: 'error.50',
                  '&:hover': { bgcolor: 'error.100' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon color="error" />
                  <Typography variant="h6" fontWeight={600} color="error.dark">
                    Red Flags - Immediate Attention Required
                  </Typography>
                  <Chip 
                    label={analysis.analysis.redFlags.length} 
                    size="small" 
                    color="error"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {analysis.analysis.redFlags.map((flag, index) => (
                  <Alert
                    key={index}
                    severity={
                      flag.severity === 'critical' ? 'error' :
                      flag.severity === 'high' ? 'warning' : 'info'
                    }
                    sx={{ 
                      m: 2, 
                      borderRadius: 2,
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {flag.flag}
                      </Typography>
                      <Chip
                        label={flag.severity.toUpperCase()}
                        color={
                          flag.severity === 'critical'
                            ? 'error'
                            : flag.severity === 'high'
                              ? 'warning'
                              : 'info'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2">
                      <strong>Action Required:</strong> {flag.action}
                    </Typography>
                  </Alert>
                ))}
              </AccordionDetails>
            </Accordion>
          </Card>
        )}

        {/* Recommended Tests */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Accordion elevation={0}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'secondary.50',
                '&:hover': { bgcolor: 'secondary.100' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScienceIcon color="secondary" />
                <Typography variant="h6" fontWeight={600}>
                  Recommended Tests
                </Typography>
                <Chip 
                  label={analysis.analysis.recommendedTests.length} 
                  size="small" 
                  color="secondary"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {analysis.analysis.recommendedTests.map((test, index) => (
                <Card
                  key={index}
                  elevation={0}
                  sx={{
                    m: 2,
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                      {test.testName}
                    </Typography>
                    <Chip
                      label={test.priority.toUpperCase()}
                      color={
                        test.priority === 'urgent'
                          ? 'error'
                          : test.priority === 'routine'
                            ? 'warning'
                            : 'info'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {test.reasoning}
                  </Typography>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Therapeutic Options */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Accordion elevation={0}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'info.50',
                '&:hover': { bgcolor: 'info.100' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MedicationIcon color="info" />
                <Typography variant="h6" fontWeight={600}>
                  Therapeutic Options
                </Typography>
                <Chip 
                  label={analysis.analysis.therapeuticOptions.length} 
                  size="small" 
                  color="info"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {analysis.analysis.therapeuticOptions.map((option, index) => (
                <Card
                  key={index}
                  elevation={0}
                  sx={{
                    m: 2,
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {option.medication}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Dosage: ${option.dosage}`} size="small" variant="outlined" />
                    <Chip label={`Frequency: ${option.frequency}`} size="small" variant="outlined" />
                    <Chip label={`Duration: ${option.duration}`} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {option.reasoning}
                  </Typography>
                  {option.safetyNotes.length > 0 && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Safety Notes:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {option.safetyNotes.map((note, i) => (
                          <li key={i}>
                            <Typography variant="body2">
                              {note}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                    </Alert>
                  )}
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Disclaimer */}
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'warning.light',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Important Disclaimer
          </Typography>
          <Typography variant="body2">
            {analysis.analysis.disclaimer}
          </Typography>
        </Alert>
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.light',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              px: 4,
              py: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab 
            label="Clinical Data Input" 
            icon={<AddIcon />}
            iconPosition="start"
            sx={{ gap: 1.5 }}
          />
          <Tab 
            label="AI Analysis Results" 
            disabled={!analysis}
            icon={<PsychologyIcon />}
            iconPosition="start"
            sx={{ gap: 1.5 }}
          />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AddIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" fontWeight={600}>
                Clinical Data Input
              </Typography>
            </Box>
            {renderInputForm()}
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'secondary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PsychologyIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" fontWeight={600}>
                AI Diagnostic Analysis
              </Typography>
            </Box>
            {renderAnalysisResults()}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Patient Consent Dialog */}
      <Dialog 
        open={consentDialog} 
        onClose={() => setConsentDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'warning.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Patient Consent Required
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            AI diagnostic analysis requires patient consent for data processing.
            Please ensure the patient has provided informed consent before
            proceeding.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              This analysis will process patient data using AI algorithms to provide diagnostic insights.
              All data is processed securely and in compliance with HIPAA regulations.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setConsentDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setPatientConsent(true);
              setConsentDialog(false);
              handleAnalysis();
            }}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Patient Consents - Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiagnosticModule;
