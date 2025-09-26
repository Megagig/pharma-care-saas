import { Button, Input, Label, Card, CardContent, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip, Alert, Skeleton, Avatar, Separator } from '@/components/ui/button';
useClinicalInterventions,
  useDeleteIntervention,


// ===============================
// TYPES AND INTERFACES
// ===============================

interface InterventionListProps {
  onEdit?: (intervention: ClinicalIntervention) => void;
  onView?: (intervention: ClinicalIntervention) => void;
  onDelete?: (intervention: ClinicalIntervention) => void;
  filters?: Partial<InterventionFilters>;
  showPatientColumn?: boolean;
  compact?: boolean;
}

type ViewMode = 'table' | 'cards';
type SortField = keyof ClinicalIntervention;
type SortOrder = 'asc' | 'desc';

// ===============================
// CONSTANTS
// ===============================

const INTERVENTION_CATEGORIES = {
  drug_therapy_problem: { label: 'Drug Therapy Problem', color: '#f44336' },
  adverse_drug_reaction: { label: 'Adverse Drug Reaction', color: '#ff9800' },
  medication_nonadherence: {
    label: 'Medication Non-adherence',
    color: '#2196f3',
  },
  drug_interaction: { label: 'Drug Interaction', color: '#9c27b0' },
  dosing_issue: { label: 'Dosing Issue', color: '#4caf50' },
  contraindication: { label: 'Contraindication', color: '#e91e63' },
  other: { label: 'Other', color: '#607d8b' },
} as const;

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#4caf50' },
  medium: { label: 'Medium', color: '#ff9800' },
  high: { label: 'High', color: '#f44336' },
  critical: { label: 'Critical', color: '#d32f2f' },
} as const;

const STATUS_LABELS = {
  identified: { label: 'Identified', color: '#2196f3' },
  planning: { label: 'Planning', color: '#ff9800' },
  in_progress: { label: 'In Progress', color: '#9c27b0' },
  implemented: { label: 'Implemented', color: '#4caf50' },
  completed: { label: 'Completed', color: '#388e3c' },
  cancelled: { label: 'Cancelled', color: '#757575' },
} as const;

// Badge variant mapping functions
const getCategoryBadgeVariant = (category: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (category) {
    case 'drug_therapy_problem':
    case 'contraindication':
      return 'destructive';
    case 'adverse_drug_reaction':
    case 'dosing_issue':
      return 'secondary';
    case 'medication_nonadherence':
    case 'drug_interaction':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
    case 'implemented':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'in_progress':
    case 'planning':
      return 'secondary';
    case 'identified':
      return 'outline';
    default:
      return 'secondary';
  }
};

// ===============================
// MAIN COMPONENT
// ===============================

