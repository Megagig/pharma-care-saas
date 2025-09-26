// // Removed incomplete import: import { usePatientOverview 
import AllergyManagement from './AllergyManagement';

import ConditionManagement from './ConditionManagement';

import MedicationManagement from './MedicationManagement';

import ClinicalAssessment from './ClinicalAssessment';

import DTPManagement from './DTPManagement';

import CarePlanManagement from './CarePlanManagement';

import VisitManagement from './VisitManagement';

import { Button, Card, CardContent, Tooltip, Alert, Skeleton, Avatar, Tabs } from '@/components/ui/button';
// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
}
// Helper function for tab accessibility
function a11yProps(index: number) {
  return {
    id: `patient-tab-${index}`,
    'aria-controls': `patient-tabpanel-${index}`,
  };
}
const PatientDetails = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  // RBAC permissions
  // RBAC hook for role-based access control
  useRBAC();
  // React Query hooks
  const {
    data: patientResponse,
    isLoading: patientLoading,
    isError: patientError,
    error,
  } = usePatient(patientId || '');
  const patient = patientResponse?.data?.patient;
  // Utility functions
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
  const formatNigerianPhone = (phone?: string): string => {
    if (!phone) return 'N/A';
    if (phone.startsWith('+234')) {
      const number = phone.slice(4);
      return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(
        6
      )}`;
    }
    return phone;
  };
  const getDisplayName = (patient?: Patient): string => {
    if (!patient) return '';
    return patient.displayName || `${patient.firstName} ${patient.lastName}`;
  };
  const getPatientAge = (patient?: Patient): string => {
    if (!patient) return 'Unknown';
    if (patient.age !== undefined) return `${patient.age} years`;
    if (patient.calculatedAge !== undefined)
      return `${patient.calculatedAge} years`;
    const calculatedAge = calculateAge(patient.dob);
    return calculatedAge ? `${calculatedAge} years` : 'Unknown';
  };
  const getInitials = (patient?: Patient): string => {
    if (!patient) return '??';
    return `${patient.firstName[0] || ''}${
      patient.lastName[0] || ''
    }`.toUpperCase();
  };
  // Tab change handler
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  // Loading state
  if (patientLoading) {
    return (
      <div className="">
        <Skeleton
          
          height={200}
          className=""
        />
        <Skeleton
          
          height={60}
          className=""
        />
        <Skeleton  height={400} className="" />
      </div>
    );
  }
  // Error state
  if (patientError || !patient) {
    return (
      <div className="">
        <Alert severity="error" className="">
          <div >Failed to load patient details</div>
          <div >
            {error instanceof Error
              ? error.message
              : 'Patient not found or unable to load patient data.'}
          </div>
        </Alert>
        <Button
          
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
        >
          Back to Patients
        </Button>
      </div>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <IconButton onClick={() => navigate('/patients')} className="">
          <ArrowBackIcon />
        </IconButton>
        <div className="">
          <div  className="">
            Patient Details
          </div>
          <div  color="text.secondary">
            Comprehensive patient information and medical records
          </div>
        </div>
        <div direction="row" spacing={1}>
          <RBACGuard action="canUpdate">
            <Tooltip title="Edit Patient">
              <IconButton
                color="primary"
                onClick={() => navigate(`/patients/${patientId}/edit`)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </RBACGuard>
          <Tooltip title="Print Profile">
            <IconButton
              color="primary"
              >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton
              color="primary"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({}
                    title: `Patient Profile - ${getDisplayName(patient)}`,
                    text: `Patient profile for ${getDisplayName(
                      patient
                    )} (MRN: ${patient.mrn})`,
                    url: window.location.href}
                } else {
                  // Fallback: copy URL to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  // You could add a toast notification here
                }>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      {/* Patient Header Card */}
      <Card className="">
        <CardContent className="">
          <div className="">
            <Avatar
              className=""
            >
              {getInitials(patient)}
            </Avatar>
            <div className="">
              <div  className="">
                {getDisplayName(patient)}
                {patient.otherNames && (
                  <div
                    component="span"
                    
                    color="text.secondary"
                    className=""
                  >
                    ({patient.otherNames})
                  </div>
                )}
              </div>
              <div
                
                color="text.secondary"
                className=""
              >
                MRN: {patient.mrn}
              </div>
              <div direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${getPatientAge(patient)} • ${
                    patient.gender || 'Unknown'
                  }`}
                  
                  size="small"
                />
                {patient.bloodGroup && (
                  <Chip
                    label={`Blood: ${patient.bloodGroup}`}
                    color="primary"
                    
                    size="small"
                  />
                )}
                {patient.genotype && (
                  <Chip
                    label={`Genotype: ${patient.genotype}`}
                    color={
                      patient.genotype.includes('S') ? 'warning' : 'success'}
                    }
                    
                    size="small"
                  />
                )}
                {patient.hasActiveDTP && (
                  <Chip
                    label="Active DTP"
                    color="error"
                    size="small"
                    icon={<WarningIcon />}
                  />
                )}
              </div>
            </div>
            <div spacing={1} alignItems="flex-end">
              <div  color="text.secondary">
                Contact
              </div>
              <div >
                {formatNigerianPhone(patient.phone)}
              </div>
              <div  color="text.secondary">
                {patient.email || 'No email'}
              </div>
              <div >
                {patient.state && patient.lga
                  ? `${patient.lga}, ${patient.state}`
                  : patient.state || 'Unknown location'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabs */}
      <Card>
        <div className="">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            
            scrollButtons="auto"
            aria-label="patient details tabs"
          >
            <Tab
              label="Overview"
              icon={<AccountBoxIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label="Allergies"
              icon={<LocalHospitalIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              label="Conditions"
              icon={<PersonIcon />}
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab
              label="Medications"
              icon={<MedicationIcon />}
              iconPosition="start"
              {...a11yProps(3)}
            />
            <Tab
              label="Assessments"
              icon={<AssessmentIcon />}
              iconPosition="start"
              {...a11yProps(4)}
            />
            <Tab
              label="Care Plans"
              icon={<AssignmentIcon />}
              iconPosition="start"
              {...a11yProps(5)}
            />
            <Tab
              label="Visits"
              icon={<VisibilityIcon />}
              iconPosition="start"
              {...a11yProps(6)}
            />
            <Tab
              label="DTPs"
              icon={<WarningIcon />}
              iconPosition="start"
              {...a11yProps(7)}
            />
          </Tabs>
        </div>
        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          <PatientOverviewTab patient={patient} />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <AllergiesTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <ConditionsTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <MedicationsTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <AssessmentsTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <CarePlansTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={6}>
          <VisitsTab patientId={patientId!} />
        </TabPanel>
        <TabPanel value={currentTab} index={7}>
          <DTPs patientId={patientId!} />
        </TabPanel>
      </Card>
    </div>
  );
};
// Overview Tab Component
const PatientOverviewTab = ({ patient }: { patient: Patient }) => {
  return (
    <div
      className="">
      <Card >
        <CardContent>
          <div  className="">
            Demographics
          </div>
          <div spacing={2}>
            <div>
              <div  color="text.secondary">
                Full Name
              </div>
              <div >
                {patient.firstName} {patient.lastName}
                {patient.otherNames && ` (${patient.otherNames})`}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Date of Birth
              </div>
              <div >
                {patient.dob
                  ? new Date(patient.dob).toLocaleDateString()
                  : 'Not specified'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Gender
              </div>
              <div  className="">
                {patient.gender || 'Not specified'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Marital Status
              </div>
              <div  className="">
                {patient.maritalStatus || 'Not specified'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card >
        <CardContent>
          <div  className="">
            Medical Information
          </div>
          <div spacing={2}>
            <div>
              <div  color="text.secondary">
                Blood Group
              </div>
              <div >
                {patient.bloodGroup || 'Not determined'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Genotype
              </div>
              <div >
                {patient.genotype || 'Not determined'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Weight
              </div>
              <div >
                {patient.weightKg ? `${patient.weightKg} kg` : 'Not recorded'}
              </div>
            </div>
            {patient.latestVitals && (
              <div>
                <div  color="text.secondary">
                  Latest Vitals
                </div>
                <div >
                  BP: {patient.latestVitals.bpSys}/{patient.latestVitals.bpDia}{' '}
                  mmHg
                  {patient.latestVitals.tempC &&
                    `, Temp: ${patient.latestVitals.tempC}°C`}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card  className="">
        <CardContent>
          <div  className="">
            Contact & Location
          </div>
          <div
            className="">
            <div>
              <div  color="text.secondary">
                Phone
              </div>
              <div >
                {patient.phone || 'Not provided'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Email
              </div>
              <div >
                {patient.email || 'Not provided'}
              </div>
            </div>
            <div>
              <div  color="text.secondary">
                Location
              </div>
              <div >
                {patient.state && patient.lga
                  ? `${patient.lga}, ${patient.state}`
                  : patient.state || 'Not specified'}
              </div>
            </div>
            {patient.address && (
              <div className="">
                <div  color="text.secondary">
                  Address
                </div>
                <div >{patient.address}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
// Placeholder tab components (to be implemented in subsequent tasks)
const AllergiesTab = ({ patientId }: { patientId: string }) => (
  <AllergyManagement patientId={patientId} />
);
const ConditionsTab = ({ patientId }: { patientId: string }) => (
  <ConditionManagement patientId={patientId} />
);
const MedicationsTab = ({ patientId }: { patientId: string }) => (
  <MedicationManagement patientId={patientId} />
);
const AssessmentsTab = ({ patientId }: { patientId: string }) => (
  <ClinicalAssessment patientId={patientId} />
);
const CarePlansTab = ({ patientId }: { patientId: string }) => (
  <CarePlanManagement patientId={patientId} />
);
const DTPs = ({ patientId }: { patientId: string }) => (
  <DTPManagement patientId={patientId} />
);
const VisitsTab = ({ patientId }: { patientId: string }) => (
  <VisitManagement patientId={patientId} />
);
export default PatientDetails;
