import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Select } from '@/components/ui/select';

import { Tooltip } from '@/components/ui/tooltip';

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';
usePatientConditions,
  useCreateCondition,
  useUpdateCondition,
  useDeleteCondition,


interface ConditionManagementProps {
  patientId: string;
}
interface ConditionFormData {
  name: string;
  snomedId?: string;
  onsetDate?: Date;
  status: 'active' | 'resolved' | 'remission';
  notes?: string;
}
type ConditionStatus = 'active' | 'resolved' | 'remission';
const CONDITION_STATUSES: {
  value: ConditionStatus;
  label: string;
  color: 'success' | 'warning' | 'info' | 'error';
  icon: React.ReactElement;
}[] = [
  {
    value: 'active',
    label: 'Active',
    color: 'error',
    icon: <WarningIcon />,
  },
  {
    value: 'remission',
    label: 'In Remission',
    color: 'warning',
    icon: <PauseCircleIcon />,
  },
  {
    value: 'resolved',
    label: 'Resolved',
    color: 'success',
    icon: <CheckCircleIcon />,
  },
];
// Common medical conditions with SNOMED CT codes
const COMMON_CONDITIONS = [
  { name: 'Hypertension', snomedId: '38341003' },
  { name: 'Diabetes mellitus', snomedId: '73211009' },
  { name: 'Asthma', snomedId: '195967001' },
  { name: 'Chronic obstructive pulmonary disease', snomedId: '13645005' },
  { name: 'Malaria', snomedId: '61462000' },
  { name: 'Typhoid fever', snomedId: '4834000' },
  { name: 'Gastroenteritis', snomedId: '25374005' },
  { name: 'Upper respiratory tract infection', snomedId: '54150009' },
  { name: 'Pneumonia', snomedId: '233604007' },
  { name: 'Urinary tract infection', snomedId: '68566005' },
  { name: 'Hepatitis B', snomedId: '66071002' },
  { name: 'Sickle cell disease', snomedId: '417357006' },
  { name: 'Peptic ulcer disease', snomedId: '13200003' },
  { name: 'Arthritis', snomedId: '3723001' },
  { name: 'Migraine', snomedId: '37796009' },
  { name: 'Depression', snomedId: '35489007' },
  { name: 'Anxiety disorder', snomedId: '48694002' },
  { name: 'Chronic kidney disease', snomedId: '709044004' },
  { name: 'Heart failure', snomedId: '84114007' },
  { name: 'Stroke', snomedId: '230690007' },
];
const ConditionManagement: React.FC<ConditionManagementProps> = ({ 
  patientId
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConditionStatus | 'all'>(
    'all'
  );
  // React Query hooks
  const {
    data: conditionsResponse,
    isLoading,
    isError,
    error,
  } = usePatientConditions(patientId);
  const createConditionMutation = useCreateCondition();
  const updateConditionMutation = useUpdateCondition();
  const deleteConditionMutation = useDeleteCondition();
  const conditions = extractResults(conditionsResponse);
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ConditionFormData>({ 
    defaultValues: {
      name: '',
      snomedId: '',
      onsetDate: undefined,
      status: 'active',
      notes: ''}
    }
  // Filtered conditions
  const filteredConditions = (conditions as Condition[]).filter(
    (condition: Condition) => {
      const matchesSearch = condition.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || condition.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );
  // Event handlers
  const handleOpenDialog = (condition?: Condition) => {
    if (condition) {
      setSelectedCondition(condition);
      reset({ 
        name: condition.name,
        snomedId: condition.snomedId || '',
        onsetDate: condition.onsetDate
          ? new Date(condition.onsetDate)
          : undefined,
        status: condition.status,
        notes: condition.notes || ''}
      });
    } else {
      setSelectedCondition(null);
      reset({ 
        name: '',
        snomedId: '',
        onsetDate: undefined,
        status: 'active',
        notes: ''}
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCondition(null);
    reset();
  };
  const handleSaveCondition = async (formData: ConditionFormData) => {
    try {
      const conditionData: CreateConditionData | UpdateConditionData = {
        name: formData.name.trim(),
        snomedId: formData.snomedId?.trim() || undefined,
        onsetDate: formData.onsetDate
          ? formData.onsetDate.toISOString()
          : undefined,
        status: formData.status,
        notes: formData.notes?.trim() || undefined,
      };
      if (selectedCondition) {
        // Update existing condition
        await updateConditionMutation.mutateAsync({ 
          conditionId: selectedCondition._id,
          conditionData: conditionData as UpdateConditionData}
        });
      } else {
        // Create new condition
        await createConditionMutation.mutateAsync({ 
          patientId,
          conditionData: conditionData as CreateConditionData}
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving condition:', error);
    }
  };
  const handleDeleteCondition = async (conditionId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this condition? This action cannot be undone.'
      )
    ) {
      try {
        await deleteConditionMutation.mutateAsync(conditionId);
      } catch (error) {
        console.error('Error deleting condition:', error);
      }
    }
  };
  const handleCommonConditionSelect = (condition: {
    name: string;
    snomedId: string;
  }) => {
    setValue('name', condition.name);
    setValue('snomedId', condition.snomedId);
  };
  const getStatusConfig = (status: ConditionStatus) => {
    return (
      CONDITION_STATUSES.find((s) => s.value === status) ||
      CONDITION_STATUSES[0]
    );
  };
  const validateSnomedId = (snomedId: string): boolean => {
    if (!snomedId) return true; // Optional field
    // SNOMED CT ID validation: 6-18 digits
    return /^\d{6,18}$/.test(snomedId);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'}
  };
  // Loading state
  if (isLoading) {
    return (
      <div className="">
        <Spinner />
      </div>
    );
  }
  // Error state
  if (isError) {
    return (
      <Alert severity="error" className="">
        <div >Failed to load conditions</div>
        <div >
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve condition information.'}
        </div>
      </Alert>
    );
  }
  return (
      <div>
        {/* Header */}
        <div
          className=""
        >
          <div className="">
            <PersonIcon className="" />
            <div  className="">
              Condition Management
            </div>
            {conditions.length > 0 && (
              <Chip
                label={`${conditions.length} condition${
                  conditions.length > 1 ? 's' : ''
                }`}
                size="small"
                className=""
              />
            )}
          </div>
          <Button
            
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={
              createConditionMutation.isPending ||
              updateConditionMutation.isPending ||
              deleteConditionMutation.isPending}
            }
          >
            Add Condition
          </Button>
        </div>
        {/* Filters and Search */}
        {conditions.length > 0 && (
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div className="">
                  <Input
                    fullWidth
                    size="small"
                    placeholder="Search conditions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    
                  />
                </div>
                <div className="">
                  <div fullWidth size="small">
                    <Label>Status Filter</Label>
                    <Select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as ConditionStatus | 'all'
                        )}
                      }
                      label="Status Filter"
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      {CONDITION_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <div className="">
                            <div
                              className=""
                            >
                              {status.icon}
                            </div>
                            {status.label}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="">
                  <div  color="text.secondary">
                    {filteredConditions.length} of {conditions.length} shown
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Conditions List */}
        {filteredConditions.length === 0 ? (
          <Card>
            <CardContent className="">
              <PersonIcon
                className=""
              />
              <div  color="text.secondary" className="">
                {searchTerm || statusFilter !== 'all'
                  ? 'No matching conditions found'
                  : 'No conditions recorded'}
              </div>
              <div  color="text.secondary" className="">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Document patient conditions to maintain comprehensive medical records'}
              </div>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add First Condition
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <TableContainer >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Condition Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>SNOMED CT ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Onset Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Notes</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredConditions as Condition[]).map(
                  (condition: Condition) => {
                    const statusConfig = getStatusConfig(condition.status);
                    return (
                      <TableRow key={condition._id} hover>
                        <TableCell>
                          <div  className="">
                            {condition.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {condition.snomedId ? (
                            <div className="">
                              <div
                                
                                className=""
                              >
                                {condition.snomedId}
                              </div>
                              <Tooltip title="SNOMED CT standardized medical terminology">
                                <InfoIcon
                                  className=""
                                />
                              </Tooltip>
                            </div>
                          ) : (
                            <div  color="text.secondary">
                              —
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            color={statusConfig.color}
                            
                            icon={statusConfig.icon}
                          />
                        </TableCell>
                        <TableCell>
                          <div >
                            {formatDate(condition.onsetDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            
                            className=""
                          >
                            {condition.notes || '—'}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          <div
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Edit Condition">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(condition)}
                                disabled={
                                  createConditionMutation.isPending ||
                                  updateConditionMutation.isPending ||
                                  deleteConditionMutation.isPending}
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Condition">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteCondition(condition._id)}
                                }
                                disabled={
                                  createConditionMutation.isPending ||
                                  updateConditionMutation.isPending ||
                                  deleteConditionMutation.isPending}
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Add/Edit Condition Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{}
            sx: { borderRadius: 2 },
          >
          <DialogTitle>
            <div className="">
              <PersonIcon className="" />
              {selectedCondition ? 'Edit Condition' : 'Add New Condition'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <div component="form" onSubmit={handleSubmit(handleSaveCondition)}>
              <div spacing={3}>
                {/* Condition Name */}
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Condition name is required',
                    minLength: {
                      value: 2,
                      message: 'Condition name must be at least 2 characters',}
                    },
                    maxLength: {
                      value: 100,
                      message: 'Condition name cannot exceed 100 characters',
                    },
                  render={({  field  }) => (
                    <Autocomplete
                      {...field}
                      options={COMMON_CONDITIONS}
                      getOptionLabel={(option) =>
                        typeof option === 'string' ? option : option.name}
                      }
                      freeSolo
                      value={field.value}
                      onChange={(_, newValue) => {
                        if (typeof newValue === 'string') {
                          field.onChange(newValue);}
                        } else if (newValue) {
                          handleCommonConditionSelect(newValue);
                        }
                      renderInput={(params) => (
                        <Input}
                          {...params}
                          label="Condition Name"
                          placeholder="e.g., Hypertension, Diabetes"
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          required
                          fullWidth
                        />
                      )}
                      renderOption={(props, option) => {}
                        const { key, ...otherProps } = props;
                        return (
                          <li key={key} {...otherProps}>
                            <div>
                              <div >
                                {option.name}
                              </div>
                              <div
                                
                                color="text.secondary"
                                className=""
                              >
                                SNOMED: {option.snomedId}
                              </div>
                            </div>
                          </li>
                        );
                    />
                  )}
                />
                {/* SNOMED CT ID */}
                <Controller
                  name="snomedId"
                  control={control}
                  
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="SNOMED CT Identifier"
                      placeholder="e.g., 38341003"
                      error={!!errors.snomedId}
                      helperText={
                        errors.snomedId?.message ||
                        'Optional: SNOMED CT standardized medical terminology code'}
                      }
                      fullWidth
                      
                    />
                  )}
                />
                <Separator />
                {/* Status and Date */}
                <div
                  className=""
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({  field  }) => (
                      <div error={!!errors.status} fullWidth>
                        <Label>Status</Label>
                        <Select {...field} label="Status">
                          {CONDITION_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              <div
                                className=""
                              >
                                <div className="">
                                  {status.icon}
                                </div>
                                <Chip
                                  label={status.label}
                                  size="small"
                                  color={status.color}
                                  
                                  className=""
                                />
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.status && (
                          <p>
                            {errors.status.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="onsetDate"
                    control={control}
                    render={({  field  }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Onset Date"
                        maxDate={new Date()}
                        error={!!errors.onsetDate}
                        helperText={
                          errors.onsetDate?.message ||
                          'When condition started'}
                        }
                      />
                    )}
                  />
                </div>
                {/* Notes */}
                <Controller
                  name="notes"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Notes cannot exceed 500 characters',}
                    },
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="Clinical Notes"
                      placeholder="Additional information about the condition..."
                      multiline
                      rows={3}
                      error={!!errors.notes}
                      helperText={
                        errors.notes?.message ||
                        'Optional: Additional clinical information or observations'}
                      }
                      fullWidth
                    />
                  )}
                />
                {/* Status Information */}
                {watch('status') && (
                  <Alert
                    severity={
                      watch('status') === 'active'
                        ? 'warning'
                        : watch('status') === 'resolved'
                        ? 'success'
                        : 'info'}
                    }
                    className=""
                  >
                    <div >
                      <strong>
                        {getStatusConfig(watch('status')).label} Status:
                      </strong>{' '}
                      {watch('status') === 'active' &&
                        'This condition is currently active and may require ongoing treatment.'}
                      {watch('status') === 'resolved' &&
                        'This condition has been resolved and is no longer active.'}
                      {watch('status') === 'remission' &&
                        'This condition is in remission - symptoms are reduced or absent but may return.'}
                    </div>
                  </Alert>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions className="">
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleSaveCondition)}
              
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting
                ? 'Saving...'
                : selectedCondition
                ? 'Update'
                : 'Add Condition'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
};
export default ConditionManagement;
