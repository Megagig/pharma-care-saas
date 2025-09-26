import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users as PeopleIcon,
  BarChart3 as AssessmentIcon,
  Database as StorageIcon,
  Activity as MonitoringIcon,
  Settings as TuneIcon,
  Flag as FlagIcon,
  Shield as ShieldIcon,
  UserCheck as AdminIcon,
  Bell as NotificationsIcon,
  LayoutDashboard as DashboardIcon,
  ChevronLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useRBAC } from '../hooks/useRBAC';

const SaasSettings: React.FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useRBAC();
  const [activeTab, setActiveTab] = useState('overview');

  const [systemStats] = useState({
    totalUsers: 1247,
    activeSubscriptions: 892,
    monthlyRevenue: 4250000,
    systemUptime: '99.8%',
    activeFeatureFlags: 12,
    pendingLicenses: 8,
  });

  // Access control - only super_admin can view this page
  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertDescription className="text-red-800 dark:text-red-200">
            <h3 className="font-medium mb-1">Access Denied</h3>
            <p>
              This page is restricted to Super Admin users only. You need super
              admin permissions to access SaaS settings.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const settingsCategories = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: <DashboardIcon className="h-5 w-5" />,
      description: 'System metrics and health status',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <PeopleIcon className="h-5 w-5" />,
      description: 'Manage users, roles, and permissions',
    },
    {
      id: 'features',
      label: 'Feature Flags',
      icon: <FlagIcon className="h-5 w-5" />,
      description: 'Control feature availability',
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: <ShieldIcon className="h-5 w-5" />,
      description: 'Security policies and configurations',
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: <AssessmentIcon className="h-5 w-5" />,
      description: 'System analytics and reporting',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon className="h-5 w-5" />,
      description: 'System notifications and alerts',
    },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <PeopleIcon className="h-8 w-8 text-blue-500" />
              <h3 className="font-medium">Total Users</h3>
            </div>
            <div className="text-2xl font-bold">
              {systemStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AssessmentIcon className="h-8 w-8 text-green-500" />
              <h3 className="font-medium">Active Subscriptions</h3>
            </div>
            <div className="text-2xl font-bold">
              {systemStats.activeSubscriptions.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Paid subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <StorageIcon className="h-8 w-8 text-amber-500" />
              <h3 className="font-medium">Monthly Revenue</h3>
            </div>
            <div className="text-2xl font-bold">
              ₦{(systemStats.monthlyRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MonitoringIcon className="h-8 w-8 text-purple-500" />
              <h3 className="font-medium">System Uptime</h3>
            </div>
            <div className="text-2xl font-bold">
              {systemStats.systemUptime}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TuneIcon className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <Button variant="outline" size="sm">
              View All Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-4"
              asChild
            >
              <Link to="/feature-flags" className="flex flex-col items-center">
                <FlagIcon className="h-6 w-6 mb-2" />
                <span className="font-medium">Feature Flags</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {systemStats.activeFeatureFlags} active flags
                </span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-4"
              asChild
            >
              <Link to="/admin" className="flex flex-col items-center">
                <AdminIcon className="h-6 w-6 mb-2" />
                <span className="font-medium">Admin Dashboard</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  User & license management
                </span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-4 relative"
            >
              <ShieldIcon className="h-6 w-6 mb-2" />
              <span className="font-medium">License Reviews</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {systemStats.pendingLicenses} pending reviews
              </span>
              {systemStats.pendingLicenses > 0 && (
                <Badge className="absolute top-2 right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {systemStats.pendingLicenses}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitoringIcon className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Database Performance</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average response time: 45ms</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Excellent
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">API Response Time</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">95th percentile: 120ms</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Good
              </Badge>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium">Memory Usage</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">2.1GB / 8GB (26%)</span>
              </div>
              <Progress value={26} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotificationsIcon className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <PeopleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">New user registered</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">2 minutes ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                <FlagIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium">Feature flag updated</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">15 minutes ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <ShieldIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">License approved</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPlaceholderTab = (title: string) => (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          This section is under development. Advanced {title.toLowerCase()}{' '}
          features will be available soon.
        </p>
        <Button disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
                <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  SaaS Settings
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldIcon className="h-6 w-6" />
              SaaS Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive system administration and configuration
            </p>
          </div>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
            <ShieldIcon className="h-3 w-3" />
            Super Admin Access
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          {settingsCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-1"
            >
              {category.icon}
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {renderPlaceholderTab('User Management')}
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          {renderPlaceholderTab('Feature Flags')}
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {renderPlaceholderTab('Security Settings')}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderPlaceholderTab('Analytics & Reports')}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {renderPlaceholderTab('Notifications')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaasSettings;