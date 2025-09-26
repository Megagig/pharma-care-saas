
import { Tooltip, Progress } from '@/components/ui/button';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1 scale
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showPercentage?: boolean;
  variant?: 'linear' | 'circular' | 'chip';
}
const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.8) {
    return {
      level: 'high',
      label: 'High Confidence',
      color: 'success' as const,
      icon: CheckCircleIcon,
      description: 'AI analysis shows high confidence in this assessment',
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'medium',
      label: 'Medium Confidence',
      color: 'warning' as const,
      icon: WarningIcon,
      description:
        'AI analysis shows moderate confidence - consider additional evaluation',
    };
  } else if (confidence >= 0.4) {
    return {
      level: 'low',
      label: 'Low Confidence',
      color: 'error' as const,
      icon: ErrorIcon,
      description:
        'AI analysis shows low confidence - manual review strongly recommended',
    };
  } else {
    return {
      level: 'very-low',
      label: 'Very Low Confidence',
      color: 'error' as const,
      icon: ErrorIcon,
      description:
        'AI analysis shows very low confidence - manual assessment required',
    };
  }
};
const getSizeConfig = (size: string) => {
  switch (size) {
    case 'small':
      return {
        height: 4,
        fontSize: '0.75rem',
        iconSize: 16,
        chipSize: 'small' as const,
      };
    case 'large':
      return {
        height: 8,
        fontSize: '1rem',
        iconSize: 24,
        chipSize: 'medium' as const,
      };
    default: // medium
      return {
        height: 6,
        fontSize: '0.875rem',
        iconSize: 20,
        chipSize: 'small' as const,
      };
  }
};
const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ 
  confidence,
  size = 'medium',
  showLabel = true,
  showPercentage = true,
  variant = 'linear'
}) => {
  const confidenceLevel = getConfidenceLevel(confidence);
  const sizeConfig = getSizeConfig(size);
  const percentage = Math.round(confidence * 100);
  const Icon = confidenceLevel.icon;
  const tooltipContent = (
    <div>
      <div  className="">
        {confidenceLevel.label} ({percentage}%)
      </div>
      <div >{confidenceLevel.description}</div>
    </div>
  );
  if (variant === 'chip') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Chip
          icon={<Icon className="" />}
          label={showPercentage ? `${percentage}%` : confidenceLevel.label}
          size={sizeConfig.chipSize}
          color={confidenceLevel.color}
          
          className="" />
      </Tooltip>
    );
  }
  if (variant === 'circular') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <div
          className=""
        >
          <div
            className=""
          >
            {/* Background circle */}
            <div
              className=""
            />
            {/* Progress circle */}
            <div
              className="".main`,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                transform: `rotate(${confidence * 360 - 90}deg)`,
                transition: 'transform 0.3s ease-in-out',
            />
            {/* Icon */}
            <Icon
              className="".main`,
                zIndex: 1,
            />
          </div>
          {(showLabel || showPercentage) && (
            <div>
              {showLabel && (
                <div
                  
                  className="">
                  {confidenceLevel.label}
                </div>
              )}
              {showPercentage && (
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {percentage}%
                </div>
              )}
            </div>
          )}
        </div>
      </Tooltip>
    );
  }
  // Default linear variant
  return (
    <Tooltip title={tooltipContent} arrow>
      <div
        className=""
      >
        <Icon
          className="".main`,
        />
        <div className="">
          <div
            className=""
          >
            {showLabel && (
              <div
                
                className="">
                {size === 'small'
                  ? confidenceLevel.level.toUpperCase()
                  : confidenceLevel.label}
              </div>
            )}
            {showPercentage && (
              <div
                
                color="text.secondary"
                className=""
              >
                {percentage}%
              </div>
            )}
          </div>
          <Progress
            
            color={confidenceLevel.color}
            className="" />
        </div>
      </div>
    </Tooltip>
  );
};
export default ConfidenceIndicator;
