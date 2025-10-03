import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  InsertChart as InsertChartIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useSaasSettings } from '../../queries/useSaasSettings';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SubscriptionAnalytics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  ltv: number; // Lifetime Value
  cac: number; // Customer Acquisition Cost
  churnRate: number;
  upgradeRate: number;
  downgradeRate: number;
  planDistribution: PlanDistribution[];
  revenueByPlan: RevenueByPlan[];
  growthTrend: GrowthTrend[];
}

interface PlanDistribution {
  planName: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface RevenueByPlan {
  planName: string;
  revenue: number;
  growth: number;
}

interface GrowthTrend {
  month: string;
  mrr: number;
  subscribers: number;
  churn: number;
}

interface PharmacyUsageReport {
  pharmacyId: string;
  pharmacyName: string;
  subscriptionPlan: string;
  prescriptionsProcessed: number;
  diagnosticsPerformed: number;
  patientsManaged: number;
  activeUsers: number;
  lastActivity: string;
  clinicalOutcomes: {
    interventions: number;
    adherenceImprovement: number;
    costSavings: number;
  };
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  reportType: 'subscription' | 'pharmacy' | 'clinical' | 'financial';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  scheduledDelivery?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

const AnalyticsReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [pharmacyReports, setPharmacyReports] = useState<PharmacyUsageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    reportType: 'subscription',
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    },
    includeCharts: true,
  });
  const [exporting, setExporting] = useState(false);

  const { 
    getSubscriptionAnalytics, 
    getPharmacyUsageReports, 
    getClinicalOutcomesReport,
    exportReport,
    scheduleReport 
  } = useSaasSettings();

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, activeTab]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 0) {
        // Load subscription analytics
        const response = await getSubscriptionAnalytics({ timeRange });
        if (response.success) {
          setSubscriptionAnalytics(response.data);
        }
      } else if (activeTab === 1) {
        // Load pharmacy usage reports
        const response = await getPharmacyUsageReports({ timeRange });
        if (response.success) {
          setPharmacyReports(response.data.reports);
        }
      }
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportReport(exportOptions);
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { 
          type: getContentType(exportOptions.format) 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.${exportOptions.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setExportDialogOpen(false);
      }
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getContentType = (format: string) => {
    switch (format) {
      case 'pdf': return 'application/pdf';
      case 'csv': return 'text/csv';
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUpIcon color="success" />;
    if (growth < 0) return <TrendingDownIcon color="error" />;
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'success';
    if (growth < 0) return 'error';
    return 'default';
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Header with Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon />
              Analytics & Reports
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="1y">Last year</MenuItem>
                  <MenuItem value="custom">Custom range</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
              >
                Export
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAnalyticsData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab 
                icon={<AttachMoneyIcon />} 
                label="Subscription Analytics" 
                id="analytics-tab-0"
                aria-controls="analytics-tabpanel-0"
              />
              <Tab 
                icon={<BusinessIcon />} 
                label="Pharmacy Usage" 
                id="analytics-tab-1"
                aria-controls="analytics-tabpanel-1"
              />
              <Tab 
                icon={<AssessmentIcon />} 
                label="Clinical Outcomes" 
                id="analytics-tab-2"
                aria-controls="analytics-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* Subscription Analytics Tab */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : subscriptionAnalytics ? (
              <Grid container spacing={3}>
                {/* Key Metrics Cards */}
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Monthly Recurring Revenue
                          </Typography>
                          <Typography variant="h4">
                            {formatCurrency(subscriptionAnalytics.mrr)}
                          </Typography>
                        </Box>
                        <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Annual Recurring Revenue
                          </Typography>
                          <Typography variant="h4">
                            {formatCurrency(subscriptionAnalytics.arr)}
                          </Typography>
                        </Box>
                        <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Churn Rate
                          </Typography>
                          <Typography variant="h4" color={subscriptionAnalytics.churnRate > 0.05 ? 'error' : 'success'}>
                            {formatPercentage(subscriptionAnalytics.churnRate)}
                          </Typography>
                        </Box>
                        {getGrowthIcon(-subscriptionAnalytics.churnRate)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Customer LTV
                          </Typography>
                          <Typography variant="h4">
                            {formatCurrency(subscriptionAnalytics.ltv)}
                          </Typography>
                        </Box>
                        <PeopleIcon color="info" sx={{ fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Plan Distribution */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Subscription Plan Distribution
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Plan</TableCell>
                              <TableCell align="right">Subscribers</TableCell>
                              <TableCell align="right">Percentage</TableCell>
                              <TableCell align="right">Revenue</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subscriptionAnalytics.planDistribution.map((plan) => (
                              <TableRow key={plan.planName}>
                                <TableCell>{plan.planName}</TableCell>
                                <TableCell align="right">{plan.count}</TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={plan.percentage}
                                      sx={{ width: 60, height: 6 }}
                                    />
                                    {formatPercentage(plan.percentage / 100)}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">{formatCurrency(plan.revenue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Revenue by Plan */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Revenue Growth by Plan
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Plan</TableCell>
                              <TableCell align="right">Revenue</TableCell>
                              <TableCell align="right">Growth</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subscriptionAnalytics.revenueByPlan.map((plan) => (
                              <TableRow key={plan.planName}>
                                <TableCell>{plan.planName}</TableCell>
                                <TableCell align="right">{formatCurrency(plan.revenue)}</TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getGrowthIcon(plan.growth)}
                                    <Chip
                                      label={formatPercentage(Math.abs(plan.growth) / 100)}
                                      color={getGrowthColor(plan.growth) as any}
                                      size="small"
                                    />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography>No subscription analytics data available</Typography>
            )}
          </TabPanel>

          {/* Pharmacy Usage Tab */}
          <TabPanel value={activeTab} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pharmacy</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell align="right">Prescriptions</TableCell>
                      <TableCell align="right">Diagnostics</TableCell>
                      <TableCell align="right">Patients</TableCell>
                      <TableCell align="right">Active Users</TableCell>
                      <TableCell align="right">Interventions</TableCell>
                      <TableCell>Last Activity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pharmacyReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No pharmacy usage data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      pharmacyReports.map((pharmacy) => (
                        <TableRow key={pharmacy.pharmacyId}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {pharmacy.pharmacyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {pharmacy.pharmacyId.slice(-8)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pharmacy.subscriptionPlan}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{pharmacy.prescriptionsProcessed.toLocaleString()}</TableCell>
                          <TableCell align="right">{pharmacy.diagnosticsPerformed.toLocaleString()}</TableCell>
                          <TableCell align="right">{pharmacy.patientsManaged.toLocaleString()}</TableCell>
                          <TableCell align="right">{pharmacy.activeUsers}</TableCell>
                          <TableCell align="right">{pharmacy.clinicalOutcomes.interventions}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(pharmacy.lastActivity), 'MMM dd, yyyy')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Clinical Outcomes Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Clinical Outcomes & Impact
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Interventions
                    </Typography>
                    <Typography variant="h4">
                      {pharmacyReports.reduce((sum, p) => sum + p.clinicalOutcomes.interventions, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Adherence Improvement
                    </Typography>
                    <Typography variant="h4">
                      {formatPercentage(
                        pharmacyReports.reduce((sum, p) => sum + p.clinicalOutcomes.adherenceImprovement, 0) / 
                        Math.max(pharmacyReports.length, 1) / 100
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Cost Savings
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(
                        pharmacyReports.reduce((sum, p) => sum + p.clinicalOutcomes.costSavings, 0)
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Analytics Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  label="Format"
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdfIcon />
                      PDF Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableChartIcon />
                      CSV Data
                    </Box>
                  </MenuItem>
                  <MenuItem value="excel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InsertChartIcon />
                      Excel Workbook
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={exportOptions.reportType}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, reportType: e.target.value as any }))}
                  label="Report Type"
                >
                  <MenuItem value="subscription">Subscription Analytics</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy Usage</MenuItem>
                  <MenuItem value="clinical">Clinical Outcomes</MenuItem>
                  <MenuItem value="financial">Financial Summary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsReports;