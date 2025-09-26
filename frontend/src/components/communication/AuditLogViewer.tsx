import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert } from '@/components/ui/button';
// Icon aliases for consistency
const FilterIcon = FilterList;
const DownloadIcon = Download;
const SearchIcon = Search;
const ViewIcon = Visibility;
const SecurityIcon = Security;
const WarningIcon = Warning;
const ErrorIcon = Error;
const InfoIcon = Info;

// Helper function to safely parse JSON responses
const safeJsonParse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from server');
    }
  } else {
    // Try to get text response and see if it's actually JSON
    const textResponse = await response.text();
    // Check if it's an HTML error page (common when endpoints don't exist)
    if (
      textResponse.trim().startsWith('<!DOCTYPE') ||
      textResponse.trim().startsWith('<html')
    ) {
      console.warn(
        'Received HTML response instead of JSON - endpoint may not exist'
      );
      throw new Error(
        `Server returned HTML instead of JSON: ${response.status} ${response.statusText}`
      );
    }
    // Handle empty responses
    if (!textResponse.trim()) {
      console.warn('Received empty response');
      throw new Error(
        `Server returned empty response: ${response.status} ${response.statusText}`
      );
    }
    try {
      return JSON.parse(textResponse);
    } catch {
      console.warn('Response is not JSON:', textResponse.substring(0, 200));
      throw new Error(
        `Server returned non-JSON response: ${response.status} ${response.statusText}`
      );
    }
  }
};
interface AuditLog {
  _id: string;
  action: string;
  timestamp: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  targetId: string;
  targetType: 'conversation' | 'message' | 'user' | 'file' | 'notification';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceCategory: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  duration?: number;
  details: {
    conversationId?: string;
    messageId?: string;
    patientId?: string;
    fileName?: string;
    metadata?: Record<string, unknown>;
  };
  errorMessage?: string;
}
interface AuditFilters {
  userId?: string;
  action?: string;
  targetType?: string;
  conversationId?: string;
  patientId?: string;
  riskLevel?: string;
  complianceCategory?: string;
  success?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  searchQuery?: string;
}
interface AuditLogViewerProps {
  conversationId?: string;
  patientId?: string;
  height?: string;
  showFilters?: boolean;
  showExport?: boolean;
}
const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ 
  conversationId,
  patientId,
  height = '600px',
  showFilters = true,
  showExport = true
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>({ 
    conversationId,
    patientId
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);
  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ 
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString()
      });
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      const endpoint = conversationId
        ? `/api/communication/audit/conversation/${conversationId}?${queryParams}`
        : `/api/communication/audit?${queryParams}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) {
        // Handle different error cases
        if (response.status === 404) {
          // Endpoint doesn't exist - return empty data
          setLogs([]);
          setTotalCount(0);
          return;
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
        try {
          const errorData = await safeJsonParse(response);
          throw new Error(
            (errorData as { message?: string }).message ||
              'Failed to fetch audit logs'
          );
        } catch {
          throw new Error(
            `Failed to fetch audit logs: ${response.status} ${response.statusText}`
          );
        }
      }
      const data = await safeJsonParse(response);
      setLogs((data as { data: AuditLog[] }).data);
      setTotalCount(
        (data as { pagination?: { total: number }; count?: number }).pagination
          ?.total ||
          (data as { count?: number }).count ||
          0
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [conversationId, filters, page, rowsPerPage]);
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);
  // Handle filter changes
  const handleFilterChange = (key: keyof AuditFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filters change
  };
  // Clear filters
  const clearFilters = () => {
    setFilters({ 
      conversationId,
      patientId,
    });
    setPage(0);
  };
  // Export audit logs
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams({ format });
      // Add filters to export
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      const response = await fetch(
        `/api/communication/audit/export?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Export functionality is not available');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
        try {
          const errorData = await safeJsonParse(response);
          throw new Error(
            (errorData as { message?: string }).message ||
              'Failed to export audit logs'
          );
        } catch {
          throw new Error(
            `Failed to export audit logs: ${response.status} ${response.statusText}`
          );
        }
      }
      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${format}_${
        format === 'csv' ? new Date().toISOString().split('T')[0] : Date.now()
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };
  // Get risk level color and icon
  const getRiskLevelDisplay = (riskLevel: string) => {
    const config = {
      low: { color: 'success', icon: <InfoIcon fontSize="small" /> },
      medium: { color: 'warning', icon: <WarningIcon fontSize="small" /> },
      high: { color: 'error', icon: <ErrorIcon fontSize="small" /> },
      critical: { color: 'error', icon: <SecurityIcon fontSize="small" /> },
    };
    const { color, icon } =
      config[riskLevel as keyof typeof config] || config.low;
    return (
      <Chip
        size="small"
        color={
          color as
            | 'success'
            | 'warning'
            | 'error'
            | 'info'
            | 'default'
            | 'primary'
            | 'secondary'}
        }
        icon={icon}
        label={riskLevel.toUpperCase()}
        
      />
    );
  };
  // Format action name
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  // Format details for display
  const formatDetails = (log: AuditLog) => {
    const details = [];
    if (log.details.conversationId)
      details.push(`Conv: ${log.details.conversationId.slice(-8)}`);
    if (log.details.messageId)
      details.push(`Msg: ${log.details.messageId.slice(-8)}`);
    if (log.details.patientId)
      details.push(`Patient: ${log.details.patientId.slice(-8)}`);
    if (log.details.fileName) details.push(`File: ${log.details.fileName}`);
    if (log.duration) details.push(`${log.duration}ms`);
    return details.join(', ');
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div className="">
          <div
            className=""
          >
            <div
              
              className=""
            >
              <SecurityIcon />
              Audit Log Viewer
              {conversationId && (
                <Chip
                  size="small"
                  label={`Conversation: ${conversationId.slice(-8)}`}
                />
              )}
            </div>
            <div className="">
              {showFilters && (
                <Button
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  variant={showFiltersPanel ? 'contained' : 'outlined'}
                  size="small"
                >
                  Filters
                </Button>
              )}
              {showExport && (
                <>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    size="small"
                    
                  >
                    Export CSV
                  </Button>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    size="small"
                    
                  >
                    Export JSON
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Filters Panel */}
          <Collapse in={showFiltersPanel}>
            <Card  className="">
              <CardContent>
                <div >
                  <div
                    >
                    <Input
                      fullWidth
                      size="small"
                      label="Search"
                      placeholder="Search actions, users..."
                      value={filters.searchQuery || ''}
                      onChange={(e) =>
                        handleFilterChange('searchQuery', e.target.value)}
                      }
                      
                    />
                  </div>
                  <div
                    >
                    <div fullWidth size="small">
                      <Label>Action</Label>
                      <Select
                        value={filters.action || ''}
                        onChange={(e) =>
                          handleFilterChange('action', e.target.value)}
                        }
                        label="Action"
                      >
                        <MenuItem value="">All Actions</MenuItem>
                        <MenuItem value="message_sent">Message Sent</MenuItem>
                        <MenuItem value="message_read">Message Read</MenuItem>
                        <MenuItem value="conversation_created">
                          Conversation Created
                        </MenuItem>
                        <MenuItem value="participant_added">
                          Participant Added
                        </MenuItem>
                        <MenuItem value="file_uploaded">File Uploaded</MenuItem>
                        <MenuItem value="conversation_exported">
                          Conversation Exported
                        </MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div
                    >
                    <div fullWidth size="small">
                      <Label>Risk Level</Label>
                      <Select
                        value={filters.riskLevel || ''}
                        onChange={(e) =>
                          handleFilterChange('riskLevel', e.target.value)}
                        }
                        label="Risk Level"
                      >
                        <MenuItem value="">All Levels</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div
                    >
                    <div fullWidth size="small">
                      <Label>Success</Label>
                      <Select
                        value={
                          filters.success !== undefined
                            ? filters.success.toString()
                            : ''}
                        }
                        onChange={(e) =>
                          handleFilterChange(
                            'success',
                            e.target.value === ''
                              ? undefined
                              : e.target.value === 'true'
                          )}
                        }
                        label="Success"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Success</MenuItem>
                        <MenuItem value="false">Failed</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div
                    >
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{}
                        textField: { size: 'small', fullWidth: true },
                    />
                  </div>
                  <div
                    >
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{}
                        textField: { size: 'small', fullWidth: true },
                    />
                  </div>
                  <div
                    >
                    <Button
                      fullWidth
                      
                      onClick={clearFilters}
                      size="small"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Collapse>
        </div>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" className="" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {/* Loading State */}
        {loading && (
          <div className="">
            <Spinner />
          </div>
        )}
        {/* Audit Logs Table */}
        {!loading && (
          <TableContainer  className="">
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <div >
                        {format(
                          parseISO(log.timestamp),
                          'MMM dd, yyyy HH:mm:ss'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div  fontWeight="medium">
                        {formatAction(log.action)}
                      </div>
                      <div  color="text.secondary">
                        {log.targetType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div >
                        {log.userId.firstName} {log.userId.lastName}
                      </div>
                      <div  color="text.secondary">
                        {log.userId.role}
                      </div>
                    </TableCell>
                    <TableCell>{getRiskLevelDisplay(log.riskLevel)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={log.success ? 'success' : 'error'}
                        label={log.success ? 'Success' : 'Failed'}
                        
                      />
                    </TableCell>
                    <TableCell>
                      <div  noWrap className="">
                        {formatDetails(log)}
                      </div>
                      {log.errorMessage && (
                        <div  color="error">
                          {log.errorMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedLog(log)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="">
                      <div color="text.secondary">
                        No audit logs found
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
        {/* Audit Log Details Dialog */}
        <Dialog
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Audit Log Details
            {selectedLog && getRiskLevelDisplay(selectedLog.riskLevel)}
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <div >
                <div
                  >
                  <div  gutterBottom>
                    Basic Information
                  </div>
                  <div >
                    <strong>Action:</strong> {formatAction(selectedLog.action)}
                  </div>
                  <div >
                    <strong>Timestamp:</strong>{' '}
                    {format(parseISO(selectedLog.timestamp), 'PPpp')}
                  </div>
                  <div >
                    <strong>User:</strong> {selectedLog.userId.firstName}{' '}
                    {selectedLog.userId.lastName} ({selectedLog.userId.email})
                  </div>
                  <div >
                    <strong>Role:</strong> {selectedLog.userId.role}
                  </div>
                  <div >
                    <strong>Target Type:</strong> {selectedLog.targetType}
                  </div>
                  <div >
                    <strong>Target ID:</strong> {selectedLog.targetId}
                  </div>
                </div>
                <div
                  >
                  <div  gutterBottom>
                    Security & Compliance
                  </div>
                  <div >
                    <strong>Risk Level:</strong> {selectedLog.riskLevel}
                  </div>
                  <div >
                    <strong>Compliance Category:</strong>{' '}
                    {selectedLog.complianceCategory}
                  </div>
                  <div >
                    <strong>Success:</strong>{' '}
                    {selectedLog.success ? 'Yes' : 'No'}
                  </div>
                  <div >
                    <strong>IP Address:</strong> {selectedLog.ipAddress}
                  </div>
                  {selectedLog.duration && (
                    <div >
                      <strong>Duration:</strong> {selectedLog.duration}ms
                    </div>
                  )}
                </div>
                <div >
                  <div  gutterBottom>
                    Details
                  </div>
                  <div  className="">
                    <pre
                      >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
                {selectedLog.errorMessage && (
                  <div >
                    <div  gutterBottom color="error">
                      Error Message
                    </div>
                    <Alert severity="error">{selectedLog.errorMessage}</Alert>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};
export default AuditLogViewer;
