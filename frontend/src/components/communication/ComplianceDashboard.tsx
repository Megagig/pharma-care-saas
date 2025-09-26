import { Button, Label, Card, CardContent, CardHeader, Select, Tooltip, Spinner, Progress, Alert } from '@/components/ui/button';

interface ComplianceMetrics {
  totalActivities: number;
  highRiskActivities: number;
  recentActivities: number;
  complianceSummary: ComplianceCategory[];
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
}
interface ComplianceCategory {
  _id: {
    complianceCategory: string;
    riskLevel: string;
    success: boolean;
  };
  count: number;
  avgDuration: number;
  actions: string[];
}
interface HighRiskActivity {
  _id: string;
  action: string;
  timestamp: string;
  userId: {
    firstName: string;
    lastName: string;
    role: string;
  };
  riskLevel: string;
  complianceCategory: string;
  details: {
    conversationId?: string;
    patientId?: string;
    fileName?: string;
  };
}
interface ComplianceDashboardProps {
  height?: string;
  refreshInterval?: number;
}
const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ 
  height = '800px',
  refreshInterval = 300000, // 5 minutes })
}) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [highRiskActivities, setHighRiskActivities] = useState<
    HighRiskActivity[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ 
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date())}
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  // Fetch compliance data
  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ 
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()}
      });
      const [metricsResponse, highRiskResponse] = await Promise.all([
        fetch(`/api/communication/audit/statistics?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }, },
        fetch(`/api/communication/audit/high-risk?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }, },
      ]);
      if (!metricsResponse.ok || !highRiskResponse.ok) {
        throw new Error('Failed to fetch compliance data');
      }
      const [metricsData, highRiskData] = await Promise.all([
        metricsResponse.json(),
        highRiskResponse.json(),
      ]);
      setMetrics(metricsData.data);
      setHighRiskActivities(highRiskData.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch compliance data'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchComplianceData();
  }, [dateRange]);
  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchComplianceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, dateRange]);
  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const days = parseInt(period);
    setDateRange({ 
      start: startOfDay(subDays(new Date(), days)),
      end: endOfDay(new Date())}
    });
  };
  // Calculate compliance score
  const calculateComplianceScore = () => {
    if (!metrics || metrics.totalActivities === 0) return 100;
    const failureRate = metrics.highRiskActivities / metrics.totalActivities;
    return Math.max(0, Math.round((1 - failureRate) * 100));
  };
  // Prepare chart data
  const prepareComplianceByCategory = () => {
    if (!metrics) return [];
    const categoryMap = new Map<
      string,
      { success: number; failed: number; total: number }
    >();
    metrics.complianceSummary.forEach((item) => {
      const category = item._id.complianceCategory;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { success: 0, failed: 0, total: 0 });
      }
      const data = categoryMap.get(category)!;
      data.total += item.count;
      if (item._id.success) {
        data.success += item.count;
      } else {
        data.failed += item.count;
      }
    });
    return Array.from(categoryMap.entries()).map(([category, data]) => ({ 
      category: category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      success: data.success,
      failed: data.failed,
      total: data.total,
      successRate:
        data.total > 0 ? Math.round((data.success / data.total) * 100) : 100}
    }));
  };
  const prepareRiskLevelData = () => {
    if (!metrics) return [];
    const riskMap = new Map<string, number>();
    metrics.complianceSummary.forEach((item) => {
      const risk = item._id.riskLevel;
      riskMap.set(risk, (riskMap.get(risk) || 0) + item.count);
    });
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#9c27b0',
    };
    return Array.from(riskMap.entries()).map(([risk, count]) => ({ 
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      value: count,
      color: colors[risk as keyof typeof colors] || '#757575'}
    }));
  };
  // Export compliance report
  const handleExportReport = async () => {
    try {
      const queryParams = new URLSearchParams({ 
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        format: 'json'}
      });
      const response = await fetch(
        `/api/communication/audit/compliance-report?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to export compliance report');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };
  const complianceScore = calculateComplianceScore();
  const categoryData = prepareComplianceByCategory();
  const riskLevelData = prepareRiskLevelData();
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div
          className=""
        >
          <div
            
            className=""
          >
            <AssessmentIcon />
            Compliance Dashboard
          </div>
          <div className="">
            <div size="small" className="">
              <Label>Period</Label>
              <Select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                label="Period"
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </div>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchComplianceData}
              disabled={loading}
              
              size="small"
            >
              Refresh
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              
              size="small"
            >
              Export Report
            </Button>
          </div>
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
        {/* Dashboard Content */}
        {!loading && metrics && (
          <>
            {/* Key Metrics Cards */}
            <div container spacing={3} className="">
              <div item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <div
                      className=""
                    >
                      <SecurityIcon color="primary" />
                      <div >Compliance Score</div>
                    </div>
                    <div
                      
                      color={
                        complianceScore >= 90
                          ? 'success.main'
                          : complianceScore >= 70
                          ? 'warning.main'
                          : 'error.main'}
                      }
                    >
                      {complianceScore}%
                    </div>
                    <Progress
                      
                      color={
                        complianceScore >= 90
                          ? 'success'
                          : complianceScore >= 70
                          ? 'warning'
                          : 'error'}
                      }
                      className=""
                    />
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <div
                      className=""
                    >
                      <TrendingUpIcon color="primary" />
                      <div >Total Activities</div>
                    </div>
                    <div >
                      {metrics.totalActivities.toLocaleString()}
                    </div>
                    <div  color="text.secondary">
                      In selected period
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <div
                      className=""
                    >
                      <WarningIcon color="warning" />
                      <div >High Risk</div>
                    </div>
                    <div  color="warning.main">
                      {metrics.highRiskActivities}
                    </div>
                    <div  color="text.secondary">
                      Activities requiring attention
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <div
                      className=""
                    >
                      <CheckCircleIcon color="success" />
                      <div >Recent Activity</div>
                    </div>
                    <div  color="success.main">
                      {metrics.recentActivities}
                    </div>
                    <div  color="text.secondary">
                      Last 24 hours
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Charts Row */}
            <div container spacing={3} className="">
              {/* Risk Level Distribution */}
              <div item xs={12} md={6}>
                <Card>
                  <CardHeader title="Risk Level Distribution" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={riskLevelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {riskLevelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              {/* Compliance by Category */}
              <div item xs={12} md={6}>
                <Card>
                  <CardHeader title="Success Rate by Category" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="success"
                          stackId="a"
                          fill="#4caf50"
                          name="Success"
                        />
                        <Bar
                          dataKey="failed"
                          stackId="a"
                          fill="#f44336"
                          name="Failed"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Compliance Categories Table */}
            <div container spacing={3} className="">
              <div item xs={12} md={8}>
                <Card>
                  <CardHeader title="Compliance Categories Overview" />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Success</TableCell>
                            <TableCell align="right">Failed</TableCell>
                            <TableCell align="right">Success Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryData.map((category) => (
                            <TableRow key={category.category}>
                              <TableCell>{category.category}</TableCell>
                              <TableCell align="right">
                                {category.total}
                              </TableCell>
                              <TableCell align="right">
                                <div color="success.main">
                                  {category.success}
                                </div>
                              </TableCell>
                              <TableCell align="right">
                                <div color="error.main">
                                  {category.failed}
                                </div>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={`${category.successRate}%`}
                                  color={
                                    category.successRate >= 95
                                      ? 'success'
                                      : category.successRate >= 85
                                      ? 'warning'
                                      : 'error'}
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </div>
              {/* High Risk Activities */}
              <div item xs={12} md={4}>
                <Card>
                  <CardHeader
                    title="Recent High Risk Activities"
                    action={
                      <Chip
                        size="small"}
                        label={highRiskActivities.length}
                        color={
                          highRiskActivities.length === 0
                            ? 'success'
                            : 'warning'}
                        }
                      />
                    }
                  />
                  <CardContent>
                    {highRiskActivities.length === 0 ? (
                      <div className="">
                        <CheckCircleIcon
                          color="success"
                          className=""
                        />
                        <div color="text.secondary">
                          No high-risk activities detected
                        </div>
                      </div>
                    ) : (
                      <div className="">
                        {highRiskActivities.slice(0, 10).map((activity) => (
                          <div
                            key={activity._id}
                            className=""
                          >
                            <div
                              className=""
                            >
                              <div  fontWeight="medium">
                                {activity.action.replace(/_/g, ' ')}
                              </div>
                              <Chip
                                size="small"
                                label={activity.riskLevel}
                                color={
                                  activity.riskLevel === 'critical'
                                    ? 'error'
                                    : 'warning'}
                                }
                              />
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              {activity.userId.firstName}{' '}
                              {activity.userId.lastName} •{' '}
                              {format(
                                new Date(activity.timestamp),
                                'MMM dd, HH:mm'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Report Summary */}
            <Card>
              <CardHeader title="Report Summary" />
              <CardContent>
                <div container spacing={2}>
                  <div item xs={12} md={6}>
                    <div  gutterBottom>
                      Report Period
                    </div>
                    <div >
                      {format(dateRange.start, 'PPP')} -{' '}
                      {format(dateRange.end, 'PPP')}
                    </div>
                    <div  color="text.secondary">
                      Generated: {format(new Date(metrics.generatedAt), 'PPpp')}
                    </div>
                  </div>
                  <div item xs={12} md={6}>
                    <div  gutterBottom>
                      Compliance Status
                    </div>
                    <div className="">
                      {complianceScore >= 90 ? (
                        <CheckCircleIcon color="success" />
                      ) : complianceScore >= 70 ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                      <div>
                        {complianceScore >= 90
                          ? 'Excellent'
                          : complianceScore >= 70
                          ? 'Good'
                          : 'Needs Attention'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LocalizationProvider>
  );
};
export default ComplianceDashboard;
