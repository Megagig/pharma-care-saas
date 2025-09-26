import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Label, Card, CardContent, CardHeader, Dialog, DialogContent, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Alert, Skeleton, Switch, Separator, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Home, Filter, Plus, Flag, Edit, Trash2, Settings, Check, X, AlertTriangle } from 'lucide-react';

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
  { value: 'core', label: 'Core Features', color: 'bg-blue-100 text-blue-800' },
  { value: 'analytics', label: 'Analytics & Reporting', color: 'bg-purple-100 text-purple-800' },
  { value: 'collaboration', label: 'Collaboration & Teams', color: 'bg-green-100 text-green-800' },
  { value: 'integration', label: 'Integrations', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'compliance', label: 'Compliance & Regulations', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'administration', label: 'Administration', color: 'bg-red-100 text-red-800' },
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
            allowedRoles: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet'],
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
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm mb-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Dashboard
          </Link>
          <span className="text-gray-500">/</span>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800">
            Admin
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">Feature Flags</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Feature Flags Management</h1>
            <p className="text-gray-600">
              Control feature access across different subscription tiers and user roles
            </p>
          </div>
          <Button onClick={handleCreateFlag} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Create Feature Flag
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-semibold">Filters & Search</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Flag className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">
                Feature Flags ({filteredFlags.length})
              </h2>
            </div>
          </div>
        </CardHeader>
        <Separator />
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from(new Array(5)).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((flag) => (
                    <TableRow key={flag._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch
                            checked={flag.isActive}
                            onCheckedChange={() => handleToggleFlag(flag)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{flag.name}</div>
                          <div className="text-sm text-gray-500">{flag.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{flag.key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryInfo(flag.metadata.category).color}>
                          {getCategoryInfo(flag.metadata.category).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(flag.metadata.priority)}>
                          {flag.metadata.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flag.allowedTiers.slice(0, 2).map((tier) => (
                            <Badge key={tier} variant="outline" className="text-xs">
                              {tier}
                            </Badge>
                          ))}
                          {flag.allowedTiers.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{flag.allowedTiers.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFlag(flag)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFlag(flag)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
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
        )}
      </Card>

      {/* Create Feature Flag Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            <div className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Feature Flag
            </div>
          </DialogTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="key">Feature Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier for the feature</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' | 'critical' })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tiers">Allowed Tiers</Label>
              <Select value={formData.allowedTiers.join(',')} onValueChange={(value) => setFormData({ ...formData, allowedTiers: value.split(',') })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tiers" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="roles">Allowed Roles</Label>
              <Select value={formData.allowedRoles.join(',')} onValueChange={(value) => setFormData({ ...formData, allowedRoles: value.split(',') })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select roles" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label>Active by default</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button>
              Create Feature Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Flag Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            <div className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit Feature Flag
            </div>
          </DialogTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Feature Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-key">Feature Key</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="mt-1"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Key cannot be changed after creation</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' | 'critical' })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-tiers">Allowed Tiers</Label>
              <Select value={formData.allowedTiers.join(',')} onValueChange={(value) => setFormData({ ...formData, allowedTiers: value.split(',') })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tiers" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-roles">Allowed Roles</Label>
              <Select value={formData.allowedRoles.join(',')} onValueChange={(value) => setFormData({ ...formData, allowedRoles: value.split(',') })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select roles" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label>Feature is active</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button>
              Update Feature Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>
            <div className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Feature Flag
            </div>
          </DialogTitle>
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="text-yellow-800">
                This action cannot be undone. This will permanently delete the feature flag and may affect users who depend on it.
              </div>
            </Alert>
            <div>
              Are you sure you want to delete the feature flag <strong>"{selectedFlag?.name}"</strong>?
            </div>
            <div className="text-sm text-gray-500">
              Key: {selectedFlag?.key}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureFlagsPage;
