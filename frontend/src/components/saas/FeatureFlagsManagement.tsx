import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  Skeleton,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { useSaasFeatureFlags, useUpdateFeatureFlagTargeting } from '../../queries/useSaasSettings';

interface TargetingRule {
  pharmacies?: string[];
  userGroups?: string[];
  subscriptionPlans?: string[];
  percentage?: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  category: string;
  targetingRules: TargetingRule;
  usageMetrics: {
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
  };
}

interface TargetingDialogProps {
  open: boolean;
  flag: FeatureFlag | null;
  onClose: () => void;
  onSave: (flagId: string, targeting: TargetingRule) => void;
}

const TargetingDialog: React.FC<TargetingDialogProps> = ({
  open,
  flag,
  onClose,
  onSave,
}) => {
  const [targeting, setTargeting] = useState<TargetingRule>(
    flag?.targetingRules || {}
  );

  const pharmacies = [
    { id: 'pharmacy1', name: 'Central Pharmacy' },
    { id: 'pharmacy2', name: 'City Pharmacy' },
    { id: 'pharmacy3', name: 'Metro Pharmacy' },
  ];

  const userGroups = [
    { id: 'pharmacists', name: 'Pharmacists' },
    { id: 'technicians', name: 'Technicians' },
    { id: 'managers', name: 'Managers' },
  ];

  const subscriptionPlans = [
    { id: 'basic', name: 'Basic Plan' },
    { id: 'professional', name: 'Professional Plan' },
    { id: 'enterprise', name: 'Enterprise Plan' },
  ];

  const handleSave = () => {
    if (flag) {
      onSave(flag.id, targeting);
      onClose();
    }
  };

  const handleArrayChange = (field: keyof TargetingRule, value: string[]) => {
    setTargeting(prev => ({ ...prev, [field]: value }));
  };

  const handlePercentageChange = (value: number) => {
    setTargeting(prev => ({ ...prev, percentage: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Targeting Rules - {flag?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Pharmacy Targeting */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Pharmacies</InputLabel>
                <Select
                  multiple
                  value={targeting.pharmacies || []}
                  onChange={(e) => handleArrayChange('pharmacies', e.target.value as string[])}
                  label="Target Pharmacies"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={pharmacies.find(p => p.id === value)?.name || value}
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {pharmacies.map((pharmacy) => (
                    <MenuItem key={pharmacy.id} value={pharmacy.id}>
                      <Checkbox checked={(targeting.pharmacies || []).includes(pharmacy.id)} />
                      <ListItemText primary={pharmacy.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* User Group Targeting */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target User Groups</InputLabel>
                <Select
                  multiple
                  value={targeting.userGroups || []}
                  onChange={(e) => handleArrayChange('userGroups', e.target.value as string[])}
                  label="Target User Groups"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={userGroups.find(g => g.id === value)?.name || value}
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {userGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Checkbox checked={(targeting.userGroups || []).includes(group.id)} />
                      <ListItemText primary={group.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Subscription Plan Targeting */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Subscription Plans</InputLabel>
                <Select
                  multiple
                  value={targeting.subscriptionPlans || []}
                  onChange={(e) => handleArrayChange('subscriptionPlans', e.target.value as string[])}
                  label="Target Subscription Plans"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={subscriptionPlans.find(p => p.id === value)?.name || value}
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {subscriptionPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      <Checkbox checked={(targeting.subscriptionPlans || []).includes(plan.id)} />
                      <ListItemText primary={plan.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Percentage Rollout */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Percentage Rollout: {targeting.percentage || 0}%
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={targeting.percentage || 0}
                  onChange={(e) => handlePercentageChange(Number(e.target.value))}
                  inputProps={{ min: 0, max: 100 }}
                  helperText="Percentage of users to receive this feature"
                />
                <LinearProgress
                  variant="determinate"
                  value={targeting.percentage || 0}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Targeting Rules
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FeatureFlagsManagement: React.FC = () => {
  const [targetingDialogOpen, setTargetingDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

  const { data: flags, isLoading, error } = useSaasFeatureFlags();
  const updateTargetingMutation = useUpdateFeatureFlagTargeting();

  const handleToggleFlag = (flagId: string, enabled: boolean) => {
    // This would typically call a toggle mutation
    console.log('Toggle flag:', flagId, enabled);
  };

  const handleConfigureTargeting = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setTargetingDialogOpen(true);
  };

  const handleSaveTargeting = (flagId: string, targeting: TargetingRule) => {
    updateTargetingMutation.mutate({ flagId, targeting });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'primary';
      case 'experimental':
        return 'warning';
      case 'premium':
        return 'success';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="h6" gutterBottom>
          Error Loading Feature Flags
        </Typography>
        <Typography variant="body2">
          There was an error loading the feature flags data. Please try refreshing the page.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title="Feature Flags Management"
          subheader="Control feature availability with targeting rules across pharmacy tenants"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {/* Handle add flag */}}
            >
              Create Flag
            </Button>
          }
        />
        <CardContent>
          {/* Feature Flags Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Feature Flag</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Targeting</TableCell>
                  <TableCell>Usage Metrics</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Skeleton width={150} />
                          <Skeleton width={200} />
                        </Box>
                      </TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={60} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  flags?.map((flag: FeatureFlag) => (
                    <TableRow key={flag.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {flag.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {flag.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={flag.category}
                          color={getCategoryColor(flag.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={flag.isEnabled}
                              onChange={(e) => handleToggleFlag(flag.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label={flag.isEnabled ? 'Enabled' : 'Disabled'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {flag.targetingRules.pharmacies && (
                            <Chip
                              icon={<BusinessIcon />}
                              label={`${flag.targetingRules.pharmacies.length} pharmacies`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {flag.targetingRules.userGroups && (
                            <Chip
                              icon={<GroupIcon />}
                              label={`${flag.targetingRules.userGroups.length} groups`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {flag.targetingRules.percentage && (
                            <Chip
                              icon={<PercentIcon />}
                              label={`${flag.targetingRules.percentage}%`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {flag.usageMetrics?.activeUsers || 0} active users
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((flag.usageMetrics?.conversionRate || 0) * 100).toFixed(1)}% conversion
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleConfigureTargeting(flag)}
                            title="Configure Targeting"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            title="View Usage Metrics"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No feature flags found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Usage Metrics Overview */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Flags</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {flags?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active feature flags
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Affected Users</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {flags?.reduce((total, flag) => total + (flag.usageMetrics?.activeUsers || 0), 0) || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Users with active flags
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PercentIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Avg. Conversion</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {flags?.length ? 
                ((flags.reduce((total, flag) => total + (flag.usageMetrics?.conversionRate || 0), 0) / flags.length) * 100).toFixed(1) + '%'
                : '0%'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average conversion rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Targeting Configuration Dialog */}
      <TargetingDialog
        open={targetingDialogOpen}
        flag={selectedFlag}
        onClose={() => {
          setTargetingDialogOpen(false);
          setSelectedFlag(null);
        }}
        onSave={handleSaveTargeting}
      />
    </Box>
  );
};

export default FeatureFlagsManagement;