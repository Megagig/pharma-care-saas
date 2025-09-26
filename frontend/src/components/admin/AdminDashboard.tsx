import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import BulkOperationProgress from '../rbac/BulkOperationProgress';
// Import the new admin components
import SecurityDashboard from './SecurityDashboard';
import UsageMonitoring from './UsageMonitoring';
import MigrationDashboard from './MigrationDashboard';
import InvitationManagement from './InvitationManagement';
import LocationManagement from './LocationManagement';
import WebhookManagement from './WebhookManagement';
import AdvancedSubscriptionAnalytics from '../subscription/AdvancedSubscriptionAnalytics';

import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Alert,
  Switch,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox
} from '@/components/ui';

import {
  ChevronDown,
  X,
  CheckCircle,
  Download,
  Edit,
  Users,
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  ArrowUpDown,
  Mail,
  MapPin,
  ExternalLink,
  Settings,
  PlaylistAddCheck,
  XCircle
} from 'lucide-react';

import {
  bulkRevokeRoles,
  bulkAssignRoles,
  rejectLicense,
  approveLicense,
  suspendUser,
  updateUserRole,
  getAllRoles,
  getSystemAnalytics,
  getPendingLicenses,
  getAllUsers
} from '@/services/rbacService';
import { BulkRoleAssignment, DynamicUser, Role } from '@/types/rbac';
import { useUIStore } from '@/stores';

interface License {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  licenseNumber: string;
  licenseDocument: {
    fileName: string;
    uploadedAt: string;
  };
  createdAt: string;
}

