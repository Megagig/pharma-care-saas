
import ProtectedRoute from './ProtectedRoute';
// Higher-order component for protecting components with role-based access control
export const withRoleProtection = <P extends object>(
  requiredRole: string | string[]
) => {
  const WithRoleProtection: React.FC<P> = (props) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );

  // Set display name for better debugging
    Component.displayName || Component.name || 'Component'
  })`;

  return WithRoleProtection;
};

// Higher-order component for feature protection
export const withFeatureProtection = <P extends object>(
  requiredFeature: string
) => {
  const WithFeatureProtection: React.FC<P> = (props) => (
    <ProtectedRoute requiredFeature={requiredFeature}>
      <Component {...props} />
    </ProtectedRoute>
  );

  // Set display name for better debugging
    Component.displayName || Component.name || 'Component'
  })`;

  return WithFeatureProtection;
};

export default { withRoleProtection, withFeatureProtection };
