import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils'; // Assuming utils.ts is set up for clsx/cn
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'; // Replaces MUI Chip
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@/components/ui/timeline';
import {
  Clipboard,
  FlaskConical,
  Pill,
  History as TimelineIconLucide, // Renaming to avoid conflict with Timeline component
  RefreshCw,
  Eye,
} from 'lucide-react'; // Using Lucide icons

// Assuming these hooks and types are defined elsewhere in the project
// If not, they would need to be imported or defined
interface ManualLabOrder {
  orderId: string;
  tests: Array<{ testName: string }>; // Assuming test structure, adjust as needed
  indication: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  priority: string;
}

// Placeholder for usePatientLabOrders hook - replace with actual import
const usePatientLabOrders = (patientId: string, options: { enabled: boolean }) => {
  // This is a mock implementation. Replace with the actual hook.
  const [data, setData] = useState<ManualLabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options.enabled && patientId) {
      // Simulate fetching data
      const fetchData = async () => {
        setIsLoading(true);
        setIsError(false);
        setError(null);
        try {
          // Replace with actual API call
          // const response = await fetch(`/api/patients/${patientId}/lab-orders`);
          // const result = await response.json();
          // setData(result);
          setData([]); // Mock empty data for now
        } catch (err) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [patientId, options.enabled]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: () => { }, // Mock refetch
  };
};

// Placeholder for date formatting functions - replace with actual implementations or imports
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

interface PatientTimelineWidgetProps {
  patientId: string;
  maxItems?: number;
  onViewLabOrder?: (orderId: string) => void;
  onViewClinicalNote?: (noteId: string) => void;
  onViewMTR?: (mtrId: string) => void;
}

interface TimelineEvent {
  id: string;
  type: 'lab_order' | 'clinical_note' | 'mtr' | 'medication';
  title: string;
  description: string;
  date: string;
  status?: string;
  priority?: string;
  data?: unknown;
}

const PatientTimelineWidget: React.FC<PatientTimelineWidgetProps> = ({
  patientId,
  maxItems = 10,
  onViewLabOrder,
  onViewClinicalNote,
  onViewMTR
}) => {
  // const theme = useTheme(); // Removed, as shadcn/ui uses Tailwind for theming
  const {
    data: labOrders = [],
    isLoading: labOrdersLoading,
    isError: labOrdersError,
    error: labOrdersErrorDetails,
    refetch: refetchLabOrders,
  } = usePatientLabOrders(patientId, { enabled: !!patientId });

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    labOrders.forEach((order: ManualLabOrder) => {
      events.push({
        id: order.orderId,
        type: 'lab_order',
        title: `Lab Order ${order.orderId}`,
        description: `${order.tests.length} test${order.tests.length !== 1 ? 's' : ''} ordered: ${order.indication}`,
        date: order.createdAt,
        status: order.status,
        priority: order.priority,
        data: order,
      });
      if (order.status === 'completed' && order.updatedAt !== order.createdAt) {
        events.push({
          id: `${order.orderId}_results`,
          type: 'lab_order',
          title: `Lab Results ${order.orderId}`,
          description: `Results entered for ${order.tests.length} test${order.tests.length !== 1 ? 's' : ''}`,
          date: order.updatedAt,
          status: 'results_entered',
          data: order,
        });
      }
    });
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return events.slice(0, maxItems);
  }, [labOrders, maxItems]);

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'lab_order':
        return event.status === 'results_entered' ? (
          <Clipboard className="h-4 w-4" />
        ) : (
          <FlaskConical className="h-4 w-4" />
        );
      case 'clinical_note':
        return <Clipboard className="h-4 w-4" />;
      case 'mtr':
        return <Pill className="h-4 w-4" />;
      default:
        return <TimelineIconLucide className="h-4 w-4" />;
    }
  };

  const getEventDotVariant = (event: TimelineEvent): "default" | "success" | "warning" | "error" | "primary" | "secondary" => {
    switch (event.type) {
      case 'lab_order':
        if (
          event.status === 'completed' ||
          event.status === 'results_entered'
        ) {
          return 'success';
        } else if (event.status === 'result_awaited') {
          return 'warning';
        } else if (event.status === 'referred') {
          return 'error';
        }
        return 'default';
      case 'clinical_note':
        return 'primary'; // Changed from 'info' to 'primary'
      case 'mtr':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (event: TimelineEvent) => {
    if (!event.status) return null;
    let variant: "default" | "secondary" | "destructive" | "outline" = 'default';
    let label = event.status;
    switch (event.status) {
      case 'completed':
      case 'results_entered':
        variant = 'default'; // Using a positive color, 'default' can be styled via CSS vars
        label =
          event.status === 'results_entered' ? 'Results Entered' : 'Completed';
        break;
      case 'requested':
        variant = 'secondary';
        label = 'Requested';
        break;
      case 'sample_collected':
        variant = 'default';
        label = 'Sample Collected';
        break;
      case 'result_awaited':
        variant = 'outline'; // Using outline for warning-like state
        label = 'Awaiting Results';
        break;
      case 'referred':
        variant = 'destructive';
        label = 'Referred';
        break;
    }
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleEventClick = (event: TimelineEvent) => {
    switch (event.type) {
      case 'lab_order':
        if (onViewLabOrder && event.data && typeof event.data === 'object' && 'orderId' in event.data) {
          onViewLabOrder((event.data as ManualLabOrder).orderId);
        }
        break;
      case 'clinical_note':
        if (onViewClinicalNote) {
          onViewClinicalNote(event.id);
        }
        break;
      case 'mtr':
        if (onViewMTR) {
          onViewMTR(event.id);
        }
        break;
    }
  };

  if (labOrdersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimelineIconLucide className="h-5 w-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[250px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (labOrdersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimelineIconLucide className="h-5 w-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Failed to load timeline data:{' '}
                {labOrdersErrorDetails instanceof Error
                  ? labOrdersErrorDetails.message
                  : 'Unknown error'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLabOrders()}
                className="ml-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TimelineIconLucide className="h-5 w-5" />
            Patient Timeline
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetchLabOrders()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <TimelineIconLucide className="mb-4 h-12 w-12 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <Timeline>
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineSeparator>
                  <TimelineDot variant={getEventDotVariant(event)}>
                    {getEventIcon(event)}
                  </TimelineDot>
                  {index < timelineEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent className="pb-8">
                  {/* The shadcn timeline might structure this differently.
                       Assuming TimelineContent is the main area for event details.
                       We might need to adjust if TimelineIndicator is for the date.
                   */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(event.date)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50"
                    )}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(event)}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    {event.priority && event.priority !== 'routine' && (
                      <Badge variant={event.priority === 'stat' ? 'destructive' : 'secondary'} className="mt-2">
                        {event.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientTimelineWidget;
