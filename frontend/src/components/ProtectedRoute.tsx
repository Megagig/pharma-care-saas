import { Navigate, useLocation, Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md ${props.severity === 'info'
      ? 'bg-blue-50 border-l-4 border-blue-400'
      : props.severity === 'warning'
        ? 'bg-yellow-50 border-l-4 border-yellow-400'
        : 'bg-red-50 border-l-4 border-red-400'
    } ${props.className || ''}`}>
    {children}
  </div>
);

// Replace imports with mock components
const Button = MockButton;
const Card = MockCard;
const Alert = MockAlert;

// Mock icons
const CreditCardIcon = ({ className }: any) => <span className={className}>💳</span>;
const WarningIcon = ({ className }: any) => <span className={className}>⚠️</span>;
const LockIcon = ({ className }: any) => <span className={className}>🔒</span>;

// Mock hooks
const useAuth = () => {
  return {
    user: {
      role: 'user'
    },
    loading: false
  };
};

const useRBAC = () => {
  return {
    hasRole: (role: string | string[]) => true,
    hasPermission: (permission: string) => true,
    hasFeature: (feature: string) => true,
    requiresLicense: () => false,
    getLicenseStatus: () => 'approved'
  };
};

const useSubscriptionStatus = () => {
  return {
    status: 'active',
    isActive: true,
    tier: 'premium',
    daysRemaining: 30
  };
};

// ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  requiredFeature?: string;
  requiresLicense?: boolean;
  requiresActiveSubscription?: boolean;
  fallbackPath?: string;
}

interface AccessDeniedProps {
  reason: 'role' | 'permission' | 'feature' | 'license' | 'subscription';
  requiredRole?: string | string[];
  requiredPermission?: string;
  requiredFeature?: string;
  userRole?: string;
  licenseStatus?: string;
  subscriptionStatus?: {
    status: string;
    isActive: boolean;
    tier: string;
    daysRemaining: number;
  };
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  reason,
  requiredRole,
  requiredPermission,
  requiredFeature,
  userRole,
  licenseStatus,
  subscriptionStatus
}) => {
  const getIcon = () => {
    switch (reason) {
      case 'subscription':
        return <CreditCardIcon className="text-3xl text-blue-500" />;
      case 'license':
        return <WarningIcon className="text-3xl text-yellow-500" />;
      default:
        return <LockIcon className="text-3xl text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'role':
        return 'Insufficient Role Permissions';
      case 'permission':
        return 'Access Permission Required';
      case 'feature':
        return 'Feature Not Available';
      case 'license':
        return 'License Verification Required';
      case 'subscription':
        return 'Subscription Required';
      default:
        return 'Access Denied';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'role': {
        const roles = Array.isArray(requiredRole)
          ? requiredRole.join(', ')
          : requiredRole;
        return `This page requires ${roles} role(s). Your current role is ${userRole}.`;
      }
      case 'permission':
        return `You don't have the required permission: ${requiredPermission}`;
      case 'feature':
        return `The feature "${requiredFeature}" is not available in your current plan. Please upgrade to access this feature.`;
      case 'license':
        return `A verified pharmacist license is required to access this feature. Current status: ${licenseStatus}`;
      case 'subscription':
        return `An active subscription is required to access this feature. Current status: ${subscriptionStatus?.status}`;
      default:
        return 'You do not have permission to access this page.';
    }
  };

  const getActionButton = () => {
    switch (reason) {
      case 'subscription':
        return (
          <Button
            className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Link to="/subscription-management" className="text-white">
              Upgrade Subscription
            </Link>
          </Button>
        );
      case 'license':
        return (
          <Button
            className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Link to="/license" className="text-white">
              Upload License
            </Link>
          </Button>
        );
      default:
        return (
          <Button
            className="mt-2 bg-gray-600 text-white hover:bg-gray-700"
          >
            <Link to="/dashboard" className="text-white">
              Back to Dashboard
            </Link>
          </Button>
        );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-3">
      <Card className="p-8 text-center max-w-lg w-full shadow-lg">
        <div className="mb-3 flex justify-center">{getIcon()}</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {getTitle()}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {getMessage()}
        </p>
        {reason === 'feature' && (
          <Alert severity="info" className="mb-4">
            Contact your administrator or upgrade your plan to enable this
            feature.
          </Alert>
        )}
        {reason === 'license' && licenseStatus === 'pending' && (
          <Alert severity="warning" className="mb-4">
            Your license is currently under review. You'll be notified once it's
            approved.
          </Alert>
        )}
        {getActionButton()}
      </Card>
    </div>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredFeature,
  requiresLicense = false,
  requiresActiveSubscription = false,
  fallbackPath = '/login'
}) => {
  const { user, loading } = useAuth();
  const {
    hasRole,
    hasPermission,
    hasFeature,
    requiresLicense: userRequiresLicense,
    getLicenseStatus,
  } = useRBAC();
  const subscriptionStatus = useSubscriptionStatus();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check subscription requirement
  if (requiresActiveSubscription && !subscriptionStatus.isActive) {
    // Allow access to subscription management pages even without active subscription
    const isSubscriptionPage = location.pathname.includes('/subscription');
    if (!isSubscriptionPage) {
      return (
        <AccessDenied
          reason="subscription"
          subscriptionStatus={subscriptionStatus}
        />
      );
    }
  }

  // Check license requirement
  if (requiresLicense && userRequiresLicense()) {
    const licenseStatus = getLicenseStatus();
    if (licenseStatus !== 'approved') {
      return <AccessDenied reason="license" licenseStatus={licenseStatus} />;
    }
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDenied
        reason="role"
        requiredRole={requiredRole}
        userRole={user.role}
      />
    );
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <AccessDenied
        reason="permission"
        requiredPermission={requiredPermission}
      />
    );
  }

  // Check feature requirement
  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <AccessDenied reason="feature" requiredFeature={requiredFeature} />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;
