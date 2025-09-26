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
usePatientDTPs,
  useCreateDTP,
  useUpdateDTP,


interface DTPManagementProps {
  patientId: string;
}
interface DTPFormData {
  type: DTPType;
  description?: string;
  status: 'unresolved' | 'resolved';
}
const DTP_TYPES: { value: DTPType; label: string; description: string }[] = [
  {
    value: 'unnecessary',
    label: 'Unnecessary Therapy',
    description: 'Patient receiving drug therapy that is not needed',
  },
  {
    value: 'wrongDrug',
    label: 'Improper Drug Selection',
    description: 'Wrong drug chosen for the condition or patient',
  },
  {
    value: 'doseTooLow',
    label: 'Sub-therapeutic Dosage',
    description: 'Dose is too low to achieve therapeutic effect',
  },
  {
    value: 'doseTooHigh',
    label: 'Overdosage',
    description: 'Dose is too high, potentially causing harm',
  },
  {
    value: 'adverseReaction',
    label: 'Adverse Drug Reaction',
    description: 'Patient experiencing unwanted effects from medication',
  },
  {
    value: 'inappropriateAdherence',
    label: 'Non-adherence',
    description: 'Patient not taking medication as prescribed',
  },
  {
    value: 'needsAdditional',
    label: 'Untreated Condition',
    description:
      'Patient has a condition requiring drug therapy but is not receiving it',
  },
];
const DTPManagement: React.FC<DTPManagementProps> = ({ patientId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDTP, setSelectedDTP] = useState<DrugTherapyProblem | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'unresolved' | 'resolved'
  >('all');
  // RBAC permissions
  // const {} = useRBAC(); // TODO: Add specific permissions when needed
  // React Query hooks
  const {
    data: dtpsResponse,
    isLoading,
    isError,
    error,
  } = usePatientDTPs(patientId);
  const createDTPMutation = useCreateDTP();
  const updateDTPMutation = useUpdateDTP();
  const dtps = dtpsResponse?.data?.results || [];
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<DTPFormData>({ 
    defaultValues: {
      type: 'untreated_condition',
      description: '',
      status: 'unresolved'}
    }
  // Filtered DTPs
  const filteredDTPs = dtps.filter((dtp: DrugTherapyProblem) => {
    const matchesSearch =
      DTP_TYPES.find((t) => t.value === dtp.type)
        ?.label.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (dtp.description &&
        dtp.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || dtp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const handleOpenDialog = (dtp?: DrugTherapyProblem) => {
    if (dtp) {
      setSelectedDTP(dtp);
      reset({ 
        type: dtp.type,
        description: dtp.description || '',
        status: dtp.status}
      });
    } else {
      setSelectedDTP(null);
      reset({ 
        type: 'untreated_condition',
        description: '',
        status: 'unresolved'}
      });
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDTP(null);
    reset();
  };
  const handleSaveDTP = async (formData: DTPFormData) => {
    try {
      const dtpData: CreateDTPData | UpdateDTPData = {
        type: formData.type,
        description: formData.description?.trim() || undefined,
        status: formData.status,
      };
      if (selectedDTP) {
        await updateDTPMutation.mutateAsync({ 
          dtpId: selectedDTP._id,
          dtpData: dtpData as UpdateDTPData}
        });
      } else {
        await createDTPMutation.mutateAsync({ 
          patientId,
          dtpData: dtpData as CreateDTPData}
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving DTP:', error);
    }
  };
  const getDTPTypeInfo = (type: DTPType) => {
    return DTP_TYPES.find((t) => t.value === type) || DTP_TYPES[0];
  };
  const getStatusColor = (
    status: 'unresolved' | 'resolved'
  ): 'error' | 'success' => {
    return status === 'resolved' ? 'success' : 'error';
  };
  const getDTPSeverityColor = (type: DTPType): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'overdosage':
      case 'adverse_drug_reaction':
        return 'error';
      case 'drug_interaction':
      case 'untreated_condition':
        return 'warning';
      default:
        return 'info';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'}
  };
  // Stats
  const unresolvedCount = dtps.filter(
    (dtp: DrugTherapyProblem) => dtp.status === 'unresolved'
  ).length;
  const resolvedCount = dtps.filter(
    (dtp: DrugTherapyProblem) => dtp.status === 'resolved'
  ).length;
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
        <div >Failed to load DTPs</div>
        <div >
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve DTP information.'}
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
            <ReportProblemIcon className="" />
            <div  className="">
              Drug Therapy Problems
            </div>
            {unresolvedCount > 0 && (
              <Chip
                label={`${unresolvedCount} unresolved`}
                size="small"
                color="error"
                className=""
              />
            )}
          </div>
          <RBACGuard action="canCreate">
            <Button
              
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Report DTP
            </Button>
          </RBACGuard>
        </div>
        {/* Statistics Cards */}
        <div direction="row" spacing={2} className="">
          <Card className="">
            <ErrorIcon color="error" className="" />
            <div >{unresolvedCount}</div>
            <div  color="text.secondary">
              Unresolved DTPs
            </div>
          </Card>
          <Card className="">
            <CheckCircleIcon color="success" className="" />
            <div >{resolvedCount}</div>
            <div  color="text.secondary">
              Resolved DTPs
            </div>
          </Card>
          <Card className="">
            <ReportProblemIcon color="primary" className="" />
            <div >{dtps.length}</div>
            <div  color="text.secondary">
              Total DTPs
            </div>
          </Card>
        </div>
        {/* Filters */}
        {dtps.length > 0 && (
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div className="">
                  <Input
                    fullWidth
                    size="small"
                    placeholder="Search DTPs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    
                  />
                </div>
                <div className="">
                  <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={(_, newFilter) =>
                      newFilter && setStatusFilter(newFilter)}
                    }
                    size="small"
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="unresolved">Unresolved</ToggleButton>
                    <ToggleButton value="resolved">Resolved</ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <div className="">
                  <div  color="text.secondary">
                    {filteredDTPs.length} of {dtps.length} shown
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* DTPs List */}
        {filteredDTPs.length === 0 ? (
          <Card>
            <CardContent className="">
              <ReportProblemIcon
                className=""
              />
              <div  color="text.secondary" className="">
                {searchTerm || statusFilter !== 'all'
                  ? 'No matching DTPs found'
                  : 'No drug therapy problems recorded'}
              </div>
              <div  color="text.secondary" className="">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Monitor and document drug therapy problems to optimize patient care'}
              </div>
              {!searchTerm && statusFilter === 'all' && (
                <RBACGuard action="canCreate">
                  <Button
                    
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Report First DTP
                  </Button>
                </RBACGuard>
              )}
            </CardContent>
          </Card>
        ) : (
          <TableContainer >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Reported</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDTPs.map((dtp: DrugTherapyProblem) => {
                  const typeInfo = getDTPTypeInfo(dtp.type);
                  return (
                    <TableRow key={dtp._id} hover>
                      <TableCell>
                        <div>
                          <div  className="">
                            {typeInfo.label}
                          </div>
                          <Chip
                            size="small"
                            label={typeInfo.label}
                            color={getDTPSeverityColor(dtp.type)}
                            
                            className=""
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div >
                          {dtp.description || typeInfo.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            dtp.status === 'resolved'
                              ? 'Resolved'
                              : 'Unresolved'}
                          }
                          size="small"
                          color={getStatusColor(dtp.status)}
                          icon={
                            dtp.status === 'resolved' ? (
                              <CheckCircleIcon />
                            ) : (
                              <WarningIcon />
                            )}
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div >
                          {formatDate(dtp.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        <div
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <RBACGuard action="canUpdate">
                            <Tooltip title="Edit DTP">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(dtp)}
                                disabled={
                                  createDTPMutation.isPending ||
                                  updateDTPMutation.isPending}
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </RBACGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Add/Edit DTP Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <div className="">
              <ReportProblemIcon className="" />
              {selectedDTP ? 'Edit Drug Therapy Problem' : 'Report New DTP'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <form onSubmit={handleSubmit(handleSaveDTP)}>
              <div spacing={3}>
                {/* DTP Type */}
                <Controller
                  name="type"
                  control={control}
                  
                  render={({  field  }) => (
                    <div fullWidth error={!!errors.type}>
                      <Label>DTP Type</Label>
                      <Select {...field} label="DTP Type">
                        {DTP_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <div>
                              <div
                                
                                className=""
                              >
                                {type.label}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {type.description}
                              </div>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                />
                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Description cannot exceed 500 characters',}
                    },
                  render={({  field  }) => (
                    <Input
                      {...field}
                      label="Detailed Description"
                      placeholder="Provide specific details about this drug therapy problem..."
                      multiline
                      rows={4}
                      fullWidth
                      error={!!errors.description}
                      helperText={
                        errors.description?.message ||
                        'Optional: Add specific details about the problem and its context'}
                      }
                    />
                  )}
                />
                {/* Status */}
                <Controller
                  name="status"
                  control={control}
                  render={({  field  }) => (
                    <div fullWidth>
                      <Label>Status</Label>
                      <Select {...field} label="Status">
                        <MenuItem value="unresolved">
                          <div className="">
                            <WarningIcon color="error" className="" />
                            Unresolved - Requires attention
                          </div>
                        </MenuItem>
                        <MenuItem value="resolved">
                          <div className="">
                            <CheckCircleIcon color="success" className="" />
                            Resolved - Problem addressed
                          </div>
                        </MenuItem>
                      </Select>
                    </div>
                  )}
                />
                {/* Problem Type Information */}
                {watch('type') && (
                  <Alert
                    severity={
                      getDTPSeverityColor(watch('type')) === 'error'
                        ? 'error'
                        : 'info'}
                    }
                    className=""
                  >
                    <div >
                      <strong>{getDTPTypeInfo(watch('type')).label}:</strong>{' '}
                      {getDTPTypeInfo(watch('type')).description}
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
              onClick={handleSubmit(handleSaveDTP)}
              
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting
                ? 'Saving...'
                : selectedDTP
                ? 'Update DTP'
                : 'Report DTP'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};
export default DTPManagement;
