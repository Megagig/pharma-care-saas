import React, { useState, useCallback, useMemo } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScienceIcon from '@mui/icons-material/Science';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TimelineIcon from '@mui/icons-material/Timeline';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import hooks and components
import {
  useDiagnosticHistory,
  useDiagnosticAnalytics,
} from '../hooks/useDiagnostics';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { usePatients } from '../../../stores';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

// Import types
import type {
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticAnalytics,
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
  // TEMPORARILY DISABLED TO TEST INFINITE LOOP
  const patients: unknown[] = [];

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
  const [refreshing, setRefreshing] = useState(false);

  // Store state
  const { filters, setFilters, clearFilters, selectRequest } =
    useDiagnosticStore();

  // TEMPORARILY DISABLED TO TEST INFINITE LOOP
  const patients: unknown[] = [];

  // Memoize the history query parameters to prevent infinite loops
  const historyParams = useMemo(
    () => ({
      ...filters,
      limit: 10, // Show recent cases
    }),
    [filters]
  );

  // API queries - TEMPORARILY DISABLED TO FIX INFINITE LOOP
  const historyData = { data: { results: [] } };
  const historyLoading = false;
  const historyError = null;
  const refetchHistoryOriginal = () => Promise.resolve();

  const analyticsData = { data: {} };
  const analyticsLoading = false;
  const analyticsError = null;
  const refetchAnalytics = () => Promise.resolve();

  // ORIGINAL CODE (commented out):
  /*
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistoryOriginal,
  } = useDiagnosticHistory(historyParams);

  // Memoize analytics parameters to prevent unnecessary re-renders
  const analyticsParams = useMemo(
    () => ({
      dateFrom: format(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      ),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
    }),
    []
  );

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useDiagnosticAnalytics(analyticsParams);
  */

  // Memoize refetch functions to prevent infinite loops
  const refetchHistory = useCallback(() => {
    refetchHistoryOriginal();
  }, []);

  // Real-time updates for pending requests
  const pendingRequests =
    historyData?.data?.results?.filter(
      (req: DiagnosticRequest) =>
        req.status === 'pending' || req.status === 'processing'
    ) || [];

  // Removed unused polling variables since polling is disabled

  // Poll for status updates on pending requests - DISABLED TO FIX INFINITE LOOP
  // TODO: Re-enable polling after fixing the infinite loop issue
  /*
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval only if there are pending requests
    if (hasPendingRequests) {
      intervalRef.current = setInterval(() => {
        refetchHistory();
      }, 10000); // Poll every 10 seconds
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasPendingRequests, refetchHistory]);
  */

  // Handlers - SIMPLIFIED TO FIX INFINITE LOOP
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);

      // Simple direct update without debouncing for now
      if (value !== filters.search) {
        setFilters({ search: value, page: 1 });
      }
    },
    [setFilters, filters.search]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHistory(), refetchAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleNewCase = useCallback(() => {
    navigate('/pharmacy/diagnostics/case/new');
  }, [navigate]);

  const handleViewDetails = useCallback(
    (request: DiagnosticRequest) => {
      selectRequest(request);
      navigate(`/pharmacy/diagnostics/case/${request._id}`);
    },
    [selectRequest, navigate]
  );

  const handleQuickAction = useCallback(
    (request: DiagnosticRequest, action: string) => {
      switch (action) {
        case 'view':
          handleViewDetails(request);
          break;
        case 'review':
          navigate(`/pharmacy/diagnostics/case/${request._id}`);
          break;
        case 'cancel':
          // Handle cancel logic
          break;
        case 'export':
          // Handle export logic
          break;
      }
    },
    [handleViewDetails, navigate]
  );

  const handleFilterClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setFilterAnchorEl(event.currentTarget);
    },
    []
  );

  const handleFilterClose = useCallback(() => {
    setFilterAnchorEl(null);
  }, []);

  const handleFilterPending = useCallback(() => {
    setFilters({ status: 'pending' });
    handleFilterClose();
  }, [setFilters, handleFilterClose]);

  const handleFilterCompleted = useCallback(() => {
    setFilters({ status: 'completed' });
    handleFilterClose();
  }, [setFilters, handleFilterClose]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    handleFilterClose();
  }, [clearFilters, handleFilterClose]);

  // Computed values
  const recentCases = historyData?.data?.results || [];
  const analytics = analyticsData?.data as DiagnosticAnalytics | undefined;

  const quickStats = useMemo(
    () => [
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
    ],
    [analytics, pendingRequests.length]
  );

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
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
            >
              Filters
            </Button>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid xs={12} sm={6} md={3} key={index}>
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
          <Grid xs={12} md={8}>
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
                    onClick={() => navigate('/pharmacy/diagnostics')}
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
          <Grid xs={12} md={4}>
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
                      onClick={() => navigate('/pharmacy/diagnostics/case/new')}
                      fullWidth
                    >
                      Lab Orders
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<TimelineIcon />}
                      onClick={() => navigate('/pharmacy/diagnostics')}
                      fullWidth
                    >
                      View Analytics
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LocalHospitalIcon />}
                      onClick={() => navigate('/pharmacy/diagnostics')}
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
          <MenuItem onClick={handleFilterPending}>Pending Cases</MenuItem>
          <MenuItem onClick={handleFilterCompleted}>Completed Cases</MenuItem>
          <MenuItem onClick={handleClearFilters}>Clear Filters</MenuItem>
        </Menu>
      </Container>
    </ErrorBoundary>
  );
};

// TEMPORARILY REMOVED FEATURE GUARD TO TEST INFINITE LOOP
// const DiagnosticDashboardWithGuard: React.FC = () => (
//   <DiagnosticFeatureGuard>
//     <DiagnosticDashboard />
//   </DiagnosticFeatureGuard>
// );

export default DiagnosticDashboard;
