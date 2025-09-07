import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  TextField,
  Autocomplete,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { usePatientInterventions } from '../queries/useClinicalInterventions';
import type { ClinicalIntervention } from '../stores/clinicalInterventionStore';

// Mock patient data - replace with actual patient service
const mockPatients = [
  { _id: '1', firstName: 'John', lastName: 'Doe', dateOfBirth: '1980-01-01' },
  { _id: '2', firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1975-05-15' },
  {
    _id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    dateOfBirth: '1990-12-10',
  },
  {
    _id: '4',
    firstName: 'Alice',
    lastName: 'Brown',
    dateOfBirth: '1985-08-22',
  },
  {
    _id: '5',
    firstName: 'Charlie',
    lastName: 'Wilson',
    dateOfBirth: '1970-03-30',
  },
];

const PatientInterventions: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // State
  const [selectedPatient, setSelectedPatient] = useState<any>(
    patientId ? mockPatients.find((p) => p._id === patientId) : null
  );

  // API queries
  const {
    data: interventionsResponse,
    isLoading,
    error,
    refetch,
  } = usePatientInterventions(selectedPatient?._id || '');

  const interventions = useMemo(() => {
    return interventionsResponse?.data || [];
  }, [interventionsResponse]);

  // Statistics
  const stats = useMemo(() => {
    if (!interventions.length) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        highPriority: 0,
      };
    }

    return {
      total: interventions.length,
      active: interventions.filter((i: ClinicalIntervention) =>
        ['identified', 'planning', 'in_progress', 'implemented'].includes(
          i.status
        )
      ).length,
      completed: interventions.filter(
        (i: ClinicalIntervention) => i.status === 'completed'
      ).length,
      highPriority: interventions.filter((i: ClinicalIntervention) =>
        ['high', 'critical'].includes(i.priority)
      ).length,
    };
  }, [interventions]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'implemented':
        return 'primary';
      case 'planning':
        return 'warning';
      case 'identified':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'in_progress':
        return <ScheduleIcon />;
      case 'implemented':
        return <CheckCircleIcon />;
      case 'planning':
        return <ScheduleIcon />;
      case 'identified':
        return <WarningIcon />;
      case 'cancelled':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Patient Interventions
        </Typography>
        {selectedPatient && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              navigate(
                `/pharmacy/clinical-interventions/create?patientId=${selectedPatient._id}`
              )
            }
          >
            Create New Intervention
          </Button>
        )}
      </Box>

      {/* Patient Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Patient
          </Typography>
          <Autocomplete
            options={mockPatients}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName} (DOB: ${option.dateOfBirth})`
            }
            value={selectedPatient}
            onChange={(_, value) => {
              setSelectedPatient(value);
              if (value) {
                navigate(
                  `/pharmacy/clinical-interventions/patients/${value._id}`
                );
              } else {
                navigate('/pharmacy/clinical-interventions/patients');
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search and select a patient..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <PersonIcon sx={{ mr: 2, color: 'action.active' }} />
                <Box>
                  <Typography variant="body1">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    DOB: {format(parseISO(option.dateOfBirth), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        </CardContent>
      </Card>

      {/* Patient Information & Statistics */}
      {selectedPatient && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Patient Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Patient Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date of Birth:{' '}
                        {format(
                          parseISO(selectedPatient.dateOfBirth),
                          'MMM dd, yyyy'
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Age:{' '}
                        {new Date().getFullYear() -
                          new Date(
                            selectedPatient.dateOfBirth
                          ).getFullYear()}{' '}
                        years
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Intervention Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Interventions
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {stats.active}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {stats.completed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {stats.highPriority}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          High Priority
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Interventions List */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinical Interventions
              </Typography>

              {isLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  }
                >
                  Error loading interventions: {error.message}
                </Alert>
              ) : interventions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Intervention #</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Identified Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {interventions.map(
                        (intervention: ClinicalIntervention) => (
                          <TableRow key={intervention._id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {intervention.interventionNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={intervention.category
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={intervention.priority.toUpperCase()}
                                size="small"
                                color={
                                  getPriorityColor(intervention.priority) as any
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(intervention.status)}
                                label={intervention.status
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                size="small"
                                color={
                                  getStatusColor(intervention.status) as any
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(
                                  parseISO(intervention.identifiedDate),
                                  'MMM dd, yyyy'
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {format(
                                  parseISO(intervention.identifiedDate),
                                  'HH:mm'
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      navigate(
                                        `/pharmacy/clinical-interventions/details/${intervention._id}`
                                      )
                                    }
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      navigate(
                                        `/pharmacy/clinical-interventions/edit/${intervention._id}`
                                      )
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No clinical interventions found for this patient.
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      navigate(
                        `/pharmacy/clinical-interventions/create?patientId=${selectedPatient._id}`
                      )
                    }
                    sx={{ ml: 2 }}
                  >
                    Create First Intervention
                  </Button>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* No Patient Selected */}
      {!selectedPatient && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Select a Patient
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose a patient from the dropdown above to view their clinical
              interventions.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PatientInterventions;
