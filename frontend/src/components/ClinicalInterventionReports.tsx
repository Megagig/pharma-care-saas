import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert, Tabs } from '@/components/ui/button';

interface OutcomeReport {
  summary: {
    totalInterventions: number;
    completedInterventions: number;
    successfulInterventions: number;
    successRate: number;
    totalCostSavings: number;
    averageResolutionTime: number;
    patientSatisfactionScore: number;
  };
  categoryAnalysis: Array<{
    category: string;
    total: number;
    successful: number;
    successRate: number;
    avgCostSavings: number;
    avgResolutionTime: number;
  }>;
  trendAnalysis: Array<{
    period: string;
    interventions: number;
    successRate: number;
    costSavings: number;
    resolutionTime: number;
  }>;
  comparativeAnalysis: {
    currentPeriod: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
    previousPeriod: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
    percentageChange: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
  };
  detailedOutcomes: Array<{
    interventionId: string;
    interventionNumber: string;
    patientName: string;
    category: string;
    priority: string;
    outcome: string;
    costSavings: number;
    resolutionTime: number;
    patientResponse: string;
    completedDate: string;
  }>;
}
interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  category: string;
  priority: string;
  outcome: string;
  pharmacist: string;
  costSavingsMin: number | null;
  costSavingsMax: number | null;
}
const ClinicalInterventionReports: React.FC = () => {
  const theme = useTheme();
  const { loading, error } = useClinicalInterventionStore();
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState<OutcomeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>(
    'pdf'
  );
  // Filter state
  const [filters, setFilters] = useState<ReportFilters>({ 
    dateFrom: startOfMonth(subMonths(new Date(), 1)),
    dateTo: endOfMonth(new Date()),
    category: 'all',
    priority: 'all',
    outcome: 'all',
    pharmacist: 'all',
    costSavingsMin: null,
    costSavingsMax: null}
  });
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Load report data
  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    setReportError(null);
    try {
      // Import the service dynamically to avoid circular dependencies
      const { clinicalInterventionService } = await import(
        '../services/clinicalInterventionService'
      );
      // Convert filters to the format expected by the API
      const apiFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        outcome: filters.outcome !== 'all' ? filters.outcome : undefined,
        pharmacist:
          filters.pharmacist !== 'all' ? filters.pharmacist : undefined,
      };
      const response = await clinicalInterventionService.generateOutcomeReport(
        apiFilters
      );
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        // If no data is available, create a mock structure to show the UI
        const mockReportData: OutcomeReport = {
          summary: {
            totalInterventions: 0,
            completedInterventions: 0,
            successfulInterventions: 0,
            successRate: 0,
            totalCostSavings: 0,
            averageResolutionTime: 0,
            patientSatisfactionScore: 0,
          },
          categoryAnalysis: [],
          trendAnalysis: [],
          comparativeAnalysis: {
            currentPeriod: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
            previousPeriod: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
            percentageChange: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
          },
          detailedOutcomes: [],
        };
        setReportData(mockReportData);
        setReportError(
          response.message ||
            'No report data available. Create some clinical interventions to see reports.'
        );
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportError(
        error instanceof Error ? error.message : 'Failed to load report data'
      );
      // Provide empty structure even on error so UI doesn't break
      const emptyReportData: OutcomeReport = {
        summary: {
          totalInterventions: 0,
          completedInterventions: 0,
          successfulInterventions: 0,
          successRate: 0,
          totalCostSavings: 0,
          averageResolutionTime: 0,
          patientSatisfactionScore: 0,
        },
        categoryAnalysis: [],
        trendAnalysis: [],
        comparativeAnalysis: {
          currentPeriod: { interventions: 0, successRate: 0, costSavings: 0 },
          previousPeriod: { interventions: 0, successRate: 0, costSavings: 0 },
          percentageChange: {
            interventions: 0,
            successRate: 0,
            costSavings: 0,
          },
        },
        detailedOutcomes: [],
      };
      setReportData(emptyReportData);
    } finally {
      setLoadingReport(false);
    }
  }, [filters]);
  // Load data on component mount and filter changes
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);
  // Handle filter changes
  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  // Handle export
  const handleExport = async () => {
    try {
      // Mock export functionality - replace with actual API call
      console.log(`Exporting report as ${exportFormat}`);
      // Create mock file download
      const filename = `clinical-interventions-report-${format(
        new Date(),
        'yyyy-MM-dd'
      )}.${exportFormat}`;
      const content = JSON.stringify(reportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  // Chart colors
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];
  if (loadingReport && !reportData) {
    return (
      <div
        className=""
      >
        <Spinner />
      </div>
    );
  }
  if (reportError) {
    return (
      <Alert severity="error" className="">
        Error loading report: {reportError}
      </Alert>
    );
  }
  if (!reportData) {
    return (
      <div className="">
        <div
          
          component="h1"
          gutterBottom
          className=""
        >
          <AssessmentIcon />
          Outcome Reports & Analytics
        </div>
        <Alert severity="info" className="">
          <div  gutterBottom>
            No Report Data Available
          </div>
          <div >
            No clinical interventions have been completed yet. Once clinical
            interventions are created and processed, comprehensive reports will
            be available including:
          </div>
          <div component="ul" className="">
            <li>Success rates by category</li>
            <li>Cost savings analysis</li>
            <li>Trend analysis over time</li>
            <li>Comparative performance metrics</li>
            <li>Detailed outcome tracking</li>
          </div>
        </Alert>
      </div>
    );
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div
          className=""
        >
          <div
            
            component="h1"
            className=""
          >
            <AssessmentIcon />
            Outcome Reports & Analytics
          </div>
          <div className="">
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadReportData} disabled={loadingReport}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              
              startIcon={<ExportIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export Report
            </Button>
            <Button
              
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        </div>
        {/* Filters */}
        <Card className="">
          <CardContent>
            <div
              
              gutterBottom
              className=""
            >
              <FilterIcon />
              Report Filters
            </div>
            <div container spacing={2}>
              <div item xs={12} sm={6} md={3}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  renderInput={(params) => (}
                    <Input {...params} fullWidth size="small" />
                  )}
                />
              </div>
              <div item xs={12} sm={6} md={3}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  renderInput={(params) => (}
                    <Input {...params} fullWidth size="small" />
                  )}
                />
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth size="small">
                  <Label>Category</Label>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) =>
                      handleFilterChange('category', e.target.value)}
                    }
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="drug_therapy_problem">
                      Drug Therapy Problem
                    </MenuItem>
                    <MenuItem value="adverse_drug_reaction">
                      Adverse Drug Reaction
                    </MenuItem>
                    <MenuItem value="medication_nonadherence">
                      Medication Non-adherence
                    </MenuItem>
                    <MenuItem value="drug_interaction">
                      Drug Interaction
                    </MenuItem>
                    <MenuItem value="dosing_issue">Dosing Issue</MenuItem>
                    <MenuItem value="contraindication">
                      Contraindication
                    </MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div fullWidth size="small">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)}
                    }
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Tabs */}
        <div className="">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Summary Overview" />
            <Tab label="Category Analysis" />
            <Tab label="Trend Analysis" />
            <Tab label="Comparative Analysis" />
            <Tab label="Detailed Outcomes" />
          </Tabs>
        </div>
        {/* Tab Content */}
        {activeTab === 0 && (
          <div>
            {/* Summary KPIs */}
            <div container spacing={3} className="">
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <AssessmentIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      {reportData?.summary?.totalInterventions || 0}
                    </div>
                    <div  color="text.secondary">
                      Total Interventions
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <TrendingUpIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      {(reportData?.summary?.successRate || 0).toFixed(1)}%
                    </div>
                    <div  color="text.secondary">
                      Success Rate
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <MoneyIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      ₦
                      {(
                        reportData?.summary?.totalCostSavings || 0
                      ).toLocaleString()}
                    </div>
                    <div  color="text.secondary">
                      Total Cost Savings
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <TimelineIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      {(
                        reportData?.summary?.averageResolutionTime || 0
                      ).toFixed(1)}
                    </div>
                    <div  color="text.secondary">
                      Avg Resolution Time (days)
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <AssessmentIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      {reportData?.summary?.completedInterventions || 0}
                    </div>
                    <div  color="text.secondary">
                      Completed Interventions
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent className="">
                    <TrendingUpIcon
                      className=""
                    />
                    <div
                      
                      component="div"
                      className=""
                    >
                      {(
                        reportData?.summary?.patientSatisfactionScore || 0
                      ).toFixed(1)}
                    </div>
                    <div  color="text.secondary">
                      Patient Satisfaction (5.0)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Summary Charts */}
            <div container spacing={3}>
              <div item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <div  gutterBottom>
                      Success Rate by Category
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData?.categoryAnalysis || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip
                          formatter={(value) => [`${value}%`, 'Success Rate']}
                        />
                        <Bar
                          dataKey="successRate"
                          fill={theme.palette.primary.main}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <div  gutterBottom>
                      Cost Savings by Category
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData?.categoryAnalysis || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value) => [}
                            `₦${value}`,
                            'Avg Cost Savings',
                          ]}
                        />
                        <Bar
                          dataKey="avgCostSavings"
                          fill={theme.palette.success.main}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            {/* Category Analysis Table */}
            <Card>
              <CardContent>
                <div  gutterBottom>
                  Category Performance Analysis
                </div>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Successful</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Avg Cost Savings</TableCell>
                        <TableCell align="right">Avg Resolution Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportData?.categoryAnalysis || []).map((category) => (
                        <TableRow key={category.category}>
                          <TableCell component="th" scope="row">
                            {category.category}
                          </TableCell>
                          <TableCell align="right">{category.total}</TableCell>
                          <TableCell align="right">
                            {category.successful}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${category.successRate.toFixed(1)}%`}
                              color={
                                category.successRate >= 90
                                  ? 'success'
                                  : category.successRate >= 80
                                  ? 'warning'
                                  : 'error'}
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            ₦{category.avgCostSavings}
                          </TableCell>
                          <TableCell align="right">
                            {category.avgResolutionTime.toFixed(1)} days
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            {/* Trend Analysis Charts */}
            <div container spacing={3}>
              <div item xs={12}>
                <Card>
                  <CardContent>
                    <div  gutterBottom>
                      Monthly Trends
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={reportData?.trendAnalysis || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="interventions"
                          fill={theme.palette.primary.main}
                          name="Interventions"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="successRate"
                          stroke={theme.palette.success.main}
                          name="Success Rate %"
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="costSavings"
                          fill={theme.palette.warning.main}
                          fillOpacity={0.3}
                          name="Cost Savings ($)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            {/* Comparative Analysis */}
            <div container spacing={3}>
              <div item xs={12} md={4}>
                <Card>
                  <CardContent className="">
                    <div  gutterBottom>
                      Interventions
                    </div>
                    <div  className="">
                      {reportData?.comparativeAnalysis?.currentPeriod
                        ?.interventions || 0}
                    </div>
                    <div
                      className=""
                    >
                      <TrendingUpIcon
                        className=""
                      />
                      <div
                        
                        className=""
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange
                            ?.interventions || 0
                        ).toFixed(1)}
                        % vs previous period
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} md={4}>
                <Card>
                  <CardContent className="">
                    <div  gutterBottom>
                      Success Rate
                    </div>
                    <div  className="">
                      {(
                        reportData?.comparativeAnalysis?.currentPeriod
                          ?.successRate || 0
                      ).toFixed(1)}
                      %
                    </div>
                    <div
                      className=""
                    >
                      <TrendingUpIcon
                        className=""
                      />
                      <div
                        
                        className=""
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange
                            ?.successRate || 0
                        ).toFixed(1)}
                        % vs previous period
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} md={4}>
                <Card>
                  <CardContent className="">
                    <div  gutterBottom>
                      Cost Savings
                    </div>
                    <div  className="">
                      $
                      {(
                        reportData?.comparativeAnalysis?.currentPeriod
                          ?.costSavings || 0
                      ).toLocaleString()}
                    </div>
                    <div
                      className=""
                    >
                      <TrendingUpIcon
                        className=""
                      />
                      <div
                        
                        className=""
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange
                            ?.costSavings || 0
                        ).toFixed(1)}
                        % vs previous period
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            {/* Detailed Outcomes Table */}
            <Card>
              <CardContent>
                <div  gutterBottom>
                  Detailed Intervention Outcomes
                </div>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Intervention #</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Outcome</TableCell>
                        <TableCell align="right">Cost Savings</TableCell>
                        <TableCell align="right">Resolution Time</TableCell>
                        <TableCell>Completed Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportData?.detailedOutcomes || [])
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((outcome) => (
                          <TableRow key={outcome.interventionId}>
                            <TableCell>{outcome.interventionNumber}</TableCell>
                            <TableCell>{outcome.patientName}</TableCell>
                            <TableCell>{outcome.category}</TableCell>
                            <TableCell>
                              <Chip
                                label={outcome.priority}
                                color={
                                  outcome.priority === 'high'
                                    ? 'error'
                                    : outcome.priority === 'medium'
                                    ? 'warning'
                                    : 'default'}
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={outcome.patientResponse}
                                color={
                                  outcome.patientResponse === 'improved'
                                    ? 'success'
                                    : outcome.patientResponse === 'no_change'
                                    ? 'warning'
                                    : 'error'}
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              ₦{outcome.costSavings}
                            </TableCell>
                            <TableCell align="right">
                              {outcome.resolutionTime} days
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(outcome.completedDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={reportData?.detailedOutcomes?.length || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  
                />
              </CardContent>
            </Card>
          </div>
        )}
        {/* Export Dialog */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        >
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent>
            <div  className="">
              Choose the format for exporting the report:
            </div>
            <div fullWidth>
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                label="Export Format"
                onChange={(e) => setExportFormat(e.target.value as unknown)}
              >
                <MenuItem value="pdf">PDF Report</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                <MenuItem value="csv">CSV Data</MenuItem>
              </Select>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};
export default ClinicalInterventionReports;
