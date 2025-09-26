  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,

import VirtualizedClinicalNotesList from './VirtualizedClinicalNotesList';

import { Button, Input, Label, Card, CardContent, Select, Alert, Switch } from '@/components/ui/button';

interface OptimizedClinicalNotesDashboardProps {
  patientId?: string;
  embedded?: boolean;
  maxHeight?: number;
  onNoteSelect?: (noteId: string) => void;
  onNoteEdit?: (noteId: string) => void;
  onNoteCreate?: () => void;
  enableVirtualization?: boolean;
  itemHeight?: number;
}
const OptimizedClinicalNotesDashboard: React.FC = ({ 
  patientId,
  embedded = false,
  maxHeight,
  onNoteSelect,
  onNoteEdit,
  onNoteCreate,
  enableVirtualization = true,
  itemHeight = 160
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Refs for performance optimization
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Store state
  const {
    notes,
    selectedNotes,
    filters,
    searchQuery,
    loading,
    pagination,
    setFilters,
    setSearchQuery,
    toggleNoteSelection,
    clearSelection,
    deleteNote,
    bulkDeleteNotes,
  } = useEnhancedClinicalNoteStore();
  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Debounced search for performance
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  // Current filters with patient context
  const currentFilters = useMemo(
    () => ({ 
      ...filters}
      ...(patientId && { patientId }),
      search: debouncedSearchQuery, },
    [filters, patientId, debouncedSearchQuery]
  );
  // React Query for data fetching
  const { data, isLoading, error, refetch, isFetching } =
    useClinicalNotes(currentFilters);
  // Memoized notes list for performance
  const memoizedNotes = useMemo(() => {
    return data?.notes || [];
  }, [data?.notes]);
  // Update search query when debounced value changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setSearchQuery(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchQuery, setSearchQuery]);
  // Intersection observer for infinite scrolling
  const { targetRef, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.1}
  });
  // Load more data when reaching the bottom
  useEffect(() => {
    if (
      isIntersecting &&
      !isLoading &&
      !isFetching &&
      data &&
      data.currentPage < data.totalPages
    ) {
      setFilters({ 
        ...currentFilters,
        page: data.currentPage + 1}
      });
    }
  }, [isIntersecting, isLoading, isFetching, data, currentFilters, setFilters]);
  // Handle search input change
  const handleSearchInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
    },
    []
  );
  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof ClinicalNoteFilters, value: any) => {
      const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to first page
      setFilters(newFilters);
    },
    [filters, setFilters]
  );
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({ 
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'}
    });
    setSearchInput('');
    setSearchQuery('');
  }, [setFilters, setSearchQuery]);
  // Handle note actions
  const handleViewNote = useCallback(
    (note: ClinicalNote) => {
      if (onNoteSelect) {
        onNoteSelect(note._id);
      } else if (embedded) {
        window.open(`/notes/${note._id}`, '_blank');
      } else {
        navigate(`/notes/${note._id}`);
      }
    },
    [onNoteSelect, embedded, navigate]
  );
  const handleEditNote = useCallback(
    (note: ClinicalNote) => {
      if (onNoteEdit) {
        onNoteEdit(note._id);
      } else {
        navigate(`/notes/${note._id}/edit`);
      }
    },
    [onNoteEdit, navigate]
  );
  const handleDeleteNote = useCallback(
    async (note: ClinicalNote) => {
      try {
        await deleteNote(note._id);
        toast.success('Note deleted successfully');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    },
    [deleteNote]
  );
  const handleNoteSelect = useCallback(
    (noteId: string) => {
      toggleNoteSelection(noteId);
    },
    [toggleNoteSelection]
  );
  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteNotes(selectedNotes);
      toast.success(`Successfully deleted ${selectedNotes.length} notes`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to delete notes');
    }
  }, [bulkDeleteNotes, selectedNotes, clearSelection]);
  // Calculate container height for virtualization
  const containerHeight = useMemo(() => {
    if (maxHeight) return maxHeight;
    if (embedded) return 600;
    return window.innerHeight - 300; // Account for header and toolbar
  }, [maxHeight, embedded]);
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear selection
      if (event.key === 'Escape') {
        clearSelection();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);
  return (
    <div ref={containerRef} className="">
      {!embedded && (
        <div className="">
          <div
            
            component="h1"
            className=""
          >
            Clinical Notes
          </div>
          <div  color="text.secondary">
            Manage SOAP notes and clinical documentation
          </div>
        </div>
      )}
      {/* Optimized Toolbar */}
      <Card className="">
        <CardContent className="">
          <div
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            alignItems={isMobile ? 'stretch' : 'center'}
          >
            {/* Search */}
            <Input
              ref={searchInputRef}
              placeholder="Search notes... (Ctrl+K)"
              value={searchInput}
              onChange={handleSearchInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">}
                    <IconButton size="small" onClick={() =>setSearchInput('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              className=""
              size="small"
            />
            {/* View Mode Toggle */}
            {!isMobile && (
              <div direction="row" spacing={0}>
                <IconButton
                  size="small"
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewListIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModuleIcon />
                </IconButton>
              </div>
            )}
            {/* Filters */}
            <Button
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              
              size="small"
            >
              Filters
            </Button>
            {/* Advanced Filters Toggle */}
            <FormControlLabel
              control={
                <Switch}
                  checked={showAdvancedFilters}
                  onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                  size="small"
                />
              }
              label="Advanced"
              className=""
            />
            {/* Create Note */}
            <Button
              startIcon={<AddIcon />}
              onClick={() => onNoteCreate?.() || navigate('/notes/new')}
              
              size="small"
            >
              New Note
            </Button>
            {/* Bulk Actions */}
            {selectedNotes.length > 0 && (
              <Button
                onClick={handleBulkDelete}
                
                color="error"
                size="small"
              >
                Delete ({selectedNotes.length})
              </Button>
            )}
          </div>
          {/* Active Filters Display */}
          {(filters.type ||
            filters.priority ||
            filters.dateFrom ||
            filters.dateTo) && (
            <div className="">
              <div direction="row" spacing={1} flexWrap="wrap">
                {filters.type && (
                  <Chip
                    label={`Type: ${
                      NOTE_TYPES.find((t) => t.value === filters.type)?.label}
                    }`}
                    onDelete={() => handleFilterChange('type', undefined)}
                    size="small"
                  />
                )}
                {filters.priority && (
                  <Chip
                    label={`Priority: ${
                      NOTE_PRIORITIES.find((p) => p.value === filters.priority)
                        ?.label}
                    }`}
                    onDelete={() => handleFilterChange('priority', undefined)}
                    size="small"
                  />
                )}
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  
                  size="small"
                  color="secondary"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="">
              <div direction="row" spacing={2} flexWrap="wrap">
                <div size="small" className="">
                  <Label>Type</Label>
                  <Select
                    value={filters.type || ''}
                    onChange={(e) =>
                      handleFilterChange('type', e.target.value || undefined)}
                    }
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {NOTE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
                <div size="small" className="">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'priority',
                        e.target.value || undefined
                      )}
                    }
                    label="Priority"
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    {NOTE_PRIORITIES.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Loading State */}
      {isLoading && memoizedNotes.length === 0 && (
        <div className="">
          <div  color="text.secondary">
            Loading clinical notes...
          </div>
        </div>
      )}
      {/* Error State */}
      {error && (
        <Alert severity="error" className="">
          Failed to load clinical notes. Please try again.
        </Alert>
      )}
      {/* Notes List */}
      {enableVirtualization && memoizedNotes.length > 10 ? (
        <VirtualizedClinicalNotesList
          notes={memoizedNotes}
          height={containerHeight}
          itemHeight={itemHeight}
          onNoteView={handleViewNote}
          onNoteEdit={handleEditNote}
          onNoteDelete={handleDeleteNote}
          onNoteSelect={handleNoteSelect}
          selectedNotes={selectedNotes}
          loading={isLoading}
        />
      ) : (
        <div className="">
          {memoizedNotes.map((note) => (
            <Card
              key={note._id}
              className=""`
                  : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              onClick={() => handleNoteSelect(note._id)}
            >
              <CardContent>
                <div  component="h3" className="">
                  {note.title}
                </div>
                <div  color="text.secondary">
                  Patient: {note.patient.firstName} {note.patient.lastName}
                </div>
                <div  color="text.secondary">
                  Created: {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Infinite scroll trigger */}
          {data && data.currentPage < data.totalPages && (
            <div ref={targetRef} >
              {isFetching && (
                <div
                  
                  color="text.secondary"
                  textAlign="center"
                >
                  Loading more notes...
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
          <TuneIcon className="" />
          Advanced Filters
        </MenuItem>
        <MenuItem onClick={handleClearFilters}>
          <ClearIcon className="" />
          Clear All Filters
        </MenuItem>
      </Menu>
    </div>
  );
};
export default React.memo(OptimizedClinicalNotesDashboard);