const InterventionList: React.FC<InterventionListProps> = ({ 
  onEdit,
  onView,
  onDelete}
  filters: propFilters = {},
  showPatientColumn = true,
  compact = false
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>(
    []
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIntervention, setSelectedIntervention] =
    useState<ClinicalIntervention | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('identifiedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Local filters state
  const [localFilters, setLocalFilters] = useState<InterventionFilters>({ 
    search: '',
    category: undefined,
    priority: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: 'identifiedDate',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    ...propFilters}
  });

  // Store
  const { setFilters, clearFilters, selectIntervention, setShowDetailsModal } =
    useClinicalInterventionStore();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFilters((prev) => ({ 
        ...prev,
        search: searchQuery,
        page: 1}
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine filters
  const combinedFilters = useMemo(
    () => ({ 
      ...localFilters,
      sortBy: sortField,
      sortOrder,
      page,
      limit: pageSize}
    }),
    [localFilters, sortField, sortOrder, page, pageSize]
  );

  // Queries
  const {
    data: interventionsResponse,
    isLoading,
    error,
    refetch,
  } = useClinicalInterventions(combinedFilters);

  const deleteMutation = useDeleteIntervention();

  // Data processing
  const interventions = interventionsResponse?.data?.data || [];
  const pagination = interventionsResponse?.data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  };

  // ===============================
  // HANDLERS
  // ===============================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (
    filterKey: keyof InterventionFilters,
    value: any
  ) => {
    setLocalFilters((prev) => ({ 
      ...prev,
      [filterKey]: value,
      page: 1, // Reset to first page when filtering })
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({ 
      search: '',
      sortBy: 'identifiedDate',
      sortOrder: 'desc',
      page: 1,
      limit: 20}
    });
    setSearchQuery('');
    clearFilters();
  };

  const handleSelectIntervention = (interventionId: string) => {
    setSelectedInterventions((prev) =>
      prev.includes(interventionId)
        ? prev.filter((id) => id !== interventionId)
        : [...prev, interventionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInterventions.length === interventions.length) {
      setSelectedInterventions([]);
    } else {
      setSelectedInterventions(interventions.map((i) => i._id));
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    intervention: ClinicalIntervention
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedIntervention(intervention);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIntervention(null);
  };

  const handleView = (intervention: ClinicalIntervention) => {
    selectIntervention(intervention);
    setShowDetailsModal(true);
    onView?.(intervention);
    handleMenuClose();
  };

  const handleEdit = (intervention: ClinicalIntervention) => {
    onEdit?.(intervention);
    handleMenuClose();
  };

  const handleDelete = async (intervention: ClinicalIntervention) => {
    if (
      window.confirm(
        `Are you sure you want to delete intervention ${intervention.interventionNumber}?`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(intervention._id);
        onDelete?.(intervention);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
    handleMenuClose();
  };

  const handleBulkDelete = async () => {
    if (selectedInterventions.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedInterventions.length} intervention(s)?`
      )
    ) {
      try {
        await Promise.all(
          selectedInterventions.map((id) => deleteMutation.mutateAsync(id))
        );
        setSelectedInterventions([]);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  // ===============================
  // RENDER HELPERS
  // ===============================

  const renderFilters = () => (
    <Collapse in={showFilters}>
      <div className="">
        <div container spacing={2}>
          <div item xs={12} sm={6} md={3}>
            <div className="w-full">
              <Label htmlFor="category-filter" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={localFilters.category || ''}
                onValueChange={(value) =>
                  handleFilterChange('category', value || undefined)}
                }
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {Object.entries(INTERVENTION_CATEGORIES).map(
                    ([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div item xs={12} sm={6} md={3}>
            <div className="w-full">
              <Label htmlFor="priority-filter" className="text-sm font-medium">
                Priority
              </Label>
              <Select
                value={localFilters.priority || ''}
                onValueChange={(value) =>
                  handleFilterChange('priority', value || undefined)}
                }
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_LEVELS).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div item xs={12} sm={6} md={3}>
            <div className="w-full">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={localFilters.status || ''}
                onValueChange={(value) =>
                  handleFilterChange('status', value || undefined)}
                }
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date From"
                value={
                  localFilters.dateFrom ? new Date(localFilters.dateFrom) : null}
                }
                onChange={(date) =>
                  handleFilterChange('dateFrom', date?.toISOString())}
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,}
                  },
              />
            </LocalizationProvider>
          </div>

          <div item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date To"
                value={
                  localFilters.dateTo ? new Date(localFilters.dateTo) : null}
                }
                onChange={(date) =>
                  handleFilterChange('dateTo', date?.toISOString())}
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,}
                  },
              />
            </LocalizationProvider>
          </div>

          <div item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </Collapse>
  );

  const renderToolbar = () => (
    <div className="">
      <div className="">
        {/* Search */}
        <Input
          size="small"
          placeholder="Search interventions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">}
                <IconButton size="small" onClick={() =>setSearchQuery('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          className=""
        />

        {/* Filter Toggle */}
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'contained' : 'outlined'}
          size="small"
        >
          Filters
        </Button>

        {/* Bulk Actions */}
        {selectedInterventions.length > 0 && (
          <div className="">
            <div  color="text.secondary">
              {selectedInterventions.length} selected
            </div>
            <Button
              size="small"
              color="error"
              onClick={handleBulkDelete}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && setViewMode(newMode)}
        size="small"
      >
        <ToggleButton value="table">
          <ViewListIcon />
        </ToggleButton>
        <ToggleButton value="cards">
          <ViewModuleIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Actions */}
      <div className="">
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export">
          <IconButton>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );

  const renderTableView = () => (
    <TableContainer >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  selectedInterventions.length > 0 &&
                  selectedInterventions.length < interventions.length}
                }
                checked={
                  interventions.length > 0 &&
                  selectedInterventions.length === interventions.length}
                }
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'interventionNumber'}
                direction={
                  sortField === 'interventionNumber' ? sortOrder : 'asc'}
                }
                onClick={() => handleSort('interventionNumber')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            {showPatientColumn && (
              <TableCell>
                <TableSortLabel
                  active={sortField === 'patientId'}
                  direction={sortField === 'patientId' ? sortOrder : 'asc'}
                  onClick={() => handleSort('patientId')}
                >
                  Patient
                </TableSortLabel>
              </TableCell>
            )}
            <TableCell>
              <TableSortLabel
                active={sortField === 'category'}
                direction={sortField === 'category' ? sortOrder : 'asc'}
                onClick={() => handleSort('category')}
              >
                Category
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'priority'}
                direction={sortField === 'priority' ? sortOrder : 'asc'}
                onClick={() => handleSort('priority')}
              >
                Priority
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'status'}
                direction={sortField === 'status' ? sortOrder : 'asc'}
                onClick={() => handleSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>Issue Description</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'identifiedDate'}
                direction={sortField === 'identifiedDate' ? sortOrder : 'asc'}
                onClick={() => handleSort('identifiedDate')}
              >
                Date
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton width={24} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
                {showPatientColumn && (
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton width={60} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton width={200} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton width={40} />
                </TableCell>
              </TableRow>
            ))
          ) : interventions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showPatientColumn ? 9 : 8}
                align="center"
                className=""
              >
                <div  color="text.secondary">
                  No interventions found
                </div>
                <div  color="text.secondary">
                  {searchQuery || Object.values(localFilters).some((v) => v)
                    ? 'Try adjusting your search or filters'
                    : 'Create your first intervention to get started'}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            interventions.map((intervention) => (
              <TableRow
                key={intervention._id}
                hover
                
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedInterventions.includes(intervention._id)}
                    onChange={() => handleSelectIntervention(intervention._id)}
                  />
                </TableCell>
                <TableCell>
                  <div  fontWeight="medium">
                    {intervention.interventionNumber}
                  </div>
                </TableCell>
                {showPatientColumn && (
                  <TableCell>
                    <div className="">
                      <Avatar
                        className=""
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <div>
                        <div  fontWeight="medium">
                          {intervention.patient?.firstName}{' '}
                          {intervention.patient?.lastName}
                        </div>
                        <div  color="text.secondary">
                          {intervention.patient?.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={getCategoryBadgeVariant(intervention.category)} className="text-xs">
                    {INTERVENTION_CATEGORIES[intervention.category]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(intervention.priority)} className="text-xs">
                    {PRIORITY_LEVELS[intervention.priority]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(intervention.status)} className="text-xs">
                    {STATUS_LABELS[intervention.status]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div
                    
                    className=""
                  >
                    {intervention.issueDescription}
                  </div>
                </TableCell>
                <TableCell>
                  <div >
                    {new Date(intervention.identifiedDate).toLocaleDateString()}
                  </div>
                  <div  color="text.secondary">
                    {intervention.identifiedByUser?.firstName}{' '}
                    {intervention.identifiedByUser?.lastName}
                  </div>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, intervention)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <div container spacing={2}>
      {isLoading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <div item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Skeleton  width="60%" height={24} />
                <Skeleton  width="40%" height={20} />
                <Skeleton
                  
                  width="100%"
                  height={60}
                  className=""
                />
                <div className="">
                  <Skeleton  width={80} height={24} />
                  <Skeleton  width={60} height={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      ) : interventions.length === 0 ? (
        <div item xs={12}>
          <div className="">
            <div  color="text.secondary" gutterBottom>
              No interventions found
            </div>
            <div  color="text.secondary">
              {searchQuery || Object.values(localFilters).some((v) => v)
                ? 'Try adjusting your search or filters'
                : 'Create your first intervention to get started'}
            </div>
          </div>
        </div>
      ) : (
        interventions.map((intervention) => (
          <div item xs={12} sm={6} md={4} key={intervention._id}>
            <Card
              className="" onClick={() => handleView(intervention)}
            >
              <CardContent className="">
                <div
                  className=""
                >
                  <div  component="div" noWrap>
                    {intervention.interventionNumber}
                  </div>
                  <Checkbox
                    size="small"
                    checked={selectedInterventions.includes(intervention._id)}
                    
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {showPatientColumn && (
                  <div
                    className=""
                  >
                    <Avatar
                      className=""
                    >
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <div  fontWeight="medium">
                      {intervention.patient?.firstName}{' '}
                      {intervention.patient?.lastName}
                    </div>
                  </div>
                )}

                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {intervention.issueDescription}
                </div>

                <div direction="row" spacing={1} className="">
                  <Badge variant={getCategoryBadgeVariant(intervention.category)} className="text-xs">
                    {INTERVENTION_CATEGORIES[intervention.category]?.label}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(intervention.priority)} className="text-xs">
                    {PRIORITY_LEVELS[intervention.priority]?.label}
                  </Badge>
                </div>

                <div
                  className=""
                >
                  <Badge variant={getStatusBadgeVariant(intervention.status)} className="text-xs">
                    {STATUS_LABELS[intervention.status]?.label}
                  </Badge>
                  <div  color="text.secondary">
                    {new Date(intervention.identifiedDate).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>

              <CardActions
                className=""
              >
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  >
                  View
                </Button>
                <IconButton
                  size="small"
                  >
                  <MoreVertIcon />
                </IconButton>
              </CardActions>
            </Card>
          </div>
        ))
      )}
    </div>
  );

  const renderPagination = () => (
    <div
      className=""
    >
      <div  color="text.secondary">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} interventions
      </div>

      <div className="">
        <div className="min-w-[100px]">
          <Label htmlFor="per-page-select" className="text-sm font-medium">
            Per page
          </Label>
          <Select
            value={pageSize.toString()}
            >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination
          count={pagination.pages}
          page={pagination.page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </div>
    </div>
  );

  // ===============================
  // MAIN RENDER
  // ===============================

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="">
          Failed to load interventions. Please try again.
        </Alert>
      )}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Pagination */}
      {!isLoading && interventions.length > 0 && renderPagination()}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() =>
            selectedIntervention && handleView(selectedIntervention)}
          }
        >
          <div>
            <ViewIcon fontSize="small" />
          </div>
          <div>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedIntervention && handleEdit(selectedIntervention)}
          }
        >
          <div>
            <EditIcon fontSize="small" />
          </div>
          <div>Edit</ListItemText>
        </MenuItem>
        <Separator />
        <MenuItem
          onClick={() =>
            selectedIntervention && handleDelete(selectedIntervention)}
          }
          className=""
        >
          <div>
            <DeleteIcon fontSize="small" color="error" />
          </div>
          <div>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default InterventionList;
