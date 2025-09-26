import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Progress } from '@/components/ui/button';

interface ExportProgressTrackerProps {
  showCompleted?: boolean;
  maxItems?: number;
}
export const ExportProgressTracker: React.FC<ExportProgressTrackerProps> = ({ 
  showCompleted = true,
  maxItems = 10
}) => {
  const {
    exportJobs,
    exportResults,
    getActiveExportJobs,
    getCompletedExportJobs,
    updateExportJob,
    removeExportJob,
    removeExportResult,
  } = useExportsStore();
  const [expanded, setExpanded] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const activeJobs = getActiveExportJobs();
  const completedJobs = showCompleted
    ? getCompletedExportJobs().slice(0, maxItems)
    : [];
  const handleCancelExport = (jobId: string) => {
    updateExportJob(jobId, {
      status: 'cancelled',
      completedAt: new Date()}
  };
  const handleRetryExport = (jobId: string) => {
    const job = exportJobs[jobId];
    if (job && job.retryCount < job.maxRetries) {
      updateExportJob(jobId, {
        status: 'queued',
        progress: 0,
        retryCount: job.retryCount + 1,
        error: undefined}
    }
  };
  const handleDeleteJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (selectedJobId) {
      removeExportJob(selectedJobId);
      const result = Object.values(exportResults).find(
        (r) => r.id === selectedJobId
      );
      if (result) {
        removeExportResult(selectedJobId);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedJobId(null);
  };
  const handleDownload = (result: ExportResult) => {
    if (result.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
      case 'cancelled':
        return <ErrorIcon color="error" />;
      case 'processing':
      case 'queued':
        return <ScheduleIcon color="primary" />;
      default:
        return <ScheduleIcon />;
    }
  };
  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'primary';
      case 'queued':
        return 'info';
      default:
        return 'default';
    }
  };
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };
  if (activeJobs.length === 0 && completedJobs.length === 0) {
    return null;
  }
  return (
    <div>
      <Card>
        <CardContent>
          <div
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <div  component="div">
              Export Progress
            </div>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </div>
          <Collapse in={expanded}>
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div mb={2}>
                <div
                  
                  gutterBottom
                  color="text.secondary"
                >
                  Active Exports ({activeJobs.length})
                </div>
                <List dense>
                  {activeJobs.map((job) => (
                    <div key={job.id} divider>
                      <div
                        primary={}
                          <div display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(job.status)}
                            <div >
                              {job.reportType
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <Chip
                              label={job.config.format.toUpperCase()}
                              size="small"
                              
                            />
                          </div>
                        }
                        secondary={
                          <div>
                            <div  display="block">
                              {getExportProgressMessage(
                                job.progress,
                                job.config.format}
                              )}
                            </div>
                            <Progress
                              
                              className=""
                            />
                            <div
                              
                              color="text.secondary"
                            >
                              Started {formatDuration(job.createdAt)} ago
                            </div>
                          </div>
                        }
                      />
                      <divSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleCancelExport(job.id)}
                          size="small"
                          color="error"
                        >
                          <CancelIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </div>
                  ))}
                </List>
              </div>
            )}
            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <div>
                <div
                  
                  gutterBottom
                  color="text.secondary"
                >
                  Recent Exports
                </div>
                <List dense>
                  {completedJobs.map((job) => {
                    const result = exportResults[job.id];
                    return (
                      <div key={job.id} divider>
                        <div
                          primary={}
                            <div display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(job.status)}
                              <div >
                                {job.reportType
                                  .replace(/-/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                              <Chip
                                label={job.config.format.toUpperCase()}
                                size="small"
                                color={getStatusColor(job.status)}
                                
                              />
                            </div>
                          }
                          secondary={
                            <div>
                              {job.status === 'completed' && result && (
                                <div  display="block">}
                                  {result.filename} (
                                  {result.fileSize
                                    ? `${Math.round(result.fileSize / 1024)} KB`
                                    : 'Unknown size'}
                                  )
                                </div>
                              )}
                              {job.status === 'failed' && job.error && (
                                <div
                                  
                                  color="error"
                                  display="block"
                                >
                                  Error: {job.error}
                                </div>
                              )}
                              <div
                                
                                color="text.secondary"
                              >
                                {job.status === 'completed'
                                  ? 'Completed'
                                  : 'Failed'}{' '}
                                {formatDuration(job.createdAt, job.completedAt)}{' '}
                                ago
                              </div>
                            </div>
                          }
                        />
                        <divSecondaryAction>
                          <div display="flex" gap={0.5}>
                            {job.status === 'completed' &&
                              result?.downloadUrl && (
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDownload(result)}
                                  size="small"
                                  color="primary"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              )}
                            {job.status === 'failed' &&
                              job.retryCount < job.maxRetries && (
                                <IconButton
                                  edge="end"
                                  onClick={() => handleRetryExport(job.id)}
                                  size="small"
                                  color="primary"
                                >
                                  <RefreshIcon />
                                </IconButton>
                              )}
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteJob(job.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </ListItemSecondaryAction>
                      </div>
                    );
                  })}
                </List>
              </div>
            )}
          </Collapse>
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Export</DialogTitle>
        <DialogContent>
          <div>
            Are you sure you want to delete this export? This action cannot be
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
    </div>
  );
};
