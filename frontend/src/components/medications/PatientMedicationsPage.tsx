import {
  useAdherenceLogs,
  useMedicationsByPatient,
  useCreateMedication,
  useUpdateMedication,
  useArchiveMedication,
  useLogAdherence,
  useAdherenceAnalytics,
  usePrescriptionPatternAnalytics,
  useInteractionAnalytics,
  usePatientMedicationSummary,
} from '@/queries/medicationManagementQueries';
import { usePatient } from '@/queries/usePatients';


import dayjs from 'dayjs';

import MedicationSettingsPanel from './MedicationSettingsPanel_fixed';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Simple textarea component
const Textarea = ({ value, onChange, rows = 3, placeholder, id, name }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
  name?: string;
}) => (
  <textarea
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    rows={rows}
    placeholder={placeholder}
    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

// Simple icons
const PersonIcon = () => <span>👤</span>;
const AddIcon = () => <span>+</span>;
const EditIcon = () => <span>✏️</span>;
const HistoryIcon = () => <span>📜</span>;
const DeleteIcon = () => <span>🗑️</span>;
const WarningIcon = () => <span>⚠️</span>;
const ScheduleIcon = () => <span>⏰</span>;

// Simple date picker components
const DatePicker = ({ value, onChange }: { value: any; onChange: (date: any) => void }) => (
  <input
    type="date"
    value={value ? value.format('YYYY-MM-DD') : ''}
    onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)}
    className="w-full p-2 border border-gray-300 rounded-md"
  />
);

// Simple LocalizationProvider wrapper
const LocalizationProvider = ({ children }: { children: React.ReactNode; dateAdapter?: any }) => (
  <>{children}</>
);

// Chart components
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

// React hooks and router
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

// Types
import {
  AdherenceLogData,
  MedicationCreateData,
  MedicationData as ImportedMedicationData,
} from '@/services/medicationManagementService_fixed';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  indication: string;
  prescriber: string;
  cost?: number;
  sellingPrice?: number;
  allergyCheck: {
    status: boolean;
    details: string;
  };
  status: 'active' | 'archived' | 'cancelled';
  patientId: string;
  reminders?: MedicationReminder[];
}

interface LocalMedicationData {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string | Date | undefined;
  endDate: string | Date | undefined;
  indication: string;
  prescriber: string;
  cost?: number;
  sellingPrice?: number;
  allergyCheck: {
    status: boolean;
    details: string;
  };
  status: 'active' | 'archived' | 'cancelled';
  patientId: string;
  reminders?: MedicationReminder[];
}

interface MedicationFormValues {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date | null;
  endDate: Date | null;
  indication: string;
  prescriber: string;
  cost: number | string;
  sellingPrice: number | string;
  allergyCheck: {
    status: boolean;
    details: string;
  };
  status: 'active' | 'archived' | 'cancelled';
  reminders?: MedicationReminder[];
}

interface MedicationReminder {
  id?: string;
  time: string;
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  enabled: boolean;
  notes?: string;
}

interface MedicationListProps {
  medications: (Medication | LocalMedicationData)[];
  onEdit: (medication: Medication | LocalMedicationData) => void;
  onArchive: (medicationId: string) => void;
  onAddAdherence: (medicationId: string) => void;
  onViewHistory: (medicationId: string) => void;
  isArchived?: boolean;
  showStatus?: boolean;
}

interface AdherenceRecord {
  id: string;
  medicationId: string;
  refillDate: string | Date;
  adherenceScore: number;
  pillCount: number;
  notes: string;
  createdAt: string | Date;
}

const initialFormValues: MedicationFormValues = {
  name: '',
  dosage: '',
  frequency: '',
  route: 'oral',
  startDate: new Date(),
  endDate: null,
  indication: '',
  prescriber: '',
  cost: '',
  sellingPrice: '',
  allergyCheck: {
    status: false,
    details: '',
  },
  status: 'active',
};

