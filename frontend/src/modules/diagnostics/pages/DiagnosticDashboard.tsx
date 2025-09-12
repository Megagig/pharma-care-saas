import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
  Fab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Science as ScienceIcon,
  LocalHospital as HospitalIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import hooks and components
import {
  useDiagnosticHistory,
  useDiagnosticAnalytics,
  useDiagnosticStatus,
} from '../hooks/useDiagnostics';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { usePatients } from '../../../stores';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { NotificationSystem } from '../../../components/common/NotificationSystem';

// Import types
import type {
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticAnalytics,
  DiagnosticFilters,
} from '../types';

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
}) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon
              sx={{
                fontSize: 16,
                color: trend.isPositive ? 'success.main' : 'error.main',
                transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                mr: 0.5,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 500,
              }}
            >
              {Math.abs(trend.value)}% from last week
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface RecentCaseCardProps {
  request: DiagnosticRequest;
  result?: DiagnosticResult;
  onViewDetails: (request: DiagnosticRequest) => void;
  onQuickAction: (request: DiagnosticRequest, action: string) => void;
}

const RecentCaseCard: React.FC<RecentCaseCardProps> = ({
  request,
  result,
  onViewDetails,
  onQuickAction,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { patients } = usePatients();

  const patient = patients.find((p) => p._id === request.patientId);
  const statusColor = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'error',
    cancelled: 'default',
  }[request.status] as 'warning' | 'info' | 'success' | 'error' | 'default';

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuickAction = (action: string) => {
    onQuickAction(request, action);
    handleMenuClose();
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon
                sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {patient
                  ? `${patient.firstName} ${patient.lastName}`
                  : 'Unknown Patient'}
              </Typography>
              <Chip
                label={request.status}
                color={statusColor}
                size="small"
                sx={{ ml: 1, textTransform: 'capitalize' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {request.inputSnapshot.symptoms.subjective.slice(0, 2).join(', ')}
              {request.inputSnapshot.symptoms.subjective.length > 2 && '...'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(request.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {result && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              Top Diagnosis:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {result.diagnoses[0]?.condition || 'No diagnosis available'}
            </Typography>
            {result.diagnoses[0] && (
              <Typography variant="caption" color="text.secondary">
                Confidence: {Math.round(result.diagnoses[0].probability * 100)}%
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onViewDetails(request)}
          >
            View Details
          </Button>
          {request.status === 'completed' &&
            result?.pharmacistReview?.status === undefined && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleQuickAction('review')}
              >
                Review
              </Button>
            )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleQuickAction('view')}>
            View Full Details
          </MenuItem>
          {request.status === 'pending' && (
            <MenuItem onClick={() => handleQuickAction('cancel')}>
              Cancel Request
            </MenuItem>
          )}
          {request.status === 'completed' && (
            <MenuItem onClick={() => handleQuickAction('export')}>
              Export Report
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};

const DiagnosticDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Store state
  const { filters, setFilters, clearFilters, selectedRequest, selectRequest } =
    useDiagnosticStore();

  const { patients } = usePatients();

  // API queries
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useDiagnosticHistory({
    ...filters,
    limit: 10, // Show recent cases
  });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useDiagnosticAnalytics({
    dateFrom: format(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    ),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  });

  // Real-time updates for pending requests
  const pendingRequests =
    historyData?.data?.results?.filter(
      (req: DiagnosticRequest) =>
        req.status === 'pending' || req.status === 'processing'
    ) || [];

  // Poll for status updates on pending requests
  useEffect(() => {
    if (pendingRequests.length > 0) {
      const interval = setInterval(() => {
        refetchHistory();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [pendingRequests.length, refetchHistory]);

  // Handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setFilters({ search: value, page: 1 });
  };

  const handlePatientFilter = (patientId: string) => {
    setSelectedPatientId(patientId);
    setFilters({ patientId: patientId || undefined, page: 1 });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHistory(), refetchAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewCase = () => {
    navigate('/diagnostics/case-intake');
  };

  const handleViewDetails = (request: DiagnosticRequest) => {
    selectRequest(request);
    navigate(`/diagnostics/case/${request._id}`);
  };

  const handleQuickAction = (request: DiagnosticRequest, action: string) => {
    switch (action) {
      case 'view':
        handleViewDetails(request);
        break;
      case 'review':
        navigate(`/diagnostics/review/${request._id}`);
        break;
      case 'cancel':
        // Handle cancel logic
        break;
      case 'export':
        // Handle export logic
        break;
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Computed values
  const recentCases = historyData?.data?.results || [];
  const analytics = analyticsData?.data as DiagnosticAnalytics | undefined;

  const quickStats = [
    {
      title: 'Total Cases',
      value: analytics?.totalRequests || 0,
      icon: <AssessmentIcon />,
      color: 'primary' as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Completed Today',
      value: analytics?.completedRequests || 0,
      icon: <CheckCircleIcon />,
      color: 'success' as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Pending Review',
      value: pendingRequests.length,
      icon: <ScheduleIcon />,
      color: 'warning' as const,
    },
    {
      title: 'Avg Confidence',
      value: analytics?.averageConfidenceScore
        ? `${Math.round(analytics.averageConfidenceScore * 100)}%`
        : '0%',
      icon: <TrendingUpIcon />,
      color: 'secondary' as const,
      trend: { value: 5, isPositive: true },
    },
  ];

  if (historyError || analyticsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Diagnostic Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                AI-powered diagnostic analysis and case management
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewCase}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                New Case
              </Button>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search cases..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              sx={{ minWidth: 300, flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filters
            </Button>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              {analyticsLoading ? (
                <Skeleton variant="rectangular" height={120} />
              ) : (
                <QuickStatsCard {...stat} />
              )}
            </Grid>
          ))}
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Recent Cases */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Cases
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/diagnostics/cases')}
                  >
                    View All
                  </Button>
                </Box>

                {historyLoading ? (
                  <Box>
                    {[...Array(5)].map((_, index) => (
                      <Skeleton
                        key={index}
                        variant="rectangular"
                        height={100}
                        sx={{ mb: 2 }}
                      />
                    ))}
                  </Box>
                ) : recentCases.length > 0 ? (
                  <Box>
                    {recentCases.map((request: DiagnosticRequest) => (
                      <RecentCaseCard
                        key={request._id}
                        request={request}
                        onViewDetails={handleViewDetails}
                        onQuickAction={handleQuickAction}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ScienceIcon
                      sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      No cases yet
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Start your first diagnostic case to see it here
                    </Typography>
                    <Button variant="contained" onClick={handleNewCase}>
                      Create First Case
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions & Notifications */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Quick Actions */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleNewCase}
                      fullWidth
                    >
                      New Diagnostic Case
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ScienceIcon />}
                      onClick={() => navigate('/diagnostics/lab-orders')}
                      fullWidth
                    >
                      Lab Orders
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<TimelineIcon />}
                      onClick={() => navigate('/diagnostics/analytics')}
                      fullWidth
                    >
                      View Analytics
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<HospitalIcon />}
                      onClick={() => navigate('/diagnostics/referrals')}
                      fullWidth
                    >
                      Referrals
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NotificationsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Notifications
                    </Typography>
                    <Badge
                      badgeContent={pendingRequests.length}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  {pendingRequests.length > 0 ? (
                    <Box>
                      {pendingRequests
                        .slice(0, 3)
                        .map((request: DiagnosticRequest) => {
                          const patient = patients.find(
                            (p) => p._id === request.patientId
                          );
                          return (
                            <Alert
                              key={request._id}
                              severity="info"
                              sx={{ mb: 1 }}
                              action={
                                <Button
                                  size="small"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  View
                                </Button>
                              }
                            >
                              <Typography variant="body2">
                                {patient
                                  ? `${patient.firstName} ${patient.lastName}`
                                  : 'Patient'}{' '}
                                - Case {request.status}
                              </Typography>
                            </Alert>
                          );
                        })}
                      {pendingRequests.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{pendingRequests.length - 3} more pending cases
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No pending notifications
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="new case"
            onClick={handleNewCase}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem
            onClick={() => {
              setFilters({ status: 'pending' });
              handleFilterClose();
            }}
          >
            Pending Cases
          </MenuItem>
          <MenuItem
            onClick={() => {
              setFilters({ status: 'completed' });
              handleFilterClose();
            }}
          >
            Completed Cases
          </MenuItem>
          <MenuItem
            onClick={() => {
              clearFilters();
              handleFilterClose();
            }}
          >
            Clear Filters
          </MenuItem>
        </Menu>

        <NotificationSystem />
      </Container>
    </ErrorBoundary>
  );
};

export default DiagnosticDashboard;
