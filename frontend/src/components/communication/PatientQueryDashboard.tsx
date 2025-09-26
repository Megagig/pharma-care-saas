import QueryCard from './QueryCard';

import NewConversationModal from './NewConversationModal';

import { Button, Input, Label, Card, CardContent, Badge, Select, Tooltip, Progress, Alert, Tabs } from '@/components/ui/button';

interface PatientQueryDashboardProps {
  patientId?: string;
  height?: string | number;
  showAnalytics?: boolean;
  onQuerySelect?: (query: Conversation) => void;
  onCreateQuery?: () => void;
}
interface QueryAnalytics {
  totalQueries: number;
  openQueries: number;
  resolvedQueries: number;
  averageResponseTime: number;
  urgentQueries: number;
  queryTrends: {
    period: string;
    count: number;
  }[];
}
const PatientQueryDashboard: React.FC<PatientQueryDashboardProps> = ({ 
  patientId,
  height = '600px',
  showAnalytics = true,
  onQuerySelect,
  onCreateQuery
}) => {
  const {
    conversations,
    conversationFilters,
    loading,
    errors,
    fetchConversations,
    setConversationFilters,
    clearConversationFilters,
    resolveConversation,
    archiveConversation,
    updateConversation,
  } = useCommunicationStore();
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ 
    start: null,
    end: null
  });
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  // Filter conversations to only patient queries
  const patientQueries = useMemo(() => {
    return conversations.filter((conv) => {
      // Filter by type
      if (conv.type !== 'patient_query') return false;
      // Filter by patient ID if provided
      if (patientId && conv.patientId !== patientId) return false;
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = conv.title?.toLowerCase().includes(searchLower);
        const participantMatch = conv.participants.some((p) =>
          p.role.toLowerCase().includes(searchLower)
        );
        const tagMatch = conv.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        if (!titleMatch && !participantMatch && !tagMatch) return false;
      }
      // Apply status filter
      if (statusFilter !== 'all' && conv.status !== statusFilter) return false;
      // Apply priority filter
      if (priorityFilter !== 'all' && conv.priority !== priorityFilter)
        return false;
      // Apply date range filter
      if (dateRange.start || dateRange.end) {
        const queryDate = new Date(conv.createdAt);
        if (dateRange.start && queryDate < startOfDay(dateRange.start))
          return false;
        if (dateRange.end && queryDate > endOfDay(dateRange.end)) return false;
      }
      return true;
    });
  }, [
    conversations,
    patientId,
    searchTerm,
    statusFilter,
    priorityFilter,
    dateRange,
  ]);
  // Group queries by status for tabs
  const queriesByStatus = useMemo(() => {
    return {
      all: patientQueries,
      open: patientQueries.filter((q) => q.status === 'active'),
      pending: patientQueries.filter(
        (q) => q.status === 'active' && q.priority === 'high'
      ),
      resolved: patientQueries.filter((q) => q.status === 'resolved'),
      archived: patientQueries.filter((q) => q.status === 'archived'),
    };
  }, [patientQueries]);
  // Calculate analytics
  const analytics: QueryAnalytics = useMemo(() => {
    const totalQueries = patientQueries.length;
    const openQueries = queriesByStatus.open.length;
    const resolvedQueries = queriesByStatus.resolved.length;
    const urgentQueries = patientQueries.filter(
      (q) => q.priority === 'urgent'
    ).length;
    // Calculate average response time (mock calculation)
    const averageResponseTime =
      resolvedQueries > 0 ? Math.round(Math.random() * 24 + 2) : 0; // Mock: 2-26 hours
    // Generate trend data for the last 7 days
    const queryTrends = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayQueries = patientQueries.filter((q) => {
        const queryDate = new Date(q.createdAt);
        return format(queryDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      return {
        period: format(date, 'MMM dd'),
        count: dayQueries.length,
      };
    });
    return {
      totalQueries,
      openQueries,
      resolvedQueries,
      averageResponseTime,
      urgentQueries,
      queryTrends,
    };
  }, [patientQueries, queriesByStatus]);
  // Tab configuration
  const tabs = [
    { label: 'All Queries', value: 'all', count: queriesByStatus.all.length },
    { label: 'Open', value: 'open', count: queriesByStatus.open.length },
    {
      label: 'Pending',
      value: 'pending',
      count: queriesByStatus.pending.length,
    },
    {
      label: 'Resolved',
      value: 'resolved',
      count: queriesByStatus.resolved.length,
    },
    {
      label: 'Archived',
      value: 'archived',
      count: queriesByStatus.archived.length,
    },
  ];
  // Get current tab queries
  const currentTabQueries =
    queriesByStatus[tabs[activeTab].value as keyof typeof queriesByStatus];
  // Load conversations on mount
  useEffect(() => {
    const filters: ConversationFilters = {
      type: 'patient_query',
      ...(patientId && { patientId }),
      sortBy: 'lastMessageAt',
      sortOrder: 'desc',
    };
    fetchConversations(filters);
  }, [patientId, fetchConversations]);
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  // Handle query actions
  const handleQueryAction = async (action: string, queryId: string) => {
    try {
      switch (action) {
        case 'resolve':
          await resolveConversation(queryId);
          break;
        case 'archive':
          await archiveConversation(queryId);
          break;
        case 'assign':
          // TODO: Implement assignment logic
          console.log('Assign query:', queryId);
          break;
        case 'escalate':
          await updateConversation(queryId, { priority: 'urgent' });
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Query action failed:', error);
    }
  };
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    try {
      const promises = selectedQueries.map((queryId) => {
        switch (action) {
          case 'resolve':
            return resolveConversation(queryId);
          case 'archive':
            return archiveConversation(queryId);
          default:
            return Promise.resolve();
        }
      });
      await Promise.all(promises);
      setSelectedQueries([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  // Handle refresh
  const handleRefresh = () => {
    const filters: ConversationFilters = {
      type: 'patient_query',
      ...(patientId && { patientId }),
      sortBy: 'lastMessageAt',
      sortOrder: 'desc',
    };
    fetchConversations(filters);
  };
  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export queries:', currentTabQueries);
  };
  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDateRange({ start: null, end: null });
    clearConversationFilters();
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div className="">
          <div
            className=""
          >
            <div  component="h1">
              Patient Query Dashboard
            </div>
            <div className="">
              <Tooltip title="Refresh">
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading.fetchConversations}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton onClick={handleExport}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Button
                
                startIcon={<Add />}
                onClick={() => {
                  if (onCreateQuery) {
                    onCreateQuery();
                  } else {
                    setShowNewQueryModal(true);
                  }
                }}
                New Query
              </Button>
            </div>
          </div>
          {/* Analytics Cards */}
          {showAnalytics && (
            <div container spacing={2} className="">
              <div item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent className="">
                    <div className="">
                      <Assignment color="primary" />
                      <div>
                        <div >
                          {analytics.totalQueries}
                        </div>
                        <div  color="text.secondary">
                          Total Queries
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent className="">
                    <div className="">
                      <Schedule color="warning" />
                      <div>
                        <div >
                          {analytics.openQueries}
                        </div>
                        <div  color="text.secondary">
                          Open Queries
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent className="">
                    <div className="">
                      <CheckCircle color="success" />
                      <div>
                        <div >
                          {analytics.resolvedQueries}
                        </div>
                        <div  color="text.secondary">
                          Resolved
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent className="">
                    <div className="">
                      <PriorityHigh color="error" />
                      <div>
                        <div >
                          {analytics.urgentQueries}
                        </div>
                        <div  color="text.secondary">
                          Urgent
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent className="">
                    <div className="">
                      <TrendingUp color="info" />
                      <div>
                        <div >
                          {analytics.averageResponseTime}h
                        </div>
                        <div  color="text.secondary">
                          Avg Response
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* Filters */}
          <div container spacing={2} alignItems="center">
            <div item xs={12} md={3}>
              <Input
                fullWidth
                size="small"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
              />
            </div>
            <div item xs={6} md={2}>
              <div fullWidth size="small">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </div>
            </div>
            <div item xs={6} md={2}>
              <div fullWidth size="small">
                <Label>Priority</Label>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priority</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </div>
            </div>
            <div item xs={6} md={2}>
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(date) =>}
                  setDateRange((prev) => ({ ...prev, start: date }))
                }
                slotProps={{ textField: { size: 'small', fullWidth: true }
              />
            </div>
            <div item xs={6} md={2}>
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(date) =>}
                  setDateRange((prev) => ({ ...prev, end: date }))
                }
                slotProps={{ textField: { size: 'small', fullWidth: true }
              />
            </div>
            <div item xs={12} md={1}>
              <Button
                
                startIcon={<FilterList />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        {/* Loading indicator */}
        {loading.fetchConversations && <Progress />}
        {/* Error display */}
        {errors.fetchConversations && (
          <Alert severity="error" className="">
            {errors.fetchConversations}
          </Alert>
        )}
        {/* Tabs */}
        <div className="">
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabs.map((tab, index) => (
              <Tab
                key={tab.value}
                label={
                  <div className="">}
                    {tab.label}
                    <Badge badgeContent={tab.count} color="primary" />
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>
        {/* Bulk actions */}
        {selectedQueries.length > 0 && (
          <div
            className=""
          >
            <div >
              {selectedQueries.length} queries selected
            </div>
            <Button
              size="small"
              
              onClick={() => handleBulkAction('resolve')}
            >
              Resolve Selected
            </Button>
            <Button
              size="small"
              
              onClick={() => handleBulkAction('archive')}
            >
              Archive Selected
            </Button>
            <Button
              size="small"
              
              onClick={() => setSelectedQueries([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
        {/* Query List */}
        <div className="">
          {currentTabQueries.length === 0 ? (
            <div
              className=""
            >
              <Assessment
                className=""
              />
              <div  color="text.secondary" gutterBottom>
                No queries found
              </div>
              <div  color="text.secondary" className="">
                {activeTab === 0
                  ? 'No patient queries match your current filters.'
                  : `No ${tabs[activeTab].label.toLowerCase()} queries found.`}
              </div>
              {activeTab === 0 && (
                <Button
                  
                  startIcon={<Add />}
                  onClick={() => setShowNewQueryModal(true)}
                >
                  Create First Query
                </Button>
              )}
            </div>
          ) : (
            <div container spacing={2}>
              {currentTabQueries.map((query) => (
                <div item xs={12} key={query._id}>
                  <QueryCard
                    query={query}
                    
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedQueries((prev) => [...prev, query._id]);}
                      } else {
                        setSelectedQueries((prev) =>
                          prev.filter((id) => id !== query._id)
                        );
                      }
                    onClick={() => onQuerySelect?.(query)}
                    onAction={handleQueryAction}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {/* New Query Modal */}
        <NewConversationModal
          open={showNewQueryModal}
          onClose={() => setShowNewQueryModal(false)}
          defaultType="patient_query"
          patientId={patientId}
        />
      </div>
    </LocalizationProvider>
  );
};
export default PatientQueryDashboard;