const routeOptions = [
  { value: 'oral', label: 'Oral' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhalation', label: 'Inhalation' },
  { value: 'injection', label: 'Injection' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'vaginal', label: 'Vaginal' },
  { value: 'ophthalmic', label: 'Ophthalmic' },
  { value: 'otic', label: 'Otic' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'other', label: 'Other' },
];

const frequencyOptions = [
  { value: 'once daily', label: 'Once Daily' },
  { value: 'twice daily', label: 'Twice Daily' },
  { value: 'three times daily', label: 'Three Times Daily' },
  { value: 'four times daily', label: 'Four Times Daily' },
  { value: 'every morning', label: 'Every Morning' },
  { value: 'every night', label: 'Every Night' },
  { value: 'as needed', label: 'As Needed (PRN)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'other', label: 'Other' },
];

interface PatientMedicationsPageProps {
  patientId?: string;
}

interface AdherenceData {
  monthlyAdherence: {
    month: string;
    adherence: number;
  }[];
  averageAdherence: number;
  trendDirection: string;
  complianceDays: {
    day: string;
    count: number;
  }[];
}

interface PrescriptionData {
  medicationsByCategory: {
    category: string;
    count: number;
  }[];
  medicationsByRoute: {
    route: string;
    count: number;
  }[];
  prescriptionFrequency: {
    month: string;
    count: number;
  }[];
  topPrescribers: {
    prescriber: string;
    count: number;
  }[];
}

interface InteractionData {
  severityDistribution: {
    severity: string;
    count: number;
  }[];
  interactionTrends: {
    month: string;
    count: number;
  }[];
}

interface MedicationSummaryData {
  activeCount: number;
  archivedCount: number;
  cancelledCount: number;
  adherenceRate: number;
  interactionCount: number;
  mostCommonCategory: string;
  mostCommonRoute: string;
  lastUpdated: string;
}

const PatientMedicationsPage: React.FC<PatientMedicationsPageProps> = ({
  patientId: propPatientId
}) => {
  const { patientId: paramPatientId } = useParams<{ patientId: string }>();
  const patientId = propPatientId || paramPatientId;
  const [tabValue, setTabValue] = useState(0);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [medicationDialogTab, setMedicationDialogTab] = useState(0);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [adherenceDialogOpen, setAdherenceDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<MedicationFormValues>(initialFormValues);
  const [adherenceValues, setAdherenceValues] = useState({
    medicationId: '',
    refillDate: new Date(),
    adherenceScore: 100,
    pillCount: 0,
    notes: '',
  });
  const [currentMedicationId, setCurrentMedicationId] = useState<string | null>(null);
  const [selectedMedicationHistory, setSelectedMedicationHistory] = useState<AdherenceRecord[]>([]);
  const [interactionCheckEnabled, setInteractionCheckEnabled] = useState(true);
  const [interactions, setInteractions] = useState<string[]>([]);

  // Fetch patient data
  const {
    data: patientData,
    isLoading: isLoadingPatient,
    error: patientError,
  } = usePatient(patientId || '');

  // Fetch medications
  const { data: medicationsData, isLoading } = useMedicationsByPatient(patientId || '');

  // Convert medication data to the expected format
  const medications: (Medication | LocalMedicationData)[] = React.useMemo(() => {
    if (!medicationsData) return [];
    return medicationsData.map(
      (med: any) => ({
        id: med._id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        route: med.route,
        startDate: med.startDate,
        endDate: med.endDate,
        indication: med.indication || '',
        prescriber: med.prescriber || '',
        allergyCheck: med.allergyCheck,
        status: med.status,
        patientId: med.patientId,
      } as Medication)
    );
  }, [medicationsData]);

  const { data: adherenceLogs } = useAdherenceLogs(patientId || '');

  // Use real mutations from React Query
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const archiveMutation = useArchiveMedication();
  const createAdherenceMutation = useLogAdherence();



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'allergyCheck') {
        setFormValues({
          ...formValues,
          allergyCheck: {
            ...formValues.allergyCheck,
            [child]: value
          }
        });
      }
    } else {
      setFormValues({
        ...formValues,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    if (name === 'allergyCheck.status') {
      setFormValues({
        ...formValues,
        allergyCheck: {
          ...formValues.allergyCheck,
          status: checked
        }
      });
    } else if (name === 'interactionCheck') {
      setInteractionCheckEnabled(checked);
    }
  };

  const handleStatusChange = (value: string) => {
    setFormValues({
      ...formValues,
      status: value as 'active' | 'archived' | 'cancelled'
    });
  };

  const handleRouteChange = (value: string) => {
    setFormValues({
      ...formValues,
      route: value
    });
  };

  const handleFrequencyChange = (value: string) => {
    setFormValues({
      ...formValues,
      frequency: value
    });
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormValues({
      ...formValues,
      [name]: date
    });
  };

  const handleAdherenceValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdherenceValues({
      ...adherenceValues,
      [name]:
        name === 'adherenceScore' || name === 'pillCount'
          ? parseInt(value, 10) || 0
          : value
    });
  };

  const handleAdherenceDateChange = (date: Date | null) => {
    if (date) {
      setAdherenceValues({
        ...adherenceValues,
        refillDate: date
      });
    }
  };

  const handleAddReminder = () => {
    const newReminder: MedicationReminder = {
      time: '09:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      enabled: true,
    };
    setReminders([...reminders, newReminder]);
  };

  const handleReminderChange = (
    index: number,
    field: keyof MedicationReminder,
    value: string | boolean | string[] | ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  ) => {
    const updatedReminders = [...reminders];
    if (field === 'days') {
      updatedReminders[index] = {
        ...updatedReminders[index],
        [field]: value as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
      };
    } else {
      updatedReminders[index] = {
        ...updatedReminders[index],
        [field]: value,
      };
    }
    setReminders(updatedReminders);
  };

  const handleDeleteReminder = (index: number) => {
    const updatedReminders = [...reminders];
    updatedReminders.splice(index, 1);
    setReminders(updatedReminders);
  };

  const handleOpenMedicationDialog = () => {
    setCurrentMedicationId(null);
    setFormValues(initialFormValues);
    setReminders([]);
    setMedicationDialogTab(0);
    setMedicationDialogOpen(true);
  };

  const handleOpenEditMedicationDialog = (medication: Medication | LocalMedicationData) => {
    setCurrentMedicationId(medication.id);
    setFormValues({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      route: medication.route,
      startDate: medication.startDate ? new Date(medication.startDate) : null,
      endDate: medication.endDate ? new Date(medication.endDate) : null,
      indication: medication.indication,
      prescriber: medication.prescriber,
      cost: medication.cost?.toString() || '',
      sellingPrice: medication.sellingPrice?.toString() || '',
      allergyCheck: medication.allergyCheck,
      status: medication.status,
      reminders: medication.reminders || []
    });

    setReminders(medication.reminders || []);
    setMedicationDialogTab(0);
    setMedicationDialogOpen(true);
  };

  const handleOpenAdherenceDialog = (medicationId: string) => {
    setAdherenceValues({
      ...adherenceValues,
      medicationId
    });
    setAdherenceDialogOpen(true);
  };

  const handleOpenHistoryDialog = (medicationId: string) => {
    if (adherenceLogs) {
      const filteredLogs = adherenceLogs.filter(
        (log: any) => log.medicationId === medicationId
      );
      setSelectedMedicationHistory(
        filteredLogs.map((log: AdherenceLogData) => ({
          id: log._id,
          medicationId: log.medicationId,
          refillDate: log.refillDate,
          adherenceScore: log.adherenceScore,
          pillCount: log.pillCount ?? 0,
          notes: log.notes ?? '',
          createdAt: log.createdAt
        }))
      );
      setHistoryDialogOpen(true);
    }
  };

  const handleOpenArchiveDialog = (medicationId: string) => {
    setCurrentMedicationId(medicationId);
    setArchiveDialogOpen(true);
  };

  const handleSubmitMedication = async () => {
    try {
      if (interactionCheckEnabled && medications && medications.length > 0) {
        const drugNames = medications.map((med) => med.name);
        if (
          !currentMedicationId &&
          drugNames.includes('Warfarin') &&
          formValues.name.includes('Aspirin')
        ) {
          setInteractions([
            'Potential interaction detected: Warfarin + Aspirin may increase bleeding risk',
          ]);
          return;
        }
      }

      const submissionData = {
        ...formValues,
        startDate: formValues.startDate ? formValues.startDate : undefined,
        endDate: formValues.endDate ? formValues.endDate : undefined,
        cost: formValues.cost ? parseFloat(formValues.cost as string) : undefined,
        sellingPrice: formValues.sellingPrice ? parseFloat(formValues.sellingPrice as string) : undefined,
        reminders: reminders,
      };

      if (currentMedicationId) {
        await updateMutation.mutateAsync({
          id: currentMedicationId,
          data: submissionData as Partial<ImportedMedicationData>
        });
      } else {
        const createData = {
          ...submissionData,
          patientId,
        };
        await createMutation.mutateAsync(createData as MedicationCreateData);
      }

      setMedicationDialogOpen(false);
      setFormValues(initialFormValues);
      setInteractions([]);
      setCurrentMedicationId(null);
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const handleSubmitAdherence = async () => {
    try {
      await createAdherenceMutation.mutateAsync({
        ...adherenceValues,
        medicationId: adherenceValues.medicationId || '',
        patientId: patientId || '',
        adherenceScore: adherenceValues.adherenceScore || 100
      });
      setAdherenceDialogOpen(false);
      setAdherenceValues({
        medicationId: '',
        refillDate: new Date(),
        adherenceScore: 100,
        pillCount: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error saving adherence record:', error);
    }
  };

  const handleArchiveMedication = async () => {
    if (!currentMedicationId) return;

    try {
      await archiveMutation.mutateAsync({
        id: currentMedicationId,
        reason: 'Medication archived by user'
      });
      setArchiveDialogOpen(false);
      setCurrentMedicationId(null);
    } catch (error) {
      console.error('Error archiving medication:', error);
    }
  };

  if (!patientId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>No Patient Selected</AlertTitle>
          Please select a patient to manage medications.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const activeMedications = medications?.filter((med) => med.status === 'active') || [];
  const archivedMedications = medications?.filter((med) => med.status === 'archived') || [];
  const cancelledMedications = medications?.filter((med) => med.status === 'cancelled') || [];

  const calculateOverallAdherence = (): number => {
    if (!adherenceLogs || adherenceLogs.length === 0) return 0;
    const totalScore = adherenceLogs.reduce((sum: number, log: any) => sum + log.adherenceScore, 0);
    return Math.round(totalScore / adherenceLogs.length);
  };

  const overallAdherence = calculateOverallAdherence();

  return (
    <div className="space-y-6">
      {/* Patient Information Card */}
      {isLoadingPatient ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        </div>
      ) : patientError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          Error loading patient information. Please try refreshing the page.
        </Alert>
      ) : patientData?.data?.patient ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  <PersonIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {patientData.data.patient.firstName}{' '}
                  {patientData.data.patient.lastName}
                  {patientData.data.patient.otherNames
                    ? ` ${patientData.data.patient.otherNames}`
                    : ''}
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <strong>MRN:</strong>{' '}
                    {patientData.data.patient.mrn || patientData.data.patient._id}
                  </div>
                  <div>
                    <strong>DOB:</strong>{' '}
                    {patientData.data.patient.dob
                      ? new Date(patientData.data.patient.dob).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <div>
                    <strong>Gender:</strong>{' '}
                    {patientData.data.patient.gender || 'N/A'}
                  </div>
                  <div>
                    <strong>Contact:</strong>{' '}
                    {patientData.data.patient.phone ||
                      patientData.data.patient.email ||
                      'None'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medication Management</h1>
        <Button onClick={handleOpenMedicationDialog}>
          <span className="mr-2 h-4 w-4"><AddIcon /></span>
          Add Medication
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Average Adherence Score</div>
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${overallAdherence > 80
                    ? 'text-green-600'
                    : overallAdherence > 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                    {overallAdherence}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Active Medications</div>
            <div className="text-2xl font-bold">{activeMedications.length}</div>
            <div className="text-sm text-gray-500">{archivedMedications.length} archived</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Last Adherence Check</div>
            <div className="text-lg">
              {adherenceLogs && adherenceLogs.length > 0
                ? new Date(adherenceLogs[adherenceLogs.length - 1].createdAt).toLocaleDateString()
                : 'No records'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={tabValue.toString()} onValueChange={v => setTabValue(Number(v))}>
            <TabsList>
              <TabsTrigger value="0">Active Medications</TabsTrigger>
              <TabsTrigger value="1">Archived</TabsTrigger>
              <TabsTrigger value="2">Cancelled</TabsTrigger>
              <TabsTrigger value="3">Analytics</TabsTrigger>
              <TabsTrigger value="4">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="0" className="space-y-4">
              {activeMedications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active medications found. Click "Add Medication" to get started.
                </div>
              ) : (
                <MedicationList
                  medications={activeMedications}
                  onEdit={handleOpenEditMedicationDialog}
                  onArchive={handleOpenArchiveDialog}
                  onAddAdherence={handleOpenAdherenceDialog}
                  onViewHistory={handleOpenHistoryDialog}
                />
              )}
            </TabsContent>

            <TabsContent value="1" className="space-y-4">
              {archivedMedications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No archived medications found.
                </div>
              ) : (
                <MedicationList
                  medications={archivedMedications}
                  onEdit={handleOpenEditMedicationDialog}
                  onArchive={handleOpenArchiveDialog}
                  onAddAdherence={handleOpenAdherenceDialog}
                  onViewHistory={handleOpenHistoryDialog}
                  isArchived={true}
                />
              )}
            </TabsContent>

            <TabsContent value="2" className="space-y-4">
              {cancelledMedications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cancelled medications found.
                </div>
              ) : (
                <MedicationList
                  medications={cancelledMedications}
                  onEdit={handleOpenEditMedicationDialog}
                  onArchive={handleOpenArchiveDialog}
                  onAddAdherence={handleOpenAdherenceDialog}
                  onViewHistory={handleOpenHistoryDialog}
                  isArchived={true}
                />
              )}
            </TabsContent>

            <TabsContent value="3" className="space-y-4">
              <MedicationAnalyticsPanel patientId={patientId} />
            </TabsContent>

            <TabsContent value="4" className="space-y-4">
              <MedicationSettingsPanel patientId={patientId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Medication Dialog */}
      <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentMedicationId ? 'Edit Medication' : 'Add New Medication'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={medicationDialogTab.toString()} onValueChange={v => setMedicationDialogTab(Number(v))}>
            <TabsList>
              <TabsTrigger value="0">Medication Details</TabsTrigger>
              <TabsTrigger value="1">Reminders & Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="0" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medication Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    value={formValues.dosage}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formValues.frequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">Route</Label>
                  <Select value={formValues.route} onValueChange={handleRouteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <LocalizationProvider>
                    <DatePicker
                      value={formValues.startDate ? dayjs(formValues.startDate) : null}
                      onChange={(date: any) => handleDateChange('startDate', date ? new Date(date.toString()) : null)}
                    />
                  </LocalizationProvider>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <LocalizationProvider>
                    <DatePicker
                      value={formValues.endDate ? dayjs(formValues.endDate) : null}
                      onChange={(date: any) => handleDateChange('endDate', date ? new Date(date.toString()) : null)}
                    />
                  </LocalizationProvider>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indication">Indication</Label>
                  <Input
                    id="indication"
                    name="indication"
                    value={formValues.indication}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prescriber">Prescriber</Label>
                  <Input
                    id="prescriber"
                    name="prescriber"
                    value={formValues.prescriber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost Price (₦)</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    value={formValues.cost}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">Optional - Cost price in Naira</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (₦)</Label>
                  <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    value={formValues.sellingPrice}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">Optional - Selling price in Naira</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allergy-status"
                    name="allergyCheck.status"
                    checked={formValues.allergyCheck.status}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'allergyCheck.status')}
                  />
                  <Label htmlFor="allergy-status">Patient has allergies related to this medication</Label>
                </div>

                {formValues.allergyCheck.status && (
                  <div className="space-y-2">
                    <Label htmlFor="allergy-details">Allergy Details</Label>
                    <Textarea
                      id="allergy-details"
                      name="allergyCheck.details"
                      value={formValues.allergyCheck.details}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="interaction-check"
                    name="interactionCheck"
                    checked={interactionCheckEnabled}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'interactionCheck')}
                  />
                  <Label htmlFor="interaction-check">Check for drug interactions before saving</Label>
                </div>

                {currentMedicationId && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formValues.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {interactions.length > 0 && (
                  <Alert>
                    <AlertTitle>Potential Interactions Detected</AlertTitle>
                    <ul className="list-disc list-inside">
                      {interactions.map((interaction, index) => (
                        <li key={index}>{interaction}</li>
                      ))}
                    </ul>
                    <p className="text-sm mt-2">
                      Override and continue? Check with prescriber first.
                    </p>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="1" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Medication Reminders</h3>
                <Button onClick={handleAddReminder} variant="outline">
                  <span className="mr-2 h-4 w-4"><AddIcon /></span>
                  Add Reminder
                </Button>
              </div>

              {reminders.length === 0 ? (
                <Alert>
                  <AlertTitle>No Reminders</AlertTitle>
                  No reminders set for this medication. Add a reminder to help the patient stay on schedule.
                </Alert>
              ) : (
                <div className="space-y-4">
                  {reminders.map((reminder, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                              type="time"
                              value={reminder.time}
                              onChange={(e) => handleReminderChange(index, 'time', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Days</Label>
                            <Select
                              value={reminder.days.join(',')}
                              onValueChange={(value) => handleReminderChange(index, 'days', value.split(','))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mon">Monday</SelectItem>
                                <SelectItem value="tue">Tuesday</SelectItem>
                                <SelectItem value="wed">Wednesday</SelectItem>
                                <SelectItem value="thu">Thursday</SelectItem>
                                <SelectItem value="fri">Friday</SelectItem>
                                <SelectItem value="sat">Saturday</SelectItem>
                                <SelectItem value="sun">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={reminder.enabled}
                                onCheckedChange={(checked) => handleReminderChange(index, 'enabled', checked)}
                              />
                              <span>{reminder.enabled ? 'Enabled' : 'Disabled'}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Actions</Label>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteReminder(index)}
                            >
                              <span className="mr-2 h-4 w-4"><DeleteIcon /></span>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            placeholder="Additional instructions for this reminder..."
                            value={reminder.notes || ''}
                            onChange={(e) => handleReminderChange(index, 'notes', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMedicationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitMedication}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adherence Dialog */}
      <Dialog open={adherenceDialogOpen} onOpenChange={setAdherenceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Medication Adherence</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Refill Date</Label>
              <LocalizationProvider>
                <DatePicker
                  value={dayjs(adherenceValues.refillDate)}
                  onChange={(date: any) => handleAdherenceDateChange(date ? new Date(date.toString()) : null)}
                />
              </LocalizationProvider>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adherenceScore">Adherence Score (%)</Label>
              <Input
                id="adherenceScore"
                name="adherenceScore"
                type="number"
                min="0"
                max="100"
                value={adherenceValues.adherenceScore}
                onChange={handleAdherenceValueChange}
              />
              <p className="text-xs text-gray-500">0% = No adherence, 100% = Perfect adherence</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pillCount">Remaining Pill Count</Label>
              <Input
                id="pillCount"
                name="pillCount"
                type="number"
                min="0"
                value={adherenceValues.pillCount}
                onChange={handleAdherenceValueChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={adherenceValues.notes}
                onChange={(e) => setAdherenceValues({
                  ...adherenceValues,
                  notes: e.target.value
                })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdherenceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdherence}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medication History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medication Adherence History</DialogTitle>
          </DialogHeader>

          {selectedMedicationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No adherence records found for this medication.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedMedicationHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {new Date(record.refillDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          <div>Pill Count: {record.pillCount}</div>
                          {record.notes && (
                            <div className="mt-1">Notes: {record.notes}</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Adherence Score:</div>
                        <Badge variant={
                          record.adherenceScore > 80
                            ? 'default'
                            : record.adherenceScore > 50
                              ? 'secondary'
                              : 'destructive'
                        }>
                          {record.adherenceScore}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Medication</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to archive this medication? This will mark it
            as no longer active, but the record will be preserved for historical
            purposes.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchiveMedication}>
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Medication List Component
const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  onEdit,
  onArchive,
  onAddAdherence,
  onViewHistory,
  isArchived = false,
  showStatus = false
}) => {
  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <Card key={medication.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{medication.name}</h3>
                <p className="text-gray-600">
                  {medication.dosage} - {medication.frequency} ({medication.route})
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <strong>Start Date:</strong>{' '}
                    {medication.startDate
                      ? new Date(medication.startDate).toLocaleDateString()
                      : 'Not specified'}
                  </div>
                  {medication.endDate && (
                    <div>
                      <strong>End Date:</strong> {new Date(medication.endDate).toLocaleDateString()}
                    </div>
                  )}

                  {medication.reminders && medication.reminders.length > 0 && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <span className="h-4 w-4"><ScheduleIcon /></span>
                      <span>
                        {medication.reminders.length} Reminder
                        {medication.reminders.length > 1 ? 's' : ''} set
                      </span>
                    </div>
                  )}

                  {showStatus && (
                    <div className="mt-2">
                      <Badge variant={
                        medication.status === 'active'
                          ? 'default'
                          : medication.status === 'archived'
                            ? 'secondary'
                            : 'destructive'
                      }>
                        {medication.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  {medication.allergyCheck.status && (
                    <div className="mt-2">
                      <Badge variant="destructive">
                        <span className="mr-1 h-3 w-3"><WarningIcon /></span>
                        Allergy Alert
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(medication)}
                >
                  <span className="mr-2 h-4 w-4"><EditIcon /></span>
                  Edit
                </Button>

                {!isArchived && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewHistory(medication.id)}
                    >
                      <span className="mr-2 h-4 w-4"><HistoryIcon /></span>
                      History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddAdherence(medication.id)}
                    >
                      <span className="mr-2 h-4 w-4"><AddIcon /></span>
                      Add Adherence
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onArchive(medication.id)}
                    >
                      <span className="mr-2 h-4 w-4"><DeleteIcon /></span>
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Analytics Components
interface MedicationAnalyticsPanelProps {
  patientId: string;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

const MedicationAnalyticsPanel: React.FC<MedicationAnalyticsPanelProps> = ({
  patientId
}) => {
  const [adherencePeriod, setAdherencePeriod] = useState<string>('6months');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Fetch analytics data
  const { data: adherenceData, isLoading: isLoadingAdherence } = useAdherenceAnalytics(patientId, adherencePeriod);
  const { data: prescriptionData, isLoading: isLoadingPrescription } = usePrescriptionPatternAnalytics(patientId);
  const { data: interactionData, isLoading: isLoadingInteraction } = useInteractionAnalytics(patientId);
  const { data: summaryData, isLoading: isLoadingSummary } = usePatientMedicationSummary(patientId);

  const handleAdherencePeriodChange = (value: string) => {
    setAdherencePeriod(value);
  };



  if (isLoadingAdherence || isLoadingPrescription || isLoadingInteraction || isLoadingSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Mock data for visualization
  const mockAdherenceData: AdherenceData = adherenceData || {
    monthlyAdherence: [
      { month: 'Jan', adherence: 75 },
      { month: 'Feb', adherence: 82 },
      { month: 'Mar', adherence: 78 },
      { month: 'Apr', adherence: 85 },
      { month: 'May', adherence: 90 },
      { month: 'Jun', adherence: 88 },
    ],
    averageAdherence: 83,
    trendDirection: 'up',
    complianceDays: [
      { day: 'Mon', count: 24 },
      { day: 'Tue', count: 26 },
      { day: 'Wed', count: 28 },
      { day: 'Thu', count: 25 },
      { day: 'Fri', count: 22 },
      { day: 'Sat', count: 18 },
      { day: 'Sun', count: 20 },
    ],
  };

  const mockPrescriptionData: PrescriptionData = prescriptionData || {
    medicationsByCategory: [
      { category: 'Cardiovascular', count: 5 },
      { category: 'Analgesic', count: 3 },
      { category: 'Antibiotic', count: 2 },
      { category: 'Respiratory', count: 4 },
      { category: 'CNS', count: 1 },
    ],
    medicationsByRoute: [
      { route: 'Oral', count: 10 },
      { route: 'Injection', count: 2 },
      { route: 'Topical', count: 1 },
      { route: 'Inhaled', count: 2 },
    ],
    prescriptionFrequency: [
      { month: 'Jan', count: 3 },
      { month: 'Feb', count: 2 },
      { month: 'Mar', count: 4 },
      { month: 'Apr', count: 1 },
      { month: 'May', count: 5 },
      { month: 'Jun', count: 3 },
    ],
    topPrescribers: [
      { prescriber: 'Dr. Smith', count: 8 },
      { prescriber: 'Dr. Johnson', count: 4 },
      { prescriber: 'Dr. Williams', count: 3 },
    ],
  };

  const mockInteractionData: InteractionData = interactionData || {
    severityDistribution: [
      { severity: 'Minor', count: 7 },
      { severity: 'Moderate', count: 4 },
      { severity: 'Severe', count: 1 },
    ],
    interactionTrends: [
      { month: 'Jan', count: 2 },
      { month: 'Feb', count: 3 },
      { month: 'Mar', count: 1 },
      { month: 'Apr', count: 4 },
      { month: 'May', count: 2 },
      { month: 'Jun', count: 0 },
    ],
  };

  const mockSummaryData: MedicationSummaryData = summaryData || {
    activeCount: 8,
    archivedCount: 3,
    cancelledCount: 1,
    adherenceRate: 85,
    interactionCount: 12,
    mostCommonCategory: 'Cardiovascular',
    mostCommonRoute: 'Oral',
    lastUpdated: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Medication Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Active Medications</div>
            <div className="text-2xl font-bold">{mockSummaryData.activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Avg. Adherence</div>
            <div className="text-2xl font-bold">{mockSummaryData.adherenceRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Potential Interactions</div>
            <div className="text-2xl font-bold">{mockSummaryData.interactionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Most Common</div>
            <div className="text-lg font-semibold">{mockSummaryData.mostCommonCategory}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab.toString()} onValueChange={v => setActiveTab(Number(v))}>
        <TabsList>
          <TabsTrigger value="0">Adherence Trends</TabsTrigger>
          <TabsTrigger value="1">Prescription Patterns</TabsTrigger>
          <TabsTrigger value="2">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="0" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Medication Adherence Over Time</h3>
            <Select value={adherencePeriod} onValueChange={handleAdherencePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Adherence Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockAdherenceData.monthlyAdherence}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#8884d8"
                      name="Adherence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medication Compliance by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAdherenceData.complianceDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Compliant Days" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="1" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Medications by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockPrescriptionData.medicationsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      label={(props: any) => 
                        `${props.name || ''}: ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {mockPrescriptionData.medicationsByCategory.map(
                        (_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medications by Route</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockPrescriptionData.medicationsByRoute}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="route"
                      label={(props: any) => 
                        `${props.name || ''}: ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {mockPrescriptionData.medicationsByRoute.map(
                        (_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Prescription Frequency Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockPrescriptionData.prescriptionFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="#8884d8"
                      name="New Prescriptions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="2" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockInteractionData.severityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="severity"
                      label={(props: any) => `${props.name ?? ''}: ${props.percent ? (Number(props.percent) * 100).toFixed(0) : 0}%`}
                    >
                      {mockInteractionData.severityDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.severity === 'Severe'
                                ? '#ff6b6b'
                                : entry.severity === 'Moderate'
                                  ? '#feca57'
                                  : '#1dd1a1'
                            }
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interaction Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockInteractionData.interactionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ff6b6b"
                      name="Interactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientMedicationsPage;