interface Analytics {
  users: { _id: string; count: number; active: number }[];
  subscriptions: {
    _id: string;
    count: number;
    active: number;
    revenue: number;
  }[];
  licenses: { _id: string; count: number }[];
  generated: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<DynamicUser[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<DynamicUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    licenseStatus: ''
  });

  // Bulk operation states
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkRevokeDialogOpen, setBulkRevokeDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [bulkOperationId, setBulkOperationId] = useState<string>('');
  const [bulkOperationProgressOpen, setBulkOperationProgressOpen] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState<string>('');
  const [revocationReason, setRevocationReason] = useState<string>('');

  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  useEffect(() => {
    if (activeTab === 0) {
      loadRoles();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 0: // Users
          await loadUsers();
          break;
        case 1: // Licenses
          await loadLicenses();
          break;
        case 2: // Analytics
          await loadAnalytics();
          break;
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load data',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await getAllUsers({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadLicenses = async () => {
    try {
      const response = await getPendingLicenses();
      if (response.success) {
        setLicenses(response.data.licenses as License[]);
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getSystemAnalytics();
      if (response.success) {
        // Convert SystemAnalytics to our Analytics interface
        const convertedAnalytics: Analytics = {
          users: response.data.userAnalytics.byRole.map((item) => ({
            _id: item._id,
            count: item.count,
            active: item.count, // Use count as active since we don't have active count
          })),
          subscriptions: response.data.userAnalytics.byStatus.map((item) => ({
            _id: item._id,
            count: item.count,
            active: item.count,
            revenue: 0, // Default revenue since we don't have this data
          })),
          licenses: response.data.permissionAnalytics.byCategory.map(
            (item) => ({
              _id: item._id,
              count: item.count
            })
          ),
          generated: new Date().toISOString(),
        };
        setAnalytics(convertedAnalytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await getAllRoles({ page: 1, limit: 100 });
      if (response.success) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const response = await updateUserRole(userId, role);
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'User role updated successfully',
          duration: 5000
        });
        loadUsers();
        setEditDialogOpen(false);
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user role',
        duration: 5000
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await suspendUser(userId, 'Administrative action');
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'User suspended successfully',
          duration: 5000
        });
        loadUsers();
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to suspend user',
        duration: 5000
      });
    }
  };

  const handleApproveLicense = async (userId: string) => {
    try {
      const response = await approveLicense(userId);
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'License approved successfully',
          duration: 5000
        });
        loadLicenses();
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to approve license',
        duration: 5000
      });
    }
  };

  const handleRejectLicense = async (userId: string, reason: string) => {
    try {
      const response = await rejectLicense(userId, reason);
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'License rejected',
          duration: 5000
        });
        loadLicenses();
        setLicenseDialogOpen(false);
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to reject license',
        duration: 5000
      });
    }
  };

  // Bulk role assignment handlers
  const handleBulkAssignRoles = async () => {
    if (selectedUsers.length === 0 || selectedRoles.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select at least one user and one role',
        duration: 5000
      });
      return;
    }

    try {
      const bulkData: BulkRoleAssignment = {
        userIds: selectedUsers,
        roleIds: selectedRoles,
        workspaceId: undefined,
        isTemporary,
        expiresAt: isTemporary ? expiresAt : undefined,
        assignmentReason,
      };

      const response = await bulkAssignRoles(
        bulkData.userIds,
        bulkData.roleIds[0]
      );

      if (response.success) {
        setBulkOperationId('');
        setBulkOperationProgressOpen(true);
        setBulkAssignDialogOpen(false);
        addNotification({
          type: 'success',
          title: 'Bulk Operation Started',
          message: 'Bulk role assignment has been initiated',
          duration: 5000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to start bulk role assignment',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to start bulk role assignment',
        duration: 5000
      });
    }
  };

  const handleBulkRevokeRoles = async () => {
    if (selectedUsers.length === 0 || selectedRoles.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select at least one user and one role',
        duration: 5000
      });
      return;
    }

    try {
      const response = await bulkRevokeRoles(selectedUsers, selectedRoles[0]);
      if (response.success) {
        setBulkOperationId('');
        setBulkOperationProgressOpen(true);
        setBulkRevokeDialogOpen(false);
        addNotification({
          type: 'success',
          title: 'Bulk Operation Started',
          message: 'Bulk role revocation has been initiated',
          duration: 5000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to start bulk role revocation',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error in bulk role revocation:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to start bulk role revocation',
        duration: 5000
      });
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleRoleSelection = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, roleId]);
    } else {
      setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllRoles = (checked: boolean) => {
    if (checked) {
      setSelectedRoles(roles.map((role) => role._id));
    } else {
      setSelectedRoles([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'pharmacy_outlet':
        return 'bg-blue-100 text-blue-800';
      case 'pharmacy_team':
        return 'bg-purple-100 text-purple-800';
      case 'pharmacist':
        return 'bg-indigo-100 text-indigo-800';
      case 'intern_pharmacist':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !users.length && !licenses.length && !analytics) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="0" className="flex items-center gap-2">
            <Users size={16} />
            User Management
          </TabsTrigger>
          <TabsTrigger value="1" className="flex items-center gap-2">
            <div className="relative">
              <FileText size={16} />
              {licenses.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {licenses.length}
                </Badge>
              )}
            </div>
            License Verification
          </TabsTrigger>
          <TabsTrigger value="2" className="flex items-center gap-2">
            <BarChart3 size={16} />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="3" className="flex items-center gap-2">
            <Shield size={16} />
            Security
          </TabsTrigger>
          <TabsTrigger value="4" className="flex items-center gap-2">
            <TrendingUp size={16} />
            Usage Monitoring
          </TabsTrigger>
          <TabsTrigger value="5" className="flex items-center gap-2">
            <ArrowUpDown size={16} />
            Migrations
          </TabsTrigger>
          <TabsTrigger value="6" className="flex items-center gap-2">
            <Mail size={16} />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="7" className="flex items-center gap-2">
            <MapPin size={16} />
            Locations
          </TabsTrigger>
          <TabsTrigger value="8" className="flex items-center gap-2">
            <ExternalLink size={16} />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="9" className="flex items-center gap-2">
            <Settings size={16} />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="0">
          {/* Bulk Actions */}
          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => setBulkAssignDialogOpen(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center gap-2"
            >
              <PlaylistAddCheck size={16} />
              Bulk Assign Roles ({selectedUsers.length})
            </Button>
            <Button
              variant="destructive"
              onClick={() => setBulkRevokeDialogOpen(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center gap-2"
            >
              <XCircle size={16} />
              Bulk Revoke Roles ({selectedUsers.length})
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label>Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="pharmacy_team">Pharmacy Team</SelectItem>
                  <SelectItem value="pharmacy_outlet">Pharmacy Outlet</SelectItem>
                  <SelectItem value="intern_pharmacist">Intern Pharmacist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedUsers.length === users.length && users.length > 0
                      }
                      onCheckedChange={handleSelectAllUsers}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>License Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={(checked) =>
                          handleUserSelection(user._id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.systemRole)}>
                        {user.systemRole.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor('not_required')}>
                        not_required
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        free_trial
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit User</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspendUser(user._id)}
                                disabled={user.status === 'suspended'}
                              >
                                <X size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Suspend User</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="1">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license._id}>
                    <TableCell>
                      {license.firstName} {license.lastName}
                    </TableCell>
                    <TableCell>{license.email}</TableCell>
                    <TableCell>{license.licenseNumber}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `/api/license/document/${license._id}`,
                            '_blank'
                          );
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                        {license.licenseDocument.fileName}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(license.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveLicense(license._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve License</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLicense(license);
                                  setLicenseDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject License</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="2">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
                  {analytics.users.map((stat) => (
                    <div
                      key={stat._id}
                      className="flex justify-between items-center mb-2"
                    >
                      <span className="text-sm">{stat._id}:</span>
                      <span className="font-medium">
                        {stat.active}/{stat.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Subscription Statistics</h3>
                  {analytics.subscriptions.map((stat) => (
                    <div key={stat._id} className="mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{stat._id}:</span>
                        <span className="font-medium">{stat.count}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Revenue: ₦{stat.revenue?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">License Statistics</h3>
                  {analytics.licenses.map((stat) => (
                    <div
                      key={stat._id}
                      className="flex justify-between items-center mb-2"
                    >
                      <span className="text-sm">{stat._id}:</span>
                      <span className="font-medium">{stat.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Security Dashboard Tab */}
        <TabsContent value="3">
          <SecurityDashboard />
        </TabsContent>

        {/* Usage Monitoring Tab */}
        <TabsContent value="4">
          <UsageMonitoring />
        </TabsContent>

        {/* Migration Dashboard Tab */}
        <TabsContent value="5">
          <MigrationDashboard />
        </TabsContent>

        {/* Invitation Management Tab */}
        <TabsContent value="6">
          <InvitationManagement />
        </TabsContent>

        {/* Location Management Tab */}
        <TabsContent value="7">
          <LocationManagement />
        </TabsContent>

        {/* Webhook Management Tab */}
        <TabsContent value="8">
          <WebhookManagement />
        </TabsContent>

        {/* Advanced Subscription Analytics Tab */}
        <TabsContent value="9">
          <AdvancedSubscriptionAnalytics />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="mb-4">
                User: {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <div>
                <Label>Role</Label>
                <Select
                  value={selectedUser.systemRole}
                  onValueChange={(value) =>
                    setSelectedUser({
                      ...selectedUser,
                      systemRole: value as any
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="pharmacy_team">Pharmacy Team</SelectItem>
                    <SelectItem value="pharmacy_outlet">Pharmacy Outlet</SelectItem>
                    <SelectItem value="intern_pharmacist">Intern Pharmacist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser &&
                handleUpdateUserRole(selectedUser._id, selectedUser.systemRole)
              }
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Rejection Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject License</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Input
              id="rejection-reason"
              placeholder="Please provide a reason for rejecting this license..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const reason = (
                  document.getElementById('rejection-reason') as HTMLInputElement
                )?.value;
                if (selectedLicense && reason) {
                  handleRejectLicense(selectedLicense._id, reason);
                }
              }}
            >
              Reject License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operation Progress Dialog */}
      <BulkOperationProgress
        open={bulkOperationProgressOpen}
        onClose={() => setBulkOperationProgressOpen(false)}
        operationId={bulkOperationId}
        initialData={{
          type: 'role_assignment',
          status: 'pending',
          progress: {
            total: selectedUsers.length,
            processed: 0,
            successful: 0,
            failed: 0,
          },
          startTime: new Date().toISOString(),
          errors: [],
          warnings: [],
          metadata: {
            userCount: selectedUsers.length,
          },
        }}
      />
    </div>
  );
};

export default AdminDashboard;
