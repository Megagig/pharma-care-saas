import { useMemo } from 'react';

// Define types for our user and RBAC system
type UserRole =
  | 'pharmacist'
  | 'pharmacy_team'
  | 'pharmacy_outlet'
  | 'intern_pharmacist'
  | 'super_admin';

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: [
    'super_admin',
    'pharmacy_outlet',
    'pharmacy_team',
    'pharmacist',
    'intern_pharmacist',
  ],
  pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
  pharmacy_team: ['pharmacy_team', 'pharmacist'],
  pharmacist: ['pharmacist'],
  intern_pharmacist: ['intern_pharmacist'],
};

// Feature mapping to subscription tiers
const FEATURE_TIER_MAPPING: Record<string, string[]> = {
  // Core features
  patient_management: ['free_trial', 'basic', 'pro', 'enterprise'],
  medication_management: ['free_trial', 'basic', 'pro', 'enterprise'],

  // Basic tier features
  clinical_notes: ['basic', 'pro', 'enterprise'],
  basic_reports: ['basic', 'pro', 'enterprise'],

  // Pro tier features
  advanced_analytics: ['pro', 'enterprise'],
  team_management: ['pro', 'enterprise'],
  custom_branding: ['pro', 'enterprise'],

  // Enterprise tier features
  enterprise_team_management: ['enterprise'],
  api_access: ['enterprise'],
  priority_support: ['enterprise'],
  custom_integrations: ['enterprise'],
};

// Features requiring license verification
const LICENSE_REQUIRED_FEATURES = [
  'patient_management',
  'medication_management',
  'clinical_notes',
  'prescription_management',
];

interface User {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  permissions?: string[];
  features?: string[];
  licenseStatus?: string;
  subscriptionTier?: string;
  currentPlan?: {
    features: Record<string, boolean>;
  };
  currentSubscription?: {
    status: string;
    endDate: string;
  };
}

export interface UserPermissions {
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  getAvailableFeatures: () => string[];
  isAdmin: () => boolean;
  isSuperAdmin: boolean;
  canManageTeam: () => boolean;
  requiresLicense: () => boolean;
  getLicenseStatus: () => string;
  getSubscriptionTier: () => string;
  isFeatureAccessible: (feature: string, role?: string) => boolean;
  checkSubscriptionFeature: (feature: string) => boolean;
  checkLicenseRequired: (feature: string) => boolean;
}

import { useAuth } from '../hooks/useAuth';

/**
 * Hook for Role-Based Access Control
 * Provides functions to check user permissions based on roles and features
 */
