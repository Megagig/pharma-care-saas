import * as React from "react";
import { useParams, useNavigate } from 'react-router-dom';

import PatientClinicalNotes from './PatientClinicalNotes';
import PatientLabOrderWidget from './PatientLabOrderWidget';
import PatientTimelineWidget from './PatientTimelineWidget';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Icons - these should be replaced with proper icon imports
const ArrowBackIcon = ({ className }: { className?: string }) => <span className={className}>←</span>;
const EditIcon = ({ className }: { className?: string }) => <span className={className}>✏️</span>;
const PrintIcon = ({ className }: { className?: string }) => <span className={className}>🖨️</span>;
const ShareIcon = ({ className }: { className?: string }) => <span className={className}>🔗</span>;
const MedicationIcon = ({ className }: { className?: string }) => <span className={className}>💊</span>;
const WarningIcon = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
const AssessmentIcon = ({ className }: { className?: string }) => <span className={className}>📊</span>;
const ScheduleIcon = ({ className }: { className?: string }) => <span className={className}>📅</span>;
const ScienceIcon = ({ className }: { className?: string }) => <span className={className}>🔬</span>;
const TimelineIcon = ({ className }: { className?: string }) => <span className={className}>📈</span>;
const PersonIcon = ({ className }: { className?: string }) => <span className={className}>👤</span>;
const PhoneIcon = ({ className }: { className?: string }) => <span className={className}>📞</span>;
const EmailIcon = ({ className }: { className?: string }) => <span className={className}>✉️</span>;
const LocationOnIcon = ({ className }: { className?: string }) => <span className={className}>📍</span>;
const CakeIcon = ({ className }: { className?: string }) => <span className={className}>🎂</span>;
const AssignmentIcon = ({ className }: { className?: string }) => <span className={className}>📋</span>;

