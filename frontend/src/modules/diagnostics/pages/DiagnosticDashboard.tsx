import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus as AddIcon,
  RefreshCw as RefreshIcon,
  Filter as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  User as PersonIcon,
  MoreVertical as MoreVertIcon,
  BarChart3 as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ScheduleIcon,
  FlaskConical as ScienceIcon,
  Timeline as TimelineIcon,
  Hospital as LocalHospitalIcon,
  Bell as NotificationsIcon
} from 'lucide-react';

// Types
interface DiagnosticRequest {
  _id: string;
  patientId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  inputSnapshot: {
    symptoms: {
      subjective: string[];
    };
  };
}

interface DiagnosticResult {
  diagnoses: Array<{
    condition: string;
    probability: number;
  }>;
  pharmacistReview?: {
    status?: string;
  };
}

interface DiagnosticAnalytics {
  totalRequests: number;
  completedRequests: number;
  averageConfidenceScore: number;
}

// Mock hooks for diagnostic data
const useDiagnosticHistory = () => ({ data: [], isLoading: false, error: null });
const useDiagnosticAnalytics = () => ({ data: null, isLoading: false, error: null });

// Mock store
const useDiagnosticStore = () => ({
  filters: { search: '', status: '', page: 1 },
  setFilters: (filters: any) => {},
  clearFilters: () => {},
  selectRequest: (request: DiagnosticRequest) => {}
});

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ 
  title,
  value,
  icon,
  trend
}) => {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold">
                {value}
              </div>
              <div className="text-sm text-gray-600">
                {title}
              </div>
            </div>
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-2 text-sm">
            <TrendingUpIcon className="w-4 h-4 mr-1 text-green-500" />
            <div className="text-green-600">
              {Math.abs(trend.value)}% from last week
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
interface RecentCaseCardProps {
  request: DiagnosticRequest;
  result?: DiagnosticResult;
  onViewDetails: (request: DiagnosticRequest) => void;
  onQuickAction: (request: DiagnosticRequest, action: string) => void;
}

const RecentCaseCard: React.FC<RecentCaseCardProps> = ({ 
  request,
  result,
  onViewDetails,
  onQuickAction
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const handleQuickAction = (action: string) => {
    onQuickAction(request, action);
    setMenuOpen(false);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <PersonIcon className="w-5 h-5 text-gray-500" />
              <div className="font-medium">
                Unknown Patient
              </div>
              <Badge className={statusColors[request.status]}>
                {request.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {request.inputSnapshot.symptoms.subjective.slice(0, 2).join(', ')}
              {request.inputSnapshot.symptoms.subjective.length > 2 && '...'}
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(request.createdAt), {
                addSuffix: true
              })}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreVertIcon className="w-4 h-4" />
          </Button>
        </div>
        
        {result && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-1">
              Top Diagnosis:
            </div>
            <div className="font-medium">
              {result.diagnoses[0]?.condition || 'No diagnosis available'}
            </div>
            {result.diagnoses[0] && (
              <div className="text-sm text-gray-600">
                Confidence: {Math.round(result.diagnoses[0].probability * 100)}%
              </div>
            )}
          </div>
        )}
        
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(request)}
          >
            View Details
          </Button>
          {request.status === 'completed' &&
            result?.pharmacistReview?.status === undefined && (
              <Button
                size="sm"
                onClick={() => handleQuickAction('review')}
              >
                Review
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
const DiagnosticDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Store state
  const { filters, setFilters, clearFilters, selectRequest } = useDiagnosticStore();
  
  // Mock data
  const historyData = { data: { results: [] } };
  const historyLoading = false;
  const historyError = null;
  const analyticsData = { data: {} };
  const analyticsLoading = false;
  const analyticsError = null;
  
  const refetchHistory = useCallback(() => {
    return Promise.resolve();
  }, []);
  
  const refetchAnalytics = useCallback(() => {
    return Promise.resolve();
  }, []);

  // Real-time updates for pending requests
  const pendingRequests = historyData?.data?.results?.filter(
    (req: DiagnosticRequest) =>
      req.status === 'pending' || req.status === 'processing'
  ) || [];

  // Handlers
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      if (value !== filters.search) {
        setFilters({ search: value, page: 1 });
      }
    },
    [setFilters, filters.search]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchHistory(), refetchAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchHistory, refetchAnalytics]);

  const handleNewCase = useCallback(() => {
    navigate('/pharmacy/diagnostics/case/new');
  }, [navigate]);

  const handleViewDetails = useCallback(
    (request: DiagnosticRequest) => {
      selectRequest(request);
      navigate(`/pharmacy/diagnostics/case/${request._id}`);
    },
    [selectRequest, navigate]
  );

  const handleQuickAction = useCallback(
    (request: DiagnosticRequest, action: string) => {
      switch (action) {
        case 'view':
          handleViewDetails(request);
          break;
        case 'review':
          navigate(`/pharmacy/diagnostics/case/${request._id}`);
          break;
        case 'cancel':
          // Handle cancel logic
          break;
        case 'export':
          // Handle export logic
          break;
      }
    },
    [handleViewDetails, navigate]
  );

  // Computed values
  const recentCases = historyData?.data?.results || [];
  const analytics = analyticsData?.data as DiagnosticAnalytics | undefined;
  
  const quickStats = useMemo(
    () => [
      {
        title: 'Total Cases',
        value: analytics?.totalRequests || 0,
        icon: <AssessmentIcon className="w-5 h-5" />,
        color: 'primary' as const,
        trend: { value: 12, isPositive: true },
      },
      {
        title: 'Completed Today',
        value: analytics?.completedRequests || 0,
        icon: <CheckCircleIcon className="w-5 h-5" />,
        color: 'success' as const,
        trend: { value: 8, isPositive: true },
      },
      {
        title: 'Pending Review',
        value: pendingRequests.length,
        icon: <ScheduleIcon className="w-5 h-5" />,
        color: 'warning' as const,
      },
      {
        title: 'Avg Confidence',
        value: analytics?.averageConfidenceScore
          ? `${Math.round(analytics.averageConfidenceScore * 100)}%`
          : '0%',
        icon: <TrendingUpIcon className="w-5 h-5" />,
        color: 'secondary' as const,
        trend: { value: 5, isPositive: true },
      },
    ],
    [analytics, pendingRequests.length]
  );

  if (historyError || analyticsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-4">
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center space-x-2">
          <RefreshIcon className="w-4 h-4" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              Diagnostic Dashboard
            </h1>
            <p className="text-gray-600">
              AI-powered diagnostic analysis and case management
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleNewCase}>
              <AddIcon className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex space-x-4">
          <Input
            placeholder="Search cases..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-md"
          />
          <Button variant="outline">
            <FilterListIcon className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {quickStats.map((stat, index) => (
          <div key={index}>
            {analyticsLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <QuickStatsCard {...stat} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Cases</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/pharmacy/diagnostics')}
                >
                  View All
                </Button>
              </div>
              
              {historyLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-24" />
                  ))}
                </div>
              ) : recentCases.length > 0 ? (
                <div>
                  {recentCases.map((request: DiagnosticRequest) => (
                    <RecentCaseCard
                      key={request._id}
                      request={request}
                      onViewDetails={handleViewDetails}
                      onQuickAction={handleQuickAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ScienceIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No cases yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start your first diagnostic case to see it here
                  </p>
                  <Button onClick={handleNewCase}>
                    Create First Case
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={handleNewCase}
                >
                  <AddIcon className="w-4 h-4 mr-2" />
                  New Diagnostic Case
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/pharmacy/diagnostics/case/new')}
                >
                  <ScienceIcon className="w-4 h-4 mr-2" />
                  Lab Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/pharmacy/diagnostics')}
                >
                  <TimelineIcon className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/pharmacy/diagnostics')}
                >
                  <LocalHospitalIcon className="w-4 h-4 mr-2" />
                  Referrals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <NotificationsIcon className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive">
                    {pendingRequests.length}
                  </Badge>
                )}
              </div>
              
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((request: DiagnosticRequest) => (
                    <Alert key={request._id} className="flex justify-between items-center">
                      <div>
                        Patient - Case {request.status}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                      >
                        View
                      </Button>
                    </Alert>
                  ))}
                  {pendingRequests.length > 3 && (
                    <p className="text-sm text-gray-600">
                      +{pendingRequests.length - 3} more pending cases
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No pending notifications</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashboard;
