
import useFeatureFlags from '../hooks/useFeatureFlags';

import { Alert } from '@/components/ui/button';

interface FeatureFlagDemoProps {
  featureKey: string;
  title: string;
  description: string;
}

/**
 * Component to demonstrate feature flag usage
 */
const FeatureFlagDemo: React.FC<FeatureFlagDemoProps> = ({ 
  featureKey,
  title,
  description
}) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const enabled = isFeatureEnabled(featureKey);

  if (isLoading) {
    return (
      <div className="">
        <div >{title}</div>
        <div>Loading feature flag status...</div>
      </div>
    );
  }

  return (
    <div
      className=""
    >
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <div >{title}</div>
        <Chip
          label={enabled ? 'Enabled' : 'Disabled'}
          color={enabled ? 'success' : 'error'}
          size="small"
        />
      </div>

      <div  color="textSecondary" gutterBottom>
        Feature key: <code>{featureKey}</code>
      </div>

      <div  paragraph>
        {description}
      </div>

      {enabled ? (
        <div mt={2}>
          <Alert severity="success">
            This feature is enabled for your subscription tier and role!
          </Alert>
        </div>
      ) : (
        <div mt={2}>
          <Alert severity="info">
            This feature is currently disabled. Contact your administrator or
            upgrade your subscription to access it.
          </Alert>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagDemo;
