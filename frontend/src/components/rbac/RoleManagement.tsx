import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as AccountTreeIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useRBAC } from '../../hooks/useRBAC';
import { rbacService } from '../../services/rbacService';
import type {
  Role,
  Permission,
  RoleFormData,
  PermissionCategory,
} from '../../types/rbac';

interface RoleManagementProps {
  onRoleSelect?: (role: Role) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ onRoleSelect }) => {
  const { canAccess } = useRBAC();

  // State management
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<
    PermissionCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form state
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    name: '',
    displayName: '',
    description: '',
    category: 'custom',
    permissions: [],
    isActive: true,
  });

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Notification state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        rbacService.getRoles({ page: 1, limit: 100 }),
        rbacService.getPermissions({ page: 1, limit: 500 }),
      ]);

      if (rolesResponse.success) {
        setRoles(rolesResponse.data.roles);
      }

      if (permissionsResponse.success) {
        setPermissions(permissionsResponse.data.permissions);
        setPermissionCategories(permissionsResponse.data.categories);
      }
    } catch (error) {
      console.error('Error loading role data:', error);
      showSnackbar('Failed to load role data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Role CRUD operations
  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      displayName: '',
      description: '',
      category: 'custom',
      permissions: [],
      isActive: true,
    });
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      category: role.category,
      parentRoleId: role.parentRole,
      permissions: role.permissions,
      isActive: role.isActive,
    });
    setRoleDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        // Update existing role
        const response = await rbacService.updateRole(
          editingRole._id,
          roleForm
        );
        if (response.success) {
          showSnackbar('Role updated successfully', 'success');
          await loadData();
        }
      } else {
        // Create new role
        const response = await rbacService.createRole(roleForm);
        if (response.success) {
          showSnackbar('Role created successfully', 'success');
          await loadData();
        }
      }
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('Error saving role:', error);
      showSnackbar('Failed to save role', 'error');
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const response = await rbacService.deleteRole(roleToDelete._id);
      if (response.success) {
        showSnackbar('Role deleted successfully', 'success');
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showSnackbar('Failed to delete role', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleCloneRole = async (role: Role) => {
    try {
      const response = await rbacService.cloneRole(
        role._id,
        `${role.name}_copy`
      );
      if (response.success) {
        showSnackbar('Role cloned successfully', 'success');
        await loadData();
      }
    } catch (error) {
      console.error('Error cloning role:', error);
      showSnackbar('Failed to clone role', 'error');
    }
    handleMenuClose();
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  // Permission handling
  const handlePermissionToggle = (permission: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      !searchTerm ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || role.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
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

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h5"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SecurityIcon color="primary" />
          Role Management
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRole}
          disabled={!canAccess('canCreate')}
        >
          Create Role
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="workplace">Workplace</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Roles Grid */}
      <Grid container spacing={3}>
        {filteredRoles.map((role) => (
          <Grid item xs={12} md={6} lg={4} key={role._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: onRoleSelect ? 'pointer' : 'default',
                '&:hover': onRoleSelect ? { boxShadow: 4 } : {},
              }}
              onClick={() => onRoleSelect?.(role)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {role.displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        label={role.category}
                        size="small"
                        color={
                          role.category === 'system'
                            ? 'primary'
                            : role.category === 'workplace'
                            ? 'secondary'
                            : 'default'
                        }
                        variant="outlined"
                      />
                      {!role.isActive && (
                        <Chip
                          label="Inactive"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, role);
                    }}
                    disabled={role.isSystemRole && !canAccess('canManage')}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 2 }}
                >
                  {role.description}
                </Typography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <GroupIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    {role.permissions.length} permissions
                  </Typography>
                </Box>

                {role.hierarchyLevel > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTreeIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      Level {role.hierarchyLevel}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRole(role);
                  }}
                  disabled={
                    !canAccess('canUpdate') ||
                    (role.isSystemRole && !canAccess('canManage'))
                  }
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloneRole(role);
                  }}
                  disabled={!canAccess('canCreate')}
                >
                  Clone
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Role Creation/Edit Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role Name"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    helperText="Internal role identifier (lowercase, no spaces)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={roleForm.displayName}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    helperText="User-friendly role name"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    helperText="Describe the role's purpose and responsibilities"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={roleForm.category}
                      onChange={(e) =>
                        setRoleForm((prev) => ({
                          ...prev,
                          category: e.target.value as any,
                        }))
                      }
                      label="Category"
                    >
                      <MenuItem value="custom">Custom</MenuItem>
                      <MenuItem value="workplace">Workplace</MenuItem>
                      {canAccess('canManage') && (
                        <MenuItem value="system">System</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={roleForm.isActive}
                        onChange={(e) =>
                          setRoleForm((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Permissions */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              {permissionCategories.map((category) => (
                <Accordion key={category.name}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      {category.displayName}
                      <Chip
                        label={
                          category.permissions.filter((p) =>
                            roleForm.permissions.includes(p.action)
                          ).length
                        }
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {category.permissions.map((permission) => (
                        <ListItem key={permission.action} disablePadding>
                          <ListItemIcon>
                            <Checkbox
                              checked={roleForm.permissions.includes(
                                permission.action
                              )}
                              onChange={() =>
                                handlePermissionToggle(permission.action)
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={permission.displayName}
                            secondary={permission.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={!roleForm.name || !roleForm.displayName}
          >
            {editingRole ? 'Update' : 'Create'} Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All users with this role will lose
            their permissions.
          </Alert>
          <Typography>
            Are you sure you want to delete the role "
            {roleToDelete?.displayName}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRole} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedRole && handleEditRole(selectedRole)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={() => selectedRole && handleCloneRole(selectedRole)}>
          <ContentCopyIcon sx={{ mr: 1 }} />
          Clone Role
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRoleToDelete(selectedRole);
            setDeleteConfirmOpen(true);
            handleMenuClose();
          }}
          disabled={selectedRole?.isSystemRole}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Role
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
