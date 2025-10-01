import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Avatar,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  LocalHospital as LocalHospitalIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDiagnosticAnalytics } from '../../../queries/useDiagnosticHistory';

const DiagnosticAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useDiagnosticAnalytics({
    dateFrom,
    dateTo,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleDateChange = () => {
    refetch();
  };

  // Chart colors
  const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2'];

  // Prepare chart data
  const trendData = analytics?.completionTrends?.map((trend) => ({
    date: format(new Date(trend._id), 'MMM dd'),
    created: trend.casesCreated,
    completed: trend.casesCompleted,
  })) || [];

  const topDiagnosesData = analytics?.topDiagnoses?.slice(0, 5).map((diagnosis, index) => ({
    ...diagnosis,
    color: COLORS[index % COLORS.length],
  })) || [];

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          Failed to load analytics data. Please try refreshing the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton
            onClick={() => navigate('/pharmacy/diagnostics')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
            Diagnostic Analytics
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>

        {/* Date Range Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <DateRangeIcon color="action" />
              <TextField
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                onClick={handleDateChange}
                disabled={isLoading}
              >
                Apply Filter
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Stats */}
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AssessmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analytics?.summary?.totalCases || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Cases
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analytics?.summary?.completedCases || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analytics?.summary?.pendingFollowUps || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Follow-ups
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {Math.round(analytics?.summary?.averageConfidence || 0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Confidence
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <LocalHospitalIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analytics?.summary?.referralsGenerated || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Referrals
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              {isLoading ? (
                <Box>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'grey.600', mr: 2 }}>
                    <TimerIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {Math.round(analytics?.summary?.averageProcessingTime || 0)}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Processing
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Case Completion Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Case Completion Trends (Last 30 Days)
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Cases Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#388e3c"
                      strokeWidth={2}
                      name="Cases Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No trend data available for the selected period
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Diagnoses */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Top Diagnoses
              </Typography>
              {isLoading ? (
                <Box>
                  {[...Array(5)].map((_, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rectangular" height={8} sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Box>
              ) : topDiagnosesData.length > 0 ? (
                <Box>
                  {topDiagnosesData.map((diagnosis, index) => (
                    <Box key={diagnosis.condition} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {diagnosis.condition}
                        </Typography>
                        <Chip
                          label={`${diagnosis.count} cases`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(diagnosis.count / (topDiagnosesData[0]?.count || 1)) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: diagnosis.color,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Avg Confidence: {Math.round(diagnosis.averageConfidence)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No diagnosis data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Statistics Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Detailed Statistics
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Cases</TableCell>
                        <TableCell align="right">{analytics?.summary?.totalCases || 0}</TableCell>
                        <TableCell>Total diagnostic cases in selected period</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Completion Rate</TableCell>
                        <TableCell align="right">
                          {analytics?.summary?.totalCases
                            ? Math.round(
                                ((analytics.summary.completedCases || 0) /
                                  analytics.summary.totalCases) *
                                  100
                              )
                            : 0}%
                        </TableCell>
                        <TableCell>Percentage of cases completed</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Confidence</TableCell>
                        <TableCell align="right">
                          {Math.round(analytics?.summary?.averageConfidence || 0)}%
                        </TableCell>
                        <TableCell>Average AI confidence score</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Processing Time</TableCell>
                        <TableCell align="right">
                          {Math.round(analytics?.summary?.averageProcessingTime || 0)}s
                        </TableCell>
                        <TableCell>Average time for AI analysis</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Referrals Generated</TableCell>
                        <TableCell align="right">{analytics?.summary?.referralsGenerated || 0}</TableCell>
                        <TableCell>Number of referrals recommended by AI</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pending Follow-ups</TableCell>
                        <TableCell align="right">{analytics?.summary?.pendingFollowUps || 0}</TableCell>
                        <TableCell>Cases requiring follow-up attention</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DiagnosticAnalyticsPage;