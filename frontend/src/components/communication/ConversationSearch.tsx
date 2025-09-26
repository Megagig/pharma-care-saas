import { Button, Input, Label, Card, CardContent, Badge, Select, Spinner, Alert, Avatar, Separator } from '@/components/ui/button';

interface SearchFilters {
  query: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  startDate?: Date | null;
  endDate?: Date | null;
  sortBy?: 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}
interface ConversationResult {
  _id: string;
  title: string;
  type: 'direct' | 'group' | 'patient_query' | 'clinical_consultation';
  status: 'active' | 'archived' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  lastMessageAt: string;
  participantDetails: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  patientId?: {
    _id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
  unreadCount?: number;
  score?: number;
}
interface SearchStats {
  totalResults: number;
  searchTime: number;
}
interface ConversationSearchProps {
  height?: string;
  onConversationSelect?: (conversation: ConversationResult) => void;
  showSavedSearches?: boolean;
  defaultFilters?: Partial<SearchFilters>;
}
const ConversationSearch: React.FC<ConversationSearchProps> = ({ 
  height = '600px',
  onConversationSelect,
  showSavedSearches = true}
  defaultFilters = {}
}) => {
  const [filters, setFilters] = useState<SearchFilters>({ 
    query: '',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    sortBy: 'relevance',
    sortOrder: 'desc',
    ...defaultFilters}
  });
  const [results, setResults] = useState<ConversationResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFilters.query.trim() && !hasAdvancedFilters(searchFilters)) {
        setResults([]);
        setStats(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (searchFilters.query.trim()) {
          queryParams.append('q', searchFilters.query.trim());
        }
        // Add other filters
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (
            key !== 'query' &&
            value !== undefined &&
            value !== null &&
            value !== ''
          ) {
            if (value instanceof Date) {
              queryParams.append(key, value.toISOString());
            } else if (Array.isArray(value)) {
              value.forEach((item) => queryParams.append(key, item));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
        const response = await fetch(
          `/api/communication/search/conversations?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data = await response.json();
        setResults(data.data || []);
        setStats(data.stats);
        // Add to search history
        if (searchFilters.query.trim()) {
          addToSearchHistory(searchFilters.query.trim());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );
  // Check if advanced filters are set
  const hasAdvancedFilters = (filters: SearchFilters) => {
    return !!(
      filters.priority ||
      (filters.tags && filters.tags.length > 0) ||
      filters.startDate ||
      filters.endDate
    );
  };
  // Add to search history
  const addToSearchHistory = (query: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      return [query, ...filtered].slice(0, 10);
    });
  };
  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };
  // Clear all filters
  const clearFilters = () => {
    setFilters({ 
      query: '',
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      sortBy: 'relevance',
      sortOrder: 'desc'}
    });
    setResults([]);
    setStats(null);
  };
  // Get conversation type icon
  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <PersonIcon />;
      case 'group':
        return <GroupIcon />;
      case 'patient_query':
      case 'clinical_consultation':
        return <MedicalIcon />;
      default:
        return <GroupIcon />;
    }
  };
  // Get conversation type label
  const getConversationTypeLabel = (type: string) => {
    switch (type) {
      case 'direct':
        return 'Direct Message';
      case 'group':
        return 'Group Chat';
      case 'patient_query':
        return 'Patient Query';
      case 'clinical_consultation':
        return 'Clinical Consultation';
      default:
        return type;
    }
  };
  // Render conversation result
  const renderConversationResult = (
    conversation: ConversationResult,
    index: number
  ) => {
    const participantNames = conversation.participantDetails
      .slice(0, 3)
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(', ');
    const moreParticipants =
      conversation.participantDetails.length > 3
        ? ` +${conversation.participantDetails.length - 3} more`
        : '';
    return (
      <div
        key={conversation._id}
        button
        onClick={() => onConversationSelect?.(conversation)}
        className=""
      >
        <divAvatar>
          <Avatar className="">
            {getConversationIcon(conversation.type)}
          </Avatar>
        </ListItemAvatar>
        <div
          primary={
            <div
              className=""
            >
              <div  className="">}
                {conversation.title}
              </div>
              <Chip
                size="small"
                label={getConversationTypeLabel(conversation.type)}
                
                className=""
              />
              <Chip
                size="small"
                label={conversation.priority}
                color={
                  conversation.priority === 'urgent'
                    ? 'error'
                    : conversation.priority === 'high'
                    ? 'warning'
                    : conversation.priority === 'low'
                    ? 'info'
                    : 'default'}
                }
                
              />
              <Chip
                size="small"
                label={conversation.status}
                color={
                  conversation.status === 'active'
                    ? 'success'
                    : conversation.status === 'resolved'
                    ? 'info'
                    : 'default'}
                }
                
              />
              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <Badge
                  badgeContent={conversation.unreadCount}
                  color="primary"
                />
              )}
            </div>
          }
          secondary={
            <div>
              <div
                
                color="text.secondary"
                className=""
              >}
                Participants: {participantNames}
                {moreParticipants}
              </div>
              {conversation.patientId && (
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Patient: {conversation.patientId.firstName}{' '}
                  {conversation.patientId.lastName}
                  (MRN: {conversation.patientId.mrn})
                </div>
              )}
              {conversation.tags.length > 0 && (
                <div
                  className=""
                >
                  {conversation.tags.map((tag, tagIndex) => (
                    <Chip
                      key={tagIndex}
                      label={tag}
                      size="small"
                      
                      className=""
                    />
                  ))}
                </div>
              )}
              <div className="">
                <ScheduleIcon className="" />
                <div  color="text.secondary">
                  Last activity:{' '}
                  {format(
                    parseISO(conversation.lastMessageAt),
                    'MMM dd, yyyy HH:mm'
                  )}
                </div>
                {conversation.score && (
                  <div  color="text.secondary">
                    • Score: {conversation.score.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          }
        />
        <IconButton>
          <ViewIcon />
        </IconButton>
      </div>
    );
  };
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Search Header */}
        <div className="">
          <div
            
            className=""
          >
            <SearchIcon />
            Conversation Search
            {stats && (
              <Badge
                badgeContent={stats.totalResults}
                color="primary"
                max={999}
              />
            )}
          </div>
          {/* Main Search Bar */}
          <Input
            fullWidth
            placeholder="Search conversations... (e.g., 'patient consultation', 'medication review', 'urgent cases')"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filters.query && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"}
                    onClick={() =>handleFilterChange('query', '')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            className=""
          />
          {/* Quick Actions */}
          <div className="">
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant={showAdvancedFilters ? 'contained' : 'outlined'}
              size="small"
            >
              Advanced Filters
            </Button>
            {hasAdvancedFilters(filters) && (
              <Button
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
                
              >
                Clear All
              </Button>
            )}
          </div>
          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Card  className="">
              <CardContent>
                <div container spacing={2}>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Priority</Label>
                      <Select
                        value={filters.priority || ''}
                        onChange={(e) =>
                          handleFilterChange('priority', e.target.value)}
                        }
                        label="Priority"
                      >
                        <MenuItem value="">All Priorities</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{}
                        textField: { size: 'small', fullWidth: true },
                    />
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{}
                        textField: { size: 'small', fullWidth: true },
                    />
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Sort By</Label>
                      <Select
                        value={filters.sortBy || 'relevance'}
                        onChange={(e) =>
                          handleFilterChange('sortBy', e.target.value)}
                        }
                        label="Sort By"
                      >
                        <MenuItem value="relevance">Relevance</MenuItem>
                        <MenuItem value="date">Last Activity</MenuItem>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Collapse>
          {/* Search History */}
          {searchHistory.length > 0 && !filters.query && (
            <div className="">
              <div  gutterBottom>
                Recent Searches
              </div>
              <div className="">
                {searchHistory.slice(0, 5).map((query, index) => (
                  <Chip
                    key={index}
                    label={query}
                    onClick={() => handleFilterChange('query', query)}
                    
                    size="small"
                    icon={<HistoryIcon />}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Results Area */}
        <div className="">
          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              className=""
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {/* Loading State */}
          {loading && (
            <div className="">
              <Spinner />
            </div>
          )}
          {/* Search Stats */}
          {!loading && stats && (
            <div className="">
              <div  color="text.secondary">
                {stats.totalResults.toLocaleString()} conversations found in{' '}
                {stats.searchTime}ms
              </div>
            </div>
          )}
          {/* Results */}
          {!loading && results.length > 0 && (
            <List>
              {results.map((result, index) => (
                <React.Fragment key={result._id}>
                  {renderConversationResult(result, index)}
                  {index < results.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </List>
          )}
          {/* No Results */}
          {!loading &&
            results.length === 0 &&
            (filters.query || hasAdvancedFilters(filters)) && (
              <div className="">
                <div color="text.secondary" gutterBottom>
                  No conversations found matching your search criteria
                </div>
                <Button onClick={clearFilters}  size="small">
                  Clear Search
                </Button>
              </div>
            )}
          {/* Initial State */}
          {!loading &&
            results.length === 0 &&
            !filters.query &&
            !hasAdvancedFilters(filters) && (
              <div className="">
                <SearchIcon
                  className=""
                />
                <div color="text.secondary" gutterBottom>
                  Enter a search query to find conversations
                </div>
                <div  color="text.secondary">
                  Try searching for patient names, topics, or conversation types
                </div>
              </div>
            )}
        </div>
      </div>
    </LocalizationProvider>
  );
};
export default ConversationSearch;
