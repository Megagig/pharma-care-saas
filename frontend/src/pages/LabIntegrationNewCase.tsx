import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Science as ScienceIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { useCreateLabIntegration } from '../hooks/useLabIntegration';
import { usePatientStore } from '../stores';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const LabIntegrationNewCase: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createMutation = useCreateLabIntegration();

  // Patient store
  const patients = usePatientStore((state) => state.patients);
  const loading = usePatientStore((state) => state.loading.fetchPatients || false);
  const fetchPatients = usePatientStore((state) => state.fetchPatients);

  // Form state
  const [patientId, setPatientId] = useState('');
  const [source, setSource] = useState<'manual_entry' | 'pdf_upload' | 'image_upload' | 'fhir_import' | 'lis_integration'>('manual_entry');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'critical'>('routine');
  const [labResultIds, setLabResultIds] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        await fetchPatients();
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        toast.error('Failed to load patients');
      }
    };
    loadPatients();
  }, [fetchPatients]);

  // Handle patient selection from URL parameters (when coming from patient list)
  useEffect(() => {
    const selectedPatientId = searchParams.get('selectedPatient');
    if (selectedPatientId && patients.length > 0) {
      const patientExists = patients.some((p) => p._id === selectedPatientId);
      if (patientExists) {
        setPatientId(selectedPatientId);
      }
    }
  }, [searchParams, patients]);

  // Fetch lab results for selected patient
  const { data: labResultsData, isLoading: labResultsLoading } = useQuery({
    queryKey: ['labResults', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const response = await axios.get(`/api/diagnostics/lab-results/patient/${patientId}`);
      return response.data.data || [];
    },
    enabled: !!patientId,
  });

  const handleBack = () => {
    navigate('/pharmacy/lab-integration');
  };

  const handleAddLabResult = (labResultId: string) => {
    if (!labResultIds.includes(labResultId)) {
      setLabResultIds([...labResultIds, labResultId]);
    }
  };

  const handleRemoveLabResult = (labResultId: string) => {
    setLabResultIds(labResultIds.filter((id) => id !== labResultId));
  };

  const handleSubmit = async () => {
    // Validation
    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (labResultIds.length === 0) {
      toast.error('Please select at least one lab result');
      return;
    }

    if (!consentGiven) {
      toast.error('Patient consent is required');
      return;
    }

    try {
      const newCase = await createMutation.mutateAsync({
        patientId,
        labResultIds,
        source,
        priority,
        notes: notes || undefined,
      });

      toast.success('Lab integration case created successfully');
      navigate(`/pharmacy/lab-integration/${newCase._id}`);
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>New Lab Integration Case | PharmaCare</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon fontSize="large" />
              Create New Lab Integration Case
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload or select lab results for AI-powered interpretation and therapy recommendations
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  {/* Action Buttons */}
                  <Box sx={{ mb: 4 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={() => fetchPatients()}
                        disabled={loading}
                        startIcon={loading ? <RefreshIcon className="animate-spin" /> : <RefreshIcon />}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          flex: 1
                        }}
                      >
                        {loading ? 'Refreshing...' : 'Refresh Patients'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/patients?for=lab-integration')}
                        startIcon={<SearchIcon />}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          flex: 1
                        }}
                      >
                        Browse Patients
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/patients/new')}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                          flex: 1
                        }}
                      >
                        New Patient
                      </Button>
                    </Stack>
                  </Box>

                  {/* Selected Patient Display */}
                  {patientId && (
                    <Paper
                      elevation={0}
                      sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #e8f5e8, #f1f8e9)',
                        border: '2px solid #4caf50',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: 'success.main',
                            width: 48,
                            height: 48,
                            mr: 2,
                          }}
                        >
                          <CheckCircleIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: 'success.dark', mb: 0.5 }}
                          >
                            Selected Patient
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {(() => {
                              const selectedPatient = patients.find((p) => p._id === patientId);
                              return selectedPatient
                                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                                : 'Loading patient details...';
                            })()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              const selectedPatient = patients.find((p) => p._id === patientId);
                              return selectedPatient
                                ? `MRN: ${selectedPatient.mrn} • ${selectedPatient.age}y, ${selectedPatient.gender}`
                                : '';
                            })()}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Patient Selection */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: !patientId ? 'error.main' : 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          width: 40,
                          height: 40,
                          mr: 2,
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Choose Patient
                          </Typography>
                          <Chip
                            label="REQUIRED"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Select the patient for this lab integration case
                        </Typography>
                      </Box>
                    </Box>

                    <FormControl fullWidth error={!patientId}>
                      <InputLabel>Select Patient</InputLabel>
                      <Select
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        label="Select Patient"
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                      >
                        {loading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <RefreshIcon className="animate-spin" sx={{ mr: 1 }} />
                              Loading patients...
                            </Box>
                          </MenuItem>
                        ) : patients.length === 0 ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              No patients found. Please add patients first.
                            </Box>
                          </MenuItem>
                        ) : (
                          patients.map((patient) => (
                            <MenuItem key={patient._id} value={patient._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Avatar
                                  sx={{
                                    bgcolor: patientId === patient._id ? 'success.main' : 'grey.300',
                                    width: 32,
                                    height: 32,
                                    mr: 2,
                                  }}
                                >
                                  {patientId === patient._id ? (
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <PersonIcon sx={{ fontSize: 18 }} />
                                  )}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {patient.firstName} {patient.lastName}
                                    {patient.otherNames && ` ${patient.otherNames}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    MRN: {patient.mrn} • {patient.age}y, {patient.gender}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>

                    {/* Empty State */}
                    {!loading && patients.length === 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 3,
                          p: 4,
                          borderRadius: 3,
                          bgcolor: 'grey.50',
                          textAlign: 'center',
                          border: '2px dashed',
                          borderColor: 'grey.300'
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'grey.200',
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          No Patients Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          You need to add patients before creating a lab integration case
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                          <Button
                            variant="contained"
                            onClick={() => navigate('/patients?for=lab-integration')}
                            startIcon={<SearchIcon />}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Browse Patients
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/patients/new')}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Create New Patient
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </Paper>

                  {/* Lab Results Selection */}
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScienceIcon />
                      Lab Results
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {!patientId ? (
                      <Alert severity="info">
                        Please select a patient first to view their lab results
                      </Alert>
                    ) : labResultsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : !labResultsData || labResultsData.length === 0 ? (
                      <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          No lab results found for this patient. Please add lab results first.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            startIcon={<ScienceIcon />}
                            onClick={() => navigate('/laboratory')}
                          >
                            Go to Laboratory Findings
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(`/laboratory/add?patientId=${selectedPatient}`)}
                          >
                            Add Lab Result
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        {/* Selected Lab Results */}
                        {labResultIds.length > 0 && (
                          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                              Selected Lab Results ({labResultIds.length})
                            </Typography>
                            <List dense>
                              {labResultIds.map((id) => {
                                const labResult = labResultsData.find((lr: any) => lr._id === id);
                                return (
                                  <ListItem key={id}>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {labResult?.testName}
                                          {labResult?.criticalValue && (
                                            <Chip
                                              label="CRITICAL"
                                              size="small"
                                              color="error"
                                              sx={{ ml: 1, height: 20 }}
                                            />
                                          )}
                                        </Typography>
                                      }
                                      secondary={
                                        <>
                                          {new Date(labResult?.performedAt).toLocaleDateString()} - {labResult?.value} {labResult?.unit}
                                          {labResult?.interpretation && ` (${labResult.interpretation})`}
                                        </>
                                      }
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton edge="end" onClick={() => handleRemoveLabResult(id)} size="small">
                                        <DeleteIcon />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                );
                              })}
                            </List>
                          </Paper>
                        )}

                        {/* Available Lab Results */}
                        <FormControl fullWidth>
                          <InputLabel>Add Lab Result</InputLabel>
                          <Select
                            value=""
                            onChange={(e) => handleAddLabResult(e.target.value)}
                            label="Add Lab Result"
                          >
                            {labResultsData
                              .filter((lr: any) => !labResultIds.includes(lr._id))
                              .map((labResult: any) => (
                                <MenuItem key={labResult._id} value={labResult._id}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {labResult.testName}
                                      {labResult.criticalValue && (
                                        <Chip
                                          label="CRITICAL"
                                          size="small"
                                          color="error"
                                          sx={{ ml: 1, height: 18 }}
                                        />
                                      )}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(labResult.performedAt).toLocaleDateString()} - {labResult.value} {labResult.unit}
                                      {labResult.interpretation && ` (${labResult.interpretation})`}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </>
                    )}
                  </Box>

                  {/* Source and Priority */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Source</InputLabel>
                        <Select
                          value={source}
                          onChange={(e) => setSource(e.target.value as any)}
                          label="Source"
                        >
                          <MenuItem value="manual_entry">Manual Entry</MenuItem>
                          <MenuItem value="pdf_upload">PDF Upload</MenuItem>
                          <MenuItem value="image_upload">Image Upload</MenuItem>
                          <MenuItem value="fhir_import">FHIR Import</MenuItem>
                          <MenuItem value="lis_integration">LIS Integration</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          label="Priority"
                        >
                          <MenuItem value="routine">Routine</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Notes */}
                  <TextField
                    label="Notes (Optional)"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or context..."
                    fullWidth
                  />

                  {/* Consent */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={consentGiven}
                          onChange={(e) => setConsentGiven(e.target.checked)}
                          required
                        />
                      }
                      label="Patient has provided consent for lab data use and AI interpretation"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Info Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    What Happens Next?
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Chip label="1" size="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">
                        AI analyzes lab results
                      </Typography>
                    </Box>
                    <Box>
                      <Chip label="2" size="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">
                        Safety checks performed
                      </Typography>
                    </Box>
                    <Box>
                      <Chip label="3" size="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">
                        Therapy recommendations generated
                      </Typography>
                    </Box>
                    <Box>
                      <Chip label="4" size="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">
                        Pharmacist review required
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Privacy Notice */}
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Privacy & Security
                </Typography>
                <Typography variant="body2">
                  All lab data is encrypted and handled in compliance with HIPAA regulations.
                  Patient consent is required and logged for audit purposes.
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !patientId || labResultIds.length === 0 || !consentGiven}
                  fullWidth
                >
                  Create Case
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  fullWidth
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default LabIntegrationNewCase;

