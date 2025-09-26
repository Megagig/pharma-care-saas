import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as GroupIcon,
  Shield as SecurityIcon,
  RefreshCw as RefreshIcon,
  Edit as EditIcon,
  MoreVertical as MoreVertIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as WarningIcon,
  Search as SearchIcon
} from 'lucide-react';
import * as rbacService from '../services/rbacService';
import { useRBAC } from '../hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
interface DynamicUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  systemRole?: string;
  assignedRoles: string[];
}

interface Role {
  _id: string;
  displayName: string;
  description?: string;
}

interface PermissionPreview {
  addedPermissions: string[];
  removedPermissions: string[];
  conflicts: string[];
}

const PharmacyUserManagement: React.FC = () => {
  const { hasFeature, canAccess } = useRBAC();
  
  // State management
  const [users, setUsers] = useState<DynamicUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [roleAssignmentOpen, setRoleAssignmentOpen] = useState(false);
  const [selectedRolesForAssignment, setSelectedRolesForAssignment] = useState<string[]>([]);
  const [permissionPreview, setPermissionPreview] = useState<PermissionPreview | null>(null);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DynamicUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [previewingPermissions, setPreviewingPermissions] = useState(false);
  
  // Notification states
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ 
    open: false,
    message: '',
    type: 'info'
  });
  
  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      setNotification({ open: true, message, type });
      setTimeout(() => setNotification(prev => ({ ...prev, open: false })), 5000);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let usersLoaded = false;
      let rolesLoaded = false;
      
      // Try to load users
      try {
        const usersResponse = await rbacService.getAllUsers({ 
          page: 1,
          limit: 100
        });
        if (usersResponse.success && usersResponse.data?.users) {
          setUsers(usersResponse.data.users);
          usersLoaded = true;
        } else {
          setUsers([]);
        }
      } catch (userError) {
        console.error('Error loading users:', userError);
        setUsers([]);
      }
      
      // Try to load roles
      try {
        const rolesResponse = await rbacService.getAllRoles({ 
          page: 1,
          limit: 100
        });
        if (rolesResponse.success && rolesResponse.data?.roles) {
          setRoles(rolesResponse.data.roles);
          rolesLoaded = true;
        } else {
          setRoles([]);
        }
      } catch (roleError) {
        console.error('Error loading roles:', roleError);
        setRoles([]);
      }
      
      // Show appropriate messages based on what loaded successfully
      if (usersLoaded && rolesLoaded) {
        showNotification('Data loaded successfully', 'success');
      } else if (usersLoaded && !rolesLoaded) {
        showNotification('Users loaded, but roles failed to load', 'warning');
      } else if (!usersLoaded && rolesLoaded) {
        showNotification('Roles loaded, but users failed to load', 'warning');
      } else {
        showNotification('Failed to load user and role data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle role assignment
  const handleOpenRoleAssignment = () => {
    if (selectedUserIds.length === 0) {
      showNotification('Please select users to assign roles', 'warning');
      return;
    }
    setRoleAssignmentOpen(true);
  };

  const handlePreviewPermissions = async () => {
    if (selectedUserIds.length === 1 && selectedRolesForAssignment.length > 0) {
      try {
        setPreviewingPermissions(true);
        const userId = selectedUserIds[0];
        const response = await rbacService.previewPermissionChanges(userId, {
          roleIds: selectedRolesForAssignment
        });
        if (response.success) {
          setPermissionPreview(response.data as PermissionPreview);
        }
      } catch (error) {
        console.error('Error previewing permissions:', error);
        showNotification('Failed to preview permissions', 'error');
      } finally {
        setPreviewingPermissions(false);
      }
    }
  };

  const handleAssignRoles = async () => {
    if (selectedUserIds.length === 0 || selectedRolesForAssignment.length === 0) {
      showNotification('Please select users and roles', 'warning');
      return;
    }

    try {
      setBulkOperationInProgress(true);
      const result = await rbacService.bulkAssignRoles(
        selectedUserIds,
        selectedRolesForAssignment[0] // bulkAssignRoles expects a single roleId
      );
      
      if (result.success) {
        showNotification('Roles assigned successfully', 'success');
        await loadData();
        setRoleAssignmentOpen(false);
        setSelectedRolesForAssignment([]);
        setSelectedUserIds([]);
        setPermissionPreview(null);
      }
    } catch (error) {
      console.error('Error assigning roles:', error);
      showNotification('Failed to assign roles', 'error');
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  // Handle individual user actions
  const handleEditUser = (user: DynamicUser) => {
    console.log('Edit user:', user);
    setUserMenuOpen(false);
  };

  const handleViewUserRoles = async (user: DynamicUser | null) => {
    if (!user || !user._id) {
      console.error('Invalid user data:', user);
      showNotification('User data is not available', 'error');
      setUserMenuOpen(false);
      return;
    }
    
    try {
      const response = await rbacService.getUserRoles(user._id);
      if (response.success) {
        console.log('User roles:', response.data);
        showNotification('User roles loaded successfully', 'success');
      } else {
        showNotification('Failed to load user roles', 'error');
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      showNotification('Failed to load user roles', 'error');
    }
    setUserMenuOpen(false);
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(user => user._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    }
  };

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((user) => {
      if (!user || typeof user !== 'object') return false;
      
      const matchesSearch = !searchTerm ||
        `${user.firstName || ''} ${user.lastName || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || user.status === statusFilter;
      
      const matchesRole = !roleFilter ||
        (Array.isArray(user.assignedRoles) &&
          user.assignedRoles.includes(roleFilter));
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Check if user has access to user management
  if (!hasFeature('user_management')) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            You don't have permission to access User Management. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Notification */}
        {notification.open && (
          <Alert className={`mb-4 ${
            notification.type === 'success' ? 'border-green-500 bg-green-50' :
            notification.type === 'error' ? 'border-red-500 bg-red-50' :
            notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GroupIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
          <p className="text-gray-600">
            Manage user roles, permissions, and access controls with dynamic RBAC
          </p>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="license_pending">License Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleOpenRoleAssignment}
                      disabled={selectedUserIds.length === 0 || !canAccess('canManage')}
                      className="flex items-center space-x-2"
                    >
                      <SecurityIcon className="h-4 w-4" />
                      <span>Assign Roles</span>
                      {selectedUserIds.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedUserIds.length}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assign Roles to Selected Users</p>
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  onClick={loadData}
                  className="flex items-center space-x-2"
                >
                  <RefreshIcon className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {(!Array.isArray(users) || users.length === 0) && !loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">No users found</div>
                <div className="text-sm text-gray-400 mb-4">
                  The RBAC service may not be available or no users exist.
                </div>
                <Button
                  variant="outline"
                  onClick={loadData}
                  className="flex items-center space-x-2"
                >
                  <RefreshIcon className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <Checkbox
                          checked={selectedUserIds.length === users.length && users.length > 0}
                          onCheckedChange={handleSelectAllUsers}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dynamic Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedUserIds.includes(user._id)}
                            onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              user.status === 'active' ? 'default' :
                              user.status === 'pending' ? 'secondary' :
                              user.status === 'suspended' ? 'destructive' :
                              'outline'
                            }
                          >
                            {user.status || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {user.systemRole || 'User'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {Array.isArray(user.assignedRoles) && Array.isArray(roles) ? (
                            <div className="flex flex-wrap gap-1">
                              {roles
                                .filter(role => role && role._id && user.assignedRoles.includes(role._id))
                                .slice(0, 2)
                                .map((role) => (
                                  <Badge key={role._id} variant="secondary">
                                    {role.displayName || 'Unknown Role'}
                                  </Badge>
                                ))}
                              {roles.filter(role => 
                                role && role._id && user.assignedRoles.includes(role._id)
                              ).length > 2 && (
                                <Badge variant="outline">
                                  +{roles.filter(role => 
                                    role && role._id && user.assignedRoles.includes(role._id)
                                  ).length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No roles</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  disabled={!canAccess('canUpdate')}
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit User</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewUserRoles(user)}
                                >
                                  <SecurityIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manage Roles</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserMenuOpen(true);
                                  }}
                                >
                                  <MoreVertIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>More Options</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Assignment Dialog */}
        <Dialog open={roleAssignmentOpen} onOpenChange={setRoleAssignmentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Assign Roles to {selectedUserIds.length} User{selectedUserIds.length !== 1 ? 's' : ''}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Roles</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {roles.map((role) => (
                    <div key={role._id} className="flex items-start space-x-2">
                      <Checkbox
                        checked={selectedRolesForAssignment.includes(role._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRolesForAssignment([...selectedRolesForAssignment, role._id]);
                          } else {
                            setSelectedRolesForAssignment(
                              selectedRolesForAssignment.filter(id => id !== role._id)
                            );
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{role.displayName}</div>
                        {role.description && (
                          <div className="text-sm text-gray-500">{role.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedUserIds.length === 1 && selectedRolesForAssignment.length > 0 && (
                <div>
                  <Button
                    variant="outline"
                    onClick={handlePreviewPermissions}
                    disabled={previewingPermissions}
                    className="flex items-center space-x-2"
                  >
                    <SecurityIcon className="h-4 w-4" />
                    <span>{previewingPermissions ? 'Previewing...' : 'Preview Permissions'}</span>
                  </Button>
                </div>
              )}

              {/* Permission Preview */}
              {permissionPreview && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Permission Changes Preview</h3>
                  
                  {permissionPreview.addedPermissions.length > 0 && (
                    <div>
                      <div className="flex items-center text-green-600 mb-2">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Added Permissions ({permissionPreview.addedPermissions.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {permissionPreview.addedPermissions.map((permission) => (
                          <Badge key={permission} className="bg-green-100 text-green-800">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {permissionPreview.removedPermissions.length > 0 && (
                    <div>
                      <div className="flex items-center text-red-600 mb-2">
                        <WarningIcon className="h-4 w-4 mr-1" />
                        Removed Permissions ({permissionPreview.removedPermissions.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {permissionPreview.removedPermissions.map((permission) => (
                          <Badge key={permission} className="bg-red-100 text-red-800">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {permissionPreview.conflicts.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertDescription>
                        <div className="font-medium mb-1">Conflicts Detected</div>
                        <ul className="list-disc list-inside">
                          {permissionPreview.conflicts.map((conflict, index) => (
                            <li key={index}>{conflict}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleAssignmentOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignRoles}
                disabled={selectedRolesForAssignment.length === 0 || bulkOperationInProgress}
                className="flex items-center space-x-2"
              >
                {bulkOperationInProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <SecurityIcon className="h-4 w-4" />
                    <span>Assign Roles</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default PharmacyUserManagement;