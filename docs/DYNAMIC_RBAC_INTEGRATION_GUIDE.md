# Dynamic RBAC Frontend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the Dynamic RBAC system into frontend applications. It covers React components, hooks, utilities, and best practices for implementing role-based access control in your UI.

## Table of Contents

1. [Quick Start](#quick-start)
2. [React Hooks](#react-hooks)
3. [Components](#components)
4. [Utilities](#utilities)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Testing](#testing)
9. [Migration Guide](#migration-guide)

## Quick Start

### Installation

```bash
npm install @pharma-care/rbac-client
# or
yarn add @pharma-care/rbac-client
```

### Basic Setup

```typescript
// src/providers/RBACProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { RBACClient } from '@pharma-care/rbac-client';

const RBACContext = createContext<RBACClient | null>(null);

interface RBACProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
  token: string;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({
  children,
  apiBaseUrl,
  token,
}) => {
  const rbacClient = new RBACClient({
    baseURL: apiBaseUrl,
    token,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
  });

  return (
    <RBACContext.Provider value={rbacClient}>{children}</RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
};
```

### App Integration

```typescript
// src/App.tsx
import React from 'react';
import { RBACProvider } from './providers/RBACProvider';
import { useAuth } from './hooks/useAuth';

function App() {
  const { token } = useAuth();

  return (
    <RBACProvider apiBaseUrl="https://api.pharma-care.com" token={token}>
      <AppContent />
    </RBACProvider>
  );
}
```

## React Hooks

### usePermissions Hook

```typescript
// src/hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { useRBAC } from '../providers/RBACProvider';

interface UsePermissionsResult {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const usePermissions = (userId?: string): UsePermissionsResult => {
  const rbacClient = useRBAC();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rbacClient.users.getEffectivePermissions(
        userId || 'current'
      );

      setPermissions(response.effectivePermissions);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((permission) =>
      permissions.includes(permission)
    );
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((permission) =>
      permissions.includes(permission)
    );
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    error,
    refetch: fetchPermissions,
  };
};
```

### useRoles Hook

```typescript
// src/hooks/useRoles.ts
import { useState, useEffect } from 'react';
import { useRBAC } from '../providers/RBACProvider';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

interface UseRolesResult {
  roles: Role[];
  userRoles: Role[];
  hasRole: (roleName: string) => boolean;
  loading: boolean;
  error: Error | null;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  revokeRole: (userId: string, roleId: string) => Promise<void>;
}

export const useRoles = (userId?: string): UseRolesResult => {
  const rbacClient = useRBAC();
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [allRoles, userPermissions] = await Promise.all([
          rbacClient.roles.getAll(),
          userId ? rbacClient.users.getEffectivePermissions(userId) : null,
        ]);

        setRoles(allRoles.roles);

        if (userPermissions) {
          setUserRoles(userPermissions.assignedRoles);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const hasRole = (roleName: string): boolean => {
    return userRoles.some((role) => role.name === roleName);
  };

  const assignRole = async (userId: string, roleId: string): Promise<void> => {
    try {
      await rbacClient.users.assignRoles(userId, { roleIds: [roleId] });
      // Refresh user roles
      const userPermissions = await rbacClient.users.getEffectivePermissions(
        userId
      );
      setUserRoles(userPermissions.assignedRoles);
    } catch (err) {
      throw new Error(`Failed to assign role: ${err.message}`);
    }
  };

  const revokeRole = async (userId: string, roleId: string): Promise<void> => {
    try {
      await rbacClient.users.revokeRole(userId, roleId);
      // Refresh user roles
      const userPermissions = await rbacClient.users.getEffectivePermissions(
        userId
      );
      setUserRoles(userPermissions.assignedRoles);
    } catch (err) {
      throw new Error(`Failed to revoke role: ${err.message}`);
    }
  };

  return {
    roles,
    userRoles,
    hasRole,
    loading,
    error,
    assignRole,
    revokeRole,
  };
};
```

## Components

### PermissionGate Component

```typescript
// src/components/PermissionGate.tsx
import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
  userId?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  userId,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } =
    usePermissions(userId);

  if (loading) {
    return <div className="permission-gate-loading">Loading...</div>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Usage examples:
// <PermissionGate permission="patient.read">
//   <PatientList />
// </PermissionGate>
//
// <PermissionGate
//   permissions={["patient.create", "patient.update"]}
//   requireAll={false}
//   fallback={<div>Access denied</div>}
// >
//   <PatientForm />
// </PermissionGate>
```

### RoleGate Component

```typescript
// src/components/RoleGate.tsx
import React, { ReactNode } from 'react';
import { useRoles } from '../hooks/useRoles';

interface RoleGateProps {
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
  userId?: string;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  children,
  userId,
}) => {
  const { hasRole, userRoles, loading } = useRoles(userId);

  if (loading) {
    return <div className="role-gate-loading">Loading...</div>;
  }

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles.length > 0) {
    if (requireAll) {
      hasAccess = roles.every((r) => hasRole(r));
    } else {
      hasAccess = roles.some((r) => hasRole(r));
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
```

### RoleManager Component

```typescript
// src/components/RoleManager.tsx
import React, { useState } from 'react';
import { useRoles } from '../hooks/useRoles';

interface RoleManagerProps {
  userId: string;
  onRoleChange?: (roles: Role[]) => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  userId,
  onRoleChange,
}) => {
  const { roles, userRoles, loading, error, assignRole, revokeRole } =
    useRoles(userId);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleToggle = async (roleId: string, isAssigned: boolean) => {
    try {
      setIsUpdating(true);

      if (isAssigned) {
        await revokeRole(userId, roleId);
      } else {
        await assignRole(userId, roleId);
      }

      onRoleChange?.(userRoles);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div>Loading roles...</div>;
  if (error) return <div>Error loading roles: {error.message}</div>;

  return (
    <div className="role-manager">
      <h3>Role Management</h3>
      <div className="role-list">
        {roles.map((role) => {
          const isAssigned = userRoles.some((ur) => ur.id === role.id);

          return (
            <div key={role.id} className="role-item">
              <div className="role-info">
                <h4>{role.displayName}</h4>
                <p>{role.description}</p>
                <small>{role.permissions.length} permissions</small>
              </div>

              <label className="role-toggle">
                <input
                  type="checkbox"
                  checked={isAssigned}
                  disabled={isUpdating}
                  onChange={() => handleRoleToggle(role.id, isAssigned)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## Utilities

### Permission Utilities

```typescript
// src/utils/permissions.ts

export interface PermissionCheck {
  permission: string;
  required: boolean;
}

export class PermissionUtils {
  static checkPermissions(
    userPermissions: string[],
    requiredPermissions: string[] | PermissionCheck[]
  ): boolean {
    if (
      Array.isArray(requiredPermissions) &&
      typeof requiredPermissions[0] === 'string'
    ) {
      return (requiredPermissions as string[]).every((permission) =>
        userPermissions.includes(permission)
      );
    }

    const checks = requiredPermissions as PermissionCheck[];
    const requiredChecks = checks.filter((check) => check.required);
    const optionalChecks = checks.filter((check) => !check.required);

    // All required permissions must be present
    const hasRequiredPermissions = requiredChecks.every((check) =>
      userPermissions.includes(check.permission)
    );

    // At least one optional permission must be present (if any optional exist)
    const hasOptionalPermissions =
      optionalChecks.length === 0 ||
      optionalChecks.some((check) =>
        userPermissions.includes(check.permission)
      );

    return hasRequiredPermissions && hasOptionalPermissions;
  }

  static getPermissionCategories(
    permissions: string[]
  ): Record<string, string[]> {
    return permissions.reduce((categories, permission) => {
      const [category] = permission.split('.');
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
      return categories;
    }, {} as Record<string, string[]>);
  }

  static formatPermissionName(permission: string): string {
    return permission
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  static getPermissionLevel(permission: string): 'read' | 'write' | 'admin' {
    if (permission.includes('read') || permission.includes('view')) {
      return 'read';
    }
    if (
      permission.includes('create') ||
      permission.includes('update') ||
      permission.includes('delete') ||
      permission.includes('manage')
    ) {
      return 'write';
    }
    return 'admin';
  }
}
```

### Route Protection Utility

```typescript
// src/utils/routeProtection.ts
import { Navigate } from 'react-router-dom';

interface RouteProtectionConfig {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const createProtectedRoute = (
  Component: React.ComponentType,
  config: RouteProtectionConfig
) => {
  return function ProtectedRoute(props: any) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } =
      usePermissions();
    const { hasRole } = useRoles();

    let hasAccess = true;

    if (config.permissions) {
      if (config.requireAll) {
        hasAccess = hasAllPermissions(config.permissions);
      } else {
        hasAccess = hasAnyPermission(config.permissions);
      }
    }

    if (config.roles && hasAccess) {
      if (config.requireAll) {
        hasAccess = config.roles.every((role) => hasRole(role));
      } else {
        hasAccess = config.roles.some((role) => hasRole(role));
      }
    }

    if (!hasAccess) {
      return <Navigate to={config.redirectTo || '/unauthorized'} replace />;
    }

    return <Component {...props} />;
  };
};

// Usage:
// const ProtectedPatientList = createProtectedRoute(PatientList, {
//   permissions: ['patient.read'],
//   redirectTo: '/access-denied'
// });
```

## State Management

### Redux Integration

```typescript
// src/store/rbacSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface RBACState {
  permissions: string[];
  roles: Role[];
  userRoles: Role[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: RBACState = {
  permissions: [],
  roles: [],
  userRoles: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchUserPermissions = createAsyncThunk(
  'rbac/fetchUserPermissions',
  async (userId: string, { extra }) => {
    const rbacClient = extra as RBACClient;
    const response = await rbacClient.users.getEffectivePermissions(userId);
    return response;
  }
);

export const fetchRoles = createAsyncThunk(
  'rbac/fetchRoles',
  async (_, { extra }) => {
    const rbacClient = extra as RBACClient;
    const response = await rbacClient.roles.getAll();
    return response.roles;
  }
);

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    clearRBACData: (state) => {
      state.permissions = [];
      state.roles = [];
      state.userRoles = [];
      state.error = null;
      state.lastUpdated = null;
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload.effectivePermissions;
        state.userRoles = action.payload.assignedRoles;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch permissions';
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      });
  },
});

export const { clearRBACData, updatePermissions } = rbacSlice.actions;
export default rbacSlice.reducer;
```

### Context + Reducer Pattern

```typescript
// src/contexts/RBACContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface RBACState {
  permissions: string[];
  roles: Role[];
  loading: boolean;
  error: string | null;
}

type RBACAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PERMISSIONS'; payload: string[] }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_DATA' };

const rbacReducer = (state: RBACState, action: RBACAction): RBACState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload, loading: false };
    case 'SET_ROLES':
      return { ...state, roles: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_DATA':
      return { permissions: [], roles: [], loading: false, error: null };
    default:
      return state;
  }
};

