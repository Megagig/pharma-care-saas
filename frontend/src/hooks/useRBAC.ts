import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

// Role hierarchy for frontend permission checking
const ROLE_HIERARCHY = {
  'super_admin': ['super_admin', 'pharmacy_outlet', 'pharmacy_team', 'pharmacist', 'intern_pharmacist'],
  'pharmacy_outlet': ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
  'pharmacy_team': ['pharmacy_team', 'pharmacist'],
  'pharmacist': ['pharmacist'],
  'intern_pharmacist': ['intern_pharmacist']
};

// Permission definitions
const PERMISSIONS = {
  // User management
  'users.view': 'View users',
  'users.create': 'Create users',
  'users.edit': 'Edit users',
  'users.delete': 'Delete users',
  'users.suspend': 'Suspend users',
  
  // License management
  'licenses.view': 'View licenses',
  'licenses.approve': 'Approve licenses',
  'licenses.reject': 'Reject licenses',
  
  // Patient management
  'patients.view': 'View patients',
  'patients.create': 'Create patients',
  'patients.edit': 'Edit patients',
  'patients.delete': 'Delete patients',
  
  // Medication management
  'medications.view': 'View medications',
  'medications.create': 'Create medications',
  'medications.edit': 'Edit medications',
  'medications.delete': 'Delete medications',
  
  // Clinical notes
  'notes.view': 'View clinical notes',
  'notes.create': 'Create clinical notes',
  'notes.edit': 'Edit clinical notes',
  'notes.delete': 'Delete clinical notes',
  
  // Reports and analytics
  'reports.view': 'View reports',
  'reports.export': 'Export reports',
  'analytics.view': 'View analytics',
  
  // Team management
  'team.view': 'View team',
  'team.invite': 'Invite team members',
  'team.manage': 'Manage team members',
  
  // Subscription management
  'subscription.view': 'View subscription',
  'subscription.manage': 'Manage subscription',
  
  // System administration
  'admin.users': 'User administration',
  'admin.system': 'System administration',
  'admin.features': 'Feature flag management'
};

export interface UserPermissions {
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  getAvailableFeatures: () => string[];
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canManageTeam: () => boolean;
  requiresLicense: () => boolean;
  getLicenseStatus: () => string;
  getSubscriptionTier: () => string;
}

export const useRBAC = (): UserPermissions => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        canAccess: () => false,
        getAvailableFeatures: () => [],
        isAdmin: () => false,
        isSuperAdmin: () => false,
        canManageTeam: () => false,
        requiresLicense: () => false,
        getLicenseStatus: () => 'not_required',
        getSubscriptionTier: () => 'free_trial'
      };
    }

    const hasRole = (role: string | string[]): boolean => {
      const roles = Array.isArray(role) ? role : [role];
      const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
      return roles.some(r => userRoles.includes(r));
    };

    const hasPermission = (permission: string): boolean => {
      // Super admin has all permissions
      if (user.role === 'super_admin') return true;
      
      // Check explicit permissions
      if (user.permissions?.includes(permission)) return true;
      if (user.permissions?.includes('*')) return true;
      
      // Check role-based permissions
      const [resource, action] = permission.split('.');
      return canAccess(resource, action);
    };

    const hasFeature = (feature: string): boolean => {
      // Super admin has all features
      if (user.role === 'super_admin') return true;
      
      // Check explicit features
      if (user.features?.includes(feature)) return true;
      if (user.features?.includes('*')) return true;
      
      // Check subscription tier features
      if (user.currentPlan?.features) {
        return user.currentPlan.features[feature] === true;
      }
      
      return false;
    };

    const canAccess = (resource: string, action: string): boolean => {
      // Super admin can access everything
      if (user.role === 'super_admin') return true;
      
      // Resource-specific access logic
      switch (resource) {
        case 'admin':
          return user.role === 'super_admin';
          
        case 'users':
          if (action === 'view') return hasRole(['pharmacy_outlet', 'super_admin']);
          if (action === 'manage') return user.role === 'super_admin';
          return false;
          
        case 'licenses':
          return user.role === 'super_admin';
          
        case 'patients':
        case 'medications':
        case 'notes':
          return hasRole(['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin']);
          
        case 'reports':
          return hasRole(['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'super_admin']) &&
                 hasFeature('basic_reports');
          
        case 'team':
          return hasRole(['pharmacy_team', 'pharmacy_outlet', 'super_admin']) &&
                 hasFeature('team_management');
          
        case 'subscription':
          if (action === 'view') return true; // All users can view their subscription
          if (action === 'manage') return hasRole(['pharmacy_outlet', 'super_admin']);
          return false;
          
        default:
          return false;
      }
    };

    const getAvailableFeatures = (): string[] => {
      if (user.role === 'super_admin') return ['*'];
      return user.features || [];
    };

    const isAdmin = (): boolean => {
      return user.role === 'super_admin';
    };

    const isSuperAdmin = (): boolean => {
      return user.role === 'super_admin';
    };

    const canManageTeam = (): boolean => {
      return hasRole(['pharmacy_team', 'pharmacy_outlet', 'super_admin']) &&
             hasFeature('team_management');
    };

    const requiresLicense = (): boolean => {
      return ['pharmacist', 'intern_pharmacist'].includes(user.role);
    };

    const getLicenseStatus = (): string => {
      return user.licenseStatus || 'not_required';
    };

    const getSubscriptionTier = (): string => {
      return user.subscriptionTier || 'free_trial';
    };

    return {
      hasRole,
      hasPermission,
      hasFeature,
      canAccess,
      getAvailableFeatures,
      isAdmin,
      isSuperAdmin,
      canManageTeam,
      requiresLicense,
      getLicenseStatus,
      getSubscriptionTier
    };
  }, [user]);
};

// Hook for checking specific permissions with loading state
export const usePermissionCheck = (permission: string) => {
  const { hasPermission } = useRBAC();
  const { loading } = useAuth();
  
  return {
    hasPermission: hasPermission(permission),
    loading
  };
};

// Hook for checking feature access
export const useFeatureCheck = (feature: string) => {
  const { hasFeature } = useRBAC();
  const { loading } = useAuth();
  
  return {
    hasFeature: hasFeature(feature),
    loading
  };
};

// Hook for subscription status
export const useSubscriptionStatus = () => {
  const { user } = useAuth();
  const { getSubscriptionTier } = useRBAC();
  
  return useMemo(() => {
    if (!user?.currentSubscription) {
      return {
        tier: 'free_trial',
        status: 'trial',
        isActive: false,
        isExpired: true,
        daysRemaining: 0
      };
    }
    
    const subscription = user.currentSubscription;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      tier: getSubscriptionTier(),
      status: subscription.status,
      isActive: subscription.status === 'active',
      isExpired: now > endDate,
      daysRemaining: Math.max(0, daysRemaining),
      endDate: endDate
    };
  }, [user, getSubscriptionTier]);
};