import { Button, Input, Card, CardContent, Spinner, Alert, Separator } from '@/components/ui/button';

interface ComplianceMetric {
  _id: string;
  count: number;
  riskDistribution: string[];
  errorCount: number;
}
interface ComplianceReportData {
  summary: {
    totalLogs: number;
    uniqueUserCount: number;
    errorRate: number;
    complianceScore: number;
    highRiskActivitiesCount: number;
    suspiciousActivitiesCount: number;
  };
  complianceMetrics: ComplianceMetric[];
  highRiskActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    action?: string;
    actionDisplay?: string;
    userId?: {
      firstName: string;
      lastName: string;
    };
  }>;
  suspiciousActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    riskLevel: 'low' | 'medium' | 'high';
    actionCount: number;
    user?: {
      firstName: string;
      lastName: string;
    };
    ipAddress: string;
    errorRate?: number;
  }>;
  recommendations: string[];
}
const ComplianceReport: React.FC = () => {
  const [dateRange, setDateRange] = useState({ 
    startDate: subMonths(new Date(), 1), // Default to last month
    endDate: new Date()}
  });
  const [reportGenerated, setReportGenerated] = useState(false);
  // Fetch compliance report
  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useQuery<ComplianceReportData>({ 
    queryKey: ['complianceReport', dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      auditService.getComplianceReport({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()}
      }),
    enabled: reportGenerated}
  const handleGenerateReport = () => {
    setReportGenerated(true);
    refetch();
  };
  const handleExportReport = async () => {
    if (!reportData) return;
    try {
      const exportData = await auditService.exportAuditData({ 
        format: 'pdf',
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        includeDetails: true}
      });
      // Generate PDF report
      const pdfBlob = await auditService.generatePDFReport({ 
        title: 'MTR Compliance Report',
        generatedAt: new Date(),
        dateRange,
        ...reportData,
        exportData}
      });
      auditService.downloadFile(
        pdfBlob,
        `compliance_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        'application/pdf'
      );
    } catch (error) {
      console.error('Failed to export compliance report:', error);
    }
  };
  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };
  const getComplianceScoreIcon = (score: number) => {
    if (score >= 90) return <CheckIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };
  const getRiskDistributionSummary = (riskDistribution: string[]) => {
    const counts = riskDistribution.reduce((acc, risk) => {
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([risk, count]) => (
      <Chip
        key={risk}
        label={`${risk}: ${count}`}
        color={auditService.getRiskLevelColor(risk)}
        size="small"
        className=""
      />
    ));
  };
  if (error) {
    return (
      <Alert severity="error">
        Failed to generate compliance report: {error.message}
      </Alert>
    );
  }
  return (
    <div className="">
      <div  gutterBottom>
        MTR Compliance Report
      </div>
      {/* Date Range Selection */}
      <Card className="">
        <CardContent>
          <div  gutterBottom>
            Report Parameters
          </div>
          <div
            className=""
          >
            <div className="">
              <Input
                fullWidth
                type="date"
                label="Start Date"
                value={format(dateRange.startDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  setDateRange((prev) => ({ 
                    ...prev}
                    startDate: new Date(e.target.value),}
                  }))
                }
                
              />
            </div>
            <div className="">
              <Input
                fullWidth
                type="date"
                label="End Date"
                value={format(dateRange.endDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  setDateRange((prev) => ({ 
                    ...prev}
                    endDate: new Date(e.target.value),}
                  }))
                }
                
              />
            </div>
            <div className="">
              <Button
                
                onClick={handleGenerateReport}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Loading State */}
      {isLoading && (
        <div className="">
          <Spinner />
        </div>
      )}
      {/* Report Content */}
      {reportData && (
        <>
          {/* Executive Summary */}
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div >Executive Summary</div>
                <Button
                  
                  startIcon={<DownloadIcon />}
                  onClick={handleExportReport}
                >
                  Export PDF
                </Button>
              </div>
              <div className="">
                <div className="">
                  <div className="">
                    <div  color="primary">
                      {reportData.summary.totalLogs.toLocaleString()}
                    </div>
                    <div color="textSecondary">
                      Total Audit Logs
                    </div>
                  </div>
                </div>
                <div className="">
                  <div className="">
                    <div  color="primary">
                      {reportData.summary.uniqueUserCount}
                    </div>
                    <div color="textSecondary">Active Users</div>
                  </div>
                </div>
                <div className="">
                  <div className="">
                    <div
                      
                      color={
                        reportData.summary.errorRate > 5 ? 'error' : 'success'}
                      }
                    >
                      {reportData.summary.errorRate.toFixed(1)}%
                    </div>
                    <div color="textSecondary">Error Rate</div>
                  </div>
                </div>
                <div className="">
                  <div
                    className=""
                  >
                    {getComplianceScoreIcon(reportData.summary.complianceScore)}
                    <div>
                      <div
                        
                        color={getComplianceScoreColor(
                          reportData.summary.complianceScore}
                        )}
                      >
                        {reportData.summary.complianceScore}
                      </div>
                      <div color="textSecondary">
                        Compliance Score
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Compliance Metrics by Category */}
          <Card className="">
            <CardContent>
              <div  gutterBottom>
                Compliance Metrics by Category
              </div>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Total Activities</TableCell>
                      <TableCell align="right">Errors</TableCell>
                      <TableCell align="right">Error Rate</TableCell>
                      <TableCell>Risk Distribution</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.complianceMetrics.map((metric) => {
                      const errorRate =
                        metric.count > 0
                          ? (metric.errorCount / metric.count) * 100
                          : 0;
                      return (
                        <TableRow key={metric._id}>
                          <TableCell>
                            <div >
                              {auditService.getComplianceCategoryDisplay(
                                metric._id
                              )}
                            </div>
                          </TableCell>
                          <TableCell align="right">
                            {metric.count.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {metric.errorCount}
                          </TableCell>
                          <TableCell align="right">
                            <div
                              color={errorRate > 5 ? 'error' : 'success'}
                            >
                              {errorRate.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="">
                              {getRiskDistributionSummary(
                                metric.riskDistribution
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          {/* Security Alerts */}
          <div className="">
            <div className="">
              <Card>
                <CardContent>
                  <div  gutterBottom color="warning.main">
                    <WarningIcon className="" />
                    High-Risk Activities (
                    {reportData.summary.highRiskActivitiesCount})
                  </div>
                  {reportData.highRiskActivities.length > 0 ? (
                    <List dense>
                      {reportData.highRiskActivities
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div key={index}>
                            <div>
                              <SecurityIcon color="warning" />
                            </div>
                            <div
                              primary={
                                activity.actionDisplay || activity.action}
                              }
                              secondary={`${activity.userId?.firstName} ${
                                activity.userId?.lastName
                              } - ${format(
                                new Date(activity.timestamp),
                                'MMM dd, HH:mm'
                              )}`}
                            />
                          </div>
                        ))}
                      {reportData.highRiskActivities.length > 5 && (
                        <div>
                          <div
                            primary={`... and ${
                              reportData.highRiskActivities.length - 5}
                            } more`}
                            className=""
                          />
                        </div>
                      )}
                    </List>
                  ) : (
                    <div color="textSecondary">
                      No high-risk activities detected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="">
              <Card>
                <CardContent>
                  <div  gutterBottom color="error.main">
                    <ErrorIcon className="" />
                    Suspicious Activities (
                    {reportData.summary.suspiciousActivitiesCount})
                  </div>
                  {reportData.suspiciousActivities.length > 0 ? (
                    <List dense>
                      {reportData.suspiciousActivities
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div key={index}>
                            <div>
                              <ErrorIcon color="error" />
                            </div>
                            <div
                              primary={`${activity.actionCount} actions from ${activity.user?.firstName} ${activity.user?.lastName}`}
                              secondary={`IP: ${
                                activity.ipAddress}
                              } - Error Rate: ${activity.errorRate?.toFixed(
                                1
                              )}%`}
                            />
                          </div>
                        ))}
                      {reportData.suspiciousActivities.length > 5 && (
                        <div>
                          <div
                            primary={`... and ${
                              reportData.suspiciousActivities.length - 5}
                            } more`}
                            className=""
                          />
                        </div>
                      )}
                    </List>
                  ) : (
                    <div color="textSecondary">
                      No suspicious activities detected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Recommendations */}
          <Card>
            <CardContent>
              <div  gutterBottom>
                <ReportIcon className="" />
                Compliance Recommendations
              </div>
              <List>
                {reportData.recommendations.map((recommendation, index) => (
                  <React.Fragment key={index}>
                    <div>
                      <div>
                        <CheckIcon color="primary" />
                      </div>
                      <div primary={recommendation} />
                    </div>
                    {index < reportData.recommendations.length - 1 && (
                      <Separator />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
export default ComplianceReport;
