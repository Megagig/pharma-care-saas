import { Button, Input, Label, Card, CardContent, Badge, Select, Spinner, Alert, Avatar, Switch, Separator } from '@/components/ui/button';

interface SearchFilters {
  query: string;
  conversationId?: string;
  senderId?: string;
  participantId?: string;
  messageType?:
    | 'text'
    | 'file'
    | 'image'
    | 'clinical_note'
    | 'system'
    | 'voice_note';
  fileType?: string;
  priority?: 'normal' | 'high' | 'urgent';
  hasAttachments?: boolean;
  hasMentions?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'sender';
  sortOrder?: 'asc' | 'desc';
}
interface SearchResult {
  message: {
    _id: string;
    content: {
      text?: string;
      type: string;
      attachments?: any[];
    };
    senderId: string;
    mentions: string[];
    priority: string;
    createdAt: string;
    sender: {
      _id: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
  conversation: {
    _id: string;
    title: string;
    type: string;
    status: string;
  };
  highlights?: {
    content?: string;
    title?: string;
  };
  score?: number;
}
interface SearchStats {
  totalResults: number;
  searchTime: number;
  facets: {
    messageTypes: { type: string; count: number }[];
    senders: { userId: string; name: string; count: number }[];
    conversations: { conversationId: string; title: string; count: number }[];
  };
}
interface SavedSearch {
  _id: string;
  name: string;
  description?: string;
  query: string;
  filters: SearchFilters;
  searchType: 'message' | 'conversation';
  isPublic: boolean;
  lastUsed?: string;
  useCount: number;
  createdAt: string;
}
interface MessageSearchProps {
  height?: string;
  onResultSelect?: (result: SearchResult) => void;
  onConversationSelect?: (conversationId: string) => void;
  showSavedSearches?: boolean;
  showSuggestions?: boolean;
  defaultFilters?: Partial<SearchFilters>;
}
const MessageSearch: React.FC<MessageSearchProps> = ({ 
  height = '600px',
  onResultSelect,
  onConversationSelect,
  showSavedSearches = true,
  showSuggestions = true}
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchDescription, setSaveSearchDescription] = useState('');
  const [saveAsPublic, setSaveAsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
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
          `/api/communication/search/messages?${queryParams}`,
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
      filters.conversationId ||
      filters.senderId ||
      filters.participantId ||
      filters.messageType ||
      filters.fileType ||
      filters.priority ||
      filters.hasAttachments !== undefined ||
      filters.hasMentions !== undefined ||
      filters.startDate ||
      filters.endDate ||
      (filters.tags && filters.tags.length > 0)
    );
  };
  // Add to search history
  const addToSearchHistory = (query: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      return [query, ...filtered].slice(0, 10);
    });
  };
  // Load search suggestions
  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/communication/search/suggestions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };
  // Load saved searches
  const loadSavedSearches = async () => {
    try {
      const response = await fetch(
        '/api/communication/search/saved?type=message&includePublic=true',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.data.userSearches || []);
      }
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  };
  // Save current search
  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim()) return;
    try {
      const response = await fetch('/api/communication/search/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          name: saveSearchName.trim(),
          description: saveSearchDescription.trim() || undefined,
          query: filters.query,
          filters: {
            conversationId: filters.conversationId,
            senderId: filters.senderId,
            messageType: filters.messageType,
            priority: filters.priority,
            dateFrom: filters.startDate,
            dateTo: filters.endDate,
            tags: filters.tags}
          },
          searchType: 'message',
          isPublic: saveAsPublic}
      if (response.ok) {
        setShowSaveDialog(false);
        setSaveSearchName('');
        setSaveSearchDescription('');
        setSaveAsPublic(false);
        loadSavedSearches();
      } else {
        throw new Error('Failed to save search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search');
    }
  };
  // Load saved search
  const loadSavedSearch = async (savedSearch: SavedSearch) => {
    try {
      // Use the saved search
      await fetch(`/api/communication/search/saved/${savedSearch._id}/use`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      // Apply the filters
      setFilters({ 
        ...savedSearch.filters,
        query: savedSearch.query}
      });
    } catch (err) {
      console.error('Failed to load saved search:', err);
    }
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
  // Render search result item
  const renderSearchResult = (result: SearchResult, index: number) => {
    const { message, conversation, highlights } = result;
    const sender = message.sender;
    return (
      <div
        key={message._id}
        button
        onClick={() => onResultSelect?.(result)}
        className=""
      >
        <divAvatar>
          <Avatar className="">
            {sender.firstName[0]}
            {sender.lastName[0]}
          </Avatar>
        </ListItemAvatar>
        <div
          primary={
            <div
              className=""
            >
              <div >}
                {sender.firstName} {sender.lastName}
              </div>
              <Chip
                size="small"
                label={sender.role}
                
                className=""
              />
              <Chip
                size="small"
                label={message.priority}
                color={
                  message.priority === 'urgent'
                    ? 'error'
                    : message.priority === 'high'
                    ? 'warning'
                    : 'default'}
                }
                
              />
              {message.content.attachments &&
                message.content.attachments.length > 0 && (
                  <AttachFileIcon
                    className=""
                  />
                )}
              {message.mentions.length > 0 && (
                <MentionIcon className="" />
              )}
            </div>
          }
          
              />
              <div className="">
                <div  color="text.secondary">
                  in {conversation.title}
                </div>
                <div  color="text.secondary">
                  • {format(parseISO(message.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
                {result.score && (
                  <div  color="text.secondary">
                    • Score: {result.score.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          }
        />
        <IconButton
          >
          <ViewIcon />
        </IconButton>
      </div>
    );
  };
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);
  useEffect(() => {
    if (showSuggestions) {
      loadSuggestions();
    }
    if (showSavedSearches) {
      loadSavedSearches();
    }
  }, [showSuggestions, showSavedSearches]);
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Search Header */}
        <div className="">
          <div
            
            className=""
          >
            <SearchIcon />
            Message Search
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
            placeholder="Search messages... (e.g., 'medication dosage', 'patient symptoms', 'prescription changes')"
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
            {results.length > 0 && (
              <>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => setShowSaveDialog(true)}
                  size="small"
                  
                >
                  Save Search
                </Button>
              </>
            )}
          </div>
          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Card  className="">
              <CardContent>
                <div container spacing={2}>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Message Type</Label>
                      <Select
                        value={filters.messageType || ''}
                        onChange={(e) =>
                          handleFilterChange('messageType', e.target.value)}
                        }
                        label="Message Type"
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="file">File</MenuItem>
                        <MenuItem value="image">Image</MenuItem>
                        <MenuItem value="clinical_note">Clinical Note</MenuItem>
                        <MenuItem value="voice_note">Voice Note</MenuItem>
                      </Select>
                    </div>
                  </div>
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
                    <FormControlLabel
                      control={
                        <Switch}
                          checked={filters.hasAttachments || false}
                          onChange={(e) =>
                            handleFilterChange(
                              'hasAttachments',
                              e.target.checked
                            )}
                          }
                        />
                      }
                      label="Has Attachments"
                    />
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch}
                          checked={filters.hasMentions || false}
                          onChange={(e) =>
                            handleFilterChange('hasMentions', e.target.checked)}
                          }
                        />
                      }
                      label="Has Mentions"
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
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="sender">Sender</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Sort Order</Label>
                      <Select
                        value={filters.sortOrder || 'desc'}
                        onChange={(e) =>
                          handleFilterChange('sortOrder', e.target.value)}
                        }
                        label="Sort Order"
                      >
                        <MenuItem value="desc">Descending</MenuItem>
                        <MenuItem value="asc">Ascending</MenuItem>
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
        {/* Content Area */}
        <div className="">
          {/* Saved Searches Sidebar */}
          {showSavedSearches && savedSearches.length > 0 && (
            <div
              className=""
            >
              <div className="">
                <div  gutterBottom>
                  Saved Searches
                </div>
                <List dense>
                  {savedSearches.map((savedSearch) => (
                    <div
                      key={savedSearch._id}
                      button
                      onClick={() => loadSavedSearch(savedSearch)}
                    >
                      <div
                        primary={savedSearch.name}
                        secondary={`${savedSearch.useCount} uses • ${format(
                          parseISO(savedSearch.createdAt),
                          'MMM dd'
                        )}`}
                      />
                    </div>
                  ))}
                </List>
              </div>
            </div>
          )}
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
                  {stats.totalResults.toLocaleString()} results found in{' '}
                  {stats.searchTime}ms
                </div>
              </div>
            )}
            {/* Results */}
            {!loading && results.length > 0 && (
              <List>
                {results.map((result, index) => (
                  <React.Fragment key={result.message._id}>
                    {renderSearchResult(result, index)}
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
                    No messages found matching your search criteria
                  </div>
                  <Button
                    onClick={clearFilters}
                    
                    size="small"
                  >
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
                    Enter a search query to find messages
                  </div>
                  <div  color="text.secondary">
                    Try searching for medications, symptoms, or patient names
                  </div>
                </div>
              )}
          </div>
        </div>
        {/* Save Search Dialog */}
        <Collapse in={showSaveDialog}>
          <div className="">
            <div  gutterBottom>
              Save Search
            </div>
            <Input
              fullWidth
              label="Search Name"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className=""
            />
            <Input
              fullWidth
              label="Description (optional)"
              value={saveSearchDescription}
              onChange={(e) => setSaveSearchDescription(e.target.value)}
              multiline
              rows={2}
              className=""
            />
            <FormControlLabel
              control={
                <Switch}
                  checked={saveAsPublic}
                  onChange={(e) => setSaveAsPublic(e.target.checked)}
                />
              }
              label="Share with team"
              className=""
            />
            <div className="">
              <Button
                
                onClick={saveCurrentSearch}
                disabled={!saveSearchName.trim()}
              >
                Save
              </Button>
              <Button
                
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Collapse>
      </div>
    </LocalizationProvider>
  );
};
export default MessageSearch;
