import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRBAC } from '../hooks/useRBAC';
import { rbacService } from '../services/rbacService';
import { useWebSocket } from '../services/websocketService';
import NotificationSystem from '../components/rbac/NotificationSystem';
import BulkOperationProgress from '../components/rbac/BulkOperationProgress';
import type { DynamicUser, Role, PermissionPreview } from '../types/rbac';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const PharmacyUserManagement: React.FC = () => {
  const { hasFeature, canAccess } = useRBAC();
  const { status: wsStatus, subscribe } = useWebSocket();

  // State management
  const [users, setUsers] = useState<DynamicUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<GridRowSelectionModel>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);

  // Real-time updates and progress tracking
  const [bulkOperationId, setBulkOperationId] = useState<string | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  // Dialog states
  const [roleAssignmentOpen, setRoleAssignmentOpen] = useState(false);
  const [selectedRolesForAssignment, setSelectedRolesForAssignment] = useState<
    string[]
  >([]);
  const [permissionPreview, setPermissionPreview] =
    useState<PermissionPreview | null>(null);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<DynamicUser | null>(null);

  // Notification states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Check if user has access to user management
  if (!hasFeature('user_management')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access User Management. Please contact
          your administrator.
        </Alert>
      </Box>
    );
  }

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeUserUpdates = subscribe('user_update', (message) => {
      // Reload user data when users are updated
      loadData();
    });

    const unsubscribeRoleUpdates = subscribe('role_change', (message) => {
      // Reload data when roles change
      loadData();
    });

    const unsubscribeBulkOperations = subscribe('bulk_operation', (message) => {
      const { operationId, status } = message.data;

      if (operationId === bulkOperationId) {
        if (status === 'completed' || status === 'failed') {
          // Reload data when bulk operation completes
          loadData();
        }
      }
    });

    return () => {
      unsubscribeUserUpdates();
      unsubscribeRoleUpdates();
      unsubscribeBulkOperations();
    };
  }, [subscribe, bulkOperationId, loadData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        rbacService.getUsers({ page: 1, limit: 100 }),
        rbacService.getRoles({ page: 1, limit: 100 }),
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.users);
      }

      if (rolesResponse.success) {
        setRoles(rolesResponse.data.roles);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Failed to load user data', 'error');
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

  // Handle role assignment
  const handleOpenRoleAssignment = () => {
    if (selectedUsers.length === 0) {
      showSnackbar('Please select users to assign roles', 'warning');
      return;
    }
    setRoleAssignmentOpen(true);
  };

  const handleRoleAssignmentChange = (
    event: SelectChangeEvent<typeof selectedRolesForAssignment>
  ) => {
    const value = event.target.value;
    setSelectedRolesForAssignment(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const handlePreviewPermissions = async () => {
    if (selectedUsers.length === 1 && selectedRolesForAssignment.length > 0) {
      try {
        const userId = selectedUsers[0] as string;
        const response = await rbacService.previewPermissionChanges(
          userId,
          selectedRolesForAssignment
        );

        if (response.success) {
          setPermissionPreview(response.data);
        }
      } catch (error) {
        console.error('Error previewing permissions:', error);
        showSnackbar('Failed to preview permissions', 'error');
      }
    }
  };

  const handleAssignRoles = async () => {
    if (selectedUsers.length === 0 || selectedRolesForAssignment.length === 0) {
      showSnackbar('Please select users and roles', 'warning');
      return;
    }

    try {
      setBulkOperationInProgress(true);

      // Generate operation ID for tracking
      const operationId = `role-assignment-${Date.now()}`;
      setBulkOperationId(operationId);

      // Show progress dialog
      setProgressDialogOpen(true);

      const result = await rbacService.bulkAssignRoles({
        userIds: selectedUsers as string[],
        roleIds: selectedRolesForAssignment,
      });

      if (result.success) {
        showSnackbar(
          `Successfully assigned roles to ${result.processed} users`,
          'success'
        );

        if (result.failed > 0) {
          showSnackbar(
            `${result.failed} assignments failed. Check the details.`,
            'warning'
          );
        }

        // Reload data and close dialog
        await loadData();
        setRoleAssignmentOpen(false);
        setSelectedRolesForAssignment([]);
        setSelectedUsers([]);
        setPermissionPreview(null);
      }
    } catch (error) {
      console.error('Error assigning roles:', error);
      showSnackbar('Failed to assign roles', 'error');
    } finally {
      setBulkOperationInProgress(false);
      // Keep progress dialog open until operation completes
    }
  };

  // Handle individual user actions
  const handleUserMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: DynamicUser
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEditUser = (user: DynamicUser) => {
    // TODO: Implement user editing
    console.log('Edit user:', user);
    handleUserMenuClose();
  };

  const handleViewUserRoles = async (user: DynamicUser) => {
    try {
      const response = await rbacService.getUserRoles(user._id);
      if (response.success) {
        // TODO: Show user roles in a dialog
        console.log('User roles:', response.data);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      showSnackbar('Failed to load user roles', 'error');
    }
    handleUserMenuClose();
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || user.status === statusFilter;

    const matchesRole =
      roleFilter.length === 0 ||
      user.assignedRoles.some((roleId) => roleFilter.includes(roleId));

    return matchesSearch && matchesStatus && matchesRole;
  });

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'active':
              return 'success';
            case 'pending':
              return 'warning';
            case 'suspended':
              return 'error';
            case 'license_pending':
              return 'info';
            case 'license_rejected':
              return 'error';
            default:
              return 'default';
          }
        };

        return (
          <Chip
            label={params.value}
            color={getStatusColor(params.value)}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'systemRole',
      headerName: 'System Role',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="filled"
          color="primary"
        />
      ),
    },
    {
      field: 'assignedRoles',
      headerName: 'Dynamic Roles',
      width: 200,
      renderCell: (params) => {
        const userRoles = roles.filter((role) =>
          params.value.includes(role._id)
        );

        if (userRoles.length === 0) {
          return (
            <Typography variant="body2" color="textSecondary">
              No roles
            </Typography>
          );
        }

        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {userRoles.slice(0, 2).map((role) => (
              <Chip
                key={role._id}
                label={role.displayName}
                size="small"
                variant="outlined"
                color="secondary"
              />
            ))}
            {userRoles.length > 2 && (
              <Chip
                label={`+${userRoles.length - 2}`}
                size="small"
                variant="outlined"
                color="default"
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditUser(params.row)}
          disabled={!canAccess('canUpdate')}
        />,
        <GridActionsCellItem
          icon={<SecurityIcon />}
          label="View Roles"
          onClick={() => handleViewUserRoles(params.row)}
        />,
        <GridActionsCellItem
          icon={<MoreVertIcon />}
          label="More"
          onClick={(event) => handleUserMenuOpen(event, params.row)}
        />,
      ],
    },
  ];

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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <GroupIcon color="primary" />
          User Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage user roles, permissions, and access controls with dynamic RBAC
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <TextField
            placeholder="Search users..."
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

          {/* Status Filter */}
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="license_pending">License Pending</MenuItem>
            </Select>
          </FormControl>

          {/* Role Filter */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  typeof e.target.value === 'string'
                    ? e.target.value.split(',')
                    : e.target.value
                )
              }
              input={<OutlinedInput label="Roles" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = roles.find((r) => r._id === value);
                    return (
                      <Chip
                        key={value}
                        label={role?.displayName || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {roles.map((role) => (
                <MenuItem key={role._id} value={role._id}>
                  <Checkbox checked={roleFilter.indexOf(role._id) > -1} />
                  <ListItemText primary={role.displayName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Tooltip title="Assign Roles to Selected Users">
            <span>
              <Button
                variant="contained"
                startIcon={<SecurityIcon />}
                onClick={handleOpenRoleAssignment}
                disabled={selectedUsers.length === 0 || !canAccess('canManage')}
              >
                Assign Roles
                {selectedUsers.length > 0 && (
                  <Badge
                    badgeContent={selectedUsers.length}
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
            </span>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row._id}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedUsers}
          onRowSelectionModelChange={setSelectedUsers}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Role Assignment Dialog */}
      <Dialog
        open={roleAssignmentOpen}
        onClose={() => setRoleAssignmentOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assign Roles to {selectedUsers.length} User
          {selectedUsers.length !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Roles</InputLabel>
              <Select
                multiple
                value={selectedRolesForAssignment}
                onChange={handleRoleAssignmentChange}
                input={<OutlinedInput label="Select Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const role = roles.find((r) => r._id === value);
                      return (
                        <Chip key={value} label={role?.displayName || value} />
                      );
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {roles.map((role) => (
                  <MenuItem key={role._id} value={role._id}>
                    <Checkbox
                      checked={
                        selectedRolesForAssignment.indexOf(role._id) > -1
                      }
                    />
                    <ListItemText
                      primary={role.displayName}
                      secondary={role.description}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedUsers.length === 1 &&
              selectedRolesForAssignment.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviewPermissions}
                    startIcon={<SecurityIcon />}
                  >
                    Preview Permissions
                  </Button>
                </Box>
              )}

            {/* Permission Preview */}
            {permissionPreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Permission Changes Preview
                </Typography>

                {permissionPreview.addedPermissions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      gutterBottom
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Added Permissions (
                      {permissionPreview.addedPermissions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {permissionPreview.addedPermissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {permissionPreview.removedPermissions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="error.main"
                      gutterBottom
                    >
                      <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Removed Permissions (
                      {permissionPreview.removedPermissions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {permissionPreview.removedPermissions.map(
                        (permission) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )
                      )}
                    </Box>
                  </Box>
                )}

                {permissionPreview.conflicts.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Conflicts Detected
                    </Typography>
                    <ul>
                      {permissionPreview.conflicts.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleAssignmentOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignRoles}
            variant="contained"
            disabled={
              selectedRolesForAssignment.length === 0 || bulkOperationInProgress
            }
            startIcon={
              bulkOperationInProgress ? (
                <CircularProgress size={16} />
              ) : (
                <SecurityIcon />
              )
            }
          >
            {bulkOperationInProgress ? 'Assigning...' : 'Assign Roles'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleEditUser(selectedUser!)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleViewUserRoles(selectedUser!)}>
          <SecurityIcon sx={{ mr: 1 }} />
          Manage Roles
        </MenuItem>
        <MenuItem
          onClick={handleUserMenuClose}
          disabled={!canAccess('canDelete')}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Suspend User
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

      {/* Real-time Notification System */}
      <NotificationSystem />

      {/* Bulk Operation Progress Dialog */}
      <BulkOperationProgress
        open={progressDialogOpen}
        onClose={() => {
          setProgressDialogOpen(false);
          setBulkOperationId(null);
        }}
        operationId={bulkOperationId || undefined}
        initialData={{
          type: 'role_assignment',
          status: 'in_progress',
          progress: {
            total: selectedUsers.length,
            processed: 0,
            successful: 0,
            failed: 0,
          },
          metadata: {
            roleNames: roles
              .filter((role) => selectedRolesForAssignment.includes(role._id))
              .map((role) => role.displayName),
            userCount: selectedUsers.length,
          },
        }}
      />
    </Box>
  );
};

export default PharmacyUserManagement;