const RBACContext = createContext<{
  state: RBACState;
  dispatch: React.Dispatch<RBACAction>;
} | null>(null);

export const RBACProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(rbacReducer, {
    permissions: [],
    roles: [],
    loading: false,
    error: null,
  });

  return (
    <RBACContext.Provider value={{ state, dispatch }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBACContext = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBACContext must be used within RBACProvider');
  }
  return context;
};
```

## Error Handling

### Error Boundary for RBAC

```typescript
// src/components/RBACErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RBACErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RBAC Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rbac-error">
            <h2>Permission Error</h2>
            <p>
              Unable to load permission information. Please try refreshing the
              page.
            </p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Error Handling Hook

```typescript
// src/hooks/useRBACError.ts
import { useState, useCallback } from 'react';

interface RBACError {
  code: string;
  message: string;
  details?: any;
}

export const useRBACError = () => {
  const [error, setError] = useState<RBACError | null>(null);

  const handleError = useCallback((err: any) => {
    if (err.response?.data?.code) {
      setError({
        code: err.response.data.code,
        message: err.response.data.message,
        details: err.response.data.details,
      });
    } else {
      setError({
        code: 'UNKNOWN_ERROR',
        message: err.message || 'An unknown error occurred',
        details: err,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getErrorMessage = useCallback((errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      INSUFFICIENT_PERMISSIONS:
        'You do not have permission to perform this action.',
      ROLE_NOT_FOUND: 'The requested role was not found.',
      PERMISSION_NOT_FOUND: 'The requested permission was not found.',
      AUTHENTICATION_REQUIRED: 'Please log in to continue.',
      CACHE_ERROR:
        'There was an issue loading your permissions. Please try again.',
      NETWORK_ERROR:
        'Unable to connect to the server. Please check your connection.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred.';
  }, []);

  return {
    error,
    handleError,
    clearError,
    getErrorMessage,
  };
};
```

