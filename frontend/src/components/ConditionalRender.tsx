import { useRBAC } from '@/hooks/useRBAC';

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
  fallback = null
}) => {
  const { hasRole, hasPermission, hasFeature } = useRBAC();

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.some(role => hasRole(role))) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // Check feature requirement
  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ConditionalRender;