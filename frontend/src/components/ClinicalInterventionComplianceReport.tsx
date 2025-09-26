import { Button, Input, Card, CardContent, Spinner, Progress, Alert, Separator } from '@/components/ui/button';

interface ComplianceData {
  summary: {
    totalInterventions: number;
    auditedActions: number;
    complianceScore: number;
    riskActivities: number;
  };
  interventionCompliance: Array<{
    interventionId: string;
    interventionNumber: string;
    auditCount: number;
    lastAudit: string;
    complianceStatus: 'compliant' | 'warning' | 'non-compliant';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
}
const ClinicalInterventionComplianceReport: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includeDetails, setIncludeDetails] = useState(false);
  useEffect(() => {
    generateReport();
  }, []);
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API call when compliance reporting is implemented
      // const response = await clinicalInterventionService.getComplianceReport({ 
      //   startDate,
      //   endDate,
      //   includeDetails}
      // });
      // if (response.success && response.data) {
      //   setComplianceData(response.data);
      // } else {
      //   setError(response.message || 'Failed to generate compliance report');
      // }
      // For now, show that the feature is not yet implemented
      // Try to fetch compliance data from API
      const response = await clinicalInterventionService.getComplianceReport({ 
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        includeDetails: true}
      });
      if (response.success && response.data) {
        setComplianceData(response.data);
      } else {
        setComplianceData(null);
        setError(
          response.message ||
            'No compliance data available. Create some clinical interventions to see compliance reports.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };
  const handleExportReport = async () => {
    try {
      const blob = await clinicalInterventionService.exportAuditData({ 
        format: 'pdf',
        startDate,
        endDate,
        includeDetails: true}
      });
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance_report_${format(
        new Date(),
        'yyyy-MM-dd'
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export compliance report');
    }
  };
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };
  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
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
  if (loading) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
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
            mb={3}
          >
            <div  component="h1">
              Clinical Interventions Compliance Report
            </div>
            <Button
              
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              disabled={!complianceData}
            >
              Export PDF
            </Button>
          </div>
          {/* Date Range Selection */}
          <div container spacing={2} mb={3}>
            <div item xs={12} sm={4}>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                
                fullWidth
                size="small"
              />
            </div>
            <div item xs={12} sm={4}>
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                
                fullWidth
                size="small"
              />
            </div>
            <div item xs={12} sm={4}>
              <Button
                
                onClick={generateReport}
                fullWidth
                disabled={loading}
              >
                Generate Report
              </Button>
            </div>
          </div>
          {error && (
            <Alert severity="info" className="">
              <div  gutterBottom>
                No Compliance Data Available
              </div>
              <div >
                The compliance reporting functionality is currently being
                developed. Once clinical interventions are created and audit
                trails are established, comprehensive compliance reports will be
                available including:
              </div>
              <div component="ul" className="">
                <li>Compliance score tracking</li>
                <li>Risk activity monitoring</li>
                <li>Audit trail analysis</li>
                <li>Regulatory compliance metrics</li>
                <li>Automated compliance recommendations</li>
              </div>
            </Alert>
          )}
          {complianceData && (
            <>
              {/* Summary Cards */}
              <div container spacing={3} mb={4}>
                <div item xs={12} sm={6} md={3}>
                  <Card >
                    <CardContent>
                      <div display="flex" alignItems="center" mb={1}>
                        <AssessmentIcon color="primary" className="" />
                        <div color="textSecondary" >
                          Total Interventions
                        </div>
                      </div>
                      <div >
                        {complianceData?.summary?.totalInterventions || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <Card >
                    <CardContent>
                      <div display="flex" alignItems="center" mb={1}>
                        <TrendingUpIcon color="primary" className="" />
                        <div color="textSecondary" >
                          Audited Actions
                        </div>
                      </div>
                      <div >
                        {complianceData?.summary?.auditedActions || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <Card >
                    <CardContent>
                      <div display="flex" alignItems="center" mb={1}>
                        <CheckCircleIcon
                          color={
                            getComplianceColor(
                              complianceData?.summary?.complianceScore || 0
                            ) as any}
                          }
                          className=""
                        />
                        <div color="textSecondary" >
                          Compliance Score
                        </div>
                      </div>
                      <div
                        
                        color={getComplianceColor(
                          complianceData?.summary?.complianceScore || 0}
                        )}
                      >
                        {complianceData?.summary?.complianceScore || 0}%
                      </div>
                      <Progress
                        
                        color={
                          getComplianceColor(
                            complianceData.summary.complianceScore
                          ) as any}
                        }
                        className=""
                      />
                    </CardContent>
                  </Card>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <Card >
                    <CardContent>
                      <div display="flex" alignItems="center" mb={1}>
                        <SecurityIcon
                          color={
                            (complianceData?.summary?.riskActivities || 0) > 0
                              ? 'error'
                              : 'success'}
                          }
                          className=""
                        />
                        <div color="textSecondary" >
                          Risk Activities
                        </div>
                      </div>
                      <div
                        
                        color={
                          (complianceData?.summary?.riskActivities || 0) > 0
                            ? 'error'
                            : 'success'}
                        }
                      >
                        {complianceData?.summary?.riskActivities || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Intervention Compliance Table */}
              <Card  className="">
                <CardContent>
                  <div  gutterBottom>
                    Intervention Compliance Details
                  </div>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Intervention</TableCell>
                          <TableCell>Audit Count</TableCell>
                          <TableCell>Last Audit</TableCell>
                          <TableCell>Compliance Status</TableCell>
                          <TableCell>Risk Level</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(complianceData?.interventionCompliance || []).map(
                          (intervention) => (
                            <TableRow key={intervention.interventionId} hover>
                              <TableCell>
                                <div  fontWeight="medium">
                                  {intervention.interventionNumber}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div >
                                  {intervention.auditCount}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div >
                                  {format(
                                    new Date(intervention.lastAudit),
                                    'MMM dd, yyyy HH:mm'
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={intervention.complianceStatus
                                    .replace('-', ' ')}
                                    .toUpperCase()}
                                  color={
                                    getComplianceStatusColor(
                                      intervention.complianceStatus
                                    ) as any}
                                  }
                                  size="small"
                                  icon={
                                    intervention.complianceStatus ===
                                    'compliant' ? (
                                      <CheckCircleIcon />
                                    ) : intervention.complianceStatus ===
                                      'warning' ? (
                                      <WarningIcon />
                                    ) : (
                                      <ErrorIcon />
                                    )}
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={intervention.riskLevel.toUpperCase()}
                                  color={
                                    getRiskLevelColor(
                                      intervention.riskLevel
                                    ) as any}
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {(complianceData?.interventionCompliance?.length || 0) ===
                    0 && (
                    <div textAlign="center" py={4}>
                      <div color="textSecondary">
                        No interventions found for the selected date range.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Recommendations */}
              {(complianceData?.recommendations?.length || 0) > 0 && (
                <Card >
                  <CardContent>
                    <div display="flex" alignItems="center" mb={2}>
                      <LightbulbIcon color="primary" className="" />
                      <div >
                        Compliance Recommendations
                      </div>
                    </div>
                    <List>
                      {(complianceData?.recommendations || []).map(
                        (recommendation, index) => (
                          <React.Fragment key={index}>
                            <div>
                              <div>
                                <LightbulbIcon color="primary" />
                              </div>
                              <div
                                primary={recommendation}
                                
                              />
                            </div>
                            {index <
                              (complianceData?.recommendations?.length || 0) -
                                1 && <Separator />}
                          </React.Fragment>
                        )
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default ClinicalInterventionComplianceReport;
