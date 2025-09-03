import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { UserRole, RBACPermissions } from '../types/patientManagement';

interface UseRBACReturn {
  permissions: RBACPermissions;
  canAccess: (action: keyof RBACPermissions) => boolean;
  role: UserRole;
  isOwner: boolean;
  isPharmacist: boolean;
  isTechnician: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (requiredRole: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
  requiresLicense: () => boolean;
  getLicenseStatus: () => string;
}

/**
 * RBAC Hook for Patient Management
 * Manages role-based access control permissions
 */
export const useRBAC = (): UseRBACReturn => {
  // Get current user role from auth context
  const { user } = useAuth();

  // Map backend system roles to frontend RBAC roles
  const mapSystemRoleToRBAC = (systemRole: string): UserRole => {
    switch (systemRole) {
      case 'super_admin':
        return 'admin';
      case 'pharmacy_outlet':
        return 'owner';
      case 'pharmacy_team':
      case 'pharmacist':
        return 'pharmacist';
      case 'intern_pharmacist':
        return 'technician';
      default:
        return 'technician'; // Default to most restrictive
    }
  };

  const role = mapSystemRoleToRBAC(user?.role || 'technician');

  // Define permissions based on role
  const permissions = useMemo((): RBACPermissions => {
    switch (role) {
      case 'owner':
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canManage: true,
        };

      case 'admin':
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canManage: true,
        };

      case 'pharmacist':
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true, // Pharmacists can delete records (matches backend permissions)
          canManage: true, // Pharmacists can manage patient data (matches backend permissions)
        };

      case 'technician':
        return {
          canCreate: true,
          canRead: true,
          canUpdate: false, // Technicians cannot update records
          canDelete: false,
          canManage: false,
        };

      default:
        return {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        };
    }
  }, [role]);

  const canAccess = (action: keyof RBACPermissions): boolean => {
    return permissions[action];
  };

  const hasRole = (requiredRole: string | string[]): boolean => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    // Map permission strings to RBACPermissions keys
    switch (permission) {
      case 'create':
        return permissions.canCreate;
      case 'read':
        return permissions.canRead;
      case 'update':
        return permissions.canUpdate;
      case 'delete':
        return permissions.canDelete;
      case 'manage':
        return permissions.canManage;
      default:
        return false;
    }
  };

  const hasFeature = (feature: string): boolean => {
    // Basic feature access based on role
    // In a real implementation, this would check against feature flags/subscription
    switch (feature) {
      case 'advanced_analytics':
        return role === 'owner' || role === 'admin';
      case 'user_management':
        return role === 'owner' || role === 'admin';
      case 'pharmacy_management':
        return role === 'owner' || role === 'admin' || role === 'pharmacist';
      case 'patient_management':
        return true; // All roles can access basic patient management
      default:
        return true; // Default to true for unknown features
    }
  };

  const requiresLicense = (): boolean => {
    // Only pharmacists require license verification
    return role === 'pharmacist';
  };

  const getLicenseStatus = (): string => {
    // In a real implementation, this would fetch from user data
    // For now, return approved for non-pharmacist roles
    if (role !== 'pharmacist') {
      return 'approved';
    }
    // This would typically come from user.licenseStatus
    return user?.licenseStatus || 'pending';
  };

  return {
    permissions,
    canAccess,
    role,
    isOwner: role === 'owner',
    isPharmacist: role === 'pharmacist',
    isTechnician: role === 'technician',
    isAdmin: role === 'admin',
    isSuperAdmin: user?.role === 'super_admin', // Check actual system role for super admin
    hasRole,
    hasPermission,
    hasFeature,
    requiresLicense,
    getLicenseStatus,
  };
};

/**
 * RBAC Component Wrapper
 * Conditionally renders children based on permissions
 */
interface RBACGuardProps {
  children: React.ReactNode;
  action?: keyof RBACPermissions;
  role?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export const RBACGuard: React.FC<RBACGuardProps> = ({
  children,
  action,
  role: requiredRole,
  fallback = null,
}) => {
  const { canAccess, role } = useRBAC();

  // Check action permission
  if (action && !canAccess(action)) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(role)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Higher-Order Component for RBAC
 */
export const withRBAC = <P extends object>(
  Component: React.ComponentType<P>,
  requiredAction?: keyof RBACPermissions,
  requiredRole?: UserRole | UserRole[]
) => {
  return (props: P) => (
    <RBACGuard action={requiredAction} role={requiredRole}>
      <Component {...props} />
    </RBACGuard>
  );
};
