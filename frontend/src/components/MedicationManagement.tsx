import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HistoryIcon from '@mui/icons-material/History';

import { useRBAC } from '../hooks/useRBAC';
import {
  ErrorDisplay,
  LoadingSkeleton,
  LoadingState,
} from './common/ErrorDisplay';
import {
  useNotifications,
  useCRUDNotifications,
} from './common/NotificationSystem';
import { useAsyncOperation } from '../hooks/useErrorHandling';
import { useResponsive, useResponsiveDialog } from '../hooks/useResponsive';
import {
  ResponsiveContainer,
  ResponsiveHeader,
  ResponsiveCard,
  ResponsiveGrid,
} from './common/ResponsiveComponents';
import ResponsiveTable, {
  ResponsiveTableColumn,
  ResponsiveTableAction,
} from './common/ResponsiveTable';

import {
  usePatientMedications,
  useCurrentMedications,
  usePastMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
} from '../queries/usePatients';
import type {
  MedicationRecord,
  CreateMedicationData,
  UpdateMedicationData,
} from '../types/patientManagement';

// Simple RBACGuard component for this file
const RBACGuard: React.FC<{ action: string; children: React.ReactNode }> = ({ action, children }) => {
  const { canAccess } = useRBAC();
  return canAccess(action, 'medication') ? <>{children}</> : null;
};

interface MedicationManagementProps {
  patientId: string;
}

interface MedicationFormData {
  phase: 'current' | 'past';
  medicationName: string;
  purposeIndication?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  adherence?: 'good' | 'poor' | 'unknown';
  notes?: string;
}

const MEDICATION_ROUTES = [
  'Oral',
  'Topical',
  'Intravenous (IV)',
  'Intramuscular (IM)',
  'Subcutaneous',
  'Inhalation',
  'Rectal',
  'Sublingual',
  'Nasal',
  'Transdermal',
];

const COMMON_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
  'Monthly',
];

const COMMON_MEDICATIONS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Ciprofloxacin',
  'Metronidazole',
  'Chloroquine',
  'Artemether-Lumefantrine (Coartem)',
  'Artesunate-Amodiaquine',
  'Lisinopril',
  'Amlodipine',
  'Metformin',
  'Glibenclamide',
  'Omeprazole',
  'Ranitidine',
  'Salbutamol',
  'Prednisolone',
  'Diclofenac',
  'Tramadol',
  'Vitamin B Complex',
  'Folic Acid',
  'Iron tablets',
  'Multivitamins',
];

