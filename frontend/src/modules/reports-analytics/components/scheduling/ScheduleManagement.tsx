import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Alert } from '@/components/ui/button';

interface ScheduleManagementProps {
  reportType?: string;
}
export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ 
  reportType
}) => {
  const {
    schedules,
    getActiveSchedules,
    updateSchedule,
    removeSchedule,
    setScheduleDialogOpen,
    scheduleDialogOpen,
  } = useExportsStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ReportSchedule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(
    null
  );
  // Filter schedules by report type if specified
  const filteredSchedules = Object.values(schedules).filter(
    (schedule) => !reportType || schedule.reportType === reportType
  );
  const paginatedSchedules = filteredSchedules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    schedule: ReportSchedule
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(schedule);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSchedule(null);
  };
  const handleToggleActive = (scheduleId: string, isActive: boolean) => {
    updateSchedule(scheduleId, { isActive });
    handleMenuClose();
  };
  const handleEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule);
    setScheduleDialogOpen(true);
    handleMenuClose();
  };
  const handleDelete = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  const confirmDelete = () => {
    if (scheduleToDelete) {
      removeSchedule(scheduleToDelete);
    }
    setDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };
  const handleRunNow = (schedule: ReportSchedule) => {
    // TODO: Implement immediate execution
    console.log('Running schedule immediately:', schedule.id);
    handleMenuClose();
  };
  const getFrequencyLabel = (frequency: ScheduleFrequency): string => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: 'Custom',
    };
    return labels[frequency] || frequency;
  };
  const getStatusColor = (
    schedule: ReportSchedule
  ): 'success' | 'error' | 'warning' | 'default' => {
    if (!schedule.isActive) return 'default';
    const successRate =
      schedule.runCount > 0 ? schedule.successCount / schedule.runCount : 1;
    if (successRate >= 0.9) return 'success';
    if (successRate >= 0.7) return 'warning';
    return 'error';
  };
  const getNextRunStatus = (
    nextRun?: Date
  ): { label: string; color: 'success' | 'warning' | 'error' | 'default' } => {
    if (!nextRun) return { label: 'Not scheduled', color: 'default' };
    const now = new Date();
    const timeDiff = nextRun.getTime() - now.getTime();
    const hoursUntil = timeDiff / (1000 * 60 * 60);
    if (hoursUntil < 0) return { label: 'Overdue', color: 'error' };
    if (hoursUntil < 1) return { label: 'Due soon', color: 'warning' };
    if (hoursUntil < 24) return { label: 'Today', color: 'success' };
    return { label: nextRun.toLocaleDateString(), color: 'default' };
  };
  const formatLastRun = (lastRun?: Date): string => {
    if (!lastRun) return 'Never';
    const now = new Date();
    const timeDiff = now.getTime() - lastRun.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };
  return (
    <div>
      <Card>
        <CardContent>
          <div
            display="flex"
            alignItems="center"
            justifyContent="between"
            mb={2}
          >
            <div  component="div">
              Scheduled Reports
              {filteredSchedules.length > 0 && (
                <Badge
                  badgeContent={getActiveSchedules().length}
                  color="primary"
                  className=""
                >
                  <ScheduleIcon />
                </Badge>
              )}
            </div>
            <div display="flex" gap={1}>
              <Button
                startIcon={<RefreshIcon />}
                
                size="small"
              >
                Refresh
              </Button>
              <Button
                startIcon={<AddIcon />}
                
                
                size="small"
              >
                New Schedule
              </Button>
            </div>
          </div>
          {filteredSchedules.length === 0 ? (
            <Alert severity="info">
              No scheduled reports found. Create your first schedule to automate
              report delivery.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Report Type</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Recipients</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Next Run</TableCell>
                      <TableCell>Last Run</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSchedules.map((schedule) => {
                      const nextRunStatus = getNextRunStatus(schedule.nextRun);
                      const successRate =
                        schedule.runCount > 0
                          ? (
                              (schedule.successCount / schedule.runCount) *
                              100
                            ).toFixed(1)
                          : '100';
                      return (
                        <TableRow key={schedule.id} hover>
                          <TableCell>
                            <div>
                              <div  fontWeight="medium">
                                {schedule.name}
                              </div>
                              {schedule.description && (
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {schedule.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div >
                              {schedule.reportType
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <Chip
                              label={schedule.exportConfig.format.toUpperCase()}
                              size="small"
                              
                            />
                          </TableCell>
                          <TableCell>
                            <div >
                              {getFrequencyLabel(schedule.schedule.frequency)}
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              at {schedule.schedule.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div display="flex" alignItems="center" gap={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <div >
                                {schedule.recipients.length}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={schedule.isActive ? 'Active' : 'Inactive'}
                              color={
                                schedule.isActive
                                  ? getStatusColor(schedule)
                                  : 'default'}
                              }
                              size="small"
                              icon={
                                schedule.isActive ? (
                                  <CheckCircleIcon />
                                ) : (
                                  <PauseIcon />
                                )}
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={nextRunStatus.label}
                              color={nextRunStatus.color}
                              size="small"
                              
                            />
                            {schedule.nextRun && (
                              <div
                                
                                display="block"
                                color="text.secondary"
                              >
                                {schedule.nextRun.toLocaleTimeString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div >
                              {formatLastRun(schedule.lastRun)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div display="flex" alignItems="center" gap={0.5}>
                              <div >
                                {successRate}%
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                ({schedule.successCount}/{schedule.runCount})
                              </div>
                            </div>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, schedule)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredSchedules.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedSchedule && (
          <>
            <MenuItem onClick={() => handleRunNow(selectedSchedule)}>
              <div>
                <PlayIcon fontSize="small" />
              </div>
              <div>Run Now</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleEdit(selectedSchedule)}>
              <div>
                <EditIcon fontSize="small" />
              </div>
              <div>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                handleToggleActive(
                  selectedSchedule.id,
                  !selectedSchedule.isActive
                )}
              }
            >
              <div>
                {selectedSchedule.isActive ? (
                  <PauseIcon fontSize="small" />
                ) : (
                  <PlayIcon fontSize="small" />
                )}
              </div>
              <div>
                {selectedSchedule.isActive ? 'Pause' : 'Activate'}
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleDelete(selectedSchedule.id)}>
              <div>
                <DeleteIcon fontSize="small" />
              </div>
              <div>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Schedule</DialogTitle>
        <DialogContent>
          <div>
            Are you sure you want to delete this schedule? This action cannot be
            undone.
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Schedule Dialog */}
      <ReportScheduler
        open={scheduleDialogOpen}
        
        reportType={reportType || 'general'}
         // TODO: Pass current filters
        initialSchedule={editingSchedule || undefined}
      />
    </div>
  );
};
