import React, { useState, useEffect, useMemo } from 'react';
import {
   Box,
   Card,
   CardContent,
   Typography,
   Button,
   Paper,
   IconButton,
   Tooltip,
   Alert,
   CircularProgress,
   FormControl,
   InputLabel,
   Select,
   MenuItem,
   TextField,
   Chip,
   Tabs,
   Tab,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   TablePagination,
   useTheme,
   alpha,
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Grid,
} from '@mui/material';
import {
   BarChart,
   Bar,
   LineChart,
   Line,
   PieChart,
   Pie,
   Cell,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip as RechartsTooltip,
   Legend,
   ResponsiveContainer,
   ComposedChart,
   Area,
   AreaChart,
} from 'recharts';
import {
   Assessment as AssessmentIcon,
   TrendingUp as TrendingUpIcon,
   GetApp as ExportIcon,
   FilterList as FilterIcon,
   DateRange as DateRangeIcon,
   AttachMoney as MoneyIcon,
   Timeline as TimelineIcon,
   PieChart as PieChartIcon,
   BarChart as BarChartIcon,
   ShowChart as ShowChartIcon,
   Refresh as RefreshIcon,
   Print as PrintIcon,
   Share as ShareIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useClinicalInterventionStore } from '../stores/clinicalInterventionStore';

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
      costSavingsMax: null,
   });

   // Pagination state
   const [page, setPage] = useState(0);
   const [rowsPerPage, setRowsPerPage] = useState(10);

   // Load report data
   const loadReportData = async () => {
      setLoadingReport(true);
      setReportError(null);

      try {
         // Mock data for demonstration - replace with actual API call
         const mockReport: OutcomeReport = {
            summary: {
               totalInterventions: 156,
               completedInterventions: 142,
               successfulInterventions: 128,
               successRate: 90.1,
               totalCostSavings: 45600,
               averageResolutionTime: 5.2,
               patientSatisfactionScore: 4.6,
            },
            categoryAnalysis: [
               {
                  category: 'Drug Therapy Problem',
                  total: 45,
                  successful: 42,
                  successRate: 93.3,
                  avgCostSavings: 320,
                  avgResolutionTime: 4.8,
               },
               {
                  category: 'Adverse Drug Reaction',
                  total: 32,
                  successful: 28,
                  successRate: 87.5,
                  avgCostSavings: 280,
                  avgResolutionTime: 3.2,
               },
               {
                  category: 'Medication Non-adherence',
                  total: 28,
                  successful: 26,
                  successRate: 92.9,
                  avgCostSavings: 150,
                  avgResolutionTime: 7.1,
               },
               {
                  category: 'Drug Interaction',
                  total: 22,
                  successful: 18,
                  successRate: 81.8,
                  avgCostSavings: 450,
                  avgResolutionTime: 2.8,
               },
               {
                  category: 'Dosing Issue',
                  total: 18,
                  successful: 16,
                  successRate: 88.9,
                  avgCostSavings: 200,
                  avgResolutionTime: 4.5,
               },
               {
                  category: 'Contraindication',
                  total: 11,
                  successful: 10,
                  successRate: 90.9,
                  avgCostSavings: 600,
                  avgResolutionTime: 1.5,
               },
            ],
            trendAnalysis: [
               {
                  period: '2024-01',
                  interventions: 32,
                  successRate: 87.5,
                  costSavings: 8900,
                  resolutionTime: 5.8,
               },
               {
                  period: '2024-02',
                  interventions: 28,
                  successRate: 89.3,
                  costSavings: 7800,
                  resolutionTime: 5.2,
               },
               {
                  period: '2024-03',
                  interventions: 35,
                  successRate: 91.4,
                  costSavings: 9200,
                  resolutionTime: 4.9,
               },
               {
                  period: '2024-04',
                  interventions: 41,
                  successRate: 90.2,
                  costSavings: 11500,
                  resolutionTime: 5.1,
               },
               {
                  period: '2024-05',
                  interventions: 38,
                  successRate: 92.1,
                  costSavings: 10800,
                  resolutionTime: 4.7,
               },
               {
                  period: '2024-06',
                  interventions: 42,
                  successRate: 88.1,
                  costSavings: 12400,
                  resolutionTime: 5.3,
               },
            ],
            comparativeAnalysis: {
               currentPeriod: {
                  interventions: 156,
                  successRate: 90.1,
                  costSavings: 45600,
               },
               previousPeriod: {
                  interventions: 134,
                  successRate: 87.3,
                  costSavings: 38200,
               },
               percentageChange: {
                  interventions: 16.4,
                  successRate: 3.2,
                  costSavings: 19.4,
               },
            },
            detailedOutcomes: Array.from({ length: 50 }, (_, i) => ({
               interventionId: `int_${i + 1}`,
               interventionNumber: `CI-202406-${String(i + 1).padStart(4, '0')}`,
               patientName: `Patient ${i + 1}`,
               category: [
                  'Drug Therapy Problem',
                  'Adverse Drug Reaction',
                  'Medication Non-adherence',
               ][i % 3],
               priority: ['high', 'medium', 'low'][i % 3],
               outcome: ['improved', 'no_change', 'worsened'][i % 3],
               costSavings: Math.floor(Math.random() * 500) + 100,
               resolutionTime: Math.floor(Math.random() * 10) + 1,
               patientResponse: ['improved', 'no_change', 'worsened'][i % 3],
               completedDate: format(
                  subDays(new Date(), Math.floor(Math.random() * 30)),
                  'yyyy-MM-dd'
               ),
            })),
         };

         setReportData(mockReport);
      } catch (error) {
         setReportError(
            error instanceof Error
               ? error.message
               : 'Failed to load report data'
         );
      } finally {
         setLoadingReport(false);
      }
   };

   // Load data on component mount and filter changes
   useEffect(() => {
      loadReportData();
   }, [filters]);

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
         <Box
            sx={{
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center',
               height: 400,
            }}
         >
            <CircularProgress />
         </Box>
      );
   }

   if (reportError) {
      return (
         <Alert severity="error" sx={{ m: 2 }}>
            Error loading report: {reportError}
         </Alert>
      );
   }

   if (!reportData) {
      return (
         <Alert severity="info" sx={{ m: 2 }}>
            No report data available
         </Alert>
      );
   }

   return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
         <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box
               sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
               }}
            >
               <Typography
                  variant="h4"
                  component="h1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
               >
                  <AssessmentIcon />
                  Outcome Reports & Analytics
               </Typography>
               <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Refresh Data">
                     <IconButton
                        onClick={loadReportData}
                        disabled={loadingReport}
                     >
                        <RefreshIcon />
                     </IconButton>
                  </Tooltip>
                  <Button
                     variant="outlined"
                     startIcon={<ExportIcon />}
                     onClick={() => setExportDialogOpen(true)}
                  >
                     Export Report
                  </Button>
                  <Button
                     variant="outlined"
                     startIcon={<PrintIcon />}
                     onClick={() => window.print()}
                  >
                     Print
                  </Button>
               </Box>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
               <CardContent>
                  <Typography
                     variant="h6"
                     gutterBottom
                     sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                     <FilterIcon />
                     Report Filters
                  </Typography>
                  <Grid container spacing={2}>
                     <Grid item xs={12} sm={6} md={3}>
                        <DatePicker
                           label="From Date"
                           value={filters.dateFrom}
                           onChange={(date) =>
                              handleFilterChange('dateFrom', date)
                           }
                           renderInput={(params) => (
                              <TextField {...params} fullWidth size="small" />
                           )}
                        />
                     </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <DatePicker
                           label="To Date"
                           value={filters.dateTo}
                           onChange={(date) =>
                              handleFilterChange('dateTo', date)
                           }
                           renderInput={(params) => (
                              <TextField {...params} fullWidth size="small" />
                           )}
                        />
                     </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                           <InputLabel>Category</InputLabel>
                           <Select
                              value={filters.category}
                              label="Category"
                              onChange={(e) =>
                                 handleFilterChange('category', e.target.value)
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
                              <MenuItem value="dosing_issue">
                                 Dosing Issue
                              </MenuItem>
                              <MenuItem value="contraindication">
                                 Contraindication
                              </MenuItem>
                           </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                           <InputLabel>Priority</InputLabel>
                           <Select
                              value={filters.priority}
                              label="Priority"
                              onChange={(e) =>
                                 handleFilterChange('priority', e.target.value)
                              }
                           >
                              <MenuItem value="all">All Priorities</MenuItem>
                              <MenuItem value="critical">Critical</MenuItem>
                              <MenuItem value="high">High</MenuItem>
                              <MenuItem value="medium">Medium</MenuItem>
                              <MenuItem value="low">Low</MenuItem>
                           </Select>
                        </FormControl>
                     </Grid>
                  </Grid>
               </CardContent>
            </Card>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
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
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
               <Box>
                  {/* Summary KPIs */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <AssessmentIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'primary.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 {reportData.summary.totalInterventions}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Total Interventions
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <TrendingUpIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'success.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 {reportData.summary.successRate.toFixed(1)}%
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Success Rate
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <MoneyIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'warning.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 $
                                 {reportData.summary.totalCostSavings.toLocaleString()}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Total Cost Savings
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <TimelineIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'info.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 {reportData.summary.averageResolutionTime.toFixed(
                                    1
                                 )}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Avg Resolution Time (days)
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <AssessmentIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'secondary.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 {reportData.summary.completedInterventions}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Completed Interventions
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <TrendingUpIcon
                                 sx={{
                                    fontSize: 40,
                                    color: 'success.main',
                                    mb: 1,
                                 }}
                              />
                              <Typography
                                 variant="h4"
                                 component="div"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 {reportData.summary.patientSatisfactionScore.toFixed(
                                    1
                                 )}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 color="text.secondary"
                              >
                                 Patient Satisfaction (5.0)
                              </Typography>
                           </CardContent>
                        </Card>
                     </Grid>
                  </Grid>

                  {/* Summary Charts */}
                  <Grid container spacing={3}>
                     <Grid item xs={12} md={6}>
                        <Card>
                           <CardContent>
                              <Typography variant="h6" gutterBottom>
                                 Success Rate by Category
                              </Typography>
                              <ResponsiveContainer width="100%" height={300}>
                                 <BarChart data={reportData.categoryAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                       dataKey="category"
                                       angle={-45}
                                       textAnchor="end"
                                       height={80}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <RechartsTooltip
                                       formatter={(value) => [
                                          `${value}%`,
                                          'Success Rate',
                                       ]}
                                    />
                                    <Bar
                                       dataKey="successRate"
                                       fill={theme.palette.primary.main}
                                    />
                                 </BarChart>
                              </ResponsiveContainer>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} md={6}>
                        <Card>
                           <CardContent>
                              <Typography variant="h6" gutterBottom>
                                 Cost Savings by Category
                              </Typography>
                              <ResponsiveContainer width="100%" height={300}>
                                 <BarChart data={reportData.categoryAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                       dataKey="category"
                                       angle={-45}
                                       textAnchor="end"
                                       height={80}
                                    />
                                    <YAxis />
                                    <RechartsTooltip
                                       formatter={(value) => [
                                          `$${value}`,
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
                     </Grid>
                  </Grid>
               </Box>
            )}

            {activeTab === 1 && (
               <Box>
                  {/* Category Analysis Table */}
                  <Card>
                     <CardContent>
                        <Typography variant="h6" gutterBottom>
                           Category Performance Analysis
                        </Typography>
                        <TableContainer>
                           <Table>
                              <TableHead>
                                 <TableRow>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">
                                       Successful
                                    </TableCell>
                                    <TableCell align="right">
                                       Success Rate
                                    </TableCell>
                                    <TableCell align="right">
                                       Avg Cost Savings
                                    </TableCell>
                                    <TableCell align="right">
                                       Avg Resolution Time
                                    </TableCell>
                                 </TableRow>
                              </TableHead>
                              <TableBody>
                                 {reportData.categoryAnalysis.map(
                                    (category) => (
                                       <TableRow key={category.category}>
                                          <TableCell component="th" scope="row">
                                             {category.category}
                                          </TableCell>
                                          <TableCell align="right">
                                             {category.total}
                                          </TableCell>
                                          <TableCell align="right">
                                             {category.successful}
                                          </TableCell>
                                          <TableCell align="right">
                                             <Chip
                                                label={`${category.successRate.toFixed(1)}%`}
                                                color={
                                                   category.successRate >= 90
                                                      ? 'success'
                                                      : category.successRate >=
                                                          80
                                                        ? 'warning'
                                                        : 'error'
                                                }
                                                size="small"
                                             />
                                          </TableCell>
                                          <TableCell align="right">
                                             ${category.avgCostSavings}
                                          </TableCell>
                                          <TableCell align="right">
                                             {category.avgResolutionTime.toFixed(
                                                1
                                             )}{' '}
                                             days
                                          </TableCell>
                                       </TableRow>
                                    )
                                 )}
                              </TableBody>
                           </Table>
                        </TableContainer>
                     </CardContent>
                  </Card>
               </Box>
            )}

            {activeTab === 2 && (
               <Box>
                  {/* Trend Analysis Charts */}
                  <Grid container spacing={3}>
                     <Grid item xs={12}>
                        <Card>
                           <CardContent>
                              <Typography variant="h6" gutterBottom>
                                 Monthly Trends
                              </Typography>
                              <ResponsiveContainer width="100%" height={400}>
                                 <ComposedChart data={reportData.trendAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis yAxisId="left" />
                                    <YAxis
                                       yAxisId="right"
                                       orientation="right"
                                    />
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
                     </Grid>
                  </Grid>
               </Box>
            )}

            {activeTab === 3 && (
               <Box>
                  {/* Comparative Analysis */}
                  <Grid container spacing={3}>
                     <Grid item xs={12} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                 Interventions
                              </Typography>
                              <Typography
                                 variant="h4"
                                 sx={{ fontWeight: 'bold', mb: 1 }}
                              >
                                 {
                                    reportData.comparativeAnalysis.currentPeriod
                                       .interventions
                                 }
                              </Typography>
                              <Box
                                 sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                 }}
                              >
                                 <TrendingUpIcon
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.interventions >=
                                          0
                                             ? 'success.main'
                                             : 'error.main',
                                       mr: 0.5,
                                    }}
                                 />
                                 <Typography
                                    variant="body2"
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.interventions >=
                                          0
                                             ? 'success.main'
                                             : 'error.main',
                                       fontWeight: 'medium',
                                    }}
                                 >
                                    {Math.abs(
                                       reportData.comparativeAnalysis
                                          .percentageChange.interventions
                                    ).toFixed(1)}
                                    % vs previous period
                                 </Typography>
                              </Box>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                 Success Rate
                              </Typography>
                              <Typography
                                 variant="h4"
                                 sx={{ fontWeight: 'bold', mb: 1 }}
                              >
                                 {reportData.comparativeAnalysis.currentPeriod.successRate.toFixed(
                                    1
                                 )}
                                 %
                              </Typography>
                              <Box
                                 sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                 }}
                              >
                                 <TrendingUpIcon
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.successRate >= 0
                                             ? 'success.main'
                                             : 'error.main',
                                       mr: 0.5,
                                    }}
                                 />
                                 <Typography
                                    variant="body2"
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.successRate >= 0
                                             ? 'success.main'
                                             : 'error.main',
                                       fontWeight: 'medium',
                                    }}
                                 >
                                    {Math.abs(
                                       reportData.comparativeAnalysis
                                          .percentageChange.successRate
                                    ).toFixed(1)}
                                    % vs previous period
                                 </Typography>
                              </Box>
                           </CardContent>
                        </Card>
                     </Grid>
                     <Grid item xs={12} md={4}>
                        <Card>
                           <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                 Cost Savings
                              </Typography>
                              <Typography
                                 variant="h4"
                                 sx={{ fontWeight: 'bold', mb: 1 }}
                              >
                                 $
                                 {reportData.comparativeAnalysis.currentPeriod.costSavings.toLocaleString()}
                              </Typography>
                              <Box
                                 sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                 }}
                              >
                                 <TrendingUpIcon
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.costSavings >= 0
                                             ? 'success.main'
                                             : 'error.main',
                                       mr: 0.5,
                                    }}
                                 />
                                 <Typography
                                    variant="body2"
                                    sx={{
                                       color:
                                          reportData.comparativeAnalysis
                                             .percentageChange.costSavings >= 0
                                             ? 'success.main'
                                             : 'error.main',
                                       fontWeight: 'medium',
                                    }}
                                 >
                                    {Math.abs(
                                       reportData.comparativeAnalysis
                                          .percentageChange.costSavings
                                    ).toFixed(1)}
                                    % vs previous period
                                 </Typography>
                              </Box>
                           </CardContent>
                        </Card>
                     </Grid>
                  </Grid>
               </Box>
            )}

            {activeTab === 4 && (
               <Box>
                  {/* Detailed Outcomes Table */}
                  <Card>
                     <CardContent>
                        <Typography variant="h6" gutterBottom>
                           Detailed Intervention Outcomes
                        </Typography>
                        <TableContainer>
                           <Table>
                              <TableHead>
                                 <TableRow>
                                    <TableCell>Intervention #</TableCell>
                                    <TableCell>Patient</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Outcome</TableCell>
                                    <TableCell align="right">
                                       Cost Savings
                                    </TableCell>
                                    <TableCell align="right">
                                       Resolution Time
                                    </TableCell>
                                    <TableCell>Completed Date</TableCell>
                                 </TableRow>
                              </TableHead>
                              <TableBody>
                                 {reportData.detailedOutcomes
                                    .slice(
                                       page * rowsPerPage,
                                       page * rowsPerPage + rowsPerPage
                                    )
                                    .map((outcome) => (
                                       <TableRow key={outcome.interventionId}>
                                          <TableCell>
                                             {outcome.interventionNumber}
                                          </TableCell>
                                          <TableCell>
                                             {outcome.patientName}
                                          </TableCell>
                                          <TableCell>
                                             {outcome.category}
                                          </TableCell>
                                          <TableCell>
                                             <Chip
                                                label={outcome.priority}
                                                color={
                                                   outcome.priority === 'high'
                                                      ? 'error'
                                                      : outcome.priority ===
                                                          'medium'
                                                        ? 'warning'
                                                        : 'default'
                                                }
                                                size="small"
                                             />
                                          </TableCell>
                                          <TableCell>
                                             <Chip
                                                label={outcome.patientResponse}
                                                color={
                                                   outcome.patientResponse ===
                                                   'improved'
                                                      ? 'success'
                                                      : outcome.patientResponse ===
                                                          'no_change'
                                                        ? 'warning'
                                                        : 'error'
                                                }
                                                size="small"
                                             />
                                          </TableCell>
                                          <TableCell align="right">
                                             ${outcome.costSavings}
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
                           count={reportData.detailedOutcomes.length}
                           rowsPerPage={rowsPerPage}
                           page={page}
                           onPageChange={(_, newPage) => setPage(newPage)}
                           onRowsPerPageChange={(event) => {
                              setRowsPerPage(parseInt(event.target.value, 10));
                              setPage(0);
                           }}
                        />
                     </CardContent>
                  </Card>
               </Box>
            )}

            {/* Export Dialog */}
            <Dialog
               open={exportDialogOpen}
               onClose={() => setExportDialogOpen(false)}
            >
               <DialogTitle>Export Report</DialogTitle>
               <DialogContent>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                     Choose the format for exporting the report:
                  </Typography>
                  <FormControl fullWidth>
                     <InputLabel>Export Format</InputLabel>
                     <Select
                        value={exportFormat}
                        label="Export Format"
                        onChange={(e) => setExportFormat(e.target.value as any)}
                     >
                        <MenuItem value="pdf">PDF Report</MenuItem>
                        <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                        <MenuItem value="csv">CSV Data</MenuItem>
                     </Select>
                  </FormControl>
               </DialogContent>
               <DialogActions>
                  <Button onClick={() => setExportDialogOpen(false)}>
                     Cancel
                  </Button>
                  <Button onClick={handleExport} variant="contained">
                     Export
                  </Button>
               </DialogActions>
            </Dialog>
         </Box>
      </LocalizationProvider>
   );
};

export default ClinicalInterventionReports;
