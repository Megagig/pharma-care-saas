
import { Card, CardContent, Skeleton, Avatar } from '@/components/ui/button';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  navigateTo?: string;
  subtitle?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  badge?: {
    label: string;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  };
}
const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title,
  value,
  icon,
  color,
  navigateTo,
  subtitle,
  loading = false,
  trend,
  badge
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
  };
  return (
    <motion.div
      
      >
      <Card
        className="" 0%, ${alpha(
            color,
            0.05
          )} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          position: 'relative',
          overflow: 'visible',
          '&:hover': navigateTo
            ? {
                boxShadow: `0 8px 32px ${alpha(color, 0.3)}`,
                transform: 'translateY(-2px)',
              }
            : {},
        onClick={handleClick}
      >
        <CardContent className="">
          {/* Background Pattern */}
          <div
            className="" ${alpha(color, 0.05)})`,
              zIndex: 0,
          />
          <div className="">
            {/* Header with Icon and Badge */}
            <div
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Avatar
                className=""
              >
                {icon}
              </Avatar>
              <div
                display="flex"
                flexDirection="column"
                alignItems="flex-end"
                gap={1}
              >
                {badge && (
                  <Chip
                    label={badge.label}
                    color={badge.color}
                    size="small"
                    
                  />
                )}
                {trend && (
                  <Chip
                    icon={
                      trend.isPositive ? (
                        <TrendingUpIcon />
                      ) : (
                        <TrendingDownIcon />
                      )}
                    }
                    label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                    size="small"
                    color={trend.isPositive ? 'success' : 'error'}
                    
                    className=""
                  />
                )}
                {navigateTo && (
                  <IconButton
                    size="small"
                    className="">
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            </div>
            {/* Title */}
            <div
              
              color="text.secondary"
              gutterBottom
              className=""
            >
              {title}
            </div>
            {/* Value */}
            {loading ? (
              <Skeleton  width="60%" height={48} />
            ) : (
              <div
                
                component="div"
                className="">
                {value}
              </div>
            )}
            {/* Subtitle */}
            {subtitle && (
              <div
                
                color="text.secondary"
                className=""
              >
                {subtitle}
              </div>
            )}
            {/* Trend Period */}
            {trend?.period && (
              <div
                
                color="text.secondary"
                className=""
              >
                vs {trend.period}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
export default DashboardCard;