const MedicationManagement: React.FC<MedicationManagementProps> = ({
  patientId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'current' | 'past'>('all');

  // Enhanced notifications, error handling and responsive design
  const { showError, showSuccess } = useNotifications();
  const crudNotifications = useCRUDNotifications();
  const { executeOperation, isLoading } = useAsyncOperation();
  const { isMobile, getSpacing } = useResponsive();
  const dialogProps = useResponsiveDialog();
  const { canAccess } = useRBAC();

  // React Query hooks
  const {
    data: allMedicationsResponse,
    isLoading: allLoading,
    isError: allError,
    error,
  } = usePatientMedications(patientId);
  const { data: currentMedications } = useCurrentMedications(patientId);
  const { data: pastMedications } = usePastMedications(patientId);
  const createMedicationMutation = useCreateMedication();
  const updateMedicationMutation = useUpdateMedication();
  const deleteMedicationMutation = useDeleteMedication();

  const allMedications = allMedicationsResponse?.medications || allMedicationsResponse || [];

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<MedicationFormData>({
    defaultValues: {
      phase: 'current',
      medicationName: '',
      purposeIndication: '',
      dose: '',
      frequency: '',
      route: 'Oral',
      duration: '',
      startDate: new Date(),
      endDate: undefined,
      adherence: 'good',
      notes: '',
    },
  });

  // Get filtered medications based on phase
  const getFilteredMedications = () => {
    let medications = allMedications;

    if (phaseFilter !== 'all') {
      medications = medications.filter(
        (med: MedicationRecord) => med.phase === phaseFilter
      );
    }

    if (searchTerm) {
      medications = medications.filter(
        (med: MedicationRecord) =>
          med.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (med.purposeIndication &&
            med.purposeIndication
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    return medications;
  };

  const filteredMedications = getFilteredMedications();

  // Event handlers
  const handleOpenDialog = (medication?: MedicationRecord) => {
    if (medication) {
      setSelectedMedication(medication);
      reset({
        phase: medication.phase,
        medicationName: medication.medicationName,
        purposeIndication: medication.purposeIndication || '',
        dose: medication.dose || '',
        frequency: medication.frequency || '',
        route: medication.route || 'Oral',
        duration: medication.duration || '',
        startDate: medication.startDate ? new Date(medication.startDate) : undefined,
        endDate: medication.endDate ? new Date(medication.endDate) : undefined,
        adherence: medication.adherence || 'good',
        notes: medication.notes || '',
      });
    } else {
      setSelectedMedication(null);
      reset({
        phase: 'current',
        medicationName: '',
        purposeIndication: '',
        dose: '',
        frequency: '',
        route: 'Oral',
        duration: '',
        startDate: new Date(),
        endDate: undefined,
        adherence: 'good',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMedication(null);
    reset();
  };

  const handleSaveMedication = async (formData: MedicationFormData) => {
    const medicationData: CreateMedicationData | UpdateMedicationData = {
      phase: formData.phase,
      medicationName: formData.medicationName.trim(),
      purposeIndication: formData.purposeIndication?.trim() || undefined,
      dose: formData.dose?.trim() || undefined,
      frequency: formData.frequency?.trim() || undefined,
      route: formData.route?.trim() || undefined,
      duration: formData.duration?.trim() || undefined,
      startDate: formData.startDate?.toISOString(),
      endDate: formData.endDate?.toISOString(),
      adherence: formData.adherence,
      notes: formData.notes?.trim() || undefined,
    };

    const operation = selectedMedication
      ? () => updateMedicationMutation.mutateAsync({
          medicationId: selectedMedication._id,
          medicationData: medicationData as UpdateMedicationData,
        })
      : () => createMedicationMutation.mutateAsync({
          patientId,
          medicationData: medicationData as CreateMedicationData,
        });

    await executeOperation(
      selectedMedication ? 'updateMedication' : 'createMedication',
      operation,
      {
        onSuccess: () => {
          handleCloseDialog();
          if (selectedMedication) {
            crudNotifications.updated('medication');
          } else {
            crudNotifications.created('medication');
          }
        },
        onError: (error) => {
          const operation = selectedMedication ? 'update' : 'create';
          crudNotifications[`${operation}Failed`]('medication', error);
        },
      }
    );
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this medication? This action cannot be undone.'
      )
    ) {
      await executeOperation(
        'deleteMedication',
        () => deleteMedicationMutation.mutateAsync(medicationId),
        {
          onSuccess: () => {
            crudNotifications.deleted('medication');
          },
          onError: (error) => {
            crudNotifications.deleteFailed('medication', error);
          },
        }
      );
    }
  };

  const getAdherenceColor = (
    adherence?: 'good' | 'poor' | 'unknown'
  ): 'success' | 'error' | 'warning' => {
    switch (adherence) {
      case 'good':
        return 'success';
      case 'poor':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getPhaseColor = (phase: 'current' | 'past'): 'primary' | 'default' => {
    return phase === 'current' ? 'primary' : 'default';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ResponsiveContainer>
        <LoadingState
          loading={allLoading}
          error={allError ? error : null}
          loadingComponent={
            <LoadingSkeleton 
              variant="table" 
              count={5} 
              animation="wave"
            />
          }
          errorComponent={
            <ErrorDisplay
              error={error}
              title="Failed to load medications"
              type={allError ? 'server' : 'error'}
              retry={() => window.location.reload()}
              showDetails={process.env.NODE_ENV === 'development'}
            />
          }
          emptyComponent={
            <ResponsiveCard
              title="No medications recorded"
              subtitle="Start by adding the patient's current medications or medication history."
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MedicationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <RBACGuard action="canCreate">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add First Medication
                  </Button>
                </RBACGuard>
              </Box>
            </ResponsiveCard>
          }
          isEmpty={!allLoading && !allError && allMedications.length === 0}
        >
          {/* Header */}
          <ResponsiveHeader
            title="Medication Management"
            subtitle={`${allMedications.length} medication${allMedications.length !== 1 ? 's' : ''} recorded`}
            actions={
              <RBACGuard action="canCreate">
                <Button
                  variant="contained"
                  startIcon={isLoading('createMedication') ? <CircularProgress size={16} /> : <AddIcon />}
                  onClick={() => handleOpenDialog()}
                  disabled={isLoading('createMedication') || isLoading('updateMedication') || isLoading('deleteMedication')}
                  fullWidth={isMobile}
                >
                  {isLoading('createMedication') ? 'Adding...' : 'Add Medication'}
                </Button>
              </RBACGuard>
            }
          />

          {/* Simple medication list */}
          {allMedications.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Medications ({allMedications.length})
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.5 }} />,
                    }}
                    sx={{ mr: 2 }}
                  />
                  <ToggleButtonGroup
                    value={phaseFilter}
                    exclusive
                    onChange={(_, newFilter) => newFilter && setPhaseFilter(newFilter)}
                    size="small"
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="current">Current</ToggleButton>
                    <ToggleButton value="past">Past</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                {filteredMedications.length === 0 ? (
                  <Typography color="text.secondary">No medications found.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {filteredMedications.map((medication: MedicationRecord) => (
                      <Card key={medication._id} variant="outlined">
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">{medication.medicationName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {medication.dose} • {medication.frequency || 'As directed'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={medication.phase === 'current' ? 'Current' : 'Past'}
                                size="small"
                                color={getPhaseColor(medication.phase)}
                              />
                              <RBACGuard action="canUpdate">
                                <IconButton size="small" onClick={() => handleOpenDialog(medication)}>
                                  <EditIcon />
                                </IconButton>
                              </RBACGuard>
                              <RBACGuard action="canDelete">
                                <IconButton size="small" color="error" onClick={() => handleDeleteMedication(medication._id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </RBACGuard>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add/Edit Medication Dialog */}
          <Dialog
            open={isDialogOpen}
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicationIcon color="primary" />
                <Typography variant="h6">
                  {selectedMedication ? 'Edit Medication' : 'Add New Medication'}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <form onSubmit={handleSubmit(handleSaveMedication)}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <Controller
                    name="medicationName"
                    control={control}
                    rules={{ required: 'Medication name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Medication Name *"
                        error={!!errors.medicationName}
                        helperText={errors.medicationName?.message}
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    name="dose"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Dose"
                        placeholder="e.g., 500mg, 1 tablet"
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Frequency"
                        placeholder="e.g., Twice daily"
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    name="phase"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Phase</InputLabel>
                        <Select {...field} label="Phase">
                          <MenuItem value="current">Current</MenuItem>
                          <MenuItem value="past">Past</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Stack>
              </form>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleSubmit(handleSaveMedication)}
                variant="contained"
                disabled={isLoading('createMedication') || isLoading('updateMedication')}
              >
                {selectedMedication ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>
        </LoadingState>
      </ResponsiveContainer>
    </LocalizationProvider>
  );
};

export default MedicationManagement;