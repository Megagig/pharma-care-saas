
import { Button } from '@/components/ui/button';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Alert } from '@/components/ui/alert';

interface DiagnosticFeatureGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
}
export const DiagnosticFeatureGuard: React.FC<DiagnosticFeatureGuardProps> = ({ 
  children,
  feature = 'ai_diagnostics',
  fallback
}) => {
  const { hasFeature, hasRole } = useRBAC();
  const subscriptionStatus = useSubscriptionStatus();
  // Check if user has required role (pharmacist or above)
  const hasRequiredRole =
    hasRole('pharmacist') || hasRole('admin') || hasRole('super_admin');
  // Check if user has active subscription
  const hasActiveSubscription = subscriptionStatus?.isActive;
  // Check if feature is enabled
  const hasRequiredFeature = hasFeature(feature);
  // If all checks pass, render children
  if (hasRequiredRole && hasActiveSubscription && hasRequiredFeature) {
    return <>{children}</>;
  }
  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }
  // Default fallback UI
  return (
    <div
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
      p={3}
    >
      <Card className="">
        <CardContent className="">
          <Science
            className=""
          />
          <div  gutterBottom>
            AI Diagnostics & Therapeutics
          </div>
          <div  color="textSecondary" paragraph>
            Advanced AI-powered diagnostic assistance for comprehensive patient
            care
          </div>
          {!hasRequiredRole && (
            <Alert severity="warning" className="">
              <div >
                <Lock className="" />
                This feature requires pharmacist-level access or higher.
              </div>
            </Alert>
          )}
          {!hasActiveSubscription && (
            <Alert severity="error" className="">
              <div >
                <Upgrade className="" />
                An active subscription is required to access diagnostic
                features.
              </div>
            </Alert>
          )}
          {!hasRequiredFeature && hasActiveSubscription && (
            <Alert severity="info" className="">
              <div >
                The AI Diagnostics feature is not enabled for your subscription
                plan.
              </div>
            </Alert>
          )}
          <div display="flex" gap={2} justifyContent="center" mt={3}>
            {!hasActiveSubscription && (
              <Button
                
                
                to="/subscriptions"
                startIcon={<Upgrade />}
              >
                Upgrade Subscription
              </Button>
            )}
            <Button   to="/dashboard">
              Back to Dashboard
            </Button>
          </div>
          <div mt={4} p={2} bgcolor="grey.50" borderRadius={2}>
            <div  gutterBottom>
              Feature Highlights
            </div>
            <div textAlign="left">
              <div  gutterBottom>
                • AI-powered differential diagnosis generation
              </div>
              <div  gutterBottom>
                • Comprehensive drug interaction checking
              </div>
              <div  gutterBottom>
                • Lab result integration and interpretation
              </div>
              <div  gutterBottom>
                • Clinical decision support tools
              </div>
              <div  gutterBottom>
                • Seamless integration with clinical notes and MTR
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default DiagnosticFeatureGuard;
