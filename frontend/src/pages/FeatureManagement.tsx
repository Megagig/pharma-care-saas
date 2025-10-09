import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  Checkbox,
  FormLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import featureFlagService, { FeatureFlag } from '../services/featureFlagService';

// Constants
const AVAILABLE_TIERS = ['free_trial', 'basic', 'pro', 'Pharmily', 'Network', 'enterprise'];
const AVAILABLE_ROLES = ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'owner', 'super_admin'];

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
      id={`feature-tabpanel-${index}`}
      aria-labelledby={`feature-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const FeatureManagement: React.FC = () => {
  // State management
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    allowedTiers: [] as string[],
    allowedRoles: [] as string[],
    isActive: true,
  });

  // Fetch features on mount
  useEffect(() => {
    fetchFeatures();
  }, []);

  // Fetch features function
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = await featureFlagService.getFeatureFlags();
      setFeatures(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle tier checkbox change
  const handleTierChange = (tier: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allowedTiers: checked
        ? [...prev.allowedTiers, tier]
        : prev.allowedTiers.filter((t) => t !== tier),
    }));
  };

  // Handle role checkbox change
  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allowedRoles: checked
        ? [...prev.allowedRoles, role]
        : prev.allowedRoles.filter((r) => r !== role),
    }));
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      if (editingFeature) {
        await featureFlagService.updateFeatureFlag(editingFeature._id, formData);
        toast.success('Feature updated successfully');
      } else {
        await featureFlagService.createFeatureFlag(formData);
        toast.success('Feature created successfully');
      }
      await fetchFeatures();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Handle edit
  const startEdit = (feature: FeatureFlag) => {
    setEditingFeature(feature);
    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      allowedTiers: feature.allowedTiers || [],
      allowedRoles: feature.allowedRoles || [],
      isActive: feature.isActive,
    });
    setShowCreateForm(true);
  };

  // Handle delete
  const handleDelete = async (feature: FeatureFlag) => {
    if (!window.confirm(`Are you sure you want to delete "${feature.name}"?`)) {
      return;
    }

    try {
      await featureFlagService.deleteFeatureFlag(feature._id);
      toast.success('Feature deleted successfully');
      await fetchFeatures();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete feature');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      allowedTiers: [],
      allowedRoles: [],
      isActive: true,
    });
    setEditingFeature(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Feature Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Add Feature
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="feature management tabs">
          <Tab label="Features" id="feature-tab-0" aria-controls="feature-tabpanel-0" />
          <Tab label="Tier Management" id="feature-tab-1" aria-controls="feature-tabpanel-1" />
        </Tabs>
      </Box>

      {/* Features Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Create/Edit Form Dialog */}
        <Dialog
          open={showCreateForm}
          onClose={resetForm}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingFeature ? 'Edit Feature' : 'Create Feature'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Feature Key"
                    value={formData.key}
                    onChange={(e) => handleInputChange('key', e.target.value)}
                    disabled={!!editingFeature}
                    helperText="Unique identifier (lowercase, underscores allowed)"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Allowed Tiers */}
                <Grid size={12}>
                  <FormLabel component="legend">Allowed Tiers</FormLabel>
                  <FormGroup row>
                    {AVAILABLE_TIERS.map((tier) => (
                      <FormControlLabel
                        key={tier}
                        control={
                          <Checkbox
                            checked={formData.allowedTiers.includes(tier)}
                            onChange={(e) => handleTierChange(tier, e.target.checked)}
                          />
                        }
                        label={tier}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                {/* Allowed Roles */}
                <Grid size={12}>
                  <FormLabel component="legend">Allowed Roles</FormLabel>
                  <FormGroup row>
                    {AVAILABLE_ROLES.map((role) => (
                      <FormControlLabel
                        key={role}
                        control={
                          <Checkbox
                            checked={formData.allowedRoles.includes(role)}
                            onChange={(e) => handleRoleChange(role, e.target.checked)}
                          />
                        }
                        label={role}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                {/* Active Toggle */}
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              {editingFeature ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feature List */}
        {features.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No features found. Click "Add Feature" to create one.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={feature._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h2">
                        {feature.name}
                      </Typography>
                      <Chip
                        label={feature.isActive ? 'Active' : 'Inactive'}
                        color={feature.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'monospace' }}>
                      Key: {feature.key}
                    </Typography>

                    {feature.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {feature.description}
                      </Typography>
                    )}

                    {/* Tiers */}
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Tiers:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {feature.allowedTiers && feature.allowedTiers.length > 0 ? (
                          feature.allowedTiers.map((tier) => (
                            <Chip key={tier} label={tier} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Roles */}
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Roles:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {feature.allowedRoles && feature.allowedRoles.length > 0 ? (
                          feature.allowedRoles.map((role) => (
                            <Chip key={role} label={role} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => startEdit(feature)}
                        aria-label="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(feature)}
                        aria-label="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Tier Management Tab */}
      <TabPanel value={activeTab} index={1}>
        <Alert severity="info">
          Tier Management Matrix will be implemented in the next task.
        </Alert>
      </TabPanel>
    </Container>
  );
};

export default FeatureManagement;
