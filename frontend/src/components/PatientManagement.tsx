import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  FileText,
  User,
  Stethoscope,
  Pill,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Eye,
  Activity
} from 'lucide-react';

// Import existing components
import PatientDashboard from './PatientDashboard';
import AllergyManagement from './AllergyManagement';
import ConditionManagement from './ConditionManagement';
import MedicationManagement from './MedicationManagement';
import ClinicalAssessment from './ClinicalAssessment';
import DTPManagement from './DTPManagement';
import CarePlanManagement from './CarePlanManagement';
import VisitManagement from './VisitManagement';
import PatientMTRWidget from './PatientMTRWidget';
import PatientClinicalNotes from './PatientClinicalNotes';
import MTRStatusIndicator from './MTRStatusIndicator';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md ${props.className || ''
    }`}>
    {children}
  </div>
);

const MockSkeleton = ({ ...props }: any) => (
  <div {...props} className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${props.className || ''}`}></div>
);

const MockTabs = ({ children, value, onValueChange, ...props }: any) => (
  <div {...props} className={`w-full ${props.className || ''}`}>
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === MockTabsList) {
        return React.cloneElement(child as React.ReactElement<any>, {
          value,
          onValueChange,
          ...(child.props || {})
        });
      }
      return child;
    })}
  </div>
);

const MockTabsList = ({ children, value, onValueChange, ...props }: any) => (
  <div {...props} className={`grid w-full grid-cols-10 border-b ${props.className || ''}`}>
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === MockTabsTrigger) {
        return React.cloneElement(child as React.ReactElement<any>, {
          value,
          onValueChange,
          ...(child.props || {})
        });
      }
      return child;
    })}
  </div>
);

const MockTabsTrigger = ({ children, value, onClick, ...props }: any) => {
  const isActive = value === props.value;
  const className = `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${isActive
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } ${props.className || ''}`;

  return (
    <button {...props} className={className} onClick={onClick}>
      {children}
    </button>
  );
};

const MockTabsContent = ({ children, value, ...props }: any) => (
  <div {...props} className={`mt-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.variant === 'destructive'
      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
    } ${props.className || ''}`}>
    {children}
  </span>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

// Replace imports with mock components
const Button = MockButton;
const Alert = MockAlert;
const Skeleton = MockSkeleton;
const Tabs = MockTabs;
const TabsContent = MockTabsContent;
const TabsList = MockTabsList;
const TabsTrigger = MockTabsTrigger;
const Badge = MockBadge;
const Card = MockCard;
const CardContent = MockCardContent;

// Mock utility functions
const extractData = (response: any) => {
  return response?.data;
};

// Mock hooks
const usePatient = (patientId: string) => {
  return {
    data: {
      data: {
        patient: {
          id: patientId,
          firstName: 'John',
          lastName: 'Doe',
          mrn: '12345',
          hasActiveDTP: false,
          genotype: 'AA'
        }
      }
    },
    isLoading: false,
    isError: false,
    error: null
  };
};

const useRBAC = () => {
  // Mock implementation
};

const PatientManagement = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // RBAC permissions
  useRBAC();

  // React Query hooks
  const {
    data: patientResponse,
    isLoading: patientLoading,
    isError: patientError,
    error,
  } = usePatient(patientId || '');

  const patient = extractData(patientResponse)?.patient;

  // Loading state
  if (patientLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (patientError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Patient Management</h1>
        </div>
        <Alert className="mb-6 border-red-200 bg-red-50">
          <div className="text-red-800">
            <div className="font-semibold">Failed to load patient</div>
            <div className="mt-1">
              {(error as any)?.message ||
                'An unexpected error occurred while loading patient data.'}
            </div>
          </div>
        </Alert>
        <Button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </Button>
      </div>
    );
  }

  // Patient not found state
  if (!patient) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Patient Management</h1>
        </div>
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <div className="text-yellow-800">
            <div className="font-semibold">Patient not found</div>
            <div className="mt-1">
              The requested patient could not be found.
            </div>
          </div>
        </Alert>
        <Button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/patients')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-600">MRN: {patient.mrn}</span>
                {patient.hasActiveDTP && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Active DTPs
                  </Badge>
                )}
                {patient.genotype &&
                  ['SS', 'SC', 'CC'].includes(patient.genotype) && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Stethoscope size={12} />
                      Sickle Cell - {patient.genotype}
                    </Badge>
                  )}
                <MTRStatusIndicator
                  patientId={patientId || ''}
                  showActions={false}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/patients/${patientId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Patient
          </Button>
        </div>

        {/* Navigation Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('dashboard')}
                >
                  <Activity size={14} />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('notes')}
                >
                  <FileText size={14} />
                  Clinical Notes
                </TabsTrigger>
                <TabsTrigger
                  value="allergies"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('allergies')}
                >
                  <User size={14} />
                  Allergies
                </TabsTrigger>
                <TabsTrigger
                  value="conditions"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('conditions')}
                >
                  <Stethoscope size={14} />
                  Conditions
                </TabsTrigger>
                <TabsTrigger
                  value="medications"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('medications')}
                >
                  <Pill size={14} />
                  Medications
                </TabsTrigger>
                <TabsTrigger
                  value="assessments"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('assessments')}
                >
                  <ClipboardList size={14} />
                  Assessments
                </TabsTrigger>
                <TabsTrigger
                  value="dtps"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('dtps')}
                >
                  <AlertTriangle size={14} />
                  DTPs
                </TabsTrigger>
                <TabsTrigger
                  value="careplans"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('careplans')}
                >
                  <ClipboardList size={14} />
                  Care Plans
                </TabsTrigger>
                <TabsTrigger
                  value="visits"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('visits')}
                >
                  <Eye size={14} />
                  Visits
                </TabsTrigger>
                <TabsTrigger
                  value="mtr"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentTab('mtr')}
                >
                  <Calendar size={14} />
                  MTR Sessions
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="dashboard">
                  <PatientDashboard patientId={patientId} />
                </TabsContent>

                <TabsContent value="notes">
                  <PatientClinicalNotes
                    patientId={patientId || ''}
                    maxNotes={10}
                    showCreateButton={true}
                    onCreateNote={() => navigate(`/notes/new?patientId=${patientId}`)}
                    onViewNote={(noteId) => navigate(`/notes/${noteId}`)}
                    onEditNote={(noteId) => navigate(`/notes/${noteId}/edit`)}
                  />
                </TabsContent>

                <TabsContent value="allergies">
                  <AllergyManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="conditions">
                  <ConditionManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="medications">
                  <MedicationManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="assessments">
                  <ClinicalAssessment patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="dtps">
                  <DTPManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="careplans">
                  <CarePlanManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="visits">
                  <VisitManagement patientId={patientId || ''} />
                </TabsContent>

                <TabsContent value="mtr">
                  <PatientMTRWidget patientId={patientId || ''} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientManagement;