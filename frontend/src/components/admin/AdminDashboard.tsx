import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WebhookIcon from '@mui/icons-material/Webhook';
import { useUIStore } from '../../stores';
import LoadingSpinner from '../LoadingSpinner';

// Import the new admin components
import SecurityDashboard from './SecurityDashboard';
import UsageMonitoring from './UsageMonitoring';
import MigrationDashboard from './MigrationDashboard';
import InvitationManagement from './InvitationManagement';
import LocationManagement from './LocationManagement';
import WebhookManagement from './WebhookManagement';
import AdvancedSubscriptionAnalytics from '../subscription/AdvancedSubscriptionAnalytics';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  licenseStatus: string;
  licenseNumber?: string;
  subscriptionTier: string;
  createdAt: string;
  lastLoginAt?: string;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    licenseStatus: '',
  });

  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

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
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const queryParams = new URLSearchParams({
      page: (page + 1).toString(),
      limit: rowsPerPage.toString(),
      ...filters,
    });

    const response = await fetch(`/api/admin/users?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUsers(data.data.users);
    }
  };

  const loadLicenses = async () => {
    const response = await fetch('/api/admin/licenses/pending', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setLicenses(data.data.licenses);
    }
  };

  const loadAnalytics = async () => {
    const response = await fetch('/api/admin/analytics', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setAnalytics(data.data);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'User role updated successfully',
          duration: 5000,
        });
        loadUsers();
        setEditDialogOpen(false);
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user role',
        duration: 5000,
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ reason: 'Administrative action' }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'User suspended successfully',
          duration: 5000,
        });
        loadUsers();
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to suspend user',
        duration: 5000,
      });
    }
  };

  const handleApproveLicense = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/licenses/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ notes: 'Approved by admin' }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'License approved successfully',
          duration: 5000,
        });
        loadLicenses();
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to approve license',
        duration: 5000,
      });
    }
  };

  const handleRejectLicense = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/licenses/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'License rejected',
          duration: 5000,
        });
        loadLicenses();
        setLicenseDialogOpen(false);
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to reject license',
        duration: 5000,
      });
    }
  };

  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (
    role: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'pharmacy_outlet':
        return 'primary';
      case 'pharmacy_team':
        return 'secondary';
      case 'pharmacist':
        return 'info';
      case 'intern_pharmacist':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !users.length && !licenses.length && !analytics) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<PeopleIcon />}
            label="User Management"
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={licenses.length} color="error">
                <AssignmentIcon />
              </Badge>
            }
            label="License Verification"
            iconPosition="start"
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Analytics"
            iconPosition="start"
          />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
          <Tab
            icon={<TrendingUpIcon />}
            label="Usage Monitoring"
            iconPosition="start"
          />
          <Tab
            icon={<SwapVertIcon />}
            label="Migrations"
            iconPosition="start"
          />
          <Tab icon={<EmailIcon />} label="Invitations" iconPosition="start" />
          <Tab
            icon={<LocationOnIcon />}
            label="Locations"
            iconPosition="start"
          />
          <Tab icon={<WebhookIcon />} label="Webhooks" iconPosition="start" />
          <Tab
            icon={<SettingsIcon />}
            label="System Settings"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Users Tab */}
      {activeTab === 0 && (
        <>
          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) =>
                    setFilters({ ...filters, role: e.target.value })
                  }
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="pharmacist">Pharmacist</MenuItem>
                  <MenuItem value="pharmacy_team">Pharmacy Team</MenuItem>
                  <MenuItem value="pharmacy_outlet">Pharmacy Outlet</MenuItem>
                  <MenuItem value="intern_pharmacist">
                    Intern Pharmacist
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Users Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>License Status</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.replace('_', ' ')}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.licenseStatus}
                        color={getStatusColor(user.licenseStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.subscriptionTier}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit User">
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Suspend User">
                        <IconButton
                          onClick={() => handleSuspendUser(user._id)}
                          disabled={user.status === 'suspended'}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={-1}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) =>
                setRowsPerPage(parseInt(e.target.value))
              }
            />
          </TableContainer>
        </>
      )}

      {/* Licenses Tab */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
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
                      startIcon={<DownloadIcon />}
                      size="small"
                      onClick={() => {
                        window.open(
                          `/api/license/document/${license._id}`,
                          '_blank'
                        );
                      }}
                    >
                      {license.licenseDocument.fileName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(license.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Approve License">
                      <IconButton
                        onClick={() => handleApproveLicense(license._id)}
                        color="success"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject License">
                      <IconButton
                        onClick={() => {
                          setSelectedLicense(license);
                          setLicenseDialogOpen(true);
                        }}
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && analytics && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Statistics
                </Typography>
                {analytics.users.map((stat) => (
                  <Box
                    key={stat._id}
                    display="flex"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="body2">{stat._id}:</Typography>
                    <Typography variant="body2">
                      {stat.active}/{stat.count}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Subscription Statistics
                </Typography>
                {analytics.subscriptions.map((stat) => (
                  <Box key={stat._id} sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">{stat._id}:</Typography>
                      <Typography variant="body2">{stat.count}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Revenue: ₦{stat.revenue?.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  License Statistics
                </Typography>
                {analytics.licenses.map((stat) => (
                  <Box
                    key={stat._id}
                    display="flex"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="body2">{stat._id}:</Typography>
                    <Typography variant="body2">{stat.count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Dashboard Tab */}
      {activeTab === 3 && <SecurityDashboard />}

      {/* Usage Monitoring Tab */}
      {activeTab === 4 && <UsageMonitoring />}

      {/* Migration Dashboard Tab */}
      {activeTab === 5 && <MigrationDashboard />}

      {/* Invitation Management Tab */}
      {activeTab === 6 && <InvitationManagement />}

      {/* Location Management Tab */}
      {activeTab === 7 && <LocationManagement />}

      {/* Webhook Management Tab */}
      {activeTab === 8 && <WebhookManagement />}

      {/* Advanced Subscription Analytics Tab */}
      {activeTab === 9 && <AdvancedSubscriptionAnalytics />}

      {/* System Settings Tab */}
      {activeTab === 10 && (
        <Alert severity="info">
          System settings panel will be available in the next update.
        </Alert>
      )}

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box pt={1}>
              <Typography variant="body1" gutterBottom>
                User: {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <MenuItem value="pharmacist">Pharmacist</MenuItem>
                  <MenuItem value="pharmacy_team">Pharmacy Team</MenuItem>
                  <MenuItem value="pharmacy_outlet">Pharmacy Outlet</MenuItem>
                  <MenuItem value="intern_pharmacist">
                    Intern Pharmacist
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedUser &&
              handleUpdateUserRole(selectedUser._id, selectedUser.role)
            }
            variant="contained"
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* License Rejection Dialog */}
      <Dialog
        open={licenseDialogOpen}
        onClose={() => setLicenseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject License</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            placeholder="Please provide a reason for rejecting this license..."
            margin="normal"
            id="rejection-reason"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLicenseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const reason = (
                document.getElementById('rejection-reason') as HTMLInputElement
              )?.value;
              if (selectedLicense && reason) {
                handleRejectLicense(selectedLicense._id, reason);
              }
            }}
            variant="contained"
            color="error"
          >
            Reject License
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
