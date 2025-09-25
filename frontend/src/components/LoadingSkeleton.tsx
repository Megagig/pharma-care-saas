import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { Card } from '@/components/ui/card';

interface LoadingSkeletonProps {
  type?: 'search' | 'details' | 'list';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'details' }) => {
  if (type === 'search') {
    return (
      <Box className="w-full">
        <Skeleton variant="rounded" height={56} className="mb-4" />
        <Card className="p-4 shadow-sm">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} variant="rounded" height={60} className="mb-2" />
          ))}
        </Card>
      </Box>
    );
  }

  if (type === 'list') {
    return (
      <Card className="p-6 shadow-sm">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} variant="rounded" height={80} className="mb-3" />
        ))}
      </Card>
    );
  }

  // Default details skeleton
  return (
    <Card className="p-6 shadow-sm">
      <Skeleton variant="rounded" height={40} className="mb-4" />
      <Skeleton variant="rounded" height={20} width="60%" className="mb-6" />
      <Skeleton variant="rounded" height={200} className="mb-4" />
      <Skeleton variant="rounded" height={150} className="mb-4" />
      <Skeleton variant="rounded" height={100} />
    </Card>
  );
};

export default LoadingSkeleton;