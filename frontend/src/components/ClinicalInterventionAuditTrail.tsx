import { Button, Input, Label, Card, CardContent, Select, Tooltip, Spinner, Alert } from '@/components/ui/button';

interface AuditLog {
  _id: string;
  action: string;
  timestamp: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceCategory: string;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}
interface AuditTrailProps {
  interventionId?: string;
  interventionNumber?: string;
}
const ClinicalInterventionAuditTrail: React.FC<AuditTrailProps> = ({ 
  interventionId,
  interventionNumber
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{
    totalActions: number;
    uniqueUsers: number;
    lastActivity: string | null;
    riskActivities: number;
  } | null>(null);
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const limit = 20;
  const fetchAuditTrail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const options: {
        page: number;
        limit: number;
        startDate?: string;
        endDate?: string;
        riskLevel?: string;
      } = {
        page,
        limit,
      };
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;
      if (riskLevelFilter) options.riskLevel = riskLevelFilter;
      let response;
      if (interventionId) {
        // Fetch audit trail for specific intervention
        response = await clinicalInterventionService.getInterventionAuditTrail(
          interventionId,
          options
        );
      } else {
        // Fetch general audit trail for all interventions
        response = await clinicalInterventionService.getAllAuditTrail(options);
      }
      if (response.success && response.data) {
        setAuditLogs(response.data.logs as AuditLog[]);
        setTotalPages(Math.ceil((response.data.total || 0) / limit));
        setSummary(
          response.data.summary || {
            totalActions: 0,
            uniqueUsers: 0,
            lastActivity: null,
            riskActivities: 0,
          }
        );
      } else {
        // Set empty state when no data is available
        setAuditLogs([]);
        setTotalPages(1);
        setSummary({ 
          totalActions: 0,
          uniqueUsers: 0,
          lastActivity: null,
          riskActivities: 0}
        });
        setError(response.message || 'No audit data available');
      }
    } catch (error: unknown) {
      console.error('Error fetching audit trail:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch audit trail';
      setError(errorMessage);
      // Set empty state on error
      setAuditLogs([]);
      setTotalPages(1);
      setSummary({ 
        totalActions: 0,
        uniqueUsers: 0,
        lastActivity: null,
        riskActivities: 0}
      });
    } finally {
      setLoading(false);
    }
  }, [interventionId, page, startDate, endDate, riskLevelFilter, limit]);
  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);
  const handleExportAudit = async () => {
    try {
      const options = {
        format: 'csv' as const,
        startDate:
          startDate ||
          format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        endDate: endDate || format(new Date(), 'yyyy-MM-dd'),
        interventionIds: interventionId ? [interventionId] : [],
        includeDetails: true,
      };
      const blob = await clinicalInterventionService.exportAuditData(options);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${
        interventionId
          ? `intervention_${interventionNumber || interventionId}_audit`
          : 'clinical_interventions_audit'
      }_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Export error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to export audit data'
      );
    }
  };
  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
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
      default:
        return 'success';
    }
  };
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Error />;
      case 'high':
        return <Warning />;
      case 'medium':
        return <Info />;
      case 'low':
      default:
        return <CheckCircle />;
    }
  };
  const formatActionName = (action: string) => {
    return action
      .replace('INTERVENTION_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };
  if (loading) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <Spinner />
      </div>
    );
  }
  return (
    <div>
      <Card>
        <CardContent>
          <div
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <div >
              {interventionId
                ? `Audit Trail - ${interventionNumber || interventionId}`
                : 'Clinical Interventions Audit Trail'}
            </div>
            <Button
              
              startIcon={<Download />}
              onClick={handleExportAudit}
              size="small"
            >
              Export
            </Button>
          </div>
          {/* Summary Cards */}
          {summary && (
            <div
              className="">
              <Card >
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Total Actions
                  </div>
                  <div >{summary.totalActions}</div>
                </CardContent>
              </Card>
              <Card >
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Unique Users
                  </div>
                  <div >{summary.uniqueUsers}</div>
                </CardContent>
              </Card>
              <Card >
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Risk Activities
                  </div>
                  <div
                    
                    color={summary.riskActivities > 0 ? 'error' : 'success'}
                  >
                    {summary.riskActivities}
                  </div>
                </CardContent>
              </Card>
              <Card >
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Last Activity
                  </div>
                  <div >
                    {summary.lastActivity
                      ? format(
                          parseISO(summary.lastActivity),
                          'MMM dd, yyyy HH:mm'
                        )
                      : 'No activity'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Filters */}
          <div
            className="">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }
              fullWidth
              size="small"
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }
              fullWidth
              size="small"
            />
            <div fullWidth size="small">
              <Label>Risk Level</Label>
              <Select
                value={riskLevelFilter}
                onChange={(e) => setRiskLevelFilter(e.target.value)}
                label="Risk Level"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </div>
            <Button
              
              
              fullWidth
            >
              Clear Filters
            </Button>
          </div>
          {error && (
            <Alert severity="error" className="">
              {error}
            </Alert>
          )}
          {/* Audit Log Table */}
          <TableContainer  >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <React.Fragment key={log._id}>
                    <TableRow hover>
                      <TableCell>
                        <div >
                          {format(parseISO(log.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div  color="textSecondary">
                          {format(parseISO(log.timestamp), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div  fontWeight="medium">
                          {formatActionName(log.action)}
                        </div>
                        {log.changedFields && log.changedFields.length > 0 && (
                          <div  color="textSecondary">
                            Changed: {log.changedFields.join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div >
                          {log.userId.firstName} {log.userId.lastName}
                        </div>
                        <div  color="textSecondary">
                          {log.userId.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRiskLevelIcon(log.riskLevel)}
                          label={log.riskLevel.toUpperCase()}
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
                        <div  textTransform="capitalize">
                          {log.complianceCategory.replace(/_/g, ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(log._id)}
                          >
                            {expandedRows.has(log._id) ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        
                        colSpan={6}
                      >
                        <Collapse
                          in={expandedRows.has(log._id)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <div margin={1}>
                            <div  gutterBottom>
                              Details
                            </div>
                            <pre
                              >
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                            {log.oldValues && log.newValues && (
                              <div mt={2}>
                                <div  gutterBottom>
                                  Changes
                                </div>
                                <div
                                  className=""
                                >
                                  <div>
                                    <div
                                      
                                      color="textSecondary"
                                    >
                                      Before:
                                    </div>
                                    <pre
                                      >
                                      {JSON.stringify(log.oldValues, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <div
                                      
                                      color="textSecondary"
                                    >
                                      After:
                                    </div>
                                    <pre
                                      >
                                      {JSON.stringify(log.newValues, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Pagination */}
          {totalPages > 1 && (
            <div display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </div>
          )}
          {auditLogs.length === 0 && !loading && (
            <div textAlign="center" py={4}>
              <Alert severity="info">
                <div  gutterBottom>
                  No Audit Data Available
                </div>
                <div >
                  {interventionId
                    ? 'No audit logs found for this specific intervention.'
                    : 'No audit logs match the selected criteria. Try adjusting your filters or check back later as audit data is generated through system usage.'}
                </div>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default ClinicalInterventionAuditTrail;
