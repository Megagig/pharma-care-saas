import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  SwapVert as MigrationIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunIcon,
  Undo as RollbackIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';

interface Migration {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  duration?: number;
  createdBy: string;
  description: string;
  version: string;
}

const MigrationDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [migrations, setMigrations] = useState<Migration[]>([
    {
      id: '1',
      name: 'Add patient insurance fields',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86000000).toISOString(),
      duration: 120,
      createdBy: 'admin@example.com',
      description:
        'Added insurance provider and policy number fields to patient records',
      version: '1.2.0',
    },
    {
      id: '2',
      name: 'Update medication schema',
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      completedAt: new Date(Date.now() - 172000000).toISOString(),
      duration: 300,
      createdBy: 'admin@example.com',
      description: 'Modified medication schema to include dosage instructions',
      version: '1.1.5',
    },
    {
      id: '3',
      name: 'Create audit log collection',
      status: 'failed',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      completedAt: new Date(Date.now() - 259000000).toISOString(),
      duration: 45,
      createdBy: 'admin@example.com',
      description:
        'Initial creation of audit log collection failed due to permissions',
      version: '1.1.0',
    },
  ]);
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(
    null
  );
  const [showRunMigrationDialog, setShowRunMigrationDialog] = useState(false);
  const [newMigration, setNewMigration] = useState({
    name: '',
    description: '',
    version: '',
  });

  const addNotification = useUIStore((state) => state.addNotification);

  const handleRunMigration = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      addNotification({
        type: 'info',
        title: 'Migration Started',
        message: `Running migration: ${newMigration.name}`,
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add the new migration to the list
      const migration: Migration = {
        id: (migrations.length + 1).toString(),
        name: newMigration.name,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + 5000).toISOString(),
        duration: 5,
        createdBy: 'current_user@example.com',
        description: newMigration.description,
        version: newMigration.version,
      };

      setMigrations([migration, ...migrations]);
      setShowRunMigrationDialog(false);
      setNewMigration({ name: '', description: '', version: '' });

      addNotification({
        type: 'success',
        title: 'Migration Completed',
        message: `Successfully completed migration: ${newMigration.name}`,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Migration Failed',
        message: `Failed to run migration: ${newMigration.name}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackMigration = async (migrationId: string) => {
    try {
      setLoading(true);

      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      addNotification({
        type: 'info',
        title: 'Rollback Started',
        message: `Rolling back migration: ${migrationId}`,
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update the migration status
      setMigrations(
        migrations.map((m) =>
          m.id === migrationId ? { ...m, status: 'completed' } : m
        )
      );

      addNotification({
        type: 'success',
        title: 'Rollback Completed',
        message: `Successfully rolled back migration: ${migrationId}`,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Rollback Failed',
        message: `Failed to rollback migration: ${migrationId}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'running':
        return <PendingIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MigrationIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Migration Dashboard
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={() => setShowRunMigrationDialog(true)}
            sx={{ mr: 1 }}
          >
            Run Migration
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Migration Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {migrations.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Migrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {migrations.filter((m) => m.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Successful
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {migrations.filter((m) => m.status === 'failed').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {
                  migrations.filter(
                    (m) => m.status === 'pending' || m.status === 'running'
                  ).length
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Migration List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Migration History"
              subheader="List of all database migrations"
            />
            <Divider />
            <CardContent>
              {migrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No migrations found
                  </Typography>
                </Box>
              ) : (
                <List>
                  {migrations.map((migration) => (
                    <ListItem
                      key={migration.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box sx={{ mr: 2, mt: 0.5 }}>
                        {getStatusIcon(migration.status)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ mr: 1 }}>
                              {migration.name}
                            </Typography>
                            <Chip
                              label={migration.status}
                              size="small"
                              color={getStatusColor(migration.status) as any}
                            />
                            <Chip
                              label={`v${migration.version}`}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {migration.description}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mt: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ mr: 2 }}
                              >
                                Created:{' '}
                                {new Date(migration.createdAt).toLocaleString()}
                              </Typography>
                              {migration.completedAt && (
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  sx={{ mr: 2 }}
                                >
                                  Completed:{' '}
                                  {new Date(
                                    migration.completedAt
                                  ).toLocaleString()}
                                </Typography>
                              )}
                              {migration.duration && (
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Duration: {migration.duration}s
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <Box>
                        {migration.status === 'failed' && (
                          <Button
                            variant="outlined"
                            startIcon={<RollbackIcon />}
                            onClick={() =>
                              handleRollbackMigration(migration.id)
                            }
                            size="small"
                          >
                            Rollback
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          onClick={() => setSelectedMigration(migration)}
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          Details
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Run Migration Dialog */}
      <Dialog
        open={showRunMigrationDialog}
        onClose={() => setShowRunMigrationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RunIcon sx={{ mr: 1 }} />
            Run New Migration
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Migration Name"
              value={newMigration.name}
              onChange={(e) =>
                setNewMigration({ ...newMigration, name: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newMigration.description}
              onChange={(e) =>
                setNewMigration({
                  ...newMigration,
                  description: e.target.value,
                })
              }
              margin="normal"
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label="Version"
              value={newMigration.version}
              onChange={(e) =>
                setNewMigration({ ...newMigration, version: e.target.value })
              }
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRunMigrationDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRunMigration}
            disabled={
              loading ||
              !newMigration.name ||
              !newMigration.description ||
              !newMigration.version
            }
            startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
          >
            Run Migration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Migration Details Dialog */}
      <Dialog
        open={!!selectedMigration}
        onClose={() => setSelectedMigration(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {selectedMigration && getStatusIcon(selectedMigration.status)}
            <Box sx={{ ml: 1 }}>
              {selectedMigration?.name}
              <Chip
                label={selectedMigration?.status}
                size="small"
                color={
                  getStatusColor(selectedMigration?.status || 'default') as any
                }
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMigration && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Migration Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>ID:</strong> {selectedMigration.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedMigration.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Description:</strong>{' '}
                    {selectedMigration.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Version:</strong> {selectedMigration.version}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Created By:</strong> {selectedMigration.createdBy}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Timeline
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Created:</strong>{' '}
                    {new Date(selectedMigration.createdAt).toLocaleString()}
                  </Typography>
                  {selectedMigration.completedAt && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Completed:</strong>{' '}
                      {new Date(selectedMigration.completedAt).toLocaleString()}
                    </Typography>
                  )}
                  {selectedMigration.duration && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {selectedMigration.duration}{' '}
                      seconds
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RunIcon />}
                      disabled={selectedMigration.status === 'running'}
                    >
                      Re-run Migration
                    </Button>
                    {selectedMigration.status === 'failed' && (
                      <Button
                        variant="outlined"
                        startIcon={<RollbackIcon />}
                        onClick={() =>
                          handleRollbackMigration(selectedMigration.id)
                        }
                      >
                        Rollback
                      </Button>
                    )}
                    <Button variant="outlined">View Logs</Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMigration(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MigrationDashboard;
