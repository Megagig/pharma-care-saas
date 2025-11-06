import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Pill,
  MessageCircle,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  User,
  Phone,
  Mail,
  Activity,
  Heart,
  Thermometer,
  Weight,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Box, Typography, Grid, LinearProgress, Divider } from '@mui/material';
import PatientOnboarding from '../../components/patient-portal/PatientOnboarding';

interface DashboardStats {
  upcomingAppointments: number;
  activeMedications: number;
  unreadMessages: number;
  pendingRefills: number;
}

interface UpcomingAppointment {
  id: string;
  type: string;
  date: string;
  time: string;
  pharmacistName: string;
  status: 'confirmed' | 'pending' | 'reminder_sent';
}

interface CurrentMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillsRemaining: number;
  nextRefillDate: string;
  adherenceScore: number;
}

interface RecentMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
}

interface HealthRecord {
  id: string;
  type: 'lab_result' | 'visit_note' | 'prescription';
  title: string;
  date: string;
  status: 'new' | 'reviewed';
}

interface VitalReading {
  type: 'blood_pressure' | 'weight' | 'glucose' | 'temperature';
  value: string;
  unit: string;
  date: string;
  status: 'normal' | 'high' | 'low';
}

export const PatientDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is the user's first visit
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('patientOnboardingCompleted');
    const patientUser = localStorage.getItem('patientUser');
    
    if (!hasCompletedOnboarding && patientUser) {
      // Show onboarding for first-time users
      setShowOnboarding(true);
    }
  }, []);

  // Mock data - replace with actual API calls
  const stats: DashboardStats = {
    upcomingAppointments: 2,
    activeMedications: 4,
    unreadMessages: 3,
    pendingRefills: 1,
  };

  const upcomingAppointments: UpcomingAppointment[] = [
    {
      id: '1',
      type: 'Medication Review',
      date: '2024-01-15',
      time: '10:00 AM',
      pharmacistName: 'Dr. Sarah Johnson',
      status: 'confirmed',
    },
    {
      id: '2',
      type: 'Health Consultation',
      date: '2024-01-22',
      time: '2:30 PM',
      pharmacistName: 'Dr. Michael Chen',
      status: 'pending',
    },
  ];

  const currentMedications: CurrentMedication[] = [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      refillsRemaining: 2,
      nextRefillDate: '2024-01-20',
      adherenceScore: 95,
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      refillsRemaining: 0,
      nextRefillDate: '2024-01-12',
      adherenceScore: 88,
    },
    {
      id: '3',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      refillsRemaining: 3,
      nextRefillDate: '2024-02-05',
      adherenceScore: 92,
    },
  ];

  const recentMessages: RecentMessage[] = [
    {
      id: '1',
      from: 'Dr. Sarah Johnson',
      subject: 'Lab Results Available',
      preview: 'Your recent blood work results are now available for review...',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: '2',
      from: 'Pharmacy Team',
      subject: 'Prescription Ready',
      preview: 'Your Metformin prescription is ready for pickup...',
      timestamp: '1 day ago',
      isRead: false,
    },
    {
      id: '3',
      from: 'Dr. Michael Chen',
      subject: 'Appointment Reminder',
      preview: 'This is a reminder about your upcoming appointment...',
      timestamp: '2 days ago',
      isRead: true,
    },
  ];

  const recentHealthRecords: HealthRecord[] = [
    {
      id: '1',
      type: 'lab_result',
      title: 'Complete Blood Count',
      date: '2024-01-10',
      status: 'new',
    },
    {
      id: '2',
      type: 'visit_note',
      title: 'Medication Review Visit',
      date: '2024-01-08',
      status: 'reviewed',
    },
    {
      id: '3',
      type: 'prescription',
      title: 'New Prescription - Lisinopril',
      date: '2024-01-05',
      status: 'reviewed',
    },
  ];

  const recentVitals: VitalReading[] = [
    {
      type: 'blood_pressure',
      value: '120/80',
      unit: 'mmHg',
      date: '2024-01-12',
      status: 'normal',
    },
    {
      type: 'weight',
      value: '75.2',
      unit: 'kg',
      date: '2024-01-12',
      status: 'normal',
    },
    {
      type: 'glucose',
      value: '95',
      unit: 'mg/dL',
      date: '2024-01-11',
      status: 'normal',
    },
  ];

  const getVitalIcon = (type: VitalReading['type']) => {
    switch (type) {
      case 'blood_pressure':
        return <Heart className="h-4 w-4" />;
      case 'weight':
        return <Weight className="h-4 w-4" />;
      case 'glucose':
        return <Activity className="h-4 w-4" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'high':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getAdherenceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    return 'error';
  };

  return (
    <Box className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Box className="mb-8">
          <Typography variant="h4" className="text-gray-900 dark:text-white font-bold">
            Welcome back, John!
          </Typography>
          <Typography variant="body1" className="text-gray-600 dark:text-gray-400 mt-1">
            Here's an overview of your health information
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="p-6">
              <Box className="flex items-center">
                <Box className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </Box>
                <Box className="ml-4">
                  <Typography variant="h6" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.upcomingAppointments}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="p-6">
              <Box className="flex items-center">
                <Box className="flex-shrink-0">
                  <Pill className="h-8 w-8 text-green-600" />
                </Box>
                <Box className="ml-4">
                  <Typography variant="h6" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeMedications}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    Active Medications
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="p-6">
              <Box className="flex items-center">
                <Box className="flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </Box>
                <Box className="ml-4">
                  <Typography variant="h6" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.unreadMessages}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    Unread Messages
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="p-6">
              <Box className="flex items-center">
                <Box className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </Box>
                <Box className="ml-4">
                  <Typography variant="h6" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingRefills}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    Pending Refills
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={6}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Upcoming Appointments */}
            <Card className="p-6 mb-6">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Appointments
                </Typography>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Box>

              <Box className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <Box key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Box className="flex items-center space-x-4">
                      <Box className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" className="font-medium text-gray-900 dark:text-white">
                          {appointment.type}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          with {appointment.pharmacistName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="flex items-center space-x-2">
                      <Badge
                        variant={appointment.status === 'confirmed' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Current Medications */}
            <Card className="p-6 mb-6">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Medications
                </Typography>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Box>

              <Box className="space-y-4">
                {currentMedications.slice(0, 3).map((medication) => (
                  <Box key={medication.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Box className="flex items-start justify-between">
                      <Box className="flex-1">
                        <Typography variant="subtitle1" className="font-medium text-gray-900 dark:text-white">
                          {medication.name} {medication.dosage}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          {medication.frequency}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          Next refill: {new Date(medication.nextRefillDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box className="text-right">
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-1">
                          Adherence
                        </Typography>
                        <Box className="flex items-center space-x-2">
                          <LinearProgress
                            variant="determinate"
                            value={medication.adherenceScore}
                            className="w-16"
                            color={getAdherenceColor(medication.adherenceScore) as any}
                          />
                          <Typography variant="body2" className="text-gray-900 dark:text-white font-medium">
                            {medication.adherenceScore}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {medication.refillsRemaining === 0 && (
                      <Box className="mt-3">
                        <Alert variant="warning">
                          <AlertCircle className="h-4 w-4" />
                          <span>Refill needed - contact your pharmacy</span>
                        </Alert>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Recent Health Records */}
            <Card className="p-6">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Health Records
                </Typography>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Box>

              <Box className="space-y-3">
                {recentHealthRecords.map((record) => (
                  <Box key={record.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    <Box className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <Box>
                        <Typography variant="subtitle2" className="font-medium text-gray-900 dark:text-white">
                          {record.title}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    {record.status === 'new' && (
                      <Badge variant="primary" size="sm">
                        New
                      </Badge>
                    )}
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            {/* Quick Actions */}
            <Card className="p-6 mb-6">
              <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </Typography>
              
              <Box className="space-y-3">
                <Button variant="primary" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Pill className="h-4 w-4 mr-2" />
                  Request Refill
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Pharmacist
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Health Records
                </Button>
              </Box>
            </Card>

            {/* Recent Messages */}
            <Card className="p-6 mb-6">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Messages
                </Typography>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Box>

              <Box className="space-y-3">
                {recentMessages.slice(0, 3).map((message) => (
                  <Box key={message.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    <Box className="flex items-start justify-between">
                      <Box className="flex-1 min-w-0">
                        <Typography variant="subtitle2" className={`font-medium ${!message.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {message.from}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 truncate">
                          {message.subject}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 dark:text-gray-500">
                          {message.timestamp}
                        </Typography>
                      </Box>
                      {!message.isRead && (
                        <Box className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-2"></Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Recent Vitals */}
            <Card className="p-6">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Vitals
                </Typography>
                <Button variant="outline" size="sm">
                  Log Vitals
                </Button>
              </Box>

              <Box className="space-y-3">
                {recentVitals.map((vital, index) => (
                  <Box key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Box className="flex items-center space-x-3">
                      {getVitalIcon(vital.type)}
                      <Box>
                        <Typography variant="subtitle2" className="font-medium text-gray-900 dark:text-white capitalize">
                          {vital.type.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          {new Date(vital.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="text-right">
                      <Typography variant="subtitle2" className="font-medium text-gray-900 dark:text-white">
                        {vital.value} {vital.unit}
                      </Typography>
                      <Badge variant={getStatusColor(vital.status) as any} size="sm">
                        {vital.status}
                      </Badge>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Patient Onboarding Modal */}
      <PatientOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        workspaceName="Your Pharmacy" // This should be dynamic based on workspace
        patientName="Patient" // This should be dynamic based on patient user
      />
    </Box>
  );
};

export default PatientDashboard;