/**
 * Deployment Monitoring Dashboard
 * Real-time deployment monitoring with rollout tracking and automated rollback triggers
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Undo as RollbackIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface DeploymentStatus {
  deploymentId: string;
  status: 'monitoring' | 'completed' | 'rolled_back' | 'failed';
  rolloutPercentage: number;
  startTime: Date;
  endTime?: Date;
  metrics: {
    errorRate: number;
    latency: number;
    throughput: number;
    activeUsers: number;
  };
  thresholds: {
    errorRate: number;
    latencyP95: number;
    throughputMin: number;
  };
  alerts: string[];
}

interface DeploymentHistory {
  deploymentId: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  rolloutPercentage: number;
  triggeredRollback: boolean;
}

const DeploymentMonitoringDashboard: React.FC = () => {
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [deploymentId, setDeploymentId] = useState('');
  const [rolloutPercentage, setRolloutPercentage] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Fetch current deployment status
  const { data: deploymentStatus, isLoading, error } = useQuery<DeploymentStatus>({
    queryKey: ['deployment', 'status'],
    queryFn: async () => {
      const response = await axios.get('/api/deployment/status');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch deployment history
  const { data: deploymentHistory } = useQuery<DeploymentHistory[]>({
    queryKey: ['deployment', 'history'],
    queryFn: async () => {
      const response = await axios.get('/api/deployment/history');
      return response.data.data;
    },
  });

  // Start deployment mutation
  const startDeploymentMutation = useMutation({
    mutationFn: async (data: { deploymentId: string; rolloutPercentage: number }) => {
      await axios.post('/api/deployment/start', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment'] });
      setStartDialogOpen(false);
      setDeploymentId('');
      setRolloutPercentage(10);
    },
  });

  // Stop deployment mutation
  const stopDeploymentMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/deployment/stop');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment'] });
    },
  });

  // Rollback deployment mutation
  const rollbackDeploymentMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/deployment/rollback');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment'] });
    },
  });

  const handleStartDeployment = () => {
    if (deploymentId && rolloutPercentage > 0 && rolloutPercentage <= 100) {
      startDeploymentMutation.mutate({ deploymentId, rolloutPercentage });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'monitoring': return 'info';
      case 'completed': return 'success';
      case 'rolled_back': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'monitoring': return <TimelineIcon />;
      case 'completed': return <SuccessIcon />;
      case 'rolled_back': return <WarningIcon />;
      case 'failed': return <ErrorIcon />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load deployment monitoring data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Deployment Monitoring
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="contained"
            startIcon={<StartIcon />}
            onClick={() => setStartDialogOpen(true)}
            disabled={deploymentStatus?.status === 'monitoring'}
          >
            Start Deployment
          </Button>
          <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['deployment'] })}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Current Deployment Status */}
      {deploymentStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Current Deployment</Typography>
              <Chip
                label={deploymentStatus.status}
                color={getStatusColor(deploymentStatus.status) as any}
                icon={getStatusIcon(deploymentStatus.status)}
              />
            </Box>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary">Deployment ID</Typography>
                <Typography variant="body1" fontWeight="bold">{deploymentStatus.deploymentId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary">Rollout Percentage</Typography>
                <Typography variant="body1" fontWeight="bold">{deploymentStatus.rolloutPercentage}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary">Error Rate</Typography>
                <Typography variant="body1" fontWeight="bold" color={deploymentStatus.metrics.errorRate > deploymentStatus.thresholds.errorRate ? 'error' : 'inherit'}>
                  {deploymentStatus.metrics.errorRate.toFixed(2)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary">Active Users</Typography>
                <Typography variant="body1" fontWeight="bold">{deploymentStatus.metrics.activeUsers}</Typography>
              </Grid>
            </Grid>

            <Box mb={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Rollout Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={deploymentStatus.rolloutPercentage}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            {deploymentStatus.alerts.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Alerts:
                </Typography>
                {deploymentStatus.alerts.map((alert, index) => (
                  <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                    {alert}
                  </Alert>
                ))}
              </Box>
            )}

            {deploymentStatus.status === 'monitoring' && (
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={() => stopDeploymentMutation.mutate()}
                >
                  Stop Deployment
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<RollbackIcon />}
                  onClick={() => rollbackDeploymentMutation.mutate()}
                >
                  Rollback
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deployment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Deployment History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Deployment ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rollout %</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Rollback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deploymentHistory?.map((deployment) => (
                  <TableRow key={deployment.deploymentId}>
                    <TableCell>{deployment.deploymentId}</TableCell>
                    <TableCell>
                      <Chip
                        label={deployment.status}
                        color={getStatusColor(deployment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{deployment.rolloutPercentage}%</TableCell>
                    <TableCell>{new Date(deployment.startTime).toLocaleString()}</TableCell>
                    <TableCell>{deployment.endTime ? new Date(deployment.endTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {deployment.triggeredRollback ? (
                        <Chip label="Yes" color="warning" size="small" />
                      ) : (
                        <Chip label="No" color="default" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Start Deployment Dialog */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Deployment</DialogTitle>
        <DialogContent>
          <TextField
            label="Deployment ID"
            fullWidth
            value={deploymentId}
            onChange={(e) => setDeploymentId(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            label="Rollout Percentage"
            type="number"
            fullWidth
            value={rolloutPercentage}
            onChange={(e) => setRolloutPercentage(Number(e.target.value))}
            margin="normal"
            inputProps={{ min: 1, max: 100 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStartDeployment}
            variant="contained"
            disabled={!deploymentId || rolloutPercentage < 1 || rolloutPercentage > 100}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeploymentMonitoringDashboard;

