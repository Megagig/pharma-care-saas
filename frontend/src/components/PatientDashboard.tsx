import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { extractData } from '../utils/apiHelpers';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Button,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import MedicationIcon from '@mui/icons-material/Medication';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CakeIcon from '@mui/icons-material/Cake';

import { usePatient } from '../queries/usePatients';
import type { Patient } from '../types/patientManagement';

interface PatientDashboardProps {
  patientId?: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientId: propPatientId,
}) => {
  const { patientId: routePatientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const patientId = propPatientId || routePatientId;

  // React Query hooks
  const {
    data: patientResponse,
    isLoading: patientLoading,
    isError: patientError,
    error,
  } = usePatient(patientId!);

  const patientData = extractData(patientResponse)?.patient;

  // Mock overview data (replace with actual hook when available)
  const overview = {
    totalActiveMedications: 5,
    totalActiveDTPs: 2,
    totalActiveConditions: 3,
    recentVisits: 8,
    recentActivity: [
      {
        id: 1,
        type: 'medication',
        description: 'New medication prescribed',
        date: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'assessment',
        description: 'Clinical assessment completed',
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        type: 'visit',
        description: 'Follow-up visit scheduled',
        date: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    clinicalInsights: [
      'Blood pressure within normal range',
      'Medication adherence good',
      'Regular monitoring recommended',
    ],
  };

  if (patientLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[...Array(6)].map((_, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Skeleton variant="rectangular" width="100%" height={150} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (patientError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Failed to load patient data</Typography>
          <Typography variant="body2">
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred.'}
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  if (!patientData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">Patient not found</Typography>
          <Typography variant="body2">
            The requested patient could not be found.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
          sx={{ mt: 2 }}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getPatientAge = (patient: Patient): string => {
    if (patient.age !== undefined) return `${patient.age} years`;
    const calculatedAge = calculateAge(patient.dob);
    return calculatedAge ? `${calculatedAge} years` : 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Patient Info */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/patients')}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {getInitials(patientData.firstName, patientData.lastName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {patientData.firstName} {patientData.lastName}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Typography variant="body1" color="text.secondary">
                MRN: {patientData.mrn}
              </Typography>
              <Chip
                label={`${getPatientAge(patientData)} • ${
                  patientData.gender || 'Unknown'
                }`}
                size="small"
                variant="outlined"
              />
              {patientData.bloodGroup && (
                <Chip
                  label={patientData.bloodGroup}
                  size="small"
                  color="primary"
                />
              )}
              {patientData.genotype && (
                <Chip
                  label={patientData.genotype}
                  size="small"
                  color={
                    patientData.genotype.includes('S') ? 'warning' : 'success'
                  }
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton>
              <EditIcon />
            </IconButton>
            <IconButton>
              <PrintIcon />
            </IconButton>
            <IconButton>
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MedicationIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {overview?.totalActiveMedications || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Medications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {overview?.totalActiveDTPs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active DTPs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {overview?.totalActiveConditions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conditions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {overview?.recentVisits || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Visits
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Patient Details and Recent Activity */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Patient Details */}
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card>
            <CardHeader
              title="Patient Information"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              avatar={<PersonIcon color="primary" />}
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {patientData.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {patientData.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOnIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {patientData.state || 'Unknown'},{' '}
                      {patientData.lga || 'Unknown LGA'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CakeIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {patientData.dob
                        ? new Date(patientData.dob).toLocaleDateString()
                        : 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card>
            <CardHeader
              title="Recent Activity"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              avatar={<TimelineIcon color="primary" />}
            />
            <CardContent>
              <List>
                {overview?.recentActivity?.slice(0, 3).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'primary.main',
                          fontSize: '0.75rem',
                        }}
                      >
                        {activity.type[0].toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.description}
                      secondary={new Date(activity.date).toLocaleDateString()}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                )) || (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="No recent activity"
                      secondary="Patient activity will appear here"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Clinical Insights */}
      <Card>
        <CardHeader
          title="Clinical Insights"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          avatar={<AssignmentIcon color="primary" />}
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {overview?.clinicalInsights?.map((insight, index) => (
              <Chip
                key={index}
                label={insight}
                variant="outlined"
                color="success"
              />
            )) || (
              <Typography variant="body2" color="text.secondary">
                Clinical insights will appear here based on patient data
                analysis
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatientDashboard;
