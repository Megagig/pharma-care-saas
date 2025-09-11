import React, { useState, useEffect } from 'react';
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
  Divider,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../context/FeatureFlagContext';

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
  drugInteractions: any[];
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

  // Form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { type: 'subjective', description: '' }
  ]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [onset, setOnset] = useState<'acute' | 'chronic' | 'subacute'>('acute');

  // Check feature access - super_admin bypasses feature flag checks
  const isSuperAdmin = user?.role === 'super_admin';
  const hasAccess = isSuperAdmin || hasFeature('clinical_decision_support');

  if (!hasAccess) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Clinical Decision Support feature is not available in your current plan.
            Please upgrade to access AI-powered diagnostic assistance.
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
    setLabResults([...labResults, { testName: '', value: '', referenceRange: '', abnormal: false }]);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', startDate: '' }]);
  };

  const handleAnalysis = async () => {
    if (!patientConsent) {
      setConsentDialog(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/diagnostics/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patientId: selectedPatient,
          symptoms: {
            subjective: symptoms.filter(s => s.type === 'subjective').map(s => s.description).filter(Boolean),
            objective: symptoms.filter(s => s.type === 'objective').map(s => s.description).filter(Boolean),
            duration,
            severity,
            onset,
          },
          labResults: labResults.filter(lr => lr.testName && lr.value),
          currentMedications: medications.filter(m => m.name && m.dosage),
          vitalSigns,
          patientConsent: {
            provided: true,
            method: 'electronic'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate diagnostic analysis');
      }

      const data = await response.json();
      setAnalysis(data.data);
      setActiveTab(1); // Switch to results tab
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderInputForm = () => (
    <Grid container spacing={3}>
      {/* Patient Selection */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Select Patient</InputLabel>
          <Select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            required
          >
            {/* This would be populated from actual patient data */}
            <MenuItem value="">Select a patient...</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Symptoms */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Symptoms
        </Typography>
        {symptoms.map((symptom, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={symptom.type === 'subjective' ? 'Subjective' : 'Objective'}
              color={symptom.type === 'subjective' ? 'primary' : 'secondary'}
              size="small"
            />
            <TextField
              fullWidth
              placeholder={`Enter ${symptom.type} symptom`}
              value={symptom.description}
              onChange={(e) => updateSymptom(index, e.target.value)}
            />
            <IconButton onClick={() => removeSymptom(index)} size="small">
              <RemoveIcon />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('subjective')}
            size="small"
          >
            Add Subjective
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('objective')}
            size="small"
          >
            Add Objective
          </Button>
        </Box>
      </Grid>

      {/* Clinical Details */}
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g., 3 days, 2 weeks"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Severity</InputLabel>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
            <MenuItem value="mild">Mild</MenuItem>
            <MenuItem value="moderate">Moderate</MenuItem>
            <MenuItem value="severe">Severe</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Onset</InputLabel>
          <Select value={onset} onChange={(e) => setOnset(e.target.value as any)}>
            <MenuItem value="acute">Acute</MenuItem>
            <MenuItem value="chronic">Chronic</MenuItem>
            <MenuItem value="subacute">Subacute</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Vital Signs */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Vital Signs
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Blood Pressure"
              value={vitalSigns.bloodPressure || ''}
              onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
              placeholder="120/80"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Heart Rate"
              type="number"
              value={vitalSigns.heartRate || ''}
              onChange={(e) => setVitalSigns({...vitalSigns, heartRate: Number(e.target.value)})}
              placeholder="BPM"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Temperature"
              type="number"
              value={vitalSigns.temperature || ''}
              onChange={(e) => setVitalSigns({...vitalSigns, temperature: Number(e.target.value)})}
              placeholder="°C"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="O2 Saturation"
              type="number"
              value={vitalSigns.oxygenSaturation || ''}
              onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: Number(e.target.value)})}
              placeholder="%"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Generate Analysis Button */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <PsychologyIcon />}
            onClick={handleAnalysis}
            disabled={loading || !selectedPatient || symptoms.filter(s => s.description).length === 0}
          >
            {loading ? 'Generating Analysis...' : 'Generate AI Analysis'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Analysis completed in {analysis.processingTime}ms with confidence score: {analysis.analysis.confidenceScore}%
        </Alert>

        {/* Differential Diagnoses */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HospitalIcon />
              <Typography variant="h6">Differential Diagnoses</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.differentialDiagnoses.map((diagnosis, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{diagnosis.condition}</Typography>
                        <Chip
                          label={`${diagnosis.probability}%`}
                          color={diagnosis.probability > 70 ? 'error' : diagnosis.probability > 40 ? 'warning' : 'success'}
                          size="small"
                        />
                        <Chip
                          label={diagnosis.severity}
                          color={diagnosis.severity === 'high' ? 'error' : diagnosis.severity === 'medium' ? 'warning' : 'info'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={diagnosis.reasoning}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Red Flags */}
        {analysis.analysis.redFlags.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="error" />
                <Typography variant="h6">Red Flags</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {analysis.analysis.redFlags.map((flag, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{flag.flag}</Typography>
                          <Chip
                            label={flag.severity}
                            color={flag.severity === 'critical' ? 'error' : flag.severity === 'high' ? 'warning' : 'info'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={flag.action}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Recommended Tests */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon />
              <Typography variant="h6">Recommended Tests</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.recommendedTests.map((test, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{test.testName}</Typography>
                        <Chip
                          label={test.priority}
                          color={test.priority === 'urgent' ? 'error' : test.priority === 'routine' ? 'warning' : 'info'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={test.reasoning}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Therapeutic Options */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicationIcon />
              <Typography variant="h6">Therapeutic Options</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.therapeuticOptions.map((option, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${option.medication} - ${option.dosage}, ${option.frequency}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">{option.reasoning}</Typography>
                        {option.safetyNotes.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="error">Safety Notes:</Typography>
                            {option.safetyNotes.map((note, i) => (
                              <Typography key={i} variant="caption" display="block" color="error">
                                • {note}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Disclaimer */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          {analysis.analysis.disclaimer}
        </Alert>
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Input Data" />
        <Tab label="AI Analysis" disabled={!analysis} />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Clinical Data Input
            </Typography>
            {renderInputForm()}
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              AI Diagnostic Analysis
            </Typography>
            {renderAnalysisResults()}
          </CardContent>
        </Card>
      )}

      {/* Patient Consent Dialog */}
      <Dialog open={consentDialog} onClose={() => setConsentDialog(false)}>
        <DialogTitle>Patient Consent Required</DialogTitle>
        <DialogContent>
          <Typography>
            AI diagnostic analysis requires patient consent for data processing.
            Please ensure the patient has provided informed consent before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsentDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setPatientConsent(true);
              setConsentDialog(false);
              handleAnalysis();
            }}
            variant="contained"
          >
            Patient Consents - Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiagnosticModule;