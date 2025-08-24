import React from 'react';
import useRBAC from '../hooks/useRBAC';

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  requiredFeature?: string;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredFeature,
  fallback = null,
}) => {
  const { hasRole, hasPermission, hasFeature } = useRBAC();

  let hasAccess = true;

  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    hasAccess = false;
  }

  if (requiredFeature && !hasFeature(requiredFeature)) {
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