## Performance Optimization

### Memoization Strategies

```typescript
// src/hooks/useOptimizedPermissions.ts
import { useMemo } from 'react';
import { usePermissions } from './usePermissions';

export const useOptimizedPermissions = (userId?: string) => {
  const { permissions, loading, error, ...rest } = usePermissions(userId);

  const permissionMap = useMemo(() => {
    return permissions.reduce((map, permission) => {
      map[permission] = true;
      return map;
    }, {} as Record<string, boolean>);
  }, [permissions]);

  const hasPermission = useMemo(() => {
    return (permission: string) => permissionMap[permission] || false;
  }, [permissionMap]);

  const hasAnyPermission = useMemo(() => {
    return (requiredPermissions: string[]) =>
      requiredPermissions.some((permission) => permissionMap[permission]);
  }, [permissionMap]);

  const hasAllPermissions = useMemo(() => {
    return (requiredPermissions: string[]) =>
      requiredPermissions.every((permission) => permissionMap[permission]);
  }, [permissionMap]);

  return {
    permissions,
    permissionMap,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    error,
    ...rest,
  };
};
```

### Caching Strategy

```typescript
// src/utils/permissionCache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PermissionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const permissionCache = new PermissionCache();
```

## Testing

### Testing Utilities

```typescript
// src/test-utils/rbacTestUtils.tsx
import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { RBACProvider } from '../providers/RBACProvider';

interface MockRBACProviderProps {
  children: ReactNode;
  permissions?: string[];
  roles?: Role[];
  loading?: boolean;
  error?: Error | null;
}

export const MockRBACProvider: React.FC<MockRBACProviderProps> = ({
  children,
  permissions = [],
  roles = [],
  loading = false,
  error = null,
}) => {
  const mockRBACClient = {
    users: {
      getEffectivePermissions: jest.fn().mockResolvedValue({
        effectivePermissions: permissions,
        assignedRoles: roles,
      }),
    },
    roles: {
      getAll: jest.fn().mockResolvedValue({ roles }),
    },
  };

  return (
    <RBACContext.Provider value={mockRBACClient}>
      {children}
    </RBACContext.Provider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  permissions?: string[];
  roles?: Role[];
  loading?: boolean;
  error?: Error | null;
}

export const renderWithRBAC = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { permissions, roles, loading, error, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <MockRBACProvider
      permissions={permissions}
      roles={roles}
      loading={loading}
      error={error}
    >
      {children}
    </MockRBACProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
```

