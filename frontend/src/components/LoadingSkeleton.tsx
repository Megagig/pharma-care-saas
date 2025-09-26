
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface LoadingSkeletonProps {
  type?: 'search' | 'details' | 'list';
}
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'details' }) => {
  if (type === 'search') {
    return (
      <div className="w-full">
        <Skeleton className="h-14 mb-4" />
        <Card className="p-4 shadow-sm">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-16 mb-2" />
          ))}
        </Card>
      </div>
    );
  }
  if (type === 'list') {
    return (
      <Card className="p-6 shadow-sm">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-20 mb-3" />
        ))}
      </Card>
    );
  }
  // Default details skeleton
  return (
    <Card className="p-6 shadow-sm">
      <Skeleton className="h-10 mb-4" />
      <Skeleton className="h-5 w-3/5 mb-6" />
      <Skeleton className="h-48 mb-4" />
      <Skeleton className="h-36 mb-4" />
      <Skeleton className="h-24" />
    </Card>
  );
};
export default LoadingSkeleton;
