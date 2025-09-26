
import { Button, Card, CardContent, Progress, Alert } from '@/components/ui/button';
const SubscriptionStatusCard: React.FC = () => {
  const navigate = useNavigate();
  const subscriptionData = useSubscriptionStatus();
  const {
    hasWorkspace,
    hasSubscription,
    status,
    tier,
    isTrialActive,
    daysRemaining,
    loading,
  } = subscriptionData || {};
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div  gutterBottom>
            Subscription Status
          </div>
          <Progress />
        </CardContent>
      </Card>
    );
  }
  const getStatusColor = () => {
    if (!hasWorkspace) return 'warning';
    if (!hasSubscription) return 'error';
    if (isTrialActive && daysRemaining && daysRemaining <= 3) return 'warning';
    if (isTrialActive) return 'info';
    if (status === 'active') return 'success';
    return 'error';
  };
  const getStatusText = () => {
    if (!hasWorkspace) return 'No Workplace';
    if (!hasSubscription) return 'No Subscription';
    if (isTrialActive) return `Free Trial (${daysRemaining} days left)`;
    if (status === 'active') return 'Active Subscription';
    return 'Subscription Expired';
  };
  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'success') return <CheckCircleIcon color="success" />;
    if (color === 'warning') return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };
  return (
    <Card>
      <CardContent>
        <div
          className=""
        >
          <div >Subscription Status</div>
          {getStatusIcon()}
        </div>
        <div className="">
          <Chip
            label={getStatusText()}
            color={getStatusColor() as 'success' | 'warning' | 'error' | 'info'}
            
          />
          {tier && (
            <Chip
              label={tier.charAt(0).toUpperCase() + tier.slice(1)}
              
            />
          )}
        </div>
        {/* No Workspace Alert */}
        {!hasWorkspace && (
          <Alert severity="info" className="">
            <div  gutterBottom>
              Create or join a workplace to access full features.
            </div>
            <Button
              size="small"
              
              onClick={() => navigate('/dashboard')}
              className=""
            >
              Set Up Workplace
            </Button>
          </Alert>
        )}
        {/* Trial Warning */}
        {hasWorkspace &&
          isTrialActive &&
          daysRemaining &&
          daysRemaining <= 7 && (
            <Alert
              severity={daysRemaining <= 3 ? 'warning' : 'info'}
              className=""
            >
              <div  gutterBottom>
                Your free trial expires in {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''}.
              </div>
              <Button
                size="small"
                
                startIcon={<UpgradeIcon />}
                onClick={() => navigate('/subscription-management')}
                className=""
              >
                Upgrade Now
              </Button>
            </Alert>
          )}
        {/* Trial Progress Bar */}
        {hasWorkspace && isTrialActive && daysRemaining !== undefined && (
          <div className="">
            <div  color="text.secondary" gutterBottom>
              Trial Progress
            </div>
            <Progress
              
              className=""
            />
          </div>
        )}
        {/* Expired Subscription */}
        {hasWorkspace && !hasSubscription && (
          <Alert severity="error" className="">
            <div  gutterBottom>
              Your subscription has expired. Upgrade to continue using all
              features.
            </div>
            <Button
              size="small"
              
              startIcon={<UpgradeIcon />}
              onClick={() => navigate('/subscription-management')}
              className=""
            >
              Renew Subscription
            </Button>
          </Alert>
        )}
        {/* Active Subscription */}
        {hasWorkspace && status === 'active' && (
          <div>
            <div  color="text.secondary" gutterBottom>
              You have full access to all features.
            </div>
            <Button
              size="small"
              
              onClick={() => navigate('/subscription-management')}
              className=""
            >
              Manage Subscription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default SubscriptionStatusCard;
