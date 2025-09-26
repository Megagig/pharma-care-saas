import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Tooltip } from '@/components/ui/tooltip';

import { Alert } from '@/components/ui/alert';

import { Skeleton } from '@/components/ui/skeleton';

import { Separator } from '@/components/ui/separator';
import {
  usePatientDashboardMTRData,
  useSyncMedicationsWithMTR,
  useSyncDTPsWithMTR,
} from '@/hooks/useMTR';

// ===============================
// PATIENT MTR WIDGET COMPONENT
// ===============================
interface PatientMTRWidgetProps {
  patientId: string;
  onStartMTR?: (mtrId: string) => void;
  onViewMTR?: (mtrId: string) => void;
}
export const PatientMTRWidget: React.FC<PatientMTRWidgetProps> = ({ 
  patientId,
  onStartMTR,
  onViewMTR
}) => {
  const navigate = useNavigate();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedMTRForSync, setSelectedMTRForSync] = useState<string | null>(
    null
  );
  // Queries
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = usePatientDashboardMTRData(
    patientId,
    !!patientId && patientId.length === 24
  );
  // Mutations
  const createMTRMutation = useCreateMTRSession();
  const syncMedicationsMutation = useSyncMedicationsWithMTR();
  const syncDTPsMutation = useSyncDTPsWithMTR();
  const handleStartMTR = async (event?: React.MouseEvent) => {
    // Prevent default behavior and event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Prevent multiple clicks
    if (createMTRMutation.isPending) {
      console.log('MTR creation already in progress, ignoring click');
      return;
    }
    try {
      console.log('Starting MTR for patient:', patientId);
      const result = await createMTRMutation.mutateAsync({ 
        patientId,
        reviewType: 'initial',
        priority: 'routine',
        patientConsent: true,
        confidentialityAgreed: true}
      });
      console.log('MTR creation result:', result);
      // Check different possible response structures
      let newMTRId =
        result?.review?._id || result?.data?.review?._id || result?._id;
      if (!newMTRId) {
        console.error('No MTR ID returned from creation:', result);
        console.error(
          'Full result structure:',
          JSON.stringify(result, null, 2)
        );
        throw new Error('Failed to create MTR session - no ID returned');
      }
      console.log('Navigating to MTR:', newMTRId);
      if (onStartMTR) {
        onStartMTR(newMTRId);
      } else {
        // Navigate to the correct MTR route
        console.log(
          'Navigating to:',
          `/pharmacy/medication-therapy/${newMTRId}`
        );
        // Use setTimeout to ensure the navigation happens after the current event loop
        setTimeout(() => {
          navigate(`/pharmacy/medication-therapy/${newMTRId}`, {
            replace: false}
        }, 100);
      }
    } catch (error) {
      console.error('Failed to start MTR:', error);
      // The error notification is already handled by the mutation's onError
    }
  };
  const handleViewMTR = (mtrId: string) => {
    if (onViewMTR) {
      onViewMTR(mtrId);
    } else {
      navigate(`/pharmacy/medication-therapy/${mtrId}`);
    }
  };
  const handleSyncData = (mtrId: string) => {
    setSelectedMTRForSync(mtrId);
    setShowSyncDialog(true);
  };
  const handleConfirmSync = async () => {
    if (!selectedMTRForSync) return;
    try {
      await Promise.all([
        syncMedicationsMutation.mutateAsync({ 
          patientId,
          mtrId: selectedMTRForSync}
        }),
        syncDTPsMutation.mutateAsync({ 
          patientId,
          mtrId: selectedMTRForSync}
        }),
      ]);
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setShowSyncDialog(false);
      setSelectedMTRForSync(null);
    }
  };
  const getStatusIcon = (status: MedicationTherapyReview['status']) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'in_progress':
        return <StartIcon color="primary" />;
      case 'on_hold':
        return <ScheduleIcon color="warning" />;
      case 'cancelled':
        return <WarningIcon color="error" />;
      default:
        return <MTRIcon />;
    }
  };
  const getPriorityColor = (priority: MedicationTherapyReview['priority']) => {
    switch (priority) {
      case 'high_risk':
        return 'error';
      case 'urgent':
        return 'warning';
      case 'routine':
      default:
        return 'default';
    }
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title={
            <div className="">
              <MTRIcon />
              <div >Medication Therapy Review</div>
            </div>}
          }
        />
        <CardContent>
          <div spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index}  height={60} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card>
        <CardHeader
          title={
            <div className="">
              <MTRIcon />
              <div >Medication Therapy Review</div>
            </div>}
          }
        />
        <CardContent>
          <Alert severity="error">
            Failed to load MTR data: {error?.message || 'Unknown error'}
          </Alert>
        </CardContent>
      </Card>
    );
  }
  // Type the dashboard data properly
  interface MTRSummary {
    totalMTRSessions: number;
    completedMTRSessions: number;
    activeMTRSessions: number;
    lastMTRDate?: string;
  }
  interface MTRSession {
    _id: string;
    reviewNumber: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
    priority: 'routine' | 'urgent' | 'high_risk';
    startedAt: string;
    completedAt?: string;
    completionPercentage: number;
    isOverdue?: boolean;
  }
  interface PendingAction {
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }
  interface DashboardData {
    activeMTRs: MTRSession[];
    recentMTRs: MTRSession[];
    mtrSummary: MTRSummary;
    pendingActions: PendingAction[];
  }
  const typedData = dashboardData as DashboardData | undefined;
  const { activeMTRs, recentMTRs, mtrSummary, pendingActions } = typedData || {
    activeMTRs: [],
    recentMTRs: [],
    mtrSummary: {
      totalMTRSessions: 0,
      completedMTRSessions: 0,
      activeMTRSessions: 0,
    },
    pendingActions: [],
  };
  return (
    <>
      <Card>
        <CardHeader
          title={
            <div className="">
              <MTRIcon />
              <div >Medication Therapy Review</div>
            </div>}
          }
          action={}
            <div direction="row" spacing={1}>
              {mtrSummary && mtrSummary.totalMTRSessions > 0 && (
                <Tooltip title="View MTR History">
                  <IconButton
                    size="small"
                    onClick={() =>}
                      navigate(`/patients/${patientId}/mtr-history`)
                    }
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Button
                size="small"
                
                startIcon={<AddIcon />}
                onClick={(e) => handleStartMTR(e)}
                disabled={createMTRMutation.isPending}
                type="button"
              >
                Start MTR
              </Button>
            </div>
          }
        />
        <CardContent>
          <div spacing={3}>
            {/* MTR Summary Stats */}
            {mtrSummary && (
              <div
                className=""
              >
                <div className="">
                  <div  color="primary">
                    {mtrSummary.totalMTRSessions}
                  </div>
                  <div  color="text.secondary">
                    Total Sessions
                  </div>
                </div>
                <div className="">
                  <div  color="success.main">
                    {mtrSummary.completedMTRSessions}
                  </div>
                  <div  color="text.secondary">
                    Completed
                  </div>
                </div>
                <div className="">
                  <div  color="warning.main">
                    {mtrSummary.activeMTRSessions}
                  </div>
                  <div  color="text.secondary">
                    Active
                  </div>
                </div>
                <div className="">
                  <div  className="">
                    {mtrSummary.lastMTRDate
                      ? new Date(mtrSummary.lastMTRDate).toLocaleDateString()
                      : 'Never'}
                  </div>
                  <div  color="text.secondary">
                    Last MTR
                  </div>
                </div>
              </div>
            )}
            {/* Active MTR Sessions */}
            {activeMTRs && activeMTRs.length > 0 && (
              <>
                <Separator />
                <div>
                  <div
                    
                    className=""
                  >
                    Active MTR Sessions
                  </div>
                  <List dense>
                    {activeMTRs.map((mtr: MTRSession) => (
                      <div
                        key={mtr._id as string}
                        className=""
                        secondaryAction={}
                          <div direction="row" spacing={0.5}>
                            <Tooltip title="Sync patient data">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleSyncData(mtr._id as string)}
                                }
                              >
                                <SyncIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View MTR">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewMTR(mtr._id as string)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </div>
                        }
                      >
                        <div>
                          {getStatusIcon(
                            mtr.status as
                              | 'in_progress'
                              | 'completed'
                              | 'cancelled'
                              | 'on_hold'
                          )}
                        </div>
                        <div
                          primary={
                            <div
                              className=""
                            >
                              <div
                                
                                className=""
                              >}
                                {mtr.reviewNumber as string}
                              </div>
                              <Chip
                                size="small"
                                label={mtr.priority as string}
                                color={getPriorityColor(
                                  mtr.priority as
                                    | 'routine'
                                    | 'urgent'
                                    | 'high_risk'}
                                )}
                                
                              />
                              {(mtr.isOverdue as boolean) && (
                                <Chip
                                  size="small"
                                  label="Overdue"
                                  color="error"
                                  icon={<WarningIcon />}
                                />
                              )}
                            </div>
                          }
                          secondary={
                            <div
                              
                              color="text.secondary"
                            >}
                              Started{' '}
                              {new Date(
                                mtr.startedAt as string
                              ).toLocaleDateString()}{' '}
                              •{mtr.completionPercentage as number}% complete
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </List>
                </div>
              </>
            )}
            {/* Pending Actions */}
            {pendingActions && pendingActions.length > 0 && (
              <>
                <Separator />
                <div>
                  <div
                    
                    className=""
                  >
                    Pending Actions
                  </div>
                  <List dense>
                    {pendingActions
                      .slice(0, 3)
                      .map((action: PendingAction, index: number) => (
                        <div key={index}>
                          <div>
                            <ScheduleIcon
                              color={
                                (action.priority as string) === 'high'
                                  ? 'error'
                                  : 'warning'}
                              }
                            />
                          </div>
                          <div
                            primary={action.description as string}
                            secondary={
                              action.dueDate && (
                                <div
                                  
                                  color="text.secondary"
                                >}
                                  Due:{' '}
                                  {new Date(
                                    action.dueDate as string
                                  ).toLocaleDateString()}
                                </div>
                              )
                            }
                          />
                        </div>
                      ))}
                  </List>
                </div>
              </>
            )}
            {/* Recent MTR Sessions */}
            {recentMTRs && recentMTRs.length > 0 && (
              <>
                <Separator />
                <div>
                  <div
                    
                    className=""
                  >
                    Recent MTR Sessions
                  </div>
                  <List dense>
                    {recentMTRs.slice(0, 3).map((mtr: MTRSession) => (
                      <div
                        key={mtr._id as string}
                        component="div"
                        onClick={() => handleViewMTR(mtr._id as string)}
                        className=""
                      >
                        <div>
                          {getStatusIcon(
                            mtr.status as
                              | 'in_progress'
                              | 'completed'
                              | 'cancelled'
                              | 'on_hold'
                          )}
                        </div>
                        <div
                          primary={
                            <div
                              className=""
                            >
                              <div >}
                                {mtr.reviewNumber as string}
                              </div>
                              <Chip
                                size="small"
                                label={mtr.status as string}
                                color={
                                  (mtr.status as string) === 'completed'
                                    ? 'success'
                                    : 'default'}
                                }
                                
                              />
                            </div>
                          }
                          secondary={
                            <div
                              
                              color="text.secondary"
                            >
                              {new Date(
                                mtr.startedAt as string}
                              ).toLocaleDateString()}
                              {mtr.completedAt &&
                                ` - ${new Date(
                                  mtr.completedAt as string
                                ).toLocaleDateString()}`}
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </List>
                </div>
              </>
            )}
            {/* Empty State */}
            {(!mtrSummary || mtrSummary.totalMTRSessions === 0) && (
              <div className="">
                <MTRIcon
                  className=""
                />
                <div  color="text.secondary" className="">
                  No MTR Sessions
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Start the first medication therapy review for this patient
                </div>
                <Button
                  
                  startIcon={<AddIcon />}
                  onClick={(e) => handleStartMTR(e)}
                  disabled={createMTRMutation.isPending}
                  type="button"
                >
                  Start First MTR
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Sync Data Dialog */}
      <Dialog open={showSyncDialog} onClose={() => setShowSyncDialog(false)}>
        <DialogTitle>Sync Patient Data with MTR</DialogTitle>
        <DialogContent>
          <div  className="">
            This will synchronize the patient's medications and drug therapy
            problems with the selected MTR session. Any conflicts will be
            highlighted for manual resolution.
          </div>
          <Alert severity="info">
            <div >
              • Patient medications will be imported into the MTR session
              <br />
              • Existing DTPs will be linked to the MTR
              <br />• Any conflicts will require manual review
            </div>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)}>Cancel</Button>
          <Button
            
            onClick={handleConfirmSync}
            disabled={
              syncMedicationsMutation.isPending || syncDTPsMutation.isPending}
            }
            startIcon={<SyncIcon />}
          >
            Sync Data
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default PatientMTRWidget;
