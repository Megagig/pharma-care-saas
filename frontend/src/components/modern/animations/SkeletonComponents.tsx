
import '../../../styles/dashboardTheme.css';

import { Card, CardContent, Skeleton } from '@/components/ui/button';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}
export const Skeleton: React.FC<SkeletonProps> = ({ 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className = ''
}) => {
  const classes = [
    'skeleton',
    variant === 'circular' ? 'rounded-full' : '',
    animation === 'pulse' ? 'animate-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={classes}
      
    />
  );
};
export const MetricCardSkeleton: React.FC = () => (
  <Card className="">
    <CardContent>
      <Skeleton height="24px" width="40%" className="mb-2" />
      <Skeleton height="40px" className="mb-2" />
      <Skeleton height="8px" width="100%" />
      <div className="">
        <Skeleton height="20px" width="30%" />
        <Skeleton height="20px" width="20%" />
      </div>
    </CardContent>
  </Card>
);
export const ChartSkeleton: React.FC<{ height?: string | number }> = ({ 
  height = 300}
}) => (
  <Card className="">
    <CardContent>
      <Skeleton height="24px" width="40%" className="mb-4" />
      <Skeleton height={height} className="mb-2" />
      <div className="">
        <Skeleton height="16px" width="20%" />
        <Skeleton height="16px" width="20%" />
      </div>
    </CardContent>
  </Card>
);
export const AppointmentSkeleton: React.FC = () => (
  <Card className="">
    <CardContent className="">
      <div direction="row" spacing={2} alignItems="center">
        <Skeleton  width={40} height={40} />
        <div className="">
          <Skeleton height="20px" width="60%" className="mb-1" />
          <Skeleton height="16px" width="40%" className="mb-1" />
          <div className="">
            <Skeleton height="14px" width="30%" />
            <Skeleton height="14px" width="20%" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
export const DashboardSkeleton: React.FC = () => (
  <div className="">
    <div container spacing={3}>
      {/* Metric cards skeletons */}
      <div item xs={12} sm={6} md={3}>
        <MetricCardSkeleton />
      </div>
      <div item xs={12} sm={6} md={3}>
        <MetricCardSkeleton />
      </div>
      <div item xs={12} sm={6} md={3}>
        <MetricCardSkeleton />
      </div>
      <div item xs={12} sm={6} md={3}>
        <MetricCardSkeleton />
      </div>
      {/* Chart skeletons */}
      <div item xs={12} md={8}>
        <ChartSkeleton height={300} />
      </div>
      <div item xs={12} md={4}>
        <ChartSkeleton height={300} />
      </div>
      {/* List skeletons */}
      <div item xs={12} md={6}>
        <Card className="dashboard-card">
          <CardContent>
            <Skeleton height="24px" width="50%" className="mb-3" />
            <div spacing={2}>
              <AppointmentSkeleton />
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </div>
          </CardContent>
        </Card>
      </div>
      <div item xs={12} md={6}>
        <Card className="dashboard-card">
          <CardContent>
            <Skeleton height="24px" width="50%" className="mb-3" />
            <div spacing={2}>
              <AppointmentSkeleton />
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
