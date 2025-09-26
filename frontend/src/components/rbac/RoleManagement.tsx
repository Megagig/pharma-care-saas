import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Switch, Accordion } from '@/components/ui/button';

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
    isActive: true}
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
    severity: 'info'}
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
      isActive: true}
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
      isActive: role.isActive}
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
        : [...prev.permissions, permission]}
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
      <div
        className=""
      >
        <Spinner />
      </div>
    );
  }
  return (
    <div>
      {/* Header */}
      <div
        className=""
      >
        <div
          
          className=""
        >
          <SecurityIcon color="primary" />
          Role Management
        </div>
        <Button
          
          startIcon={<AddIcon />}
          onClick={handleCreateRole}
          disabled={!canAccess('canCreate')}
        >
          Create Role
        </Button>
      </div>
      {/* Filters */}
      <div className="">
        <div className="">
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            
            className=""
          />
          <div className="">
            <Label>Category</Label>
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
          </div>
        </div>
      </div>
      {/* Roles Grid */}
      <div container spacing={3}>
        {filteredRoles.map((role) => (
          <div item xs={12} md={6} lg={4} key={role._id}>
            <Card
              className="" : {},
              onClick={() => onRoleSelect?.(role)}
            >
              <CardContent className="">
                <div
                  className=""
                >
                  <div>
                    <div  gutterBottom>
                      {role.displayName}
                    </div>
                    <div className="">
                      <Chip
                        label={role.category}
                        size="small"
                        color={
                          role.category === 'system'
                            ? 'primary'
                            : role.category === 'workplace'
                            ? 'secondary'
                            : 'default'}
                        }
                        
                      />
                      {!role.isActive && (
                        <Chip
                          label="Inactive"
                          size="small"
                          color="error"
                          
                        />
                      )}
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    
                    disabled={role.isSystemRole && !canAccess('canManage')}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  {role.description}
                </div>
                <div
                  className=""
                >
                  <GroupIcon fontSize="small" color="action" />
                  <div >
                    {role.permissions.length} permissions
                  </div>
                </div>
                {role.hierarchyLevel > 0 && (
                  <div className="">
                    <AccountTreeIcon fontSize="small" color="action" />
                    <div >
                      Level {role.hierarchyLevel}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  
                  disabled={
                    !canAccess('canUpdate') ||
                    (role.isSystemRole && !canAccess('canManage'))}
                  }
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  
                  disabled={!canAccess('canCreate')}
                >
                  Clone
                </Button>
              </CardActions>
            </Card>
          </div>
        ))}
      </div>
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
          <div className="">
            {/* Basic Information */}
            <div>
              <div  gutterBottom>
                Basic Information
              </div>
              <div container spacing={2}>
                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Role Name"
                    value={roleForm.name}
                    onChange={(e) =>}
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    helperText="Internal role identifier (lowercase, no spaces)"
                  />
                </div>
                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Display Name"
                    value={roleForm.displayName}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ 
                        ...prev}
                        displayName: e.target.value,}
                      }))
                    }
                    helperText="User-friendly role name"
                  />
                </div>
                <div item xs={12}>
                  <Input
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ 
                        ...prev}
                        description: e.target.value,}
                      }))
                    }
                    helperText="Describe the role's purpose and responsibilities"
                  />
                </div>
                <div item xs={12} sm={6}>
                  <div fullWidth>
                    <Label>Category</Label>
                    <Select
                      value={roleForm.category}
                      onChange={(e) =>
                        setRoleForm((prev) => ({ 
                          ...prev}
                          category: e.target.value as any,}
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
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch}
                        checked={roleForm.isActive}
                        onChange={(e) =>
                          setRoleForm((prev) => ({ 
                            ...prev}
                            isActive: e.target.checked,}
                          }))
                        }
                      />
                    }
                    label="Active"
                  />
                </div>
              </div>
            </div>
            {/* Permissions */}
            <div>
              <div  gutterBottom>
                Permissions
              </div>
              {permissionCategories.map((category) => (
                <Accordion key={category.name}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div >
                      {category.displayName}
                      <Chip
                        label={
                          category.permissions.filter((p) =>
                            roleForm.permissions.includes(p.action)
                          ).length}
                        }
                        size="small"
                        className=""
                      />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {category.permissions.map((permission) => (
                        <div key={permission.action} disablePadding>
                          <div>
                            <Checkbox
                              checked={roleForm.permissions.includes(
                                permission.action}
                              )}
                              onChange={() =>
                                handlePermissionToggle(permission.action)}
                              }
                            />
                          </div>
                          <div
                            primary={permission.displayName}
                            secondary={permission.description}
                          />
                        </div>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRole}
            
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
          <Alert severity="warning" className="">
            This action cannot be undone. All users with this role will lose
            their permissions.
          </Alert>
          <div>
            Are you sure you want to delete the role "
            {roleToDelete?.displayName}"?
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRole} color="error" >
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
          <EditIcon className="" />
          Edit Role
        </MenuItem>
        <MenuItem onClick={() => selectedRole && handleCloneRole(selectedRole)}>
          <ContentCopyIcon className="" />
          Clone Role
        </MenuItem>
        <MenuItem
          
          disabled={selectedRole?.isSystemRole}
          className=""
        >
          <DeleteIcon className="" />
          Delete Role
        </MenuItem>
      </Menu>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};
export default RoleManagement;
