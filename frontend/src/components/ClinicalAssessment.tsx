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

import { Separator } from '@/components/ui/separator';
// Icons


interface ClinicalAssessmentProps {
  patientId: string;
}
interface AssessmentFormData {
  // Vitals
  bpSys?: number;
  bpDia?: number;
  rr?: number;
  tempC?: number;
  heartSounds?: string;
  pallor?: 'none' | 'mild' | 'moderate' | 'severe';
  dehydration?: 'none' | 'mild' | 'moderate' | 'severe';
  // Labs
  pcv?: number;
  mcs?: string;
  eucr?: string;
  fbc?: string;
  fbs?: number;
  hba1c?: number;
  recordedAt: Date;
}
const PALLOR_LEVELS = [
  { value: 'none', label: 'None', color: 'success' as const },
  { value: 'mild', label: 'Mild', color: 'warning' as const },
  { value: 'moderate', label: 'Moderate', color: 'error' as const },
  { value: 'severe', label: 'Severe', color: 'error' as const },
];
const ClinicalAssessmentComponent: React.FC<ClinicalAssessmentProps> = ({ 
  patientId
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<ClinicalAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Enhanced notifications, error handling and responsive design
  const crudNotifications = useCRUDNotifications();
  const { executeOperation, isLoading } = useAsyncOperation();
  const { isMobile } = useResponsive();
  // React Query hooks
  const {
    data: assessmentsResponse,
    isLoading: allLoading,
    isError: allError,
    error,
  } = usePatientAssessments(patientId);
  const createAssessmentMutation = useCreateAssessment();
  const updateAssessmentMutation = useUpdateAssessment();
  const assessments = assessmentsResponse?.data?.results || [];
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssessmentFormData>({ 
    defaultValues: {
      bpSys: undefined,
      bpDia: undefined,
      rr: undefined,
      tempC: undefined,
      heartSounds: '',
      pallor: 'none',
      dehydration: 'none',
      pcv: undefined,
      mcs: '',
      eucr: '',
      fbc: '',
      fbs: undefined,
      hba1c: undefined,
      recordedAt: new Date()}
    }
  const handleOpenDialog = (assessment?: ClinicalAssessment) => {
    console.log('handleOpenDialog called with:', assessment);
    console.log('Current isDialogOpen state:', isDialogOpen);
    if (assessment) {
      setSelectedAssessment(assessment);
      reset({ 
        bpSys: assessment.vitals?.bpSys,
        bpDia: assessment.vitals?.bpDia,
        rr: assessment.vitals?.rr,
        tempC: assessment.vitals?.tempC,
        heartSounds: assessment.vitals?.heartSounds || '',
        pallor: assessment.vitals?.pallor || 'none',
        dehydration: assessment.vitals?.dehydration || 'none',
        pcv: assessment.labs?.pcv,
        mcs: assessment.labs?.mcs || '',
        eucr: assessment.labs?.eucr || '',
        fbc: assessment.labs?.fbc || '',
        fbs: assessment.labs?.fbs,
        hba1c: assessment.labs?.hba1c,
        recordedAt: new Date(assessment.recordedAt)}
      });
    } else {
      setSelectedAssessment(null);
      reset({ 
        bpSys: undefined,
        bpDia: undefined,
        rr: undefined,
        tempC: undefined,
        heartSounds: '',
        pallor: 'none',
        dehydration: 'none',
        pcv: undefined,
        mcs: '',
        eucr: '',
        fbc: '',
        fbs: undefined,
        hba1c: undefined,
        recordedAt: new Date()}
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAssessment(null);
    reset();
  };
  const handleSaveAssessment = async (formData: AssessmentFormData) => {
    const assessmentData: CreateAssessmentData | UpdateAssessmentData = {
      vitals: {
        bpSys: formData.bpSys ? Number(formData.bpSys) : undefined,
        bpDia: formData.bpDia ? Number(formData.bpDia) : undefined,
        rr: formData.rr ? Number(formData.rr) : undefined,
        tempC: formData.tempC ? Number(formData.tempC) : undefined,
        heartSounds: formData.heartSounds?.trim() || undefined,
        pallor: formData.pallor,
        dehydration: formData.dehydration,
      },
      labs: {
        pcv: formData.pcv ? Number(formData.pcv) : undefined,
        mcs: formData.mcs?.trim() || undefined,
        eucr: formData.eucr?.trim() || undefined,
        fbc: formData.fbc?.trim() || undefined,
        fbs: formData.fbs ? Number(formData.fbs) : undefined,
        hba1c: formData.hba1c ? Number(formData.hba1c) : undefined,
      },
      recordedAt: formData.recordedAt.toISOString(),
    };
    const operation = selectedAssessment
      ? () =>
          updateAssessmentMutation.mutateAsync({ 
            assessmentId: selectedAssessment._id,
            assessmentData: assessmentData as UpdateAssessmentData}
          })
      : () =>
          createAssessmentMutation.mutateAsync({ 
            patientId,
            assessmentData: assessmentData as CreateAssessmentData}
          });
    await executeOperation(
      selectedAssessment ? 'updateAssessment' : 'createAssessment',
      operation,
      {
        onSuccess: () => {
          handleCloseDialog();
          if (selectedAssessment) {
            crudNotifications.updated('assessment');
          } else {
            crudNotifications.created('assessment');
          }
        },
        onError: (error: unknown) => {
          const operation = selectedAssessment ? 'update' : 'create';
          crudNotifications[`${operation}Failed`](
            'assessment',
            error instanceof Error ? error : new Error('Unknown error')
          );
        },
      }
    );
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'}
  };
  const getFilteredAssessments = () => {
    let filtered = assessments;
    if (searchTerm) {
      filtered = filtered.filter((assessment: ClinicalAssessment) =>
        formatDate(assessment.recordedAt)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };
  const filteredAssessments = getFilteredAssessments();
  return (
      <ResponsiveContainer>
        <LoadingState
          loading={allLoading}
          error={allError ? error : null}
          loadingComponent={}
            <LoadingSkeleton  count={5} animation="wave" />
          }
          errorComponent={
            <ErrorDisplay}
              error={error}
              title="Failed to load assessments"
              type={allError ? 'server' : 'error'}
              retry={() => window.location.reload()}
              showDetails={process.env.NODE_ENV === 'development'}
            />
          }
          emptyComponent={
            <ResponsiveCard
              title="No assessments recorded"
              subtitle="Start by adding the patient's clinical assessments and lab results."
            >
              <div className="">
                <MonitorHeartIcon
                  className=""
                />
                <Button
                  }
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add First Assessment
                </Button>
              </div>
            </ResponsiveCard>
          }
          isEmpty={!allLoading && !allError && assessments.length === 0}
        >
          {/* Header */}
          <ResponsiveHeader
            title="Clinical Assessments"
            subtitle={`${assessments.length} assessment${
              assessments.length !== 1 ? 's' : ''
            } recorded`}
            actions={
              <RBACGuard action="canCreate">
                <Button
                  
                  startIcon={
                    isLoading('createAssessment') ? (}
                      <Spinner size={16} />
                    ) : (
                      <AddIcon />
                    )
                  }
                  onClick={() => handleOpenDialog()}
                  disabled={
                    isLoading('createAssessment') ||
                    isLoading('updateAssessment')}
                  }
                  fullWidth={isMobile}
                >
                  {isLoading('createAssessment')
                    ? 'Adding...'
                    : 'Add Assessment'}
                </Button>
              </RBACGuard>
            }
          />
          {/* Simple assessment list */}
          {assessments.length > 0 && (
            <Card>
              <CardContent>
                <div className="">
                  <Input
                    size="small"
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    
                  />
                </div>
                {filteredAssessments.length === 0 ? (
                  <div color="text.secondary">
                    No assessments found.
                  </div>
                ) : (
                  <div spacing={2}>
                    {filteredAssessments.map(
                      (assessment: ClinicalAssessment) => (
                        <Card key={assessment._id} >
                          <CardContent className="">
                            <div
                              className=""
                            >
                              <div >
                                {formatDate(assessment.recordedAt)}
                              </div>
                              <div className="">
                                <RBACGuard action="canUpdate">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(assessment)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </RBACGuard>
                              </div>
                            </div>
                            <div
                              className=""
                            >
                              {/* Vitals */}
                              <div>
                                <div
                                  
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  Vitals
                                </div>
                                {assessment.vitals?.bpSys &&
                                  assessment.vitals?.bpDia && (
                                    <div >
                                      BP: {assessment.vitals.bpSys}/
                                      {assessment.vitals.bpDia} mmHg
                                    </div>
                                  )}
                                {assessment.vitals?.tempC && (
                                  <div >
                                    Temp: {assessment.vitals.tempC}°C
                                  </div>
                                )}
                                {assessment.vitals?.rr && (
                                  <div >
                                    RR: {assessment.vitals.rr}/min
                                  </div>
                                )}
                              </div>
                              {/* Labs */}
                              <div>
                                <div
                                  
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  Lab Results
                                </div>
                                {assessment.labs?.pcv && (
                                  <div >
                                    PCV: {assessment.labs.pcv}%
                                  </div>
                                )}
                                {assessment.labs?.fbs && (
                                  <div >
                                    FBS: {assessment.labs.fbs} mg/dL
                                  </div>
                                )}
                                {assessment.labs?.hba1c && (
                                  <div >
                                    HbA1c: {assessment.labs.hba1c}%
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </LoadingState>
        {/* Add/Edit Assessment Dialog - Outside LoadingState so it can always render */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <div className="">
              <MonitorHeartIcon color="primary" />
              <div >
                {selectedAssessment ? 'Edit Assessment' : 'Add New Assessment'}
              </div>
            </div>
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit(handleSaveAssessment)}>
              <div spacing={3} className="">
                <Controller
                  name="recordedAt"
                  control={control}
                  
                  render={({  field  }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Date & Time"
                      required
                      maxDateTime={new Date()}
                      error={!!errors.recordedAt}
                      helperText={errors.recordedAt?.message}
                    />
                  )}
                />
                <Separator />
                {/* Vitals Section */}
                <div>
                  <div
                    
                    className=""
                  >
                    <FavoriteIcon color="primary" />
                    Vital Signs
                  </div>
                  <div
                    className=""
                  >
                    <Controller
                      name="bpSys"
                      control={control}
                      rules={{
                        min: {
                          value: 50,
                          message: 'Systolic BP must be at least 50',}
                        },
                        max: {
                          value: 300,
                          message: 'Systolic BP cannot exceed 300',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="Systolic BP"
                          type="number"
                          
                          error={!!errors.bpSys}
                          helperText={errors.bpSys?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="bpDia"
                      control={control}
                      rules={{
                        min: {
                          value: 30,
                          message: 'Diastolic BP must be at least 30',}
                        },
                        max: {
                          value: 200,
                          message: 'Diastolic BP cannot exceed 200',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="Diastolic BP"
                          type="number"
                          
                          error={!!errors.bpDia}
                          helperText={errors.bpDia?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="tempC"
                      control={control}
                      rules={{
                        min: {
                          value: 30,
                          message: 'Temperature must be at least 30°C',}
                        },
                        max: {
                          value: 45,
                          message: 'Temperature cannot exceed 45°C',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="Temperature"
                          type="number"
                          
                          
                          error={!!errors.tempC}
                          helperText={errors.tempC?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="rr"
                      control={control}
                      rules={{
                        min: {
                          value: 5,
                          message: 'Respiratory rate must be at least 5',}
                        },
                        max: {
                          value: 60,
                          message: 'Respiratory rate cannot exceed 60',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="Respiratory Rate"
                          type="number"
                          
                          error={!!errors.rr}
                          helperText={errors.rr?.message}
                          fullWidth
                        />
                      )}
                    />
                  </div>
                  <div
                    className=""
                  >
                    <Controller
                      name="pallor"
                      control={control}
                      render={({  field  }) => (
                        <div fullWidth>
                          <Label>Pallor</Label>
                          <Select {...field} label="Pallor">
                            {PALLOR_LEVELS.map((level) => (
                              <MenuItem key={level.value} value={level.value}>
                                {level.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      name="dehydration"
                      control={control}
                      render={({  field  }) => (
                        <div fullWidth>
                          <Label>Dehydration</Label>
                          <Select {...field} label="Dehydration">
                            {PALLOR_LEVELS.map((level) => (
                              <MenuItem key={level.value} value={level.value}>
                                {level.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      name="heartSounds"
                      control={control}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="Heart Sounds"
                          placeholder="e.g., Normal S1, S2"
                          fullWidth
                        />
                      )}
                    />
                  </div>
                </div>
                <Separator />
                {/* Lab Results Section */}
                <div>
                  <div
                    
                    className=""
                  >
                    <BiotechIcon color="primary" />
                    Lab Results
                  </div>
                  <div
                    className=""
                  >
                    <Controller
                      name="pcv"
                      control={control}
                      rules={{
                        min: {
                          value: 10,
                          message: 'PCV must be at least 10%',}
                        },
                        max: { value: 60, message: 'PCV cannot exceed 60%' },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="PCV"
                          type="number"
                          
                          error={!!errors.pcv}
                          helperText={errors.pcv?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="fbs"
                      control={control}
                      rules={{
                        min: {
                          value: 30,
                          message: 'FBS must be at least 30 mg/dL',}
                        },
                        max: {
                          value: 500,
                          message: 'FBS cannot exceed 500 mg/dL',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="FBS"
                          type="number"
                          
                          error={!!errors.fbs}
                          helperText={errors.fbs?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="hba1c"
                      control={control}
                      rules={{
                        min: {
                          value: 3,
                          message: 'HbA1c must be at least 3%',}
                        },
                        max: {
                          value: 15,
                          message: 'HbA1c cannot exceed 15%',
                        },
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          {...field}
                          value={value || ''}
                          
                          label="HbA1c"
                          type="number"
                          
                          
                          error={!!errors.hba1c}
                          helperText={errors.hba1c?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="mcs"
                      control={control}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="MCS"
                          placeholder="e.g., No growth"
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="eucr"
                      control={control}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="E/U/Cr"
                          placeholder="e.g., Normal"
                          fullWidth
                        />
                      )}
                    />
                    <Controller
                      name="fbc"
                      control={control}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          label="FBC"
                          placeholder="e.g., Normal"
                          fullWidth
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit(handleSaveAssessment)}
              
              disabled={
                isLoading('createAssessment') || isLoading('updateAssessment')}
              }
            >
              {selectedAssessment ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveContainer>
  );
};
export default ClinicalAssessmentComponent;