export const useRBAC = (): UserPermissions => {
  const { user } = useAuth();

  return useMemo(() => {
    // Development fallback - treat users as super_admin in development if no user role is set
    const effectiveUser = user || (
      process.env.NODE_ENV === 'development' ? {
        role: 'super_admin' as UserRole,
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        permissions: ['*'],
        features: ['*'],
        licenseStatus: 'approved',
        subscriptionTier: 'enterprise',
      } : null
    );

    if (!effectiveUser) {
      return {
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        canAccess: () => false,
        getAvailableFeatures: () => [],
        isAdmin: () => false,
        isSuperAdmin: false,
        canManageTeam: () => false,
        requiresLicense: () => false,
        getLicenseStatus: () => 'not_required',
        getSubscriptionTier: () => 'free_trial',
        isFeatureAccessible: () => false,
        checkSubscriptionFeature: () => false,
        checkLicenseRequired: () => false,
      };
    }

    const hasRole = (
      role: UserRole | UserRole[] | string | string[]
    ): boolean => {
      const roles = Array.isArray(role) ? role : [role];
      const userRole = effectiveUser.role || 'pharmacist';
      const userRoles = ROLE_HIERARCHY[userRole as UserRole] || [userRole];
      return roles.some((r) => userRoles.includes(r as UserRole));
    };

    const hasPermission = (permission: string): boolean => {
      // Super admin has all permissions
      if ((effectiveUser.role as UserRole) === 'super_admin') return true;

      // Check explicit permissions
      if (effectiveUser.permissions?.includes(permission)) return true;
      if (effectiveUser.permissions?.includes('*')) return true;

      // Check role-based permissions
      const [resource, action] = permission.split('.');
      return canAccess(resource, action);
    };

    const hasFeature = (feature: string): boolean => {
      // Super admin has all features
      if ((effectiveUser.role as UserRole) === 'super_admin') return true;

      // Check explicit features
      if (effectiveUser.features?.includes(feature)) return true;
      if (effectiveUser.features?.includes('*')) return true;

      // Check subscription tier features
      if (effectiveUser.currentPlan?.features) {
        return effectiveUser.currentPlan.features[feature] === true;
      }

      // Check feature tier mapping
      const tier = getSubscriptionTier();
      if (FEATURE_TIER_MAPPING[feature]) {
        return FEATURE_TIER_MAPPING[feature].includes(tier);
      }

      return false;
    };

    const canAccess = (resource: string, action: string): boolean => {
      // Super admin can access everything
      if ((effectiveUser.role as UserRole) === 'super_admin') return true;

      // Resource-specific access logic
      switch (resource) {
        case 'admin':
          return (effectiveUser.role as UserRole) === 'super_admin';

        case 'users':
          if (action === 'view')
            return hasRole(['pharmacy_outlet', 'super_admin']);
          if (action === 'manage')
            return (effectiveUser.role as UserRole) === 'super_admin';
          return false;

        case 'licenses':
          return (effectiveUser.role as UserRole) === 'super_admin';

        case 'patients':
        case 'medications':
        case 'notes':
          return hasRole([
            'pharmacist',
            'pharmacy_team',
            'pharmacy_outlet',
            'super_admin',
          ]);

        case 'reports':
          return (
            hasRole([
              'pharmacist',
              'pharmacy_team',
              'pharmacy_outlet',
              'super_admin',
            ]) && hasFeature('basic_reports')
          );

        case 'team':
          return (
            hasRole(['pharmacy_team', 'pharmacy_outlet', 'super_admin']) &&
            hasFeature('team_management')
          );

        case 'subscription':
          if (action === 'view') return true; // All users can view their subscription
          if (action === 'manage')
            return hasRole(['pharmacy_outlet', 'super_admin']);
          return false;

        default:
          return false;
      }
    };

    const getAvailableFeatures = (): string[] => {
      if (effectiveUser.role === 'super_admin') return ['*'];
      return effectiveUser.features || [];
    };

    const isAdmin = (): boolean => {
      return (effectiveUser.role as UserRole) === 'super_admin';
    };

    const isSuperAdmin = (effectiveUser.role as UserRole) === 'super_admin';

    const canManageTeam = (): boolean => {
      return (
        hasRole(['pharmacy_team', 'pharmacy_outlet', 'super_admin']) &&
        hasFeature('team_management')
      );
    };

    const requiresLicense = (): boolean => {
      return ['pharmacist', 'intern_pharmacist'].includes(effectiveUser.role || '');
    };

    const getLicenseStatus = (): string => {
      return effectiveUser.licenseStatus || 'not_required';
    };

    const getSubscriptionTier = (): string => {
      return effectiveUser.subscriptionTier || 'free_trial';
    };

    // Enhanced feature checking that takes into account role and license
    const isFeatureAccessible = (
      feature: string,
      role?: UserRole | string
    ): boolean => {
      // Super admin can access all features
      if ((effectiveUser.role as UserRole) === 'super_admin') return true;

      // If role is specified, check if user has that role
      if (role && !hasRole(role)) return false;

      // Check subscription tier and feature access
      if (!checkSubscriptionFeature(feature)) return false;

      // Check if feature requires license and if license is valid
      if (checkLicenseRequired(feature) && getLicenseStatus() !== 'approved')
        return false;

      return true;
    };

    // Check if user has active subscription for the feature
    const checkSubscriptionFeature = (feature: string): boolean => {
      const tier = getSubscriptionTier();

      // Check if feature is available in user's subscription tier
      if (FEATURE_TIER_MAPPING[feature]) {
        return FEATURE_TIER_MAPPING[feature].includes(tier);
      }

      // If feature tier mapping is not defined, fall back to hasFeature
      return hasFeature(feature);
    };

    // Check if feature requires valid license
    const checkLicenseRequired = (feature: string): boolean => {
      // If user is not in a role that requires license, return false (no license required)
      if (!requiresLicense()) return false;

      // Check if this feature requires license verification
      return LICENSE_REQUIRED_FEATURES.includes(feature);
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
      getSubscriptionTier,
      isFeatureAccessible,
      checkSubscriptionFeature,
      checkLicenseRequired,
    };
  }, [user]);
};

export default useRBAC;