### Component Testing Examples

```typescript
// src/components/__tests__/PermissionGate.test.tsx
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRBAC } from '../../test-utils/rbacTestUtils';
import { PermissionGate } from '../PermissionGate';

describe('PermissionGate', () => {
  it('renders children when user has required permission', () => {
    renderWithRBAC(
      <PermissionGate permission="patient.read">
        <div>Patient Content</div>
      </PermissionGate>,
      { permissions: ['patient.read', 'patient.write'] }
    );

    expect(screen.getByText('Patient Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks permission', () => {
    renderWithRBAC(
      <PermissionGate
        permission="patient.delete"
        fallback={<div>Access Denied</div>}
      >
        <div>Patient Content</div>
      </PermissionGate>,
      { permissions: ['patient.read'] }
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Patient Content')).not.toBeInTheDocument();
  });

  it('handles multiple permissions with requireAll=false', () => {
    renderWithRBAC(
      <PermissionGate
        permissions={['patient.create', 'patient.update']}
        requireAll={false}
      >
        <div>Patient Form</div>
      </PermissionGate>,
      { permissions: ['patient.read', 'patient.create'] }
    );

    expect(screen.getByText('Patient Form')).toBeInTheDocument();
  });

  it('handles multiple permissions with requireAll=true', () => {
    renderWithRBAC(
      <PermissionGate
        permissions={['patient.create', 'patient.update']}
        requireAll={true}
        fallback={<div>Insufficient Permissions</div>}
      >
        <div>Patient Form</div>
      </PermissionGate>,
      { permissions: ['patient.read', 'patient.create'] }
    );

    expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// src/hooks/__tests__/usePermissions.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { MockRBACProvider } from '../../test-utils/rbacTestUtils';

describe('usePermissions', () => {
  it('fetches and returns user permissions', async () => {
    const wrapper = ({ children }) => (
      <MockRBACProvider permissions={['patient.read', 'patient.write']}>
        {children}
      </MockRBACProvider>
    );

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([
      'patient.read',
      'patient.write',
    ]);
    expect(result.current.hasPermission('patient.read')).toBe(true);
    expect(result.current.hasPermission('patient.delete')).toBe(false);
  });

  it('handles permission checking correctly', async () => {
    const wrapper = ({ children }) => (
      <MockRBACProvider permissions={['patient.read', 'medication.view']}>
        {children}
      </MockRBACProvider>
    );

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(
      result.current.hasAnyPermission(['patient.read', 'patient.write'])
    ).toBe(true);
    expect(
      result.current.hasAllPermissions(['patient.read', 'medication.view'])
    ).toBe(true);
    expect(
      result.current.hasAllPermissions(['patient.read', 'patient.write'])
    ).toBe(false);
  });
});
```

