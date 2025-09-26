
import { Button, Card, CardContent, Avatar } from '@/components/ui/button';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  navigateTo: string;
  buttonText?: string;
  disabled?: boolean;
  badge?: string;
}
const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title,
  description,
  icon,
  color,
  navigateTo,
  buttonText = 'Go',
  disabled = false,
  badge
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const handleClick = () => {
    if (!disabled) {
      navigate(navigateTo);
    }
  };
  return (
    <motion.div
      whileHover={!disabled ? { y: -6, scale: 1.02 } : {
      whileTap={!disabled ? { scale: 0.98 } : {>
      <Card
        className="" 0%, ${alpha(
            color,
            0.05
          )} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          position: 'relative',
          overflow: 'visible',
          opacity: disabled ? 0.6 : 1,
          '&:hover': !disabled
            ? {
                boxShadow: `0 12px 40px ${alpha(color, 0.3)}`,
                '& .action-button': {
                  transform: 'translateX(4px)',
                },
                '& .action-icon': {
                  transform: 'scale(1.1)',
                },
              }
            : {},
        onClick={handleClick}
      >
        <CardContent
          className=""
        >
          {/* Background Pattern */}
          <div
            className="" ${alpha(color, 0.03)})`,
              zIndex: 0,
          />
          {/* Badge */}
          {badge && (
            <div
              className=""
            >
              {badge}
            </div>
          )}
          <div
            className=""
          >
            {/* Header with Icon */}
            <div display="flex" alignItems="center" mb={2}>
              <Avatar
                className=""
              >
                {typeof icon === 'string' ? (
                  <div className="">{icon}</div>
                ) : (
                  icon
                )}
              </Avatar>
              <div
                
                component="div"
                className=""
              >
                {title}
              </div>
            </div>
            {/* Description */}
            <div
              
              color="text.secondary"
              className=""
            >
              {description}
            </div>
            {/* Action Button */}
            <Button
              className="action-button"
              
              endIcon={<ArrowForwardIcon />}
              disabled={disabled}
              className=""`,
                },
                '&:disabled': {
                  backgroundColor: alpha(color, 0.3),
                  color: alpha(theme.palette.common.white, 0.7),
                },>
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
export default QuickActionCard;
