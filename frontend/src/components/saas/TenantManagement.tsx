import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/material-icons';
import { useSaasSettings } from '../../queries/useSaasSettings';

interface TenantBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

interface TenantLimits {
  maxUsers: number;
  maxPatients: number;
  storageLimit: number;
  apiCallsPerMonth: number;
  maxWorkspaces: number;
  maxIntegrations: number;
}

interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface TenantCustomization {
  branding: TenantBranding;
  limits: TenantLimits;
  features: string[];
  settings: TenantSettings;
  usageMetrics: {
    currentUsers: number;
    currentPatients: number;
    storageUsed: number;
    apiCallsThisMonth: number;
    lastCalculatedAt: string;
  };
}

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  type: 'pharmacy' | 'clinic' | 'hospital' | 'chain';
  status: 'active' | 'suspended' | 'pending' | 'trial' | 'cancelled';
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'trialing';
  contactInfo: {
    email: string;
    phone?: string;
  };
  createdAt: string;
  lastActivity: string;
}

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
      id={`tenant-tabpanel-${index}`}
      aria-labelledby={`tenant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TenantManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [customization, setCustomization] = useState<TenantCustomization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customizationDialog, setCustomizationDialog] = useState(false);
  const [editingBranding, setEditingBranding] = useState(false);
  const [editingLimits, setEditingLimits] = useState(false);
  const [editingFeatures, setEditingFeatures] = useState(false);

  const { saasService } = useSaasSettings();

  // Available features for selection
  const availableFeatures = [
    'patient-management',
    'prescription-processing',
    'inventory-management',
    'clinical-notes',
    'ai-diagnostics',
    'reports-analytics',
    'billing-integration',
    'multi-location',
    'api-access',
    'advanced-security',
  ];

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await saasService.getTenants();
      setTenants(response.tenants || []);
    } catch (err) {
      setError('Failed to load tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantCustomization = async (tenantId: string) => {
    try {
      setLoading(true);
      const response = await saasService.getTenantCustomization(tenantId);
      setCustomization(response.customization);
    } catch (err) {
      setError('Failed to load tenant customization');
      console.error('Error loading tenant customization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    await loadTenantCustomization(tenant._id);
    setCustomizationDialog(true);
  };

  const handleUpdateBranding = async (branding: Partial<TenantBranding>) => {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      await saasService.updateTenantBranding(selectedTenant._id, branding);
      setSuccess('Branding updated successfully');
      await loadTenantCustomization(selectedTenant._id);
      setEditingBranding(false);
    } catch (err) {
      setError('Failed to update branding');
      console.error('Error updating branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimits = async (limits: Partial<TenantLimits>) => {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      await saasService.updateTenantLimits(selectedTenant._id, limits);
      setSuccess('Limits updated successfully');
      await loadTenantCustomization(selectedTenant._id);
      setEditingLimits(false);
    } catch (err) {
      setError('Failed to update limits');
      console.error('Error updating limits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeatures = async (features: string[]) => {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      await saasService.updateTenantFeatures(selectedTenant._id, features);
      setSuccess('Features updated successfully');
      await loadTenantCustomization(selectedTenant._id);
      setEditingFeatures(false);
    } catch (err) {
      setError('Failed to update features');
      console.error('Error updating features:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      case 'trial':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatUsage = (current: number, limit: number, unit: string) => {
    const percentage = (current / limit) * 100;
    const color = percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'success';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          {current.toLocaleString()} / {limit.toLocaleString()} {unit}
        </Typography>
        <Chip
          label={`${percentage.toFixed(1)}%`}
          size="small"
          color={color}
          variant="outlined"
        />
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tenant Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadTenants}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Tenant List" />
              <Tab label="Customization" disabled={!selectedTenant} />
              <Tab label="Analytics" disabled={!selectedTenant} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {loading && !tenants.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Subscription</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">{tenant.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {tenant.slug}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={tenant.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tenant.status}
                            size="small"
                            color={getStatusColor(tenant.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tenant.subscriptionStatus}
                            size="small"
                            color={getStatusColor(tenant.subscriptionStatus) as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{tenant.contactInfo.email}</Typography>
                          {tenant.contactInfo.phone && (
                            <Typography variant="caption" color="textSecondary">
                              {tenant.contactInfo.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(tenant.lastActivity).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Customize Tenant">
                            <IconButton
                              size="small"
                              onClick={() => handleTenantSelect(tenant)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {selectedTenant && customization && (
              <Grid container spacing={3}>
                {/* Branding Section */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PaletteIcon />
                          Branding & Theming
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setEditingBranding(true)}
                        >
                          Edit
                        </Button>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: customization.branding.primaryColor,
                                borderRadius: 1,
                                border: '1px solid #ccc',
                              }}
                            />
                            <Box>
                              <Typography variant="subtitle2">Primary Color</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {customization.branding.primaryColor}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: customization.branding.secondaryColor,
                                borderRadius: 1,
                                border: '1px solid #ccc',
                              }}
                            />
                            <Box>
                              <Typography variant="subtitle2">Secondary Color</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {customization.branding.secondaryColor}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography variant="subtitle2">Font Family</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {customization.branding.fontFamily || 'Default'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Limits Section */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SecurityIcon />
                          Limits & Quotas
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setEditingLimits(true)}
                        >
                          Edit
                        </Button>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Users</Typography>
                          {formatUsage(
                            customization.usageMetrics.currentUsers,
                            customization.limits.maxUsers,
                            'users'
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Patients</Typography>
                          {formatUsage(
                            customization.usageMetrics.currentPatients,
                            customization.limits.maxPatients,
                            'patients'
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Storage</Typography>
                          {formatUsage(
                            customization.usageMetrics.storageUsed,
                            customization.limits.storageLimit,
                            'MB'
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>API Calls (This Month)</Typography>
                          {formatUsage(
                            customization.usageMetrics.apiCallsThisMonth,
                            customization.limits.apiCallsPerMonth,
                            'calls'
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Features Section */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SettingsIcon />
                          Enabled Features
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setEditingFeatures(true)}
                        >
                          Edit
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {customization.features.map((feature) => (
                          <Chip
                            key={feature}
                            label={feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {customization.features.length === 0 && (
                          <Typography variant="body2" color="textSecondary">
                            No features enabled
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {selectedTenant && customization && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Usage Analytics for {selectedTenant.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {customization.usageMetrics.currentUsers}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Active Users
                      </Typography>
                      <Typography variant="caption">
                        of {customization.limits.maxUsers} limit
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {customization.usageMetrics.currentPatients}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Patients
                      </Typography>
                      <Typography variant="caption">
                        of {customization.limits.maxPatients} limit
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info">
                        {(customization.usageMetrics.storageUsed / 1024).toFixed(1)}GB
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Storage Used
                      </Typography>
                      <Typography variant="caption">
                        of {(customization.limits.storageLimit / 1024).toFixed(1)}GB limit
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning">
                        {customization.usageMetrics.apiCallsThisMonth.toLocaleString()}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        API Calls
                      </Typography>
                      <Typography variant="caption">
                        this month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TenantManagement;