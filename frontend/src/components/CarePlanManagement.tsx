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

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';
usePatientCarePlans,
  useCreateCarePlan,
  useUpdateCarePlan,


interface CarePlanManagementProps {
  patientId: string;
}

interface CarePlanFormData {
  goals: Array<{ value: string }>;
  objectives: Array<{ value: string }>;
  followUpDate?: Date;
  planQuality: 'adequate' | 'needsReview';
  dtpSummary?: 'resolved' | 'unresolved';
  notes?: string;
}

const CarePlanManagement: React.FC<CarePlanManagementProps> = ({ 
  patientId
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<CarePlan | null>(
    null
  );

  // React Query hooks
  const {
    data: carePlansResponse,
    isLoading,
    isError,
    error,
  } = usePatientCarePlans(patientId);
  const createCarePlanMutation = useCreateCarePlan();
  const updateCarePlanMutation = useUpdateCarePlan();

  const carePlans = carePlansResponse?.data?.results || [];
  const latestCarePlan = carePlans[0]; // Assuming sorted by date desc

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarePlanFormData>({ 
    defaultValues: { })
      goals: [{ value: '' }],
      objectives: [{ value: '' }],
      followUpDate: undefined,
      planQuality: 'adequate',
      dtpSummary: 'resolved',
      notes: '',
    }

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({ 
    control,
    name: 'goals'}
  });

  const {
    fields: objectiveFields,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({ 
    control,
    name: 'objectives'}
  });

  const handleOpenDialog = (carePlan?: CarePlan) => {
    if (carePlan) {
      setSelectedCarePlan(carePlan);
      reset({ 
        goals:
          carePlan.goals.length > 0 })
            ? carePlan.goals.map((g) => ({ value: g }))
            : [{ value: '' }],
        objectives:
          carePlan.objectives.length > 0
            ? carePlan.objectives.map((o) => ({ value: o }))
            : [{ value: '' }],
        followUpDate: carePlan.followUpDate
          ? new Date(carePlan.followUpDate)
          : undefined,
        planQuality: carePlan.planQuality,
        dtpSummary: carePlan.dtpSummary,
        notes: carePlan.notes || ''}
    } else {
      setSelectedCarePlan(null);
      reset({  })
        goals: [{ value: '' }],
        objectives: [{ value: '' }],
        followUpDate: undefined,
        planQuality: 'adequate',
        dtpSummary: 'resolved',
        notes: ''}
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCarePlan(null);
    reset();
  };

  const handleSaveCarePlan = async (formData: CarePlanFormData) => {
    try {
      const carePlanData: CreateCarePlanData | UpdateCarePlanData = {
        goals: formData.goals
          .map((g) => g.value)
          .filter((goal) => goal.trim() !== ''),
        objectives: formData.objectives
          .map((o) => o.value)
          .filter((obj) => obj.trim() !== ''),
        followUpDate: formData.followUpDate?.toISOString(),
        planQuality: formData.planQuality,
        dtpSummary: formData.dtpSummary,
        notes: formData.notes?.trim() || undefined,
      };

      if (selectedCarePlan) {
        await updateCarePlanMutation.mutateAsync({ 
          carePlanId: selectedCarePlan._id,
          carePlanData: carePlanData as UpdateCarePlanData}
        });
      } else {
        await createCarePlanMutation.mutateAsync({ 
          patientId,
          carePlanData: carePlanData as CreateCarePlanData}
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving care plan:', error);
    }
  };

  const getPlanQualityColor = (
    quality: 'adequate' | 'needsReview'
  ): 'success' | 'warning' => {
    return quality === 'adequate' ? 'success' : 'warning';
  };

  const getDtpSummaryColor = (
    summary?: 'resolved' | 'unresolved'
  ): 'success' | 'warning' => {
    return summary === 'resolved' ? 'success' : 'warning';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'}
  };

  if (isLoading) {
    return (
      <div className="">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" className="">
        <div >Failed to load care plans</div>
        <div >
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve care plan information.'}
        </div>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        {/* Header */}
        <div
          className=""
        >
          <div className="">
            <AssignmentIcon className="" />
            <div  className="">
              Care Plan Management
            </div>
            {carePlans.length > 0 && (
              <Chip
                label={`${carePlans.length} plan${
                  carePlans.length > 1 ? 's' : ''
                }`}
                size="small"
                className=""
              />
            )}
          </div>
          <RBACGuard action="canCreate">
            <Button
              
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Care Plan
            </Button>
          </RBACGuard>
        </div>

        {/* Current Care Plan */}
        {latestCarePlan ? (
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div  className="">
                  Current Care Plan
                </div>
                <div direction="row" spacing={1}>
                  <Chip
                    label={
                      latestCarePlan.planQuality === 'adequate'
                        ? 'Adequate'
                        : 'Needs Review'}
                    }
                    size="small"
                    color={getPlanQualityColor(latestCarePlan.planQuality)}
                    icon={
                      latestCarePlan.planQuality === 'adequate' ? (
                        <CheckCircleIcon />
                      ) : (
                        <WarningIcon />
                      )}
                    }
                  />
                  {latestCarePlan.dtpSummary && (
                    <Chip
                      label={`DTPs ${latestCarePlan.dtpSummary}`}
                      size="small"
                      color={getDtpSummaryColor(latestCarePlan.dtpSummary)}
                    />
                  )}
                  <RBACGuard action="canUpdate">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(latestCarePlan)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </RBACGuard>
                </div>
              </div>

              <div
                className=""
              >
                {/* Goals */}
                <div>
                  <div
                    
                    className=""
                  >
                    <FlagIcon className="" />
                    Treatment Goals ({latestCarePlan.goals.length})
                  </div>
                  <List dense>
                    {latestCarePlan.goals.map((goal: string, index: number) => (
                      <div key={index} className="">
                        <div
                          primary={goal}
                          
                        />
                      </div>
                    ))}
                  </List>
                </div>

                {/* Objectives */}
                <div>
                  <div
                    
                    className=""
                  >
                    <CheckCircleIcon className="" />
                    Objectives ({latestCarePlan.objectives.length})
                  </div>
                  <List dense>
                    {latestCarePlan.objectives.map(
                      (objective: string, index: number) => (
                        <div key={index} className="">
                          <div
                            primary={objective}
                            
                          />
                        </div>
                      )
                    )}
                  </List>
                </div>
              </div>

              {(latestCarePlan.notes || latestCarePlan.followUpDate) && (
                <>
                  <Separator className="" />
                  <div
                    className=""
                  >
                    {latestCarePlan.followUpDate && (
                      <div>
                        <div  color="text.secondary">
                          Next Follow-up
                        </div>
                        <div  className="">
                          {formatDate(latestCarePlan.followUpDate)}
                        </div>
                      </div>
                    )}
                    {latestCarePlan.notes && (
                      <div>
                        <div  color="text.secondary">
                          Additional Notes
                        </div>
                        <div >
                          {latestCarePlan.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="">
              <AssignmentIcon
                className=""
              />
              <div  color="text.secondary" className="">
                No care plan created
              </div>
              <div  color="text.secondary" className="">
                Create a comprehensive care plan to guide patient treatment and
                track progress
              </div>
              <RBACGuard action="canCreate">
                <Button
                  
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Create Care Plan
                </Button>
              </RBACGuard>
            </CardContent>
          </Card>
        )}

        {/* Previous Care Plans */}
        {carePlans.length > 1 && (
          <Card className="">
            <CardContent>
              <div  className="">
                Previous Care Plans ({carePlans.length - 1})
              </div>
              <div spacing={2}>
                {carePlans.slice(1).map((plan: CarePlan) => (
                  <div key={plan._id} className="" >
                    <div
                      className=""
                    >
                      <div>
                        <div  className="">
                          Care Plan - {formatDate(plan.createdAt)}
                        </div>
                        <div  color="text.secondary">
                          {plan.goals.length} goals • {plan.objectives.length}{' '}
                          objectives
                        </div>
                      </div>
                      <div direction="row" spacing={1}>
                        <Chip
                          label={plan.planQuality}
                          size="small"
                          color={getPlanQualityColor(plan.planQuality)}
                          
                        />
                        <RBACGuard action="canUpdate">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(plan)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </RBACGuard>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Care Plan Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <div className="">
              <AssignmentIcon className="" />
              {selectedCarePlan ? 'Edit Care Plan' : 'Create Care Plan'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <form onSubmit={handleSubmit(handleSaveCarePlan)}>
              <div spacing={3}>
                {/* Goals Section */}
                <div>
                  <div  className="">
                    Treatment Goals
                  </div>
                  {goalFields.map((field, index) => (
                    <div key={field.id} className="">
                      <Controller
                        name={`goals.${index}.value`}
                        control={control}
                        rules={{
                          required:
                            index === 0
                              ? 'At least one goal is required'
                              : false,
                          maxLength: {
                            value: 200,
                            message: 'Goal cannot exceed 200 characters',}
                          },
                        render={({  field  }) => (
                          <Input
                            {...field}
                            placeholder={`Goal ${index + 1}`}
                            fullWidth
                            size="small"
                            error={!!errors.goals?.[index]?.value}
                            helperText={errors.goals?.[index]?.value?.message}
                          />
                        )}
                      />
                      {goalFields.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeGoal(index)}
                          color="error"
                        >
                          <RemoveIcon />
                        </IconButton>
                      )}
                    </div>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => appendGoal({ value: '' })}
                    
                    size="small"
                    className=""
                  >
                    Add Goal
                  </Button>
                </div>

                {/* Objectives Section */}
                <div>
                  <div  className="">
                    Treatment Objectives
                  </div>
                  {objectiveFields.map((field, index) => (
                    <div key={field.id} className="">
                      <Controller
                        name={`objectives.${index}.value`}
                        control={control}
                        rules={{
                          required:
                            index === 0
                              ? 'At least one objective is required'
                              : false,
                          maxLength: {
                            value: 200,
                            message: 'Objective cannot exceed 200 characters',}
                          },
                        render={({  field  }) => (
                          <Input
                            {...field}
                            placeholder={`Objective ${index + 1}`}
                            fullWidth
                            size="small"
                            error={!!errors.objectives?.[index]?.value}
                            helperText={
                              errors.objectives?.[index]?.value?.message}
                            }
                          />
                        )}
                      />
                      {objectiveFields.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeObjective(index)}
                          color="error"
                        >
                          <RemoveIcon />
                        </IconButton>
                      )}
                    </div>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => appendObjective({ value: '' })}
                    
                    size="small"
                    className=""
                  >
                    Add Objective
                  </Button>
                </div>

                <Separator />

                {/* Quality and Status */}
                <div
                  className=""
                >
                  <Controller
                    name="planQuality"
                    control={control}
                    render={({  field  }) => (
                      <div fullWidth>
                        <Label>Plan Quality</Label>
                        <Select {...field} label="Plan Quality">
                          <MenuItem value="adequate">
                            <div className="">
                              <CheckCircleIcon color="success" className="" />
                              Adequate
                            </div>
                          </MenuItem>
                          <MenuItem value="needsReview">
                            <div className="">
                              <WarningIcon color="warning" className="" />
                              Needs Review
                            </div>
                          </MenuItem>
                        </Select>
                      </div>
                    )}
                  />

                  <Controller
                    name="dtpSummary"
                    control={control}
                    render={({  field  }) => (
                      <div fullWidth>
                        <Label>DTP Status</Label>
                        <Select {...field} label="DTP Status">
                          <MenuItem value="resolved">
                            All DTPs Resolved
                          </MenuItem>
                          <MenuItem value="unresolved">
                            DTPs Unresolved
                          </MenuItem>
                        </Select>
                      </div>
                    )}
                  />
                </div>

                {/* Follow-up Date */}
                <Controller
                  name="followUpDate"
                  control={control}
                  render={({  field  }) => (
                    <DatePicker
                      {...field}
                      label="Next Follow-up Date"
                      minDate={new Date()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: 'Optional: Schedule next appointment',}
                        },
                    />
                  )}
                />

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
                      label="Additional Notes"
                      placeholder="Any additional observations or instructions..."
                      multiline
                      rows={3}
                      fullWidth
                      error={!!errors.notes}
                      helperText={
                        errors.notes?.message || 'Optional clinical notes'}
                      }
                    />
                  )}
                />
              </div>
            </form>
          </DialogContent>

          <DialogActions className="">
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleSaveCarePlan)}
              
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting
                ? 'Saving...'
                : selectedCarePlan
                ? 'Update Plan'
                : 'Create Plan'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};

export default CarePlanManagement;
