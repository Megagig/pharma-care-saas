import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Assignment,
  Schedule,
  CheckCircle,
  Archive,
  PriorityHigh,
  TrendingUp,
  Assessment,
  Download,
  Add,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import QueryCard from './QueryCard';
import NewConversationModal from './NewConversationModal';
import { useCommunicationStore } from '../../stores/communicationStore';
import { Conversation, ConversationFilters } from '../../stores/types';

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
  onCreateQuery,
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
    end: null,
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
      <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h1">
              Patient Query Dashboard
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
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
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  if (onCreateQuery) {
                    onCreateQuery();
                  } else {
                    setShowNewQueryModal(true);
                  }
                }}
              >
                New Query
              </Button>
            </Box>
          </Box>

          {/* Analytics Cards */}
          {showAnalytics && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment color="primary" />
                      <Box>
                        <Typography variant="h6">
                          {analytics.totalQueries}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Queries
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule color="warning" />
                      <Box>
                        <Typography variant="h6">
                          {analytics.openQueries}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Open Queries
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" />
                      <Box>
                        <Typography variant="h6">
                          {analytics.resolvedQueries}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Resolved
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PriorityHigh color="error" />
                      <Box>
                        <Typography variant="h6">
                          {analytics.urgentQueries}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Urgent
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="info" />
                      <Box>
                        <Typography variant="h6">
                          {analytics.averageResponseTime}h
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Response
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
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
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
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
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(date) =>
                  setDateRange((prev) => ({ ...prev, start: date }))
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={6} md={2}>
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(date) =>
                  setDateRange((prev) => ({ ...prev, end: date }))
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Loading indicator */}
        {loading.fetchConversations && <LinearProgress />}

        {/* Error display */}
        {errors.fetchConversations && (
          <Alert severity="error" sx={{ m: 2 }}>
            {errors.fetchConversations}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabs.map((tab, index) => (
              <Tab
                key={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Badge badgeContent={tab.count} color="primary" />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Bulk actions */}
        {selectedQueries.length > 0 && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.selected',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body2">
              {selectedQueries.length} queries selected
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkAction('resolve')}
            >
              Resolve Selected
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkAction('archive')}
            >
              Archive Selected
            </Button>

            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedQueries([])}
            >
              Clear Selection
            </Button>
          </Box>
        )}

        {/* Query List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {currentTabQueries.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Assessment
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No queries found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeTab === 0
                  ? 'No patient queries match your current filters.'
                  : `No ${tabs[activeTab].label.toLowerCase()} queries found.`}
              </Typography>
              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowNewQueryModal(true)}
                >
                  Create First Query
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {currentTabQueries.map((query) => (
                <Grid item xs={12} key={query._id}>
                  <QueryCard
                    query={query}
                    selected={selectedQueries.includes(query._id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedQueries((prev) => [...prev, query._id]);
                      } else {
                        setSelectedQueries((prev) =>
                          prev.filter((id) => id !== query._id)
                        );
                      }
                    }}
                    onClick={() => onQuerySelect?.(query)}
                    onAction={handleQueryAction}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* New Query Modal */}
        <NewConversationModal
          open={showNewQueryModal}
          onClose={() => setShowNewQueryModal(false)}
          defaultType="patient_query"
          patientId={patientId}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default PatientQueryDashboard;
