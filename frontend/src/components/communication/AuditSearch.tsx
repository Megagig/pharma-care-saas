import { Button, Input, Label, Card, CardContent, Badge, Select, Tooltip, Spinner, Alert, Separator } from '@/components/ui/button';

interface SearchFilters {
  query: string;
  action?: string;
  riskLevel?: string;
  complianceCategory?: string;
  userId?: string;
  targetType?: string;
  success?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}
interface SearchResult {
  _id: string;
  action: string;
  timestamp: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  targetType: string;
  riskLevel: string;
  complianceCategory: string;
  success: boolean;
  details: {
    conversationId?: string;
    messageId?: string;
    patientId?: string;
    fileName?: string;
  };
  score?: number; // Search relevance score
}
interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  resultCount?: number;
}
interface SearchSuggestion {
  type: 'action' | 'user' | 'category' | 'recent';
  value: string;
  label: string;
  count?: number;
}
interface AuditSearchProps {
  height?: string;
  onResultSelect?: (result: SearchResult) => void;
  showSavedSearches?: boolean;
  showSuggestions?: boolean;
}
const AuditSearch: React.FC<AuditSearchProps> = ({ 
  height = '600px',
  onResultSelect,
  showSavedSearches = true,
  showSuggestions = true
}) => {
  const [filters, setFilters] = useState<SearchFilters>({ 
    query: '',
    startDate: subDays(new Date(), 30),
    endDate: new Date()}
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFilters.query.trim() && !hasAdvancedFilters(searchFilters)) {
        setResults([]);
        setTotalResults(0);
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
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
        const response = await fetch(
          `/api/communication/audit/search?${queryParams}`,
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
        setTotalResults(data.pagination?.total || data.data?.length || 0);
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
      filters.action ||
      filters.riskLevel ||
      filters.complianceCategory ||
      filters.userId ||
      filters.targetType ||
      filters.success !== undefined ||
      filters.startDate ||
      filters.endDate
    );
  };
  // Add to search history
  const addToSearchHistory = (query: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      return [query, ...filtered].slice(0, 10); // Keep last 10 searches
    });
  };
  // Load search suggestions
  const loadSuggestions = async () => {
    try {
      // This would typically come from an API endpoint
      // For now, we'll use static suggestions
      const staticSuggestions: SearchSuggestion[] = [
        {
          type: 'action',
          value: 'message_sent',
          label: 'Message Sent',
          count: 150,
        },
        {
          type: 'action',
          value: 'file_uploaded',
          label: 'File Uploaded',
          count: 45,
        },
        {
          type: 'action',
          value: 'conversation_created',
          label: 'Conversation Created',
          count: 30,
        },
        {
          type: 'category',
          value: 'patient_privacy',
          label: 'Patient Privacy',
          count: 89,
        },
        {
          type: 'category',
          value: 'data_access',
          label: 'Data Access',
          count: 67,
        },
      ];
      setSuggestions(staticSuggestions);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };
  // Load saved searches
  const loadSavedSearches = () => {
    const saved = localStorage.getItem('auditSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };
  // Save current search
  const saveCurrentSearch = () => {
    const name = prompt('Enter a name for this search:');
    if (!name) return;
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
      resultCount: totalResults,
    };
    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('auditSearches', JSON.stringify(updated));
  };
  // Load saved search
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
  };
  // Delete saved search
  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((search) => search.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('auditSearches', JSON.stringify(updated));
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
      endDate: new Date()}
    });
    setResults([]);
    setTotalResults(0);
  };
  // Export search results
  const exportResults = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.query.trim()) {
        queryParams.append('q', filters.query.trim());
      }
      Object.entries(filters).forEach(([key, value]) => {
        if (
          key !== 'query' &&
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      queryParams.append('format', 'csv');
      const response = await fetch(
        `/api/communication/audit/export?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_search_results_${format(
        new Date(),
        'yyyy-MM-dd'
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
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
            Audit Log Search
            {totalResults > 0 && (
              <Badge badgeContent={totalResults} color="primary" max={999} />
            )}
          </div>
          {/* Main Search Bar */}
          <Input
            fullWidth
            placeholder="Search audit logs... (e.g., 'message sent by John', 'high risk activities', 'file uploads')"
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
                  startIcon={<BookmarkIcon />}
                  onClick={saveCurrentSearch}
                  size="small"
                  
                >
                  Save Search
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={exportResults}
                  size="small"
                  
                >
                  Export Results
                </Button>
              </>
            )}
          </div>
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card  className="">
              <CardContent>
                <div container spacing={2}>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Action</Label>
                      <Select
                        value={filters.action || ''}
                        onChange={(e) =>
                          handleFilterChange('action', e.target.value)}
                        }
                        label="Action"
                      >
                        <MenuItem value="">All Actions</MenuItem>
                        <MenuItem value="message_sent">Message Sent</MenuItem>
                        <MenuItem value="message_read">Message Read</MenuItem>
                        <MenuItem value="conversation_created">
                          Conversation Created
                        </MenuItem>
                        <MenuItem value="file_uploaded">File Uploaded</MenuItem>
                        <MenuItem value="participant_added">
                          Participant Added
                        </MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div item xs={12} sm={6} md={3}>
                    <div fullWidth size="small">
                      <Label>Risk Level</Label>
                      <Select
                        value={filters.riskLevel || ''}
                        onChange={(e) =>
                          handleFilterChange('riskLevel', e.target.value)}
                        }
                        label="Risk Level"
                      >
                        <MenuItem value="">All Levels</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
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
                </div>
              </CardContent>
            </Card>
          )}
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && !filters.query && (
            <div className="">
              <div  gutterBottom>
                Popular Searches
              </div>
              <div className="">
                {suggestions.slice(0, 8).map((suggestion) => (
                  <Chip
                    key={suggestion.value}
                    label={`${suggestion.label} (${suggestion.count})`}
                    onClick={() =>
                      handleFilterChange('query', suggestion.label)}
                    }
                    
                    size="small"
                    icon={<TrendingIcon />}
                  />
                ))}
              </div>
            </div>
          )}
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
                      key={savedSearch.id}
                      button
                      onClick={() => loadSavedSearch(savedSearch)}
                    >
                      <div
                        primary={savedSearch.name}
                        secondary={`${
                          savedSearch.resultCount || 0}
                        } results • ${format(
                          parseISO(savedSearch.createdAt),
                          'MMM dd'
                        )}`}
                      />
                      <divSecondaryAction>
                        <IconButton
                          size="small"
                          >
                          <ClearIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
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
            {/* Results */}
            {!loading && results.length > 0 && (
              <div className="">
                <div  gutterBottom>
                  {totalResults.toLocaleString()} results found
                </div>
                <List>
                  {results.map((result, index) => (
                    <React.Fragment key={result._id}>
                      <div
                        button
                        onClick={() => onResultSelect?.(result)}
                        className=""
                      >
                        <div
                          primary={
                            <div
                              className=""
                            >
                              <div >
                                {result.action
                                  .replace(/_/g, ' ')}
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                              <Chip
                                size="small"
                                label={result.riskLevel}
                                color={
                                  result.riskLevel === 'critical' ||
                                  result.riskLevel === 'high'
                                    ? 'error'
                                    : result.riskLevel === 'medium'
                                    ? 'warning'
                                    : 'success'}
                                }
                                
                              />
                              <Chip
                                size="small"
                                label={result.success ? 'Success' : 'Failed'}
                                color={result.success ? 'success' : 'error'}
                                
                              />
                            </div>
                          }
                          secondary={
                            <div>
                              <div
                                
                                color="text.secondary"
                              >}
                                {result.userId.firstName}{' '}
                                {result.userId.lastName} ({result.userId.role})
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {format(parseISO(result.timestamp), 'PPpp')}
                              </div>
                              {(result.details.conversationId ||
                                result.details.fileName) && (
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {result.details.conversationId &&
                                    `Conversation: ${result.details.conversationId.slice(
                                      -8
                                    )}`}
                                  {result.details.fileName &&
                                    ` • File: ${result.details.fileName}`}
                                </div>
                              )}
                            </div>
                          }
                        />
                        <divSecondaryAction>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => onResultSelect?.(result)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </div>
                      {index < results.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </List>
              </div>
            )}
            {/* No Results */}
            {!loading &&
              results.length === 0 &&
              (filters.query || hasAdvancedFilters(filters)) && (
                <div className="">
                  <div color="text.secondary" gutterBottom>
                    No audit logs found matching your search criteria
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
                    Enter a search query or use filters to find audit logs
                  </div>
                  <div  color="text.secondary">
                    Try searching for actions, users, or specific events
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};
export default AuditSearch;
