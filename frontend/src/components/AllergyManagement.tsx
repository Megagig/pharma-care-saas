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
// // Removed incomplete import: import { extractResults 
  usePatientAllergies,
  useCreateAllergy,
  useUpdateAllergy,
  useDeleteAllergy,


interface AllergyManagementProps {
  patientId: string;
}
interface AllergyFormData {
  substance: string;
  reaction?: string;
  severity?: SeverityLevel;
  notedAt?: Date;
}
const SEVERITY_LEVELS: {
  value: SeverityLevel;
  label: string;
  color: 'success' | 'warning' | 'error';
}[] = [
  { value: 'mild', label: 'Mild', color: 'success' },
  { value: 'moderate', label: 'Moderate', color: 'warning' },
  { value: 'severe', label: 'Severe', color: 'error' },
];
const COMMON_ALLERGENS = [
  'Penicillin',
  'Amoxicillin',
  'Aspirin',
  'Ibuprofen',
  'Sulfonamides',
  'Codeine',
  'Morphine',
  'Latex',
  'Peanuts',
  'Shellfish',
  'Eggs',
  'Milk',
  'Wheat',
  'Soy',
  'Tree nuts',
  'Fish',
  'Dust mites',
  'Pollen',
  'Pet dander',
  'Insect stings',
];
const AllergyManagement: React.FC<AllergyManagementProps> = ({ patientId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<Allergy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>(
    'all'
  );
  // React Query hooks
  const {
    data: allergiesResponse,
    isLoading,
    isError,
    error,
  } = usePatientAllergies(patientId);
  const createAllergyMutation = useCreateAllergy();
  const updateAllergyMutation = useUpdateAllergy();
  const deleteAllergyMutation = useDeleteAllergy();
  const allergies = allergiesResponse?.data?.results || [];
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AllergyFormData>({ 
    defaultValues: {
      substance: '',
      reaction: '',
      severity: 'mild',
      notedAt: new Date()}
    }
  // Filtered allergies
  const filteredAllergies = allergies.filter((allergy: Allergy) => {
    const matchesSearch = allergy.substance
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSeverity =
      severityFilter === 'all' || allergy.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });
  // Event handlers
  const handleOpenDialog = (allergy?: Allergy) => {
    if (allergy) {
      setSelectedAllergy(allergy);
      reset({ 
        substance: allergy.substance,
        reaction: allergy.reaction || '',
        severity: allergy.severity || 'mild',
        notedAt: allergy.notedAt ? new Date(allergy.notedAt) : new Date()}
      });
    } else {
      setSelectedAllergy(null);
      reset({ 
        substance: '',
        reaction: '',
        severity: 'mild',
        notedAt: new Date()}
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAllergy(null);
    reset();
  };
  const handleSaveAllergy = async (formData: AllergyFormData) => {
    try {
      const allergyData: CreateAllergyData | UpdateAllergyData = {
        substance: formData.substance.trim(),
        reaction: formData.reaction?.trim() || undefined,
        severity: formData.severity,
        notedAt: formData.notedAt?.toISOString(),
      };
      if (selectedAllergy) {
        // Update existing allergy
        await updateAllergyMutation.mutateAsync({ 
          allergyId: selectedAllergy._id,
          allergyData: allergyData as UpdateAllergyData}
        });
      } else {
        // Create new allergy
        await createAllergyMutation.mutateAsync({ 
          patientId,
          allergyData: allergyData as CreateAllergyData}
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving allergy:', error);
    }
  };
  const handleDeleteAllergy = async (allergyId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this allergy? This action cannot be undone.'
      )
    ) {
      try {
        await deleteAllergyMutation.mutateAsync(allergyId);
      } catch (error) {
        console.error('Error deleting allergy:', error);
      }
    }
  };
  const handleCommonAllergenSelect = (substance: string) => {
    setValue('substance', substance);
  };
  const getSeverityColor = (
    severity?: SeverityLevel
  ): 'success' | 'warning' | 'error' | 'default' => {
    const severityConfig = SEVERITY_LEVELS.find((s) => s.value === severity);
    return (
      (severityConfig?.color as 'success' | 'warning' | 'error') || 'default'
    );
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
        <div >Failed to load allergies</div>
        <div >
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve allergy information.'}
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
            <LocalHospitalIcon className="" />
            <div  className="">
              Allergy Management
            </div>
            {allergies.length > 0 && (
              <Chip
                label={`${allergies.length} record${
                  allergies.length > 1 ? 's' : ''
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
              createAllergyMutation.isPending ||
              updateAllergyMutation.isPending ||
              deleteAllergyMutation.isPending}
            }
          >
            Add Allergy
          </Button>
        </div>
        {/* Filters and Search */}
        {allergies.length > 0 && (
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div className="">
                  <Input
                    fullWidth
                    size="small"
                    placeholder="Search allergies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    
                  />
                </div>
                <div className="">
                  <div fullWidth size="small">
                    <Label>Severity Filter</Label>
                    <Select
                      value={severityFilter}
                      onChange={(e) =>
                        setSeverityFilter(
                          e.target.value as SeverityLevel | 'all'
                        )}
                      }
                      label="Severity Filter"
                    >
                      <MenuItem value="all">All Severities</MenuItem>
                      {SEVERITY_LEVELS.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="">
                  <div  color="text.secondary">
                    {filteredAllergies.length} of {allergies.length} shown
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Allergies List */}
        {filteredAllergies.length === 0 ? (
          <Card>
            <CardContent className="">
              <LocalHospitalIcon
                className=""
              />
              <div  color="text.secondary" className="">
                {searchTerm || severityFilter !== 'all'
                  ? 'No matching allergies found'
                  : 'No allergies recorded'}
              </div>
              <div  color="text.secondary" className="">
                {searchTerm || severityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add allergies to help ensure patient safety and appropriate medication selection'}
              </div>
              {!searchTerm && severityFilter === 'all' && (
                <Button
                  
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add First Allergy
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
                    <strong>Substance</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Reaction</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Severity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Noted Date</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAllergies.map((allergy: Allergy) => (
                  <TableRow key={allergy._id} hover>
                    <TableCell>
                      <div className="">
                        <div  className="">
                          {allergy.substance}
                        </div>
                        {allergy.severity === 'severe' && (
                          <WarningIcon
                            className=""
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div >
                        {allergy.reaction || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          SEVERITY_LEVELS.find(
                            (s) => s.value === allergy.severity
                          )?.label || 'Unknown'}
                        }
                        size="small"
                        color={getSeverityColor(allergy.severity)}
                        
                      />
                    </TableCell>
                    <TableCell>
                      <div >
                        {formatDate(allergy.notedAt)}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit Allergy">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(allergy)}
                            disabled={
                              createAllergyMutation.isPending ||
                              updateAllergyMutation.isPending ||
                              deleteAllergyMutation.isPending}
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Allergy">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAllergy(allergy._id)}
                            disabled={
                              createAllergyMutation.isPending ||
                              updateAllergyMutation.isPending ||
                              deleteAllergyMutation.isPending}
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Add/Edit Allergy Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{}
            sx: { borderRadius: 2 },
          >
          <DialogTitle>
            <div className="">
              <LocalHospitalIcon className="" />
              {selectedAllergy ? 'Edit Allergy' : 'Add New Allergy'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <form onSubmit={handleSubmit(handleSaveAllergy)}>
              <div spacing={3}>
                {/* Substance Field */}
                <Controller
                  name="substance"
                  control={control}
                  rules={{
                    required: 'Allergy substance is required',
                    minLength: {
                      value: 2,
                      message: 'Substance name must be at least 2 characters',}
                    },
                    maxLength: {
                      value: 100,
                      message: 'Substance name cannot exceed 100 characters',
                    },
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="Allergy Substance"
                      placeholder="e.g., Penicillin, Peanuts, Latex"
                      error={!!errors.substance}
                      helperText={errors.substance?.message}
                      required
                      fullWidth
                    />
                  )}
                />
                {/* Common Allergens Quick Select */}
                <div>
                  <div
                    
                    className=""
                  >
                    Common Allergens (click to select):
                  </div>
                  <div className="">
                    {COMMON_ALLERGENS.slice(0, 12).map((allergen) => (
                      <Chip
                        key={allergen}
                        label={allergen}
                        size="small"
                        onClick={() => handleCommonAllergenSelect(allergen)}
                        className=""
                        variant={
                          watch('substance') === allergen
                            ? 'filled'
                            : 'outlined'}
                        }
                        color={
                          watch('substance') === allergen
                            ? 'primary'
                            : 'default'}
                        }
                      />
                    ))}
                  </div>
                </div>
                <Separator />
                {/* Reaction Field */}
                <Controller
                  name="reaction"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 200,
                      message:
                        'Reaction description cannot exceed 200 characters',}
                    },
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="Reaction (Optional)"
                      placeholder="e.g., rash, difficulty breathing, swelling"
                      multiline
                      rows={2}
                      error={!!errors.reaction}
                      helperText={
                        errors.reaction?.message ||
                        "Describe the patient's allergic reaction"}
                      }
                      fullWidth
                    />
                  )}
                />
                {/* Severity and Date */}
                <div
                  className=""
                >
                  <Controller
                    name="severity"
                    control={control}
                    render={({  field  }) => (
                      <div error={!!errors.severity} fullWidth>
                        <Label>Severity</Label>
                        <Select {...field} label="Severity">
                          {SEVERITY_LEVELS.map((level) => (
                            <MenuItem key={level.value} value={level.value}>
                              <div
                                className=""
                              >
                                <Chip
                                  label={level.label}
                                  size="small"
                                  color={level.color}
                                  
                                  className=""
                                />
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.severity && (
                          <p>
                            {errors.severity.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="notedAt"
                    control={control}
                    render={({  field  }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Date Noted"
                        maxDateTime={new Date()}
                        error={!!errors.notedAt}
                        helperText={errors.notedAt?.message}
                      />
                    )}
                  />
                </div>
                {/* Severity Warning */}
                {watch('severity') === 'severe' && (
                  <Alert severity="warning" className="">
                    <div >
                      <strong>Severe Allergy Warning:</strong> This allergy will
                      be prominently displayed in the patient's profile and
                      flagged during medication prescribing to ensure patient
                      safety.
                    </div>
                  </Alert>
                )}
              </div>
            </form>
          </DialogContent>
          <DialogActions className="">
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleSaveAllergy)}
              
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting
                ? 'Saving...'
                : selectedAllergy
                ? 'Update'
                : 'Add Allergy'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
};
export default AllergyManagement;