## Migration Guide

### From Static to Dynamic RBAC

#### 1. Update Permission Checks

**Before (Static):**

```typescript
// Old static permission check
import { hasPermission } from '../utils/staticRBAC';

const canViewPatients = hasPermission(user, 'VIEW_PATIENTS');

if (canViewPatients) {
  // Show patient list
}
```

**After (Dynamic):**

```typescript
// New dynamic permission check
import { usePermissions } from '../hooks/usePermissions';

const PatientComponent = () => {
  const { hasPermission } = usePermissions();

  if (hasPermission('patient.read')) {
    return <PatientList />;
  }

  return <AccessDenied />;
};
```

#### 2. Update Role Checks

**Before:**

```typescript
const isManager = user.roles.includes('MANAGER');
```

**After:**

```typescript
const { hasRole } = useRoles();
const isManager = hasRole('pharmacy_manager');
```

#### 3. Update Route Protection

**Before:**

```typescript
<Route
  path="/patients"
  element={
    user.permissions.includes('VIEW_PATIENTS') ? (
      <PatientList />
    ) : (
      <Navigate to="/unauthorized" />
    )
  }
/>
```

**After:**

```typescript
<Route
  path="/patients"
  element={
    <PermissionGate
      permission="patient.read"
      fallback={<Navigate to="/unauthorized" />}
    >
      <PatientList />
    </PermissionGate>
  }
/>
```

### Gradual Migration Strategy

1. **Phase 1: Dual Support**

   ```typescript
   // Support both old and new systems during transition
   const hasAccess =
     hasPermission('patient.read') ||
     legacyHasPermission(user, 'VIEW_PATIENTS');
   ```

2. **Phase 2: Component-by-Component**

   ```typescript
   // Migrate components one at a time
   const useHybridPermissions = () => {
     const { hasPermission: hasNewPermission } = usePermissions();
     const hasLegacyPermission = useLegacyPermissions();

     return {
       hasPermission: (permission: string) => {
         // Try new system first, fallback to legacy
         return (
           hasNewPermission(permission) ||
           hasLegacyPermission(mapToLegacyPermission(permission))
         );
       },
     };
   };
   ```

3. **Phase 3: Complete Migration**
   ```typescript
   // Remove all legacy code
   const { hasPermission } = usePermissions();
   ```

## Best Practices

### 1. Permission Naming Conventions

```typescript
// Use consistent naming patterns
'resource.action'; // patient.read, medication.create
'category.resource.action'; // admin.user.delete
'workspace.resource.action'; // pharmacy.inventory.manage
```

### 2. Error Handling

```typescript
// Always handle loading and error states
const { permissions, loading, error } = usePermissions();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Performance Optimization

```typescript
// Use memoization for expensive permission checks
const expensivePermissionCheck = useMemo(() => {
  return hasAllPermissions(complexPermissionList);
}, [permissions, complexPermissionList]);
```

### 4. Testing

```typescript
// Always test permission logic
it('should hide sensitive actions for regular users', () => {
  renderWithRBAC(<Component />, {
    permissions: ['patient.read'], // No admin permissions
  });

  expect(screen.queryByText('Delete Patient')).not.toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Permissions not updating after role change**

   ```typescript
   // Force refresh permissions
   const { refetch } = usePermissions();
   await refetch();
   ```

2. **Cache not invalidating**

   ```typescript
   // Clear permission cache
   permissionCache.invalidate('user:*');
   ```

3. **Performance issues with many permission checks**
   ```typescript
   // Use optimized hook
   const { hasPermission } = useOptimizedPermissions();
   ```

### Debug Tools

```typescript
// Add debug logging
const usePermissionsWithDebug = (userId?: string) => {
  const result = usePermissions(userId);

  useEffect(() => {
    console.log('Permissions updated:', result.permissions);
  }, [result.permissions]);

  return result;
};
```

This integration guide provides comprehensive coverage of implementing Dynamic RBAC in frontend applications with practical examples, testing strategies, and migration guidance.
