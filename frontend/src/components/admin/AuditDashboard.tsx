import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert } from '@/components/ui/button';

interface AuditLog {
  _id: string;
  timestamp: string;
  action: string;
  actionDisplay: string;
  resourceType: string;
  resourceId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  userRole: string;
  complianceCategory: string;
  complianceCategoryDisplay: string;
  riskLevel: string;
  riskLevelDisplay: string;
  ipAddress?: string;
  patientId?: {
    _id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
  reviewId?: {
    _id: string;
    reviewNumber: string;
    status: string;
  };
  details: Record<string, unknown>;
  errorMessage?: string;
  duration?: number;
}
interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resourceType?: string;
  complianceCategory?: string;
  riskLevel?: string;
  patientId?: string;
  reviewId?: string;
  ipAddress?: string;
}
const AuditDashboard: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState<AuditFilters>({ 
    startDate: subDays(new Date(), 7), // Default to last 7 days
    endDate: new Date()}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>(
    'json'
  );
  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery({ 
    queryKey: ['auditLogs', page, rowsPerPage, filters],
    queryFn: () =>
      auditService.getAuditLogs({
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()}
      })}
  // Fetch audit summary
  const { data: summaryData } = useQuery({ 
    queryKey: ['auditSummary', filters.startDate, filters.endDate],
    queryFn: () =>
      auditService.getAuditSummary({
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()}
      })}
  // Fetch filter options
  const { data: filterOptions } = useQuery({ 
    queryKey: ['auditActions'],
    queryFn: () => auditService.getAuditActions()}
  });
  // Export mutation
  const exportMutation = useMutation({ 
    mutationFn: (exportData: Record<string, unknown>) =>
      auditService.exportAuditData(exportData),
    onSuccess: (data, variables) => {
      // Handle file download
      const blob = new Blob([data], {
        type: variables.format === 'csv' ? 'text/csv' : 'application/json'}
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_export_${format(new Date(), 'yyyy-MM-dd')}.${
        variables.format
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    }
  const handleFilterChange = (field: keyof AuditFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };
  const handleExport = () => {
    exportMutation.mutate({ 
      format: exportFormat,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      filters: {
        userId: filters.userId,
        action: filters.action,
        resourceType: filters.resourceType,
        complianceCategory: filters.complianceCategory,
        riskLevel: filters.riskLevel,
        patientId: filters.patientId,
        reviewId: filters.reviewId,
        ipAddress: filters.ipAddress}
      },
      includeDetails: true}
  };
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  const getComplianceCategoryIcon = (category: string) => {
    switch (category) {
      case 'system_security':
        return <SecurityIcon fontSize="small" />;
      case 'patient_safety':
        return <WarningIcon fontSize="small" />;
      default:
        return <ReportIcon fontSize="small" />;
    }
  };
  if (error) {
    return (
      <Alert severity="error">Failed to load audit logs: {error.message}</Alert>
    );
  }
  return (
    <div className="">
      <div  gutterBottom>
        Audit Trail Dashboard
      </div>
      {/* Summary Cards */}
      {summaryData && (
        <div container spacing={3} className="">
          <div item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <div color="textSecondary" gutterBottom>
                  Total Logs
                </div>
                <div >
                  {summaryData.totalLogs?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          <div item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <div color="textSecondary" gutterBottom>
                  Unique Users
                </div>
                <div >
                  {summaryData.uniqueUserCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          <div item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <div color="textSecondary" gutterBottom>
                  Error Rate
                </div>
                <div
                  
                  color={summaryData.errorRate > 5 ? 'error' : 'success'}
                >
                  {summaryData.errorRate?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
          </div>
          <div item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <div color="textSecondary" gutterBottom>
                  Compliance Score
                </div>
                <div
                  
                  color={
                    summaryData.complianceScore > 80 ? 'success' : 'warning'}
                  }
                >
                  {summaryData.complianceScore || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Controls */}
      <div
        className=""
      >
        <Button
          
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        <Button
          
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button
          
          startIcon={<DownloadIcon />}
          onClick={() => setExportDialogOpen(true)}
        >
          Export
        </Button>
      </div>
      {/* Filters */}
      {showFilters && (
        <Card className="">
          <CardContent>
            <div  gutterBottom>
              Filters
            </div>
            <div container spacing={2}>
              <div item xs={12} sm={6} md={3}>
                <Input
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={
                    filters.startDate
                      ? format(filters.startDate, 'yyyy-MM-dd')
                      : ''}
                  }
                  onChange={(e) =>
                    handleFilterChange('startDate', new Date(e.target.value))}
                  }
                  
                />
              </div>
              <div item xs={12} sm={6} md={3}>
                <Input
                  fullWidth
                  type="date"
                  label="End Date"
                  value={
                    filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                  }
                  onChange={(e) =>
                    handleFilterChange('endDate', new Date(e.target.value))}
                  }
                  
                />
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth>
                  <Label>Action</Label>
                  <Select
                    value={filters.action || ''}
                    onChange={(e) =>
                      handleFilterChange('action', e.target.value || undefined)}
                    }
                    label="Action"
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    {filterOptions?.actions?.map((action: string) => (
                      <MenuItem key={action} value={action}>
                        {action}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth>
                  <Label>Risk Level</Label>
                  <Select
                    value={filters.riskLevel || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'riskLevel',
                        e.target.value || undefined
                      )}
                    }
                    label="Risk Level"
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {filterOptions?.riskLevels?.map((level: string) => (
                      <MenuItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth>
                  <Label>Resource Type</Label>
                  <Select
                    value={filters.resourceType || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'resourceType',
                        e.target.value || undefined
                      )}
                    }
                    label="Resource Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {filterOptions?.resourceTypes?.map((type: string) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth>
                  <Label>Compliance Category</Label>
                  <Select
                    value={filters.complianceCategory || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'complianceCategory',
                        e.target.value || undefined
                      )}
                    }
                    label="Compliance Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {filterOptions?.complianceCategories?.map(
                      (category: string) => (
                        <MenuItem key={category} value={category}>
                          {category
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <Input
                  fullWidth
                  label="IP Address"
                  value={filters.ipAddress || ''}
                  onChange={(e) =>
                    handleFilterChange('ipAddress', e.target.value || undefined)}
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <div  gutterBottom>
            Audit Logs
          </div>
          {isLoading ? (
            <div className="">
              <Spinner />
            </div>
          ) : (
            <>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditData?.data?.map((log: AuditLog) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <div >
                            {format(
                              new Date(log.timestamp),
                              'MMM dd, yyyy HH:mm:ss'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div >
                            {log.actionDisplay}
                          </div>
                          {log.errorMessage && (
                            <Tooltip title={log.errorMessage}>
                              <WarningIcon color="error" fontSize="small" />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <div >
                            {log.userId.firstName} {log.userId.lastName}
                          </div>
                          <div  color="textSecondary">
                            {log.userRole}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div >
                            {log.resourceType}
                          </div>
                          {log.patientId && (
                            <div  color="textSecondary">
                              Patient: {log.patientId.firstName}{' '}
                              {log.patientId.lastName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.riskLevelDisplay}
                            color={
                              getRiskLevelColor(log.riskLevel) as
                                | 'default'
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'}
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <div
                            className=""
                          >
                            {getComplianceCategoryIcon(log.complianceCategory)}
                            <div >
                              {log.complianceCategoryDisplay}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div >
                            {log.ipAddress || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedLog(log)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={auditData?.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                
              />
            </>
          )}
        </CardContent>
      </Card>
      {/* Log Details Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <div className="">
              <div container spacing={2}>
                <div item xs={12} sm={6}>
                  <div >Timestamp</div>
                  <div >
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div >Action</div>
                  <div >
                    {selectedLog.actionDisplay}
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div >User</div>
                  <div >
                    {selectedLog.userId.firstName} {selectedLog.userId.lastName}{' '}
                    ({selectedLog.userId.email})
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div >Risk Level</div>
                  <Chip
                    label={selectedLog.riskLevelDisplay}
                    color={
                      getRiskLevelColor(selectedLog.riskLevel) as
                        | 'default'
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'}
                    }
                    size="small"
                  />
                </div>
                {selectedLog.duration && (
                  <div item xs={12} sm={6}>
                    <div >Duration</div>
                    <div >
                      {selectedLog.duration}ms
                    </div>
                  </div>
                )}
                {selectedLog.errorMessage && (
                  <div item xs={12}>
                    <div >Error Message</div>
                    <div  color="error">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}
                <div item xs={12}>
                  <div >Details</div>
                  <div
                    component="pre"
                    className=""
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      >
        <DialogTitle>Export Audit Data</DialogTitle>
        <DialogContent>
          <div fullWidth className="">
            <Label>Format</Label>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as string)}
              label="Format"
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default AuditDashboard;
