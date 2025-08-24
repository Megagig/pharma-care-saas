import { useAuth } from './useAuth';
import useRBAC from './useRBAC';

// Custom hook to check subscription status
export const useSubscriptionStatus = () => {
  const { user } = useAuth();
  const { getSubscriptionTier } = useRBAC();

  // Calculate days remaining in subscription if applicable
  const calculateDaysRemaining = () => {
    if (!user?.subscription?.expiresAt) return 0;

    const expiryDate = new Date(user.subscription.expiresAt);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  return {
    status: user?.subscription?.status || 'inactive',
    isActive:
      user?.subscription?.status === 'active' || user?.role === 'super_admin',
    tier: getSubscriptionTier(),
    expiresAt: user?.subscription?.expiresAt || null,
    daysRemaining: calculateDaysRemaining(),
    canceledAt: user?.subscription?.canceledAt || null,
  };
};

// Hook for programmatic access control
export const useAccessControl = () => {
  const rbac = useRBAC();
  const { user } = useAuth();
  const subscriptionStatus = useSubscriptionStatus();

  const checkAccess = (requirements: {
    role?: string | string[];
    permission?: string;
    feature?: string;
    requiresLicense?: boolean;
    requiresActiveSubscription?: boolean;
  }) => {
    if (!user) return false;

    if (
      requirements.requiresActiveSubscription &&
      !subscriptionStatus.isActive
    ) {
      return false;
    }

    if (
      requirements.requiresLicense &&
      rbac.requiresLicense() &&
      rbac.getLicenseStatus() !== 'approved'
    ) {
      return false;
    }

    if (requirements.role && !rbac.hasRole(requirements.role)) {
      return false;
    }

    if (
      requirements.permission &&
      !rbac.hasPermission(requirements.permission)
    ) {
      return false;
    }

    if (requirements.feature && !rbac.hasFeature(requirements.feature)) {
      return false;
    }

    return true;
  };

  return {
    ...rbac,
    checkAccess,
    subscriptionStatus,
  };
};

export default useSubscriptionStatus;
