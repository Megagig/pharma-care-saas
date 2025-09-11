import React, { useState, useEffect } from 'react';
import {
   Box,
   Container,
   Typography,
   Card,
   CardContent,
   CardHeader,
   Switch,
   Chip,
   Button,
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   TextField,
   FormControl,
   InputLabel,
   Select,
   MenuItem,
   FormControlLabel,
   Alert,
   useTheme,
   useMediaQuery,
   Breadcrumbs,
   Link,
   IconButton,
   Tooltip,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   TablePagination,
   Divider,
   Skeleton,
   Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import FilterIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';

import { useRBAC } from '../hooks/useRBAC';

// Types
interface FeatureFlag {
   _id: string;
   name: string;
   key: string;
   description: string;
   isActive: boolean;
   allowedTiers: string[];
   allowedRoles: string[];
   metadata: {
      category: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      tags: string[];
   };
   customRules?: {
      maxUsers?: number;
      requiredLicense?: boolean;
   };
   createdAt: string;
   updatedAt: string;
}

const CATEGORIES = [
   { value: 'core', label: 'Core Features', color: 'primary' },
   { value: 'analytics', label: 'Analytics & Reporting', color: 'secondary' },
   { value: 'collaboration', label: 'Collaboration & Teams', color: 'success' },
   { value: 'integration', label: 'Integrations', color: 'info' },
   { value: 'compliance', label: 'Compliance & Regulations', color: 'warning' },
   { value: 'administration', label: 'Administration', color: 'error' },
] as const;

const SUBSCRIPTION_TIERS = [
   'free_trial',
   'basic',
   'pro',
   'pharmily',
   'network',
   'enterprise',
];

const USER_ROLES = [
   'pharmacist',
   'pharmacy_team',
   'pharmacy_outlet',
   'intern_pharmacist',
   'super_admin',
];

const FeatureFlagsPage: React.FC = () => {
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
   const { isSuperAdmin } = useRBAC();

   // State
   const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('all');
   const [statusFilter, setStatusFilter] = useState('all');
   const [page, setPage] = useState(0);
   const [rowsPerPage, setRowsPerPage] = useState(10);

   // Dialog states
   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

   // Form state
   const [formData, setFormData] = useState({
      name: '',
      key: '',
      description: '',
      isActive: true,
      allowedTiers: [] as string[],
      allowedRoles: [] as string[],
      category: 'core',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
      tags: [] as string[],
   });

   useEffect(() => {
      fetchFeatureFlags();
   }, []);

   const fetchFeatureFlags = async () => {
      try {
         setLoading(true);
         // Mock data for now - replace with actual API call
         setTimeout(() => {
            setFeatureFlags([
               {
                  _id: '1',
                  name: 'Advanced Analytics',
                  key: 'advanced_analytics',
                  description:
                     'Access to advanced business intelligence dashboards and reports',
                  isActive: true,
                  allowedTiers: ['pro', 'pharmily', 'network', 'enterprise'],
                  allowedRoles: [
                     'pharmacist',
                     'pharmacy_team',
                     'pharmacy_outlet',
                  ],
                  metadata: {
                     category: 'analytics',
                     priority: 'high',
                     tags: ['analytics', 'reports', 'dashboard'],
                  },
                  customRules: {
                     maxUsers: 10,
                     requiredLicense: true,
                  },
                  createdAt: '2024-01-15T10:00:00Z',
                  updatedAt: '2024-01-20T14:30:00Z',
               },
               {
                  _id: '2',
                  name: 'Team Management',
                  key: 'team_management',
                  description:
                     'Ability to invite and manage team members across the organization',
                  isActive: true,
                  allowedTiers: ['pro', 'pharmily', 'network', 'enterprise'],
                  allowedRoles: ['pharmacy_team', 'pharmacy_outlet'],
                  metadata: {
                     category: 'collaboration',
                     priority: 'medium',
                     tags: ['team', 'collaboration', 'users'],
                  },
                  customRules: {
                     maxUsers: 50,
                  },
                  createdAt: '2024-01-10T09:00:00Z',
                  updatedAt: '2024-01-18T16:45:00Z',
               },
               {
                  _id: '3',
                  name: 'API Access',
                  key: 'api_access',
                  description:
                     'Access to REST API endpoints for external integrations',
                  isActive: false,
                  allowedTiers: ['network', 'enterprise'],
                  allowedRoles: ['pharmacy_outlet', 'super_admin'],
                  metadata: {
                     category: 'integration',
                     priority: 'low',
                     tags: ['api', 'integration', 'external'],
                  },
                  customRules: {
                     requiredLicense: true,
                  },
                  createdAt: '2024-01-05T11:30:00Z',
                  updatedAt: '2024-01-22T08:15:00Z',
               },
            ]);
            setLoading(false);
         }, 1000);
      } catch (error) {
         console.error('Error fetching feature flags:', error);
         setLoading(false);
      }
   };

   const handleToggleFlag = async (flag: FeatureFlag) => {
      try {
         // Mock API call - replace with actual implementation
         setFeatureFlags((prev) =>
            prev.map((f) =>
               f._id === flag._id ? { ...f, isActive: !f.isActive } : f
            )
         );
      } catch (error) {
         console.error('Error toggling flag:', error);
      }
   };

   const handleCreateFlag = () => {
      setFormData({
         name: '',
         key: '',
         description: '',
         isActive: true,
         allowedTiers: [],
         allowedRoles: [],
         category: 'core',
         priority: 'medium',
         tags: [],
      });
      setCreateDialogOpen(true);
   };

   const handleEditFlag = (flag: FeatureFlag) => {
      setSelectedFlag(flag);
      setFormData({
         name: flag.name,
         key: flag.key,
         description: flag.description,
         isActive: flag.isActive,
         allowedTiers: flag.allowedTiers,
         allowedRoles: flag.allowedRoles,
         category: flag.metadata.category,
         priority: flag.metadata.priority,
         tags: flag.metadata.tags,
      });
      setEditDialogOpen(true);
   };

   const handleDeleteFlag = (flag: FeatureFlag) => {
      setSelectedFlag(flag);
      setDeleteDialogOpen(true);
   };

   const filteredFlags = featureFlags.filter((flag) => {
      const matchesSearch =
         flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
         flag.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
         categoryFilter === 'all' || flag.metadata.category === categoryFilter;
      const matchesStatus =
         statusFilter === 'all' ||
         (statusFilter === 'active' && flag.isActive) ||
         (statusFilter === 'inactive' && !flag.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
   });

   const getCategoryInfo = (category: string) => {
      return CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];
   };

   const getPriorityColor = (priority: string) => {
      switch (priority) {
         case 'critical':
            return 'error';
         case 'high':
            return 'warning';
         case 'medium':
            return 'info';
         case 'low':
            return 'success';
         default:
            return 'default';
      }
   };

   if (!isSuperAdmin) {
      return (
         <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <Alert severity="error" sx={{ mt: 4 }}>
               <Typography variant="h6" gutterBottom>
                  Access Denied
               </Typography>
               <Typography>
                  You need super admin permissions to access feature flag
                  management.
               </Typography>
            </Alert>
         </Container>
      );
   }

   return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
         {/* Header */}
         <Box sx={{ mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
               <Link component={RouterLink} to="/dashboard" color="inherit">
                  Dashboard
               </Link>
               <Link component={RouterLink} to="/admin" color="inherit">
                  Admin
               </Link>
               <Typography color="textPrimary">Feature Flags</Typography>
            </Breadcrumbs>

            <Box
               sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
               }}
            >
               <Box>
                  <Typography variant="h3" component="h1" gutterBottom>
                     Feature Flags Management
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                     Control feature access across different subscription tiers
                     and user roles
                  </Typography>
               </Box>

               {!isMobile && (
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={handleCreateFlag}
                     size="large"
                  >
                     Create Feature Flag
                  </Button>
               )}
            </Box>
         </Box>

         {/* Filters Card */}
         <Card sx={{ mb: 4 }}>
            <CardHeader title="Filters & Search" avatar={<FilterIcon />} />
            <CardContent>
               <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                     <TextField
                        fullWidth
                        placeholder="Search features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                           startAdornment: (
                              <SearchIcon
                                 sx={{ mr: 1, color: 'text.secondary' }}
                              />
                           ),
                        }}
                     />
                  </Grid>
                  <Grid item xs={12} md={4}>
                     <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                           value={categoryFilter}
                           label="Category"
                           onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                           <MenuItem value="all">All Categories</MenuItem>
                           {CATEGORIES.map((category) => (
                              <MenuItem
                                 key={category.value}
                                 value={category.value}
                              >
                                 {category.label}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                     <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                           value={statusFilter}
                           label="Status"
                           onChange={(e) => setStatusFilter(e.target.value)}
                        >
                           <MenuItem value="all">All Status</MenuItem>
                           <MenuItem value="active">Active</MenuItem>
                           <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                     </FormControl>
                  </Grid>
               </Grid>
            </CardContent>
         </Card>

         {/* Feature Flags Table */}
         <Card>
            <CardHeader
               title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <FlagIcon />
                     <Typography variant="h6">
                        Feature Flags ({filteredFlags.length})
                     </Typography>
                  </Box>
               }
               action={
                  isMobile && (
                     <IconButton onClick={handleCreateFlag}>
                        <AddIcon />
                     </IconButton>
                  )
               }
            />
            <Divider />

            {loading ? (
               <Box sx={{ p: 3 }}>
                  {Array.from(new Array(5)).map((_, index) => (
                     <Skeleton
                        key={index}
                        variant="rectangular"
                        height={60}
                        sx={{ mb: 1 }}
                     />
                  ))}
               </Box>
            ) : (
               <TableContainer>
                  <Table>
                     <TableHead>
                        <TableRow>
                           <TableCell>Status</TableCell>
                           <TableCell>Name</TableCell>
                           <TableCell>Key</TableCell>
                           <TableCell>Category</TableCell>
                           <TableCell>Priority</TableCell>
                           <TableCell>Tiers</TableCell>
                           <TableCell align="center">Actions</TableCell>
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {filteredFlags
                           .slice(
                              page * rowsPerPage,
                              page * rowsPerPage + rowsPerPage
                           )
                           .map((flag) => (
                              <TableRow key={flag._id} hover>
                                 <TableCell>
                                    <FormControlLabel
                                       control={
                                          <Switch
                                             checked={flag.isActive}
                                             onChange={() =>
                                                handleToggleFlag(flag)
                                             }
                                             color="primary"
                                          />
                                       }
                                       label=""
                                    />
                                 </TableCell>
                                 <TableCell>
                                    <Box>
                                       <Typography
                                          variant="subtitle2"
                                          gutterBottom
                                       >
                                          {flag.name}
                                       </Typography>
                                       <Typography
                                          variant="caption"
                                          color="textSecondary"
                                       >
                                          {flag.description}
                                       </Typography>
                                    </Box>
                                 </TableCell>
                                 <TableCell>
                                    <Typography
                                       variant="body2"
                                       sx={{
                                          fontFamily: 'monospace',
                                          backgroundColor: 'background.paper',
                                          padding: '2px 6px',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                       }}
                                    >
                                       {flag.key}
                                    </Typography>
                                 </TableCell>
                                 <TableCell>
                                    <Chip
                                       label={
                                          getCategoryInfo(
                                             flag.metadata.category
                                          ).label
                                       }
                                       size="sm"
                                       color={
                                          getCategoryInfo(
                                             flag.metadata.category
                                          ).color as
                                             | 'default'
                                             | 'primary'
                                             | 'secondary'
                                             | 'error'
                                             | 'info'
                                             | 'success'
                                             | 'warning'
                                       }
                                       variant="outlined"
                                    />
                                 </TableCell>
                                 <TableCell>
                                    <Chip
                                       label={flag.metadata.priority.toUpperCase()}
                                       size="sm"
                                       color={
                                          getPriorityColor(
                                             flag.metadata.priority
                                          ) as
                                             | 'default'
                                             | 'primary'
                                             | 'secondary'
                                             | 'error'
                                             | 'info'
                                             | 'success'
                                             | 'warning'
                                       }
                                       variant="filled"
                                    />
                                 </TableCell>
                                 <TableCell>
                                    <Box
                                       sx={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 0.5,
                                       }}
                                    >
                                       {flag.allowedTiers
                                          .slice(0, 2)
                                          .map((tier) => (
                                             <Chip
                                                key={tier}
                                                label={tier}
                                                size="sm"
                                                variant="outlined"
                                             />
                                          ))}
                                       {flag.allowedTiers.length > 2 && (
                                          <Chip
                                             label={`+${flag.allowedTiers.length - 2}`}
                                             size="sm"
                                             variant="outlined"
                                             color="default"
                                          />
                                       )}
                                    </Box>
                                 </TableCell>
                                 <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                       <Tooltip title="Edit">
                                          <IconButton
                                             size="sm"
                                             onClick={() =>
                                                handleEditFlag(flag)
                                             }
                                          >
                                             <EditIcon />
                                          </IconButton>
                                       </Tooltip>
                                       <Tooltip title="Delete">
                                          <IconButton
                                             size="sm"
                                             color="error"
                                             onClick={() =>
                                                handleDeleteFlag(flag)
                                             }
                                          >
                                             <DeleteIcon />
                                          </IconButton>
                                       </Tooltip>
                                    </Box>
                                 </TableCell>
                              </TableRow>
                           ))}
                     </TableBody>
                  </Table>
                  <TablePagination
                     component="div"
                     count={filteredFlags.length}
                     page={page}
                     onPageChange={(_, newPage) => setPage(newPage)}
                     rowsPerPage={rowsPerPage}
                     onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                     }}
                  />
               </TableContainer>
            )}
         </Card>

         {/* Mobile FAB for Create */}
         {isMobile && (
            <Box
               sx={{
                  position: 'fixed',
                  bottom: 24,
                  right: 24,
                  zIndex: 1000,
               }}
            >
               <Button
                  variant="contained"
                  onClick={handleCreateFlag}
                  sx={{
                     minWidth: 56,
                     height: 56,
                     borderRadius: '50%',
                  }}
               >
                  <AddIcon />
               </Button>
            </Box>
         )}

         {/* Create Feature Flag Dialog */}
         <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="md"
            fullWidth
         >
            <DialogTitle>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon />
                  Create New Feature Flag
               </Box>
            </DialogTitle>
            <DialogContent>
               <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                     <TextField
                        fullWidth
                        label="Feature Name"
                        value={formData.name}
                        onChange={(e) =>
                           setFormData({ ...formData, name: e.target.value })
                        }
                     />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <TextField
                        fullWidth
                        label="Feature Key"
                        value={formData.key}
                        onChange={(e) =>
                           setFormData({ ...formData, key: e.target.value })
                        }
                        helperText="Unique identifier for the feature"
                     />
                  </Grid>
                  <Grid item xs={12}>
                     <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={formData.description}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              description: e.target.value,
                           })
                        }
                     />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                           value={formData.category}
                           label="Category"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 category: e.target.value,
                              })
                           }
                        >
                           {CATEGORIES.map((category) => (
                              <MenuItem
                                 key={category.value}
                                 value={category.value}
                              >
                                 {category.label}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                           value={formData.priority}
                           label="Priority"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 priority: e.target.value as
                                    | 'low'
                                    | 'medium'
                                    | 'high'
                                    | 'critical',
                              })
                           }
                        >
                           <MenuItem value="low">Low</MenuItem>
                           <MenuItem value="medium">Medium</MenuItem>
                           <MenuItem value="high">High</MenuItem>
                           <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Allowed Tiers</InputLabel>
                        <Select
                           multiple
                           value={formData.allowedTiers}
                           label="Allowed Tiers"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 allowedTiers: e.target.value as string[],
                              })
                           }
                           renderValue={(selected) => (
                              <Box
                                 sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                 }}
                              >
                                 {selected.map((value) => (
                                    <Chip key={value} label={value} size="sm" />
                                 ))}
                              </Box>
                           )}
                        >
                           {SUBSCRIPTION_TIERS.map((tier) => (
                              <MenuItem key={tier} value={tier}>
                                 {tier}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Allowed Roles</InputLabel>
                        <Select
                           multiple
                           value={formData.allowedRoles}
                           label="Allowed Roles"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 allowedRoles: e.target.value as string[],
                              })
                           }
                           renderValue={(selected) => (
                              <Box
                                 sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                 }}
                              >
                                 {selected.map((value) => (
                                    <Chip key={value} label={value} size="sm" />
                                 ))}
                              </Box>
                           )}
                        >
                           {USER_ROLES.map((role) => (
                              <MenuItem key={role} value={role}>
                                 {role}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={formData.isActive}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    isActive: e.target.checked,
                                 })
                              }
                           />
                        }
                        label="Active by default"
                     />
                  </Grid>
               </Grid>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setCreateDialogOpen(false)}>
                  Cancel
               </Button>
               <Button
                  variant="contained"
                  onClick={() => {
                     // Handle create logic here
                     setCreateDialogOpen(false);
                  }}
               >
                  Create Feature Flag
               </Button>
            </DialogActions>
         </Dialog>

         {/* Edit Feature Flag Dialog */}
         <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="md"
            fullWidth
         >
            <DialogTitle>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon />
                  Edit Feature Flag
               </Box>
            </DialogTitle>
            <DialogContent>
               <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                     <TextField
                        fullWidth
                        label="Feature Name"
                        value={formData.name}
                        onChange={(e) =>
                           setFormData({ ...formData, name: e.target.value })
                        }
                     />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <TextField
                        fullWidth
                        label="Feature Key"
                        value={formData.key}
                        onChange={(e) =>
                           setFormData({ ...formData, key: e.target.value })
                        }
                        disabled
                        helperText="Key cannot be changed after creation"
                     />
                  </Grid>
                  <Grid item xs={12}>
                     <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={formData.description}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              description: e.target.value,
                           })
                        }
                     />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                           value={formData.category}
                           label="Category"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 category: e.target.value,
                              })
                           }
                        >
                           {CATEGORIES.map((category) => (
                              <MenuItem
                                 key={category.value}
                                 value={category.value}
                              >
                                 {category.label}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                           value={formData.priority}
                           label="Priority"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 priority: e.target.value as
                                    | 'low'
                                    | 'medium'
                                    | 'high'
                                    | 'critical',
                              })
                           }
                        >
                           <MenuItem value="low">Low</MenuItem>
                           <MenuItem value="medium">Medium</MenuItem>
                           <MenuItem value="high">High</MenuItem>
                           <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Allowed Tiers</InputLabel>
                        <Select
                           multiple
                           value={formData.allowedTiers}
                           label="Allowed Tiers"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 allowedTiers: e.target.value as string[],
                              })
                           }
                           renderValue={(selected) => (
                              <Box
                                 sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                 }}
                              >
                                 {selected.map((value) => (
                                    <Chip key={value} label={value} size="sm" />
                                 ))}
                              </Box>
                           )}
                        >
                           {SUBSCRIPTION_TIERS.map((tier) => (
                              <MenuItem key={tier} value={tier}>
                                 {tier}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <FormControl fullWidth>
                        <InputLabel>Allowed Roles</InputLabel>
                        <Select
                           multiple
                           value={formData.allowedRoles}
                           label="Allowed Roles"
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 allowedRoles: e.target.value as string[],
                              })
                           }
                           renderValue={(selected) => (
                              <Box
                                 sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                 }}
                              >
                                 {selected.map((value) => (
                                    <Chip key={value} label={value} size="sm" />
                                 ))}
                              </Box>
                           )}
                        >
                           {USER_ROLES.map((role) => (
                              <MenuItem key={role} value={role}>
                                 {role}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={formData.isActive}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    isActive: e.target.checked,
                                 })
                              }
                           />
                        }
                        label="Feature is active"
                     />
                  </Grid>
               </Grid>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
               <Button
                  variant="contained"
                  onClick={() => {
                     // Handle update logic here
                     setEditDialogOpen(false);
                  }}
               >
                  Update Feature Flag
               </Button>
            </DialogActions>
         </Dialog>

         {/* Delete Confirmation Dialog */}
         <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
         >
            <DialogTitle>
               <Box
                  sx={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: 1,
                     color: 'error.main',
                  }}
               >
                  <DeleteIcon />
                  Delete Feature Flag
               </Box>
            </DialogTitle>
            <DialogContent>
               <Alert severity="warning" sx={{ mb: 2 }}>
                  This action cannot be undone. This will permanently delete the
                  feature flag and may affect users who depend on it.
               </Alert>
               <Typography variant="body1">
                  Are you sure you want to delete the feature flag{' '}
                  <strong>"${selectedFlag?.name}"</strong>?
               </Typography>
               <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Key: {selectedFlag?.key}
               </Typography>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
               </Button>
               <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                     // Handle delete logic here
                     if (selectedFlag) {
                        setFeatureFlags((prev) =>
                           prev.filter((f) => f._id !== selectedFlag._id)
                        );
                     }
                     setDeleteDialogOpen(false);
                  }}
               >
                  Delete Forever
               </Button>
            </DialogActions>
         </Dialog>
      </Container>
   );
};

export default FeatureFlagsPage;
