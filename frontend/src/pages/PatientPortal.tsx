import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Tabs,
  Tab,
  Container,
} from '@mui/material';
import AvailableSlotsView from '../components/patient-portal/AvailableSlotsView';
import BookAppointmentForm from '../components/patient-portal/BookAppointmentForm';
import MyAppointmentsList from '../components/patient-portal/MyAppointmentsList';
import NotificationPreferencesForm from '../components/patient-portal/NotificationPreferencesForm';
import { useAuth } from '../hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-portal-tabpanel-${index}`}
      aria-labelledby={`patient-portal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Patient Portal - Public-facing interface for patients
 * Allows patients to book appointments, view their appointments, and manage preferences
 */
const PatientPortal: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // For demo purposes, using current user's workspace
  const workspaceId = user?.workspaceId || 'demo-workspace';
  const patientId = user?.id || 'demo-patient';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Patient Portal
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Book appointments, manage your healthcare, and stay connected
        </Typography>
      </Box>

      {/* Main Card */}
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: theme.shadows[8],
          background: theme.palette.background.paper,
          overflow: 'hidden',
        }}
      >
        {/* Navigation Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="patient portal tabs"
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 64,
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <Tab label="Book Appointment" />
            <Tab label="My Appointments" />
            <Tab label="Available Times" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <CardContent sx={{ p: 0 }}>
          {/* Book Appointment Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Book New Appointment
              </Typography>
              <BookAppointmentForm
                workspaceId={workspaceId}
                patientId={patientId}
                onSuccess={() => {
                  // Switch to My Appointments tab after successful booking
                  setTabValue(1);
                }}
              />
            </Box>
          </TabPanel>

          {/* My Appointments Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                My Appointments
              </Typography>
              <MyAppointmentsList
                workspaceId={workspaceId}
                patientId={patientId}
              />
            </Box>
          </TabPanel>

          {/* Available Times Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Available Appointment Times
              </Typography>
              <AvailableSlotsView
                workspaceId={workspaceId}
                onSlotSelect={(slot) => {
                  // Switch to booking form with pre-selected slot
                  setTabValue(0);
                }}
              />
            </Box>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Notification Preferences
              </Typography>
              <NotificationPreferencesForm
                patientId={patientId}
                workspaceId={workspaceId}
              />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Need help? Contact your pharmacy directly or call our support line.
        </Typography>
      </Box>
    </Container>
  );
};

export default PatientPortal;