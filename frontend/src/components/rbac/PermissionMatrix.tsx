import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert, Switch } from '@/components/ui/button';

interface PermissionMatrixProps {
  selectedRole?: Role | null;
  onRoleSelect?: (role: Role) => void;
}
interface MatrixData {
  roles: Role[];
  permissions: Permission[];
  matrix: Record<string, Record<string, boolean>>;
}
interface PermissionUsage {
  permission: string;
  roleCount: number;
  userCount: number;
  displayName: string;
  category: string;
}
const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ 
  selectedRole,
  onRoleSelect
}) => {
  const { canAccess } = useRBAC();
  // State management
  const [matrixData, setMatrixData] = useState<MatrixData>({ 
    roles: [],
    permissions: []}
    matrix: {}
  const [permissionCategories, setPermissionCategories] = useState<
    PermissionCategory[]
  >([]);
  const [permissionUsage, setPermissionUsage] = useState<PermissionUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  // Dialog states
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<
    Array<{
      type: string;
      message: string;
      severity: 'warning' | 'error';
    }>
  >([]);
  // Analytics dialog
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
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
      const [matrixResponse, categoriesResponse, usageResponse] =
        await Promise.all([
          rbacService.getPermissionMatrix(),
          rbacService.getPermissionCategories(),
          rbacService.getPermissionUsageAnalytics(),
        ]);
      if (matrixResponse.success) {
        setMatrixData(matrixResponse.data);
      }
      if (categoriesResponse.success) {
        setPermissionCategories(categoriesResponse.data);
        // Expand all categories by default
        setExpandedCategories(
          new Set(categoriesResponse.data.map((cat) => cat.name))
        );
      }
      if (usageResponse.success) {
        setPermissionUsage(usageResponse.data.permissionUsage);
      }
    } catch (error) {
      console.error('Error loading permission matrix:', error);
      showSnackbar('Failed to load permission matrix', 'error');
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
  // Permission matrix operations
  const handlePermissionToggle = async (roleId: string, permission: string) => {
    if (!canAccess('canUpdate')) {
      showSnackbar('You do not have permission to modify roles', 'error');
      return;
    }
    try {
      setSaving(true);
      const currentValue = matrixData.matrix[roleId]?.[permission] || false;
      const newValue = !currentValue;
      // Update local state immediately for better UX
      setMatrixData((prev) => ({ 
        ...prev,
        matrix: {
          ...prev.matrix,
          [roleId]: {
            ...prev.matrix[roleId],
            [permission]: newValue}
          },
        }
      // Update on server
      const response = await rbacService.updatePermissionMatrix(roleId, {
        [permission]: newValue}
      if (response.success) {
        showSnackbar(
          `Permission ${newValue ? 'granted' : 'revoked'} successfully`,
          'success'
        );
      } else {
        // Revert local state if server update failed
        setMatrixData((prev) => ({ 
          ...prev,
          matrix: {
            ...prev.matrix,
            [roleId]: {
              ...prev.matrix[roleId],
              [permission]: currentValue}
            },
          }
        showSnackbar('Failed to update permission', 'error');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      showSnackbar('Failed to update permission', 'error');
      // Reload data to ensure consistency
      await loadData();
    } finally {
      setSaving(false);
    }
  };
  const handleBulkPermissionUpdate = async (
    roleId: string,
    permissions: Record<string, boolean>
  ) => {
    if (!canAccess('canUpdate')) {
      showSnackbar('You do not have permission to modify roles', 'error');
      return;
    }
    try {
      setSaving(true);
      const response = await rbacService.updatePermissionMatrix(
        roleId,
        permissions
      );
      if (response.success) {
        showSnackbar('Permissions updated successfully', 'success');
        await loadData(); // Reload to get fresh data
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      showSnackbar('Failed to update permissions', 'error');
    } finally {
      setSaving(false);
    }
  };
  // Category expansion handling
  const handleCategoryToggle = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };
  // Filter permissions and roles
  const filteredCategories = permissionCategories.filter((category) => {
    if (categoryFilter && category.name !== categoryFilter) return false;
    const hasMatchingPermissions = category.permissions.some((permission) => {
      const matchesSearch =
        !searchTerm ||
        permission.displayName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase());
      if (showOnlyAssigned) {
        const hasAssignments = matrixData.roles.some(
          (role) => matrixData.matrix[role._id]?.[permission.action]
        );
        return matchesSearch && hasAssignments;
      }
      return matchesSearch;
    });
    return hasMatchingPermissions;
  });
  const filteredRoles = matrixData.roles.filter((role) => {
    if (roleFilter && role._id !== roleFilter) return false;
    return true;
  });
  // Get permission conflicts
  const getPermissionConflicts = (
    permission: string
  ): Array<{ type: string; message: string }> => {
    const conflicts: Array<{ type: string; message: string }> = [];
    // Find permission object
    const permissionObj = matrixData.permissions.find(
      (p) => p.action === permission
    );
    if (!permissionObj) return conflicts;
    // Check for dependency conflicts
    permissionObj.dependsOn.forEach((dependency) => {
      const rolesWithPermission = filteredRoles.filter(
        (role) => matrixData.matrix[role._id]?.[permission]
      );
      rolesWithPermission.forEach((role) => {
        if (!matrixData.matrix[role._id]?.[dependency]) {
          conflicts.push({ 
            type: 'dependency'}
            message: `Role "${role.displayName}" has "${permission}" but missing dependency "${dependency}"`}
        }
      });
    });
    // Check for direct conflicts
    permissionObj.conflicts.forEach((conflictPermission) => {
      const rolesWithBoth = filteredRoles.filter(
        (role) =>
          matrixData.matrix[role._id]?.[permission] &&
          matrixData.matrix[role._id]?.[conflictPermission]
      );
      rolesWithBoth.forEach((role) => {
        conflicts.push({ 
          type: 'conflict'}
          message: `Role "${role.displayName}" has conflicting permissions: "${permission}" and "${conflictPermission}"`}
      });
    });
    return conflicts;
  };
  // Get usage statistics for a permission
  const getPermissionUsageStats = (permission: string) => {
    return permissionUsage.find((usage) => usage.permission === permission);
  };
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
          Permission Matrix
        </div>
        <div className="">
          <Button
            
            startIcon={<AnalyticsIcon />}
            onClick={() => setAnalyticsDialogOpen(true)}
          >
            Analytics
          </Button>
          <Button
            
            startIcon={<DownloadIcon />}
            onClick={async () => {
              try {
                const blob = await rbacService.exportRoleAssignments('csv');
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'permission-matrix.csv';
                a.click();
                window.URL.revokeObjectURL(url);}
              } catch (error) {
                showSnackbar('Failed to export matrix', 'error');
              }>
            Export
          </Button>
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div className="">
        <div container spacing={2} alignItems="center">
          <div item xs={12} sm={6} md={3}>
            <Input
              fullWidth
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              
            />
          </div>
          <div item xs={12} sm={6} md={2}>
            <div fullWidth>
              <Label>Category</Label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                {permissionCategories.map((category) => (
                  <MenuItem key={category.name} value={category.name}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </div>
          </div>
          <div item xs={12} sm={6} md={2}>
            <div fullWidth>
              <Label>Role</Label>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All</MenuItem>
                {matrixData.roles.map((role) => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </div>
          </div>
          <div item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch}
                  checked={showOnlyAssigned}
                  onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                />
              }
              label="Show only assigned"
            />
          </div>
          <div item xs={12} md={2}>
            <div className="">
              <Button
                size="small"
                onClick={() =>
                  setExpandedCategories(
                    new Set(permissionCategories.map((cat) => cat.name))
                  )}
                }
              >
                Expand All
              </Button>
              <Button
                size="small"
                onClick={() => setExpandedCategories(new Set())}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Permission Matrix */}
      <div className="">
        <TableContainer className="">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="">
                  Permission
                </TableCell>
                {filteredRoles.map((role) => (
                  <TableCell
                    key={role._id}
                    align="center"
                    className=""
                        : {},
                    onClick={() => onRoleSelect?.(role)}
                  >
                    <div>
                      <div  noWrap>
                        {role.displayName}
                      </div>
                      <Chip
                        label={role.category}
                        size="small"
                        
                        color={
                          role.category === 'system' ? 'primary' : 'default'}
                        }
                      />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((category) => (
                <React.Fragment key={category.name}>
                  {/* Category Header */}
                  <TableRow>
                    <TableCell
                      colSpan={filteredRoles.length + 1}
                      className="" onClick={() => handleCategoryToggle(category.name)}
                    >
                      <div
                        className=""
                      >
                        {expandedCategories.has(category.name) ? (
                          <KeyboardArrowDownIcon />
                        ) : (
                          <KeyboardArrowRightIcon />
                        )}
                        <div  fontWeight="bold">
                          {category.displayName}
                        </div>
                        <Chip
                          label={`${category.permissions.length} permissions`}
                          size="small"
                          
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Category Permissions */}
                  <Collapse
                    in={expandedCategories.has(category.name)}
                    timeout="auto"
                    unmountOnExit
                  >
                    {category.permissions
                      .filter((permission) => {
                        const matchesSearch =
                          !searchTerm ||
                          permission.displayName
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          permission.action
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        if (showOnlyAssigned) {
                          const hasAssignments = filteredRoles.some(
                            (role) =>
                              matrixData.matrix[role._id]?.[permission.action]
                          );
                          return matchesSearch && hasAssignments;
                        }
                        return matchesSearch;
                      })
                      .map((permission) => {
                        const conflicts = getPermissionConflicts(
                          permission.action
                        );
                        const usage = getPermissionUsageStats(
                          permission.action
                        );
                        return (
                          <TableRow key={permission.action} hover>
                            <TableCell>
                              <div
                                className=""
                              >
                                <div className="">
                                  <div
                                    
                                    fontWeight="medium"
                                  >
                                    {permission.displayName}
                                  </div>
                                  <div
                                    
                                    color="textSecondary"
                                  >
                                    {permission.action}
                                  </div>
                                  {permission.description && (
                                    <div
                                      
                                      display="block"
                                      color="textSecondary"
                                    >
                                      {permission.description}
                                    </div>
                                  )}
                                </div>
                                <div
                                  className=""
                                >
                                  {conflicts.length > 0 && (
                                    <Tooltip
                                      title={`${conflicts.length} conflicts detected`}
                                    >
                                      <WarningIcon
                                        color="warning"
                                        fontSize="small"
                                      />
                                    </Tooltip>
                                  )}
                                  {permission.requiresSubscription && (
                                    <Tooltip title="Requires subscription">
                                      <InfoIcon color="info" fontSize="small" />
                                    </Tooltip>
                                  )}
                                  {usage && (
                                    <Tooltip
                                      title={`Used by ${usage.roleCount} roles, ${usage.userCount} users`}
                                    >
                                      <Chip
                                        label={usage.userCount}
                                        size="small"
                                        
                                        color="primary"
                                      />
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {filteredRoles.map((role) => {
                              const hasPermission =
                                matrixData.matrix[role._id]?.[
                                  permission.action
                                ] || false;
                              const isSystemRole = role.isSystemRole;
                              const canModify =
                                canAccess('canUpdate') && !isSystemRole;
                              return (
                                <TableCell key={role._id} align="center">
                                  <Checkbox
                                    checked={hasPermission}
                                    onChange={() =>
                                      handlePermissionToggle(
                                        role._id,
                                        permission.action
                                      )}
                                    }
                                    disabled={!canModify || saving}
                                    color="primary"
                                    size="small"
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                  </Collapse>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      {/* Analytics Dialog */}
      <Dialog
        open={analyticsDialogOpen}
        onClose={() => setAnalyticsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Permission Usage Analytics</DialogTitle>
        <DialogContent>
          <div container spacing={3}>
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Most Used Permissions
                  </div>
                  <List dense>
                    {permissionUsage
                      .sort((a, b) => b.userCount - a.userCount)
                      .slice(0, 10)
                      .map((usage) => (
                        <div key={usage.permission}>
                          <div
                            primary={usage.displayName}
                            secondary={`${usage.userCount} users, ${usage.roleCount} roles`}
                          />
                        </div>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </div>
            <div item xs={12} md={6}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Unused Permissions
                  </div>
                  <List dense>
                    {permissionUsage
                      .filter((usage) => usage.userCount === 0)
                      .slice(0, 10)
                      .map((usage) => (
                        <div key={usage.permission}>
                          <div>
                            <WarningIcon color="warning" />
                          </div>
                          <div
                            primary={usage.displayName}
                            secondary={usage.category}
                          />
                        </div>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
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
export default PermissionMatrix;
