import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

interface FeatureGuardProps {
  feature: string;
  requiredRole?: string | string[];
  requiresLicense?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * FeatureGuard - A component that conditionally renders its children based on
 * feature access, user role, and license status.
 *
 * @param feature - The feature key to check
 * @param requiredRole - Optional role(s) required to access the feature
 * @param requiresLicense - Whether the feature requires an approved license
 * @param children - Content to show if user has access
 * @param fallback - Content to show if user doesn't have access (optional)
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  requiredRole,
  requiresLicense = false,
  children,
  fallback = null,
}) => {
  const { hasFeature, hasRole, getLicenseStatus } = useRBAC();

  // Check if feature is available
  if (!hasFeature(feature)) return <>{fallback}</>;

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) return <>{fallback}</>;

  // Check license if required
  if (requiresLicense && getLicenseStatus() !== 'approved')
    return <>{fallback}</>;

  // All checks passed
  return <>{children}</>;
};

interface SubscriptionGuardProps {
  tier: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SubscriptionGuard - A component that conditionally renders its children based on
 * the user's subscription tier.
 *
 * @param tier - Required subscription tier(s)
 * @param children - Content to show if user has the required tier
 * @param fallback - Content to show if user doesn't have the required tier
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  tier,
  children,
  fallback = null,
}) => {
  const { getSubscriptionTier } = useRBAC();

  const currentTier = getSubscriptionTier();
  const tierHierarchy: Record<string, string[]> = {
    enterprise: ['enterprise'],
    pro: ['pro', 'enterprise'],
    basic: ['basic', 'pro', 'enterprise'],
    free_trial: ['free_trial', 'basic', 'pro', 'enterprise'],
  };

  const requiredTiers = Array.isArray(tier) ? tier : [tier];
  const allowedTiers = currentTier ? tierHierarchy[currentTier] || [] : [];

  const hasAccess = requiredTiers.some((t) => allowedTiers.includes(t));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface RoleGuardProps {
  role: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard - A component that conditionally renders its children based on
 * the user's role.
 *
 * @param role - Required role(s)
 * @param children - Content to show if user has the required role
 * @param fallback - Content to show if user doesn't have the required role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  children,
  fallback = null,
}) => {
  const { hasRole } = useRBAC();
  return hasRole(role) ? <>{children}</> : <>{fallback}</>;
};

export default FeatureGuard;
