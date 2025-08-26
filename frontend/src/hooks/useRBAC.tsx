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
}

/**
 * RBAC Hook for Patient Management
 * Manages role-based access control permissions
 */
export const useRBAC = (): UseRBACReturn => {
  // Get current user role from auth context
  const { user } = useAuth();
  const role = (user?.role as UserRole) || 'technician';

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
          canDelete: false, // Pharmacists cannot delete records
          canManage: false, // Cannot manage system settings
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

  return {
    permissions,
    canAccess,
    role,
    isOwner: role === 'owner',
    isPharmacist: role === 'pharmacist',
    isTechnician: role === 'technician',
    isAdmin: role === 'admin',
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
