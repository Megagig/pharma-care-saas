// import ClinicalNotesErrorBoundary from './ClinicalNotesErrorBoundary';

import { Button, Input, Label, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert, Separator } from '@/components/ui/button';

interface ClinicalNotesDashboardProps {
  patientId?: string;
  embedded?: boolean;
  maxHeight?: number;
  onNoteSelect?: (noteId: string) => void;
  onNoteEdit?: (noteId: string) => void;
  onNoteCreate?: () => void;
}
const ClinicalNotesDashboard: React.FC<ClinicalNotesDashboardProps> = ({ 
  patientId,
  embedded = false,
  maxHeight,
  onNoteSelect,
  onNoteEdit,
  onNoteCreate
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile, shouldUseCardLayout } = useResponsive();
  // Store state
  const {
    selectedNotes,
    filters,
    searchQuery,
    loading,
    errors,
    ui,
    // Actions
    fetchNotes,
    searchNotes,
    deleteNote,
    bulkDeleteNotes,
    bulkUpdateNotes,
    toggleNoteSelection,
    clearSelection,
    setFilters,
    clearFilters,
    setSearchQuery,
    setPage,
    setCreateModalOpen,
    setEditModalOpen,
    setDeleteConfirmOpen,
    setBulkDeleteConfirmOpen,
  } = useEnhancedClinicalNoteStore();
  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [bulkActionAnchor, setBulkActionAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedNoteForAction, setSelectedNoteForAction] =
    useState<ClinicalNote | null>(null);
  // React Query for data fetching - stabilize filters to prevent unnecessary re-renders
  const currentFilters = useMemo(() => {
    const baseFilters = filters || {};
    const result = { ...baseFilters };
    if (patientId) {
      result.patientId = patientId;
    }
    return result;
  }, [filters, patientId]);
  const { data, isLoading, error } = useClinicalNotes(currentFilters);
  // Handle search - directly update filters for React Query
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const newFilters = {
        ...filters,
        ...(patientId && { patientId }),
        page: 1, // Reset to first page
      };
      if (query.trim()) {
        newFilters.search = query.trim();
      } else {
        // Remove search parameter when query is empty
        delete newFilters.search;
      }
      setFilters(newFilters);
    },
    [filters, patientId, setSearchQuery, setFilters]
  );
  // Debounced search - use useRef to maintain stable reference
  const debouncedSearchRef = React.useRef<(query: string) => void>();
    let timeoutId: NodeJS.Timeout;
    debouncedSearchRef.current = (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleSearch(query), 300);
    };
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);
  const debouncedSearch = useCallback((query: string) => {
    debouncedSearchRef.current?.(query);
  }, []);
  // Handle search input change
  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };
  // Handle filter changes - directly update filters for React Query
  const handleFilterChange = (
    key: keyof ClinicalNoteFilters,
    value: string | undefined
  ) => {
    if (value === undefined || value === '') {
      // Create new filters object without the specified key
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: unused, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    } else {
      // Type-safe approach with explicit object creation
      const updatedFilters: ClinicalNoteFilters = { ...filters, page: 1 };
      // Handle each specific key type-safely
      if (
        key === 'search' ||
        key === 'patientId' ||
        key === 'type' ||
        key === 'priority' ||
        key === 'dateFrom' ||
        key === 'dateTo'
      ) {
        updatedFilters[key] = value;
      } else if (
        key === 'sortBy' &&
        (value === 'title' ||
          value === 'createdAt' ||
          value === 'updatedAt' ||
          value === 'priority')
      ) {
        updatedFilters.sortBy = value;
      } else if (key === 'sortOrder' && (value === 'asc' || value === 'desc')) {
        updatedFilters.sortOrder = value;
      }
      setFilters(updatedFilters);
    }
  };
  // Clear all filters - reset to initial state
  const handleClearFilters = () => {
    // Use the store's clearFilters method
    clearFilters();
    // Reset local state
    setSearchInput('');
    setSearchQuery('');
  }; // Handle row selection with simplified approach
 // Handle bulk actions
  const handleBulkDelete = async () => {
    try {
      const success = await bulkDeleteNotes(selectedNotes);
      if (success) {
        toast.success(`Successfully deleted ${selectedNotes.length} notes`);
        clearSelection();
      }
    } catch {
      toast.error('Failed to delete notes');
    }
    setBulkDeleteConfirmOpen(false);
  };
  const handleBulkToggleConfidential = async (isConfidential: boolean) => {
    try {
      const success = await bulkUpdateNotes(selectedNotes, { isConfidential });
      if (success) {
        toast.success(`Successfully updated ${selectedNotes.length} notes`);
        clearSelection();
      }
    } catch {
      toast.error('Failed to update notes');
    }
    setBulkActionAnchor(null);
  };
  // Handle individual note actions
  const handleViewNote = (note: ClinicalNote) => {
    // Use callback if provided, otherwise fallback to navigation
    if (onNoteSelect) {
      onNoteSelect(note._id);
    } else if (embedded) {
      // For embedded views, open in new tab
      window.open(`/notes/${note._id}`, '_blank');
    } else {
      // For main dashboard, navigate in same tab
      navigate(`/notes/${note._id}`);
    }
  };
  const handleEditNote = (note: ClinicalNote) => {
    // Use callback if provided, otherwise fallback to modal
    if (onNoteEdit) {
      onNoteEdit(note._id);
    } else {
      setSelectedNoteForAction(note);
      setEditModalOpen(true);
    }
  };
  const handleDeleteNote = async (note: ClinicalNote) => {
    try {
      const success = await deleteNote(note._id);
      if (success) {
        toast.success('Note deleted successfully');
      }
    } catch {
      toast.error('Failed to delete note');
    }
    setDeleteConfirmOpen(false);
  };
  // Format functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };
  const formatPatientName = (patient: ClinicalNote['patient']) => {
    return `${patient.firstName} ${patient.lastName}`;
  };
  const formatPharmacistName = (pharmacist: ClinicalNote['pharmacist']) => {
    return `${pharmacist.firstName} ${pharmacist.lastName}`;
  };
  // Priority chip component
  const PriorityChip = ({ 
    priority}
  }: {
    priority: ClinicalNote['priority'];
  }) => {
    const priorityInfo = NOTE_PRIORITIES.find((p) => p.value === priority);
    const priorityConfig = {
      high: {
        color: theme.palette.error.main,
        bg: `${theme.palette.error.main}15`,
        icon: '🔴',
      },
      medium: {
        color: theme.palette.warning.main,
        bg: `${theme.palette.warning.main}15`,
        icon: '🟡',
      },
      low: {
        color: theme.palette.success.main,
        bg: `${theme.palette.success.main}15`,
        icon: '🟢',
      },
    };
    const config = priorityConfig[priority] || priorityConfig.low;
    return (
      <Chip
        label={`${config.icon} ${priorityInfo?.label || priority}`}
        size="small"
        className=""30`,
          fontSize: '0.75rem',
          '&:hover': {
            backgroundColor: `${config.color}25`,
          },
          transition: 'all 0.2s ease-in-out',
      />
    );
  };
  // Type chip component
  const TypeChip = ({ type }: { type: ClinicalNote['type'] }) => {
    const typeInfo = NOTE_TYPES.find((t) => t.value === type);
    const typeConfig = {
      consultation: { icon: '👩‍⚕️', color: theme.palette.primary.main },
      medication_review: { icon: '💊', color: theme.palette.secondary.main },
      follow_up: { icon: '📅', color: theme.palette.info.main },
      adverse_event: { icon: '⚠️', color: theme.palette.error.main },
      other: { icon: '📝', color: theme.palette.grey[600] },
    };
    const config = typeConfig[type] || typeConfig.other;
    return (
      <Chip
        label={`${config.icon} ${typeInfo?.label || type}`}
        size="small"
        className=""10`,
          color: config.color,
          border: `1px solid ${config.color}30`,
          fontWeight: 500,
          fontSize: '0.75rem',
          '&:hover': {
            backgroundColor: `${config.color}20`,
          },
          transition: 'all 0.2s ease-in-out',
      />
    );
  };
  // Initialize filters on component mount
  useEffect(() => {
    console.log('Component mount - current filters:', filters); // Debug log
    if (!filters || Object.keys(filters).length === 0) {
      console.log('Initializing filters...'); // Debug log
      const initFilters = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        ...(patientId && { patientId }),
      };
      setFilters(initFilters);
    }
  }, [filters, setFilters, patientId]);
  // Handle row selection for the new table
  const handleTableSelectionChange = (selectedRows: ClinicalNote[]) => {
    const selectedIds = selectedRows.map(row => row._id);
    setSelectedNotes(selectedIds);
  };
  // Mobile Card Component
  const NoteCard: React.FC<{ note: ClinicalNote }> = ({ note }) => {
    const [cardExpanded, setCardExpanded] = useState(false);
    const isSelected = selectedNotes.includes(note._id);
    return (
      <Card
        className="">
        <CardContent className="">
          {/* Header */}
          <div className="">
            <div className="">
              <div
                
                component="h3"
                className=""
              >
                {note.title}
              </div>
              <div direction="row" spacing={1} flexWrap="wrap" className="">
                <TypeChip type={note.type} />
                <PriorityChip priority={note.priority} />
                {note.isConfidential && (
                  <Chip
                    icon={<SecurityIcon className="" />}
                    label="Confidential"
                    size="small"
                    className="" />
                )}
              </div>
            </div>
            <IconButton
              size="small"
              onClick={() => toggleNoteSelection(note._id)}
              className="">
              {isSelected ? '✓' : '○'}
            </IconButton>
          </div>
          {/* Patient Info */}
          <div
            className="">
            <div
              
              className=""
            >
              <div
                component="span"
                className=""
              >
                Patient:
              </div>
              <div
                component="span"
                className=""
              >
                {formatPatientName(note.patient)}
              </div>
              <Chip
                label={`MRN: ${note.patient.mrn}`}
                size="small"
                
                className=""
              />
            </div>
            <div
              
              className=""
            >
              <div
                component="span"
                className=""
              >
                Provider:
              </div>
              <div component="span" className="">
                {formatPharmacistName(note.pharmacist)}
              </div>
            </div>
            <div
              
              className=""
            >
              <div
                component="span"
                className=""
              >
                Created:
              </div>
              <div component="span" className="">
                {formatDate(note.createdAt)}
              </div>
            </div>
          </div>
          {/* Indicators */}
          <div direction="row" spacing={1} alignItems="center" className="">
            {note.followUpRequired && (
              <Tooltip
                title={`Follow-up: ${
                  note.followUpDate
                    ? formatDate(note.followUpDate)
                    : 'Not scheduled'}
                }`}
              >
                <Chip
                  icon={<ScheduleIcon className="" />}
                  label="Follow-up"
                  size="small"
                  className="" />
              </Tooltip>
            )}
            {note.attachments?.length > 0 && (
              <Chip
                icon={<AttachFileIcon className="" />}
                label={`${note.attachments.length} files`}
                size="small"
                
                className="" />
            )}
          </div>
          {/* Content Preview */}
          <Collapse in={cardExpanded}>
            <div className="">
              {note.content.subjective && (
                <div className="">
                  <div
                    
                    fontWeight={600}
                    color="primary"
                  >
                    Subjective:
                  </div>
                  <div  className="">
                    {note.content.subjective}
                  </div>
                </div>
              )}
              {note.content.objective && (
                <div className="">
                  <div
                    
                    fontWeight={600}
                    color="primary"
                  >
                    Objective:
                  </div>
                  <div  className="">
                    {note.content.objective}
                  </div>
                </div>
              )}
              {note.content.assessment && (
                <div className="">
                  <div
                    
                    fontWeight={600}
                    color="primary"
                  >
                    Assessment:
                  </div>
                  <div  className="">
                    {note.content.assessment}
                  </div>
                </div>
              )}
              {note.content.plan && (
                <div className="">
                  <div
                    
                    fontWeight={600}
                    color="primary"
                  >
                    Plan:
                  </div>
                  <div  className="">
                    {note.content.plan}
                  </div>
                </div>
              )}
            </div>
          </Collapse>
        </CardContent>
        <CardActions
          className="">
          <Button
            size="small"
            onClick={() => setCardExpanded(!cardExpanded)}
            startIcon={cardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            className="">
            {cardExpanded ? 'Show Less' : 'Show More'}
          </Button>
          <div direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => handleViewNote(note)}
              className="">
              <ViewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEditNote(note)}
              className="">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              
              className="">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </CardActions>
      </Card>
    );
  };
  return (
    <div className="">
      {!embedded && (
        <div className="">
          <div
            className="">
            <div className="">
              <div
                
                component="h1"
                className="">
                Clinical Notes
              </div>
              <div
                
                color="text.secondary"
                className=""
              >
                Manage SOAP notes and clinical documentation with enhanced
                workflow
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <Card
        className="">
        <CardContent className="">
          {isMobile ? (
            // Mobile Toolbar Layout
            <div spacing={2}>
              {/* Search Row */}
              <Input
                placeholder="Search notes, patients, or content..."
                value={searchInput}
                onChange={handleSearchInputChange}
                
                        className="">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                fullWidth
                size="small"
                className=""
                    },
                    },
                  },
              />
              {/* Action Buttons Row */}
              <div direction="row" spacing={1} justifyContent="space-between">
                <div direction="row" spacing={1}>
                  <IconButton
                    onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                    color="primary"
                    size="small"
                  >
                    <FilterIcon />
                  </IconButton>
                  {(filters.type ||
                    filters.priority ||
                    filters.dateFrom ||
                    filters.dateTo) && (
                    <IconButton
                      onClick={handleClearFilters}
                      color="secondary"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                  {selectedNotes.length > 0 && (
                    <IconButton
                      onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                      color="secondary"
                      size="small"
                    >
                      <Badge
                        badgeContent={selectedNotes.length}
                        color="primary"
                      >
                        <MoreVertIcon />
                      </Badge>
                    </IconButton>
                  )}
                </div>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() =>
                    onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)}
                  }
                  
                  size="small"
                  className="">
                  New
                </Button>
              </div>
            </div>
          ) : (
            // Desktop Toolbar Layout
            <div
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* Search */}
              <Input
                placeholder="Search notes, patients, or content..."
                value={searchInput}
                onChange={handleSearchInputChange}
                
                        className="">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                className=""
                    },
                    },
                  },
              />
              {/* Filters */}
              <Button
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                
                className="">
                Filters
              </Button>
              {/* Clear Filters */}
              {(filters.type ||
                filters.priority ||
                filters.dateFrom ||
                filters.dateTo) && (
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  
                  color="secondary"
                >
                  Clear Filters
                </Button>
              )}
              {/* Create Note */}
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)}
                }
                
                className="">
                New Note
              </Button>
              {/* Bulk Actions */}
              {selectedNotes.length > 0 && (
                <Button
                  startIcon={<MoreVertIcon />}
                  onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                  
                  color="secondary"
                >
                  Actions ({selectedNotes.length})
                </Button>
              )}
            </div>
          )}
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
                {filters.dateFrom && (
                  <Chip
                    label={`From: ${format(
                      parseISO(filters.dateFrom),
                      'MMM dd, yyyy'}
                    )}`}
                    onDelete={() => handleFilterChange('dateFrom', undefined)}
                    size="small"
                  />
                )}
                {filters.dateTo && (
                  <Chip
                    label={`To: ${format(
                      parseISO(filters.dateTo),
                      'MMM dd, yyyy'}
                    )}`}
                    onDelete={() => handleFilterChange('dateTo', undefined)}
                    size="small"
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Data Display - Table or Cards */}
      {shouldUseCardLayout ? (
        // Mobile Card Layout
        <div>
          {isLoading || loading.fetchNotes ? (
            <div
              className=""
            >
              <Spinner size="xl" className="text-primary"
              />
              <div
                
                color="text.secondary"
                className=""
              >
                Loading clinical notes...
              </div>
            </div>
          ) : (data?.notes || []).length === 0 ? (
            <Card
              className="">
              <CardContent>
                <div className="">
                  <NoteIcon
                    className=""
                  />
                </div>
                <div
                  
                  className=""
                >
                  No clinical notes found
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {searchQuery || filters.type || filters.priority
                    ? "Try adjusting your search criteria or filters to find the notes you're looking for."
                    : 'Get started by creating your first clinical note. Document patient consultations, medication reviews, and follow-ups all in one place.'}
                </div>
                <Button
                  
                  startIcon={<AddIcon />}
                  size="large"
                  className="" ${theme.palette.primary.dark})`,
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                  onClick={() =>
                    onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)}
                  }
                >
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Notes List */}
              <div>
                {(data?.notes || []).map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
              {/* Mobile Pagination */}
              {data && data.totalPages > 1 && (
                <Card className="">
                  <CardContent>
                    <div
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <div  color="text.secondary">
                        Page {data.currentPage} of {data.totalPages}
                      </div>
                      <div direction="row" spacing={1}>
                        <Button
                          size="small"
                          disabled={data.currentPage <= 1}
                          onClick={() => setPage(data.currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          size="small"
                          disabled={data.currentPage >= data.totalPages}
                          onClick={() => setPage(data.currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        // Desktop Table Layout
        <Card>
          {/* Render DataGrid with simplified conditions */}
          {isLoading || loading.fetchNotes ? (
            <div
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
              flexDirection="column"
              gap={2}
            >
              <Spinner />
              <div  color="text.secondary">
                Loading clinical notes...
              </div>
            </div>
          ) : error ? (
            <div
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
              flexDirection="column"
              gap={2}
            >
              <div  color="error">
                Error loading notes: {error.message}
              </div>
            </div>
          ) : (
            <>
              {/* TanStack Table wrapped in error boundary for additional protection */}
              <ClinicalNotesErrorBoundary>
                <ClinicalNotesTable
                  data={data?.notes || []}
                  loading={isLoading || loading.fetchNotes}
                  onRowClick={handleViewNote}
                  onViewNote={handleViewNote}
                  onEditNote={handleEditNote}
                  
                  selectedNotes={selectedNotes}
                  onSelectionChange={handleTableSelectionChange}
                  enableRowSelection={Array.isArray(selectedNotes)}
                />
              </ClinicalNotesErrorBoundary>
            </>
          )}
        </Card>
      )}
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 300, p: 2 }>
        <div spacing={2}>
          <div fullWidth size="small">
            <Label>Note Type</Label>
            <Select
              value={filters.type || ''}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange('type', e.target.value || undefined)}
              }
              label="Note Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {NOTE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div fullWidth size="small">
            <Label>Priority</Label>
            <Select
              value={filters.priority || ''}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange('priority', e.target.value || undefined)}
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
          <Input
            label="Date From"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              handleFilterChange('dateFrom', e.target.value || undefined)}
            }
            
            size="small"
            fullWidth
          />
          <Input
            label="Date To"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              handleFilterChange('dateTo', e.target.value || undefined)}
            }
            
            size="small"
            fullWidth
          />
        </div>
      </Menu>
      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionAnchor}
        open={Boolean(bulkActionAnchor)}
        onClose={() => setBulkActionAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkToggleConfidential(true)}>
          <SecurityIcon className="" />
          Mark as Confidential
        </MenuItem>
        <MenuItem onClick={() => handleBulkToggleConfidential(false)}>
          <SecurityIcon className="" />
          Remove Confidential
        </MenuItem>
        <Separator />
        <MenuItem
          onClick={() => setBulkDeleteConfirmOpen(true)}
          className=""
        >
          <DeleteIcon className="" />
          Delete Selected
        </MenuItem>
      </Menu>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={ui?.isDeleteConfirmOpen || false}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <div>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedNoteForAction && handleDeleteNote(selectedNoteForAction)}
            }
            color="error"
            
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={ui?.isBulkDeleteConfirmOpen || false}
        onClose={() => setBulkDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Multiple Notes</DialogTitle>
        <DialogContent>
          <div>
            Are you sure you want to delete {selectedNotes.length} selected
            notes? This action cannot be undone.
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} color="error" >
            Delete {selectedNotes.length} Notes
          </Button>
        </DialogActions>
      </Dialog>
      {/* Error Display */}
      {(error || errors.fetchNotes) && (
        <Alert severity="error" className="">
          {error?.message ||
            errors.fetchNotes ||
            'An error occurred while loading notes'}
        </Alert>
      )}
    </div>
  );
};
// Wrap with error boundary
const ClinicalNotesDashboardWithErrorBoundary: React.FC = (props) => {
  return (
    <ClinicalNotesErrorBoundary context="clinical-notes-dashboard">
      <ClinicalNotesDashboard {...props} />
    </ClinicalNotesErrorBoundary>
  );
};
export default ClinicalNotesDashboardWithErrorBoundary;