// Mock PatientMTRWidget component
const PatientMTRWidget = ({ patientId }: { patientId: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>MTR Integration</CardTitle>
    </CardHeader>
    <CardContent>
      <div>MTR Widget for patient {patientId}</div>
    </CardContent>
  </Card>
);

// Mock hooks - these should be replaced with actual implementations
const usePatient = (id: string) => ({
  data: {
    patient: {
      firstName: '',
      lastName: '',
      mrn: '',
      age: 0,
      gender: '',
      bloodGroup: '',
      genotype: '',
      dob: '',
      phone: '',
      email: '',
      state: '',
      lga: ''
    }
  },
  isLoading: false,
  isError: false,
  error: null
});

const usePatientSummary = (id: string) => ({
  data: {
    counts: {
      currentMedications: 0,
      hasActiveDTP: false,
      conditions: 0,
      visits: 0,
      interventions: 0,
      activeInterventions: 0
    }
  },
  isLoading: false,
  isError: false
});

const usePatientLabOrders = (id: string, options: any) => ({
  data: [],
  isLoading: false
});

const useFeatureFlags = () => ({
  isFeatureEnabled: (flag: string) => flag !== 'clinical_notes'
});

const extractData = (response: any) => response?.data || {};

// Mock types
interface Patient {
  firstName: string;
  lastName: string;
  mrn: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  genotype?: string;
  dob?: string;
  phone?: string;
  email?: string;
  state?: string;
  lga?: string;
}

interface PatientDashboardProps {
  patientId?: string;
}
const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientId: propPatientId
}) => {
  const { patientId: routePatientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patientId = propPatientId || routePatientId;
  // Feature flags
  const { isFeatureEnabled } = useFeatureFlags();
  const hasClinicalNotesFeature = isFeatureEnabled('clinical_notes');
  // React Query hooks
  const {
    data: patientResponse,
    isLoading: patientLoading,
    isError: patientError,
    error,
  } = usePatient(patientId!);
  const {
    data: summaryResponse,
    isLoading: summaryLoading,
    isError: summaryError,
  } = usePatientSummary(patientId!);
  const { data: labOrders = [], isLoading: labOrdersLoading } =
    usePatientLabOrders(patientId!, { enabled: !!patientId });
  const patientData = extractData(patientResponse)?.patient;
  const summaryData = extractData(summaryResponse);
  // Extract real data from API response
  const overview = summaryData
    ? {
      totalActiveMedications: summaryData.counts?.currentMedications || 0,
      totalActiveDTPs: summaryData.counts?.hasActiveDTP ? 1 : 0, // Convert boolean to count
      totalActiveConditions: summaryData.counts?.conditions || 0,
      recentVisits: summaryData.counts?.visits || 0,
      totalInterventions: summaryData.counts?.interventions || 0,
      activeInterventions: summaryData.counts?.activeInterventions || 0,
    }
    : {
      totalActiveMedications: 0,
      totalActiveDTPs: 0,
      totalActiveConditions: 0,
      recentVisits: 0,
      totalInterventions: 0,
      activeInterventions: 0,
    };
  if (patientLoading || summaryLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-2">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-36 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (patientError || summaryError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load patient data.{' '}
            {error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2"
        >
          <ArrowBackIcon />
          Back to Patients
        </Button>
      </div>
    );
  }
  if (!patientData) {
    return (
      <div className="space-y-4">
        <Alert className="mb-4">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Patient not found. The requested patient could not be found.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2"
        >
          <ArrowBackIcon />
          Back to Patients
        </Button>
      </div>
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
    <div className="space-y-6">
      {/* Header with Patient Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowBackIcon />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {getInitials(patientData.firstName, patientData.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {patientData.firstName} {patientData.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                MRN: {patientData.mrn}
              </span>
              <Badge variant="outline">
                {getPatientAge(patientData)} • {patientData.gender || 'Unknown'}
              </Badge>
              {patientData.bloodGroup && (
                <Badge variant="secondary">
                  {patientData.bloodGroup}
                </Badge>
              )}
              {patientData.genotype && (
                <Badge variant={patientData.genotype.includes('S') ? "destructive" : "default"}>
                  {patientData.genotype}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${patientId}/edit`)}>
            <EditIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.print()}>
            <PrintIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Patient Profile - ${patientData.firstName} ${patientData.lastName}`,
                  text: `Patient profile for ${patientData.firstName} ${patientData.lastName} (MRN: ${patientData.mrn})`,
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <ShareIcon />
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-blue-100">
              <MedicationIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {overview?.totalActiveMedications || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Medications
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-yellow-100">
              <WarningIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {overview?.totalActiveDTPs || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Active DTPs
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-green-100">
              <AssessmentIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {overview?.totalActiveConditions || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Conditions
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-purple-100">
              <ScheduleIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {overview?.recentVisits || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Recent Visits
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-indigo-100">
              <ScienceIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {labOrdersLoading ? '...' : labOrders.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Lab Orders
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-pink-100">
              <TimelineIcon />
            </Avatar>
            <div>
              <div className="text-2xl font-bold">
                {overview?.totalInterventions || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Interventions
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MTR Integration Widget */}
      <div>
        <PatientMTRWidget patientId={patientId!} />
      </div>

      {/* Clinical Notes Widget - Only show if feature is enabled */}
      {hasClinicalNotesFeature && (
        <div>
          <PatientClinicalNotes
            patientId={patientId!}
            maxNotes={5}
            showCreateButton={true}
          />
        </div>
      )}

      {/* Lab Order History Widget */}
      <div>
        <PatientLabOrderWidget
          patientId={patientId!}
          maxOrders={3}
          onViewOrder={(orderId: string) => {
            // Navigate to order details
            navigate(`/lab-orders/${orderId}`);
          }}
          onViewResults={(orderId: string) => {
            // Navigate to results entry/view
            navigate(`/lab-orders/${orderId}/results`);
          }}
          onViewAllOrders={() => {
            // Navigate to full lab order history
            navigate(`/patients/${patientId}/lab-orders`);
          }}
        />
      </div>

      {/* Patient Details and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PersonIcon />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <PhoneIcon className="mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Phone
                  </div>
                  <div className="font-medium">
                    {patientData.phone || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <EmailIcon className="mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Email
                  </div>
                  <div className="font-medium">
                    {patientData.email || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LocationOnIcon className="mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Location
                  </div>
                  <div className="font-medium">
                    {patientData.state || 'Unknown'},{' '}
                    {patientData.lga || 'Unknown LGA'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CakeIcon className="mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Date of Birth
                  </div>
                  <div className="font-medium">
                    {patientData.dob
                      ? new Date(patientData.dob).toLocaleDateString()
                      : 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Timeline */}
        <div>
          <PatientTimelineWidget
            patientId={patientId!}
            maxItems={5}
            onViewLabOrder={(orderId: string) => {
              navigate(`/lab-orders/${orderId}`);
            }}
            onViewClinicalNote={(noteId: string) => {
              navigate(`/clinical-notes/${noteId}`);
            }}
            onViewMTR={(mtrId: string) => {
              navigate(`/mtr/${mtrId}`);
            }}
          />
        </div>
      </div>

      {/* Patient Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AssignmentIcon />
            Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {summaryData?.counts?.hasActiveDTP && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WarningIcon />
                Has Active DTP
              </Badge>
            )}
            {summaryData?.counts?.hasActiveInterventions && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TimelineIcon />
                Active Interventions
              </Badge>
            )}
            {overview?.totalActiveMedications > 0 && (
              <Badge variant="outline">
                {overview.totalActiveMedications} Active Medications
              </Badge>
            )}
            {overview?.totalActiveConditions > 0 && (
              <Badge variant="default">
                {overview.totalActiveConditions} Active Conditions
              </Badge>
            )}
            {!summaryData?.counts?.hasActiveDTP &&
              !summaryData?.counts?.hasActiveInterventions &&
              overview?.totalActiveMedications === 0 &&
              overview?.totalActiveConditions === 0 && (
                <div className="text-sm text-muted-foreground">
                  No active clinical issues identified
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default PatientDashboard;
