# Frontend Integration Guide - Workspace Subscription & RBAC

## Overview

This guide provides comprehensive instructions for integrating the new workspace-level subscription management, invitation system, and enhanced RBAC features into the frontend application.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Authentication Integration](#authentication-integration)
3. [Workspace Context Management](#workspace-context-management)
4. [Invitation System Integration](#invitation-system-integration)
5. [Subscription Management](#subscription-management)
6. [Usage Monitoring](#usage-monitoring)
7. [Permission-Based UI](#permission-based-ui)
8. [Error Handling](#error-handling)
9. [Testing Strategies](#testing-strategies)

---

## Setup and Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000

# Feature Flags
REACT_APP_ENABLE_WORKSPACE_SUBSCRIPTIONS=true
REACT_APP_ENABLE_INVITATIONS=true
REACT_APP_ENABLE_USAGE_MONITORING=true

# Payment Integration
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

### Dependencies

Install required dependencies:

```bash
npm install @tanstack/react-query axios react-hook-form zod
npm install @types/node --save-dev
```

### API Client Setup

Create a centralized API client with authentication and error handling:

```typescript
// src/lib/apiClient.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

export interface APIError {
  success: false;
  message: string;
  code?: string;
  details?: any;
  upgradeRequired?: boolean;
  upgradeTo?: string;
  retryAfter?: number;
}

export interface APISuccess<T = any> {
  success: true;
  message?: string;
  data: T;
}

export type APIResponse<T = any> = APISuccess<T> | APIError;

class APIClient {
  private client = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<APIError>) => {
        const apiError = error.response?.data;

        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = apiError?.retryAfter || 60;
          toast.error(
            `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          );
          return Promise.reject(error);
        }

        // Handle upgrade required errors
        if (apiError?.upgradeRequired) {
          toast.error(
            `${apiError.message}. Please upgrade to ${apiError.upgradeTo} plan.`,
            { duration: 5000 }
          );
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

---

## Authentication Integration

### Enhanced Auth Context

Update your auth context to include workspace information:

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'user';
  status: 'active' | 'suspended' | 'license_rejected';
}

interface Workspace {
  id: string;
  name: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'expired' | 'canceled';
  currentPlanId: string;
  trialEndDate?: string;
  userRole: 'Owner' | 'Pharmacist' | 'Technician' | 'Intern';
}

interface Subscription {
  id: string;
  status: string;
  tier: string;
  features: string[];
  limits: Record<string, number | null>;
  endDate: string;
  isExpired: boolean;
  isInGracePeriod: boolean;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  subscription: Subscription | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (resource: string, current: number) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get user profile with workspace context
      const response = await apiClient.get<
        APISuccess<{
          user: User;
          workspace: Workspace | null;
          subscription: Subscription | null;
          permissions: string[];
        }>
      >('/api/auth/profile');

      if (response.success) {
        setUser(response.data.user);
        setWorkspace(response.data.workspace);
        setSubscription(response.data.subscription);
        setPermissions(response.data.permissions);
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<
      APISuccess<{
        token: string;
        user: User;
        workspace: Workspace | null;
      }>
    >('/api/auth/login', { email, password });

    if (response.success) {
      localStorage.setItem('authToken', response.data.token);
      await refreshAuth();
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setWorkspace(null);
    setSubscription(null);
    setPermissions([]);
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission) || user?.role === 'super_admin';
  };

  const hasFeature = (feature: string): boolean => {
    return (
      subscription?.features.includes(feature) ||
      subscription?.features.includes('*') ||
      user?.role === 'super_admin'
    );
  };

  const isWithinLimit = (resource: string, current: number): boolean => {
    const limit = subscription?.limits[resource];
    return limit === null || current < limit;
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        subscription,
        permissions,
        loading,
        login,
        logout,
        refreshAuth,
        hasPermission,
        hasFeature,
        isWithinLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Workspace Context Management

### Workspace Selector Component

```typescript
// src/components/WorkspaceSelector.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/apiClient';

interface WorkspaceSelectorProps {
  onWorkspaceChange?: (workspace: any) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onWorkspaceChange,
}) => {
  const { user, workspace, refreshAuth } = useAuth();
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const switchWorkspace = async (workspaceId: string) => {
    setLoading(true);
    try {
      await apiClient.post('/api/auth/switch-workspace', { workspaceId });
      await refreshAuth();
      onWorkspaceChange?.(workspace);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!workspace) {
    return (
      <div className="workspace-selector">
        <span>No workspace selected</span>
      </div>
    );
  }

  return (
    <div className="workspace-selector">
      <div className="current-workspace">
        <h3>{workspace.name}</h3>
        <span className={`status ${workspace.subscriptionStatus}`}>
          {workspace.subscriptionStatus}
        </span>
      </div>

      {workspace.subscriptionStatus === 'trial' && workspace.trialEndDate && (
        <div className="trial-warning">
          <p>
            Trial expires:{' '}
            {new Date(workspace.trialEndDate).toLocaleDateString()}
          </p>
          <button
            onClick={() => (window.location.href = '/subscription/upgrade')}
          >
            Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Invitation System Integration

### Invitation Management Hook

```typescript
// src/hooks/useInvitations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { toast } from 'react-hot-toast';

interface CreateInvitationData {
  email: string;
  role: 'Owner' | 'Pharmacist' | 'Technician' | 'Intern';
  customMessage?: string;
}

interface Invitation {
  id: string;
  email: string;
  code: string;
  role: string;
  status: 'active' | 'expired' | 'used' | 'canceled';
  expiresAt: string;
  createdAt: string;
  metadata: {
    inviterName: string;
    workspaceName: string;
    customMessage?: string;
  };
}

export const useInvitations = (workspaceId: string) => {
  const queryClient = useQueryClient();

  // Get invitations
  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: () =>
      apiClient.get<
        APISuccess<{
          invitations: Invitation[];
          pagination: any;
          stats: any;
        }>
      >(`/api/workspaces/${workspaceId}/invitations`),
    enabled: !!workspaceId,
  });

  // Create invitation
  const createInvitation = useMutation({
    mutationFn: (data: CreateInvitationData) =>
      apiClient.post(`/api/workspaces/${workspaceId}/invitations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
      toast.success('Invitation sent successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to send invitation';
      toast.error(message);
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.delete(`/api/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
      toast.success('Invitation canceled');
    },
    onError: () => {
      toast.error('Failed to cancel invitation');
    },
  });

  // Resend invitation
  const resendInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(`/api/invitations/${invitationId}/resend`),
    onSuccess: () => {
      toast.success('Invitation resent successfully!');
    },
    onError: () => {
      toast.error('Failed to resend invitation');
    },
  });

  return {
    invitations: invitations?.data,
    isLoading,
    error,
    createInvitation,
    cancelInvitation,
    resendInvitation,
  };
};
```

### Invitation Form Component

```typescript
// src/components/InvitationForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInvitations } from '../hooks/useInvitations';
import { useAuth } from '../context/AuthContext';

const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['Owner', 'Pharmacist', 'Technician', 'Intern']),
  customMessage: z.string().max(500).optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface InvitationFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  workspaceId,
  onSuccess,
}) => {
  const { hasPermission } = useAuth();
  const { createInvitation } = useInvitations(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
  });

  if (!hasPermission('invitation.create')) {
    return (
      <div className="permission-denied">
        <p>You don't have permission to send invitations.</p>
      </div>
    );
  }

  const onSubmit = async (data: InvitationFormData) => {
    try {
      await createInvitation.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="invitation-form">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'error' : ''}
          placeholder="colleague@example.com"
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          {...register('role')}
          className={errors.role ? 'error' : ''}
        >
          <option value="">Select a role</option>
          <option value="Pharmacist">Pharmacist</option>
          <option value="Technician">Technician</option>
          <option value="Intern">Intern</option>
        </select>
        {errors.role && (
          <span className="error-message">{errors.role.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="customMessage">Custom Message (Optional)</label>
        <textarea
          id="customMessage"
          {...register('customMessage')}
          placeholder="Welcome to our team! We're excited to have you join us."
          rows={3}
          maxLength={500}
        />
        {errors.customMessage && (
          <span className="error-message">{errors.customMessage.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary">
        {isSubmitting ? 'Sending...' : 'Send Invitation'}
      </button>
    </form>
  );
};
```

### Invitation Acceptance Page

```typescript
// src/pages/AcceptInvitation.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

interface InvitationDetails {
  valid: boolean;
  invitation?: {
    workspaceName: string;
    role: string;
    inviterName: string;
    expiresAt: string;
    customMessage?: string;
  };
  reason?: string;
  message?: string;
}

export const AcceptInvitation: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (code) {
      validateInvitation(code);
    }
  }, [code]);

  const validateInvitation = async (invitationCode: string) => {
    try {
      const response = await apiClient.get<APISuccess<InvitationDetails>>(
        `/api/invitations/${invitationCode}/validate`
      );
      setInvitation(response.data);
    } catch (error) {
      setInvitation({ valid: false, message: 'Invalid invitation code' });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (userData?: any) => {
    if (!code) return;

    setAccepting(true);
    try {
      const response = await apiClient.post(`/api/invitations/${code}/accept`, {
        userData,
      });

      if (response.success) {
        await refreshAuth();
        navigate('/dashboard', {
          state: { message: 'Welcome to the team!' },
        });
      }
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="loading">Validating invitation...</div>;
  }

  if (!invitation?.valid) {
    return (
      <div className="invitation-invalid">
        <h2>Invalid Invitation</h2>
        <p>{invitation?.message || 'This invitation is no longer valid.'}</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="accept-invitation">
      <div className="invitation-details">
        <h2>You're Invited!</h2>
        <p>
          <strong>{invitation.invitation?.inviterName}</strong> has invited you
          to join <strong>{invitation.invitation?.workspaceName}</strong> as a{' '}
          <strong>{invitation.invitation?.role}</strong>.
        </p>

        {invitation.invitation?.customMessage && (
          <div className="custom-message">
            <p>"{invitation.invitation.customMessage}"</p>
          </div>
        )}

        <p className="expires">
          This invitation expires on{' '}
          {new Date(
            invitation.invitation?.expiresAt || ''
          ).toLocaleDateString()}
        </p>
      </div>

      {user ? (
        <div className="accept-section">
          <p>Accept this invitation with your current account:</p>
          <p>
            <strong>{user.email}</strong>
          </p>
          <button
            onClick={() => acceptInvitation()}
            disabled={accepting}
            className="btn btn-primary"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>
      ) : (
        <div className="signup-section">
          <p>Create your account to accept this invitation:</p>
          <form onSubmit={handleSubmit(acceptInvitation)}>
            <div className="form-group">
              <input
                {...register('firstName', {
                  required: 'First name is required',
                })}
                placeholder="First Name"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && (
                <span className="error-message">
                  {errors.firstName.message as string}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                {...register('lastName', { required: 'Last name is required' })}
                placeholder="Last Name"
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && (
                <span className="error-message">
                  {errors.lastName.message as string}
                </span>
              )}
            </div>

            <div className="form-group">
              <input
                {...register('phoneNumber')}
                placeholder="Phone Number (Optional)"
                type="tel"
              />
            </div>

            <div className="form-group">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                placeholder="Password"
                type="password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <span className="error-message">
                  {errors.password.message as string}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={accepting}
              className="btn btn-primary"
            >
              {accepting ? 'Creating Account...' : 'Accept & Create Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
```

---

## Subscription Management

### Subscription Hook

```typescript
// src/hooks/useSubscription.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { toast } from 'react-hot-toast';

export const useSubscription = (workspaceId: string) => {
  const queryClient = useQueryClient();

  // Get subscription details
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['subscription', workspaceId],
    queryFn: () => apiClient.get(`/api/subscriptions/workspace/${workspaceId}`),
    enabled: !!workspaceId,
  });

  // Upgrade subscription
  const upgradeSubscription = useMutation({
    mutationFn: (data: { planId: string; billingInterval: string }) =>
      apiClient.post('/api/subscriptions/workspace/upgrade', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', workspaceId],
      });
      toast.success('Subscription upgraded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Upgrade failed');
    },
  });

  // Downgrade subscription
  const downgradeSubscription = useMutation({
    mutationFn: (data: { planId: string }) =>
      apiClient.post('/api/subscriptions/workspace/downgrade', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', workspaceId],
      });
      toast.success('Downgrade scheduled for end of billing period');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Downgrade failed');
    },
  });

  return {
    subscription: subscription?.data,
    isLoading,
    error,
    upgradeSubscription,
    downgradeSubscription,
  };
};
```

---

## Usage Monitoring

### Usage Dashboard Component

```typescript
// src/components/UsageDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

interface UsageStats {
  workspace: { id: string; name: string };
  plan: { name: string; tier: string };
  usage: Record<
    string,
    {
      current: number;
      limit: number | null;
      percentage: number;
      unlimited: boolean;
      unit?: string;
    }
  >;
  alerts: Array<{
    type: 'warning' | 'error';
    resource: string;
    message: string;
    upgradeRecommended: boolean;
  }>;
}

export const UsageDashboard: React.FC = () => {
  const { hasPermission } = useAuth();

  const { data: usageStats, isLoading } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => apiClient.get<APISuccess<UsageStats>>('/api/usage/stats'),
  });

  if (!hasPermission('workspace.view')) {
    return <div>Access denied</div>;
  }

  if (isLoading) {
    return <div>Loading usage statistics...</div>;
  }

  const usage = usageStats?.data.usage;
  const alerts = usageStats?.data.alerts || [];

  return (
    <div className="usage-dashboard">
      <h2>Usage Statistics</h2>

      {alerts.length > 0 && (
        <div className="usage-alerts">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.type}`}>
              <p>{alert.message}</p>
              {alert.upgradeRecommended && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    (window.location.href = '/subscription/upgrade')
                  }
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="usage-grid">
        {usage &&
          Object.entries(usage).map(([resource, stats]) => (
            <div key={resource} className="usage-card">
              <h3>{resource.charAt(0).toUpperCase() + resource.slice(1)}</h3>

              <div className="usage-bar">
                <div
                  className="usage-fill"
                  style={{
                    width: `${Math.min(stats.percentage, 100)}%`,
                    backgroundColor:
                      stats.percentage > 90
                        ? '#ef4444'
                        : stats.percentage > 70
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                />
              </div>

              <div className="usage-text">
                {stats.unlimited ? (
                  <span>Unlimited</span>
                ) : (
                  <span>
                    {stats.current.toLocaleString()} /{' '}
                    {stats.limit?.toLocaleString()}
                    {stats.unit && ` ${stats.unit}`}
                  </span>
                )}
                <span className="percentage">
                  {stats.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
```

---

## Permission-Based UI

### Permission Guard Components

```typescript
// src/components/PermissionGuard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGuardProps {
  permission?: string;
  feature?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  feature,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasFeature, workspace } = useAuth();

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check feature access
  if (feature && !hasFeature(feature)) {
    return <>{fallback}</>;
  }

  // Check role
  if (role && workspace?.userRole !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Usage examples:
export const ExampleUsage: React.FC = () => {
  return (
    <div>
      <PermissionGuard
        permission="invitation.create"
        fallback={<p>You cannot send invitations</p>}
      >
        <button>Send Invitation</button>
      </PermissionGuard>

      <PermissionGuard
        feature="advanced_reports"
        fallback={<UpgradePrompt feature="Advanced Reports" />}
      >
        <AdvancedReportsComponent />
      </PermissionGuard>

      <PermissionGuard role="Owner">
        <WorkspaceSettingsButton />
      </PermissionGuard>
    </div>
  );
};
```

### Feature Upgrade Prompt

```typescript
// src/components/UpgradePrompt.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  description,
  className = '',
}) => {
  const { subscription } = useAuth();

  const handleUpgrade = () => {
    window.location.href = '/subscription/upgrade';
  };

  return (
    <div className={`upgrade-prompt ${className}`}>
      <div className="upgrade-content">
        <h3>Upgrade Required</h3>
        <p>
          <strong>{feature}</strong> is not available in your current{' '}
          <span className="plan-name">{subscription?.tier}</span> plan.
        </p>
        {description && <p>{description}</p>}

        <div className="upgrade-actions">
          <button onClick={handleUpgrade} className="btn btn-primary">
            Upgrade Plan
          </button>
          <a href="/pricing" className="btn btn-secondary">
            View Plans
          </a>
        </div>
      </div>
    </div>
  );
};
```

---

## Error Handling

### Global Error Handler

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### API Error Handler Hook

```typescript
// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const useErrorHandler = () => {
  const { logout } = useAuth();

  const handleError = useCallback(
    (error: any) => {
      const response = error.response;
      const data = response?.data;

      // Handle authentication errors
      if (response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        logout();
        return;
      }

      // Handle permission errors
      if (response?.status === 403) {
        toast.error(
          data?.message || "You don't have permission to perform this action."
        );
        return;
      }

      // Handle upgrade required errors
      if (data?.upgradeRequired) {
        toast.error(
          `${data.message}. Please upgrade to ${data.upgradeTo} plan.`,
          {
            duration: 5000,
            action: {
              label: 'Upgrade',
              onClick: () => (window.location.href = '/subscription/upgrade'),
            },
          }
        );
        return;
      }

      // Handle rate limiting
      if (response?.status === 429) {
        const retryAfter = data?.retryAfter || 60;
        toast.error(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
        return;
      }

      // Handle validation errors
      if (response?.status === 400 && data?.details) {
        const validationErrors = Object.values(data.details).join(', ');
        toast.error(`Validation error: ${validationErrors}`);
        return;
      }

      // Generic error handling
      const message =
        data?.message || error.message || 'An unexpected error occurred';
      toast.error(message);
    },
    [logout]
  );

  return { handleError };
};
```

---

## Testing Strategies

### Component Testing

```typescript
// src/components/__tests__/InvitationForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvitationForm } from '../InvitationForm';
import { AuthProvider } from '../../context/AuthContext';

// Mock API client
jest.mock('../../lib/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('InvitationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<InvitationForm workspaceId="test-workspace" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/custom message/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<InvitationForm workspaceId="test-workspace" />, {
      wrapper: createWrapper(),
    });

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
    require('../../lib/apiClient').apiClient.post = mockPost;

    render(<InvitationForm workspaceId="test-workspace" />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: 'Pharmacist' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/api/workspaces/test-workspace/invitations',
        {
          email: 'test@example.com',
          role: 'Pharmacist',
          customMessage: '',
        }
      );
    });
  });
});
```

### Integration Testing

```typescript
// src/__tests__/integration/InvitationFlow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../App';

// Mock API responses
const mockApiResponses = {
  '/api/auth/profile': {
    success: true,
    data: {
      user: { id: '1', email: 'owner@test.com', role: 'user' },
      workspace: { id: 'ws1', name: 'Test Workspace', userRole: 'Owner' },
      subscription: { features: ['team_management'], limits: {} },
      permissions: ['invitation.create'],
    },
  },
  '/api/workspaces/ws1/invitations': {
    success: true,
    data: { invitations: [], stats: {} },
  },
};

// Setup test environment
const setupTest = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Invitation Flow Integration', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });

    // Mock fetch
    global.fetch = jest.fn((url) => {
      const response = mockApiResponses[url as keyof typeof mockApiResponses];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      });
    }) as jest.Mock;
  });

  it('completes full invitation flow', async () => {
    setupTest();

    // Navigate to team management
    fireEvent.click(screen.getByText(/team/i));

    // Fill invitation form
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'newuser@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: 'Pharmacist' },
    });

    // Submit invitation
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    // Verify success message
    await waitFor(() => {
      expect(
        screen.getByText(/invitation sent successfully/i)
      ).toBeInTheDocument();
    });
  });
});
```

---

This comprehensive frontend integration guide provides all the necessary components, hooks, and patterns needed to integrate the new workspace subscription and RBAC features into your React application. The examples include proper error handling, permission checking, and user experience considerations.
