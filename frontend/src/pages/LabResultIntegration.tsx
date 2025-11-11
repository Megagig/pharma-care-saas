import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import {
  usePendingReviews,
  useCriticalCases,
  useCasesRequiringEscalation,
  useLabIntegrationStats,
  useLabIntegrationStatusColor,
  useHasCriticalFindings,
} from '../hooks/useLabIntegration';
import type { LabIntegration } from '../services/labIntegrationService';

const LabResultIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const {
    data: pendingReviews,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingReviews();

  const {
    data: criticalCases,
    isLoading: criticalLoading,
    refetch: refetchCritical,
  } = useCriticalCases();

  const {
    data: escalationCases,
    isLoading: escalationLoading,
    refetch: refetchEscalation,
  } = useCasesRequiringEscalation();

  const stats = useLabIntegrationStats();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPending(), refetchCritical(), refetchEscalation()]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/pharmacy/lab-integration/${caseId}`);
  };

  const handleNewCase = () => {
    navigate('/pharmacy/lab-integration/new');
  };

  const getStatusColor = (status: LabIntegration['status']) => {
    const colors: Record<LabIntegration['status'], string> = {
      draft: 'default',
      pending_interpretation: 'info',
      pending_review: 'warning',
      pending_approval: 'warning',
      approved: 'success',
      implemented: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: LabIntegration['priority']) => {
    const colors: Record<LabIntegration['priority'], string> = {
      routine: 'default',
      urgent: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
  };

  const isLoading = pendingLoading || criticalLoading || escalationLoading;

  return (
    <>
      <Helmet>
        <title>Lab Result Integration | PharmaCare</title>
      </Helmet>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon fontSize="large" />
              Lab Result Integration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered lab result interpretation with therapy recommendations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewCase}
            >
              New Lab Integration
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Pending Reviews
                    </Typography>
                    <Typography variant="h4">
                      {isLoading ? <Skeleton width={60} /> : stats.pendingCount}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Critical Cases
                    </Typography>
                    <Typography variant="h4">
                      {isLoading ? <Skeleton width={60} /> : stats.criticalCount}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <WarningIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Escalation Required
                    </Typography>
                    <Typography variant="h4">
                      {isLoading ? <Skeleton width={60} /> : stats.escalationCount}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <LocalHospitalIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Total Action Required
                    </Typography>
                    <Typography variant="h4">
                      {isLoading ? <Skeleton width={60} /> : stats.totalActionRequired}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AssignmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Critical Cases */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Critical Cases
                  </Typography>
                  <Chip label={stats.criticalCount} color="error" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {criticalLoading ? (
                  <Box>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height={80} sx={{ mb: 1 }} />
                    ))}
                  </Box>
                ) : criticalCases && criticalCases.length > 0 ? (
                  <List>
                    {criticalCases.slice(0, 5).map((case_) => (
                      <ListItem
                        key={case_._id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => handleViewCase(case_._id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'error.main' }}>
                            <WarningIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Patient ID: ${case_.patientId}`}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {format(new Date(case_.createdAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={case_.priority}
                                  size="small"
                                  color={getPriorityColor(case_.priority) as any}
                                />
                                <Chip
                                  label={case_.status.replace(/_/g, ' ')}
                                  size="small"
                                  color={getStatusColor(case_.status) as any}
                                />
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success">No critical cases at this time</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Reviews */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="warning" />
                    Pending Reviews
                  </Typography>
                  <Chip label={stats.pendingCount} color="warning" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {pendingLoading ? (
                  <Box>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height={80} sx={{ mb: 1 }} />
                    ))}
                  </Box>
                ) : pendingReviews && pendingReviews.length > 0 ? (
                  <List>
                    {pendingReviews.slice(0, 5).map((case_) => (
                      <ListItem
                        key={case_._id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => handleViewCase(case_._id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <ScheduleIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Patient ID: ${case_.patientId}`}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {format(new Date(case_.createdAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={case_.priority}
                                  size="small"
                                  color={getPriorityColor(case_.priority) as any}
                                />
                                <Chip
                                  label={case_.status.replace(/_/g, ' ')}
                                  size="small"
                                  color={getStatusColor(case_.status) as any}
                                />
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No pending reviews</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default LabResultIntegration;
